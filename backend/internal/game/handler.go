package game

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/finlleyl/nebula-quiz/internal/realtime"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(_ *http.Request) bool { return true }, // origin validated by CORS middleware
}

// Handler exposes game REST endpoints and the WS upgrade endpoint.
type Handler struct {
	svc     *Service
	tickets *TicketStore
	hub     *realtime.Hub
}

func NewHandler(svc *Service, tickets *TicketStore, hub *realtime.Hub) *Handler {
	return &Handler{svc: svc, tickets: tickets, hub: hub}
}

// POST /api/v1/games
// Body: { "quiz_id": "uuid" }
func (h *Handler) CreateGame(w http.ResponseWriter, r *http.Request) {
	var body struct {
		QuizID uuid.UUID `json:"quiz_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.QuizID == uuid.Nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", "quiz_id is required")
		return
	}

	hostID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}

	result, err := h.svc.CreateGame(r.Context(), hostID, CreateGameInput{QuizID: body.QuizID})
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			httpapi.WriteProblem(w, http.StatusNotFound, "quiz_not_found", "quiz not found")
		case errors.Is(err, ErrForbidden):
			httpapi.WriteProblem(w, http.StatusForbidden, "forbidden", "you don't own this quiz")
		default:
			slog.Error("create game", "err", err)
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal", "internal server error")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"game_id":      result.GameID,
		"room_code":    result.RoomCode,
		"match_number": result.MatchNumber,
	})
}

// POST /api/v1/games/by-code/:code/join
// Body: { "nickname": "string", "avatar_url"?: "string" }
// Auth: optional (authenticated users or guests).
func (h *Handler) JoinGame(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var body struct {
		Nickname  string  `json:"nickname"`
		AvatarURL *string `json:"avatar_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", "invalid request body")
		return
	}

	in := JoinGameInput{
		Nickname:  body.Nickname,
		AvatarURL: body.AvatarURL,
	}
	if uid, ok := middleware.UserID(r); ok && uid != uuid.Nil {
		in.UserID = &uid
	}

	result, err := h.svc.JoinGame(r.Context(), code, in)
	if err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound):
			httpapi.WriteProblem(w, http.StatusNotFound, "session_not_found", "no active session with that code")
		case errors.Is(err, ErrNotInLobby):
			httpapi.WriteProblem(w, http.StatusConflict, "not_in_lobby", "game is not accepting new players")
		case errors.Is(err, ErrValidation):
			httpapi.WriteProblem(w, http.StatusUnprocessableEntity, "validation", err.Error())
		default:
			slog.Error("join game", "err", err)
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal", "internal server error")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"game_id":        result.GameID,
		"participant_id": result.ParticipantID,
		"ws_ticket":      result.WSTicket,
	})
}

// POST /api/v1/games/:id/host-ticket — issues a WS ticket for the host.
func (h *Handler) HostTicket(w http.ResponseWriter, r *http.Request) {
	sessionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_id", "invalid game session ID")
		return
	}
	hostID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}

	ticket, err := h.svc.IssueHostTicket(r.Context(), sessionID, hostID, "Game Master")
	if err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound):
			httpapi.WriteProblem(w, http.StatusNotFound, "session_not_found", "game session not found")
		case errors.Is(err, ErrForbidden):
			httpapi.WriteProblem(w, http.StatusForbidden, "forbidden", "you are not the host")
		default:
			slog.Error("host ticket", "err", err)
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal", "internal server error")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"ws_ticket": ticket})
}

// GET /ws?ticket=<token>
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	ticket := r.URL.Query().Get("ticket")
	if ticket == "" {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "missing_ticket", "ticket query parameter is required")
		return
	}

	claims, ok := h.tickets.Consume(ticket)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "invalid_ticket", "ticket is invalid or expired")
		return
	}

	room, err := h.hub.GetRoom(claims.RoomCode)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusNotFound, "room_not_found", "game room is not active")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Warn("ws upgrade failed", "err", err)
		return
	}

	c := realtime.NewClient(conn)
	c.ID = claims.UserID
	c.ParticipantID = claims.ParticipantID
	c.GameSessionID = claims.GameSessionID
	c.IsHost = claims.IsHost
	c.IsGuest = claims.IsGuest
	c.Nickname = claims.Nickname

	room.Register(c)
	go c.WritePump()
	c.ReadPump(room)
}
