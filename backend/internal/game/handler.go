package game

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/v1/games
// Body: { "quiz_id": "..." }
// Returns: { "game_id", "room_code", "match_number", "ws_ticket" }
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	hostID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return
	}

	var body struct {
		QuizID string `json:"quiz_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid json", err.Error())
		return
	}
	quizID, err := uuid.Parse(body.QuizID)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid quiz_id", "")
		return
	}

	res, err := h.svc.CreateSession(r.Context(), quizID, hostID)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			httpapi.WriteProblem(w, http.StatusNotFound, "quiz not found", "")
		case errors.Is(err, ErrForbidden):
			httpapi.WriteProblem(w, http.StatusForbidden, "forbidden", "you are not the quiz owner")
		default:
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal error", err.Error())
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"game_id":      res.GameID,
		"room_code":    res.RoomCode,
		"match_number": res.MatchNumber,
		"ws_ticket":    res.WSTicket,
	})
}

// GET /api/v1/games/:id
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid id", "")
		return
	}

	sess, err := h.svc.GetSession(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrSessionNotFound) {
			httpapi.WriteProblem(w, http.StatusNotFound, "not found", "")
			return
		}
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal error", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":           sess.ID,
		"quiz_id":      sess.QuizID,
		"host_id":      sess.HostID,
		"room_code":    sess.RoomCode,
		"match_number": sess.MatchNumber,
		"status":       sess.Status,
	})
}

// POST /api/v1/games/by-code/:code/join
// Body: { "nickname": "...", "avatar_url": "..." }
// Returns: { "game_id", "participant_id", "room_code", "ws_ticket" }
func (h *Handler) JoinByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var body struct {
		Nickname  string  `json:"nickname"`
		AvatarURL *string `json:"avatar_url,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid json", err.Error())
		return
	}
	if body.Nickname == "" {
		httpapi.WriteProblem(w, http.StatusBadRequest, "nickname required", "")
		return
	}

	// Optionally attach a logged-in user.
	var userID *uuid.UUID
	if id, ok := middleware.UserID(r); ok {
		userID = &id
	}

	res, err := h.svc.JoinByCode(r.Context(), code, body.Nickname, body.AvatarURL, userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound):
			httpapi.WriteProblem(w, http.StatusNotFound, "room not found", "")
		case errors.Is(err, ErrSessionNotInLobby):
			httpapi.WriteProblem(w, http.StatusConflict, "game already started", "")
		case errors.Is(err, ErrAlreadyJoined):
			httpapi.WriteProblem(w, http.StatusConflict, "already joined", "")
		default:
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal error", err.Error())
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"game_id":        res.GameID,
		"participant_id": res.ParticipantID,
		"room_code":      res.RoomCode,
		"ws_ticket":      res.WSTicket,
	})
}
