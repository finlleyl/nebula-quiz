package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"

	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 4096,
	CheckOrigin:     func(_ *http.Request) bool { return true },
}

// Hub manages all active rooms.
type Hub struct {
	mu      sync.RWMutex
	rooms   map[string]*Room
	tickets *TicketStore
	db      *gen.Queries
}

func NewHub(tickets *TicketStore, pool *pgxpool.Pool) *Hub {
	return &Hub{
		rooms:   make(map[string]*Room),
		tickets: tickets,
		db:      gen.New(pool),
	}
}

// CreateRoom creates a new room and starts its goroutine.
// sessionID is the hub map key; roomCode is the human-readable 7-char code.
func (h *Hub) CreateRoom(
	sessionID uuid.UUID,
	quizID uuid.UUID,
	quizTitle string,
	totalQs int,
	roomCode string,
	matchNumber int32,
) *Room {
	key := sessionID.String()
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[key]; ok {
		return r
	}
	r := newRoom(key, roomCode, h, sessionID, quizID, quizTitle, totalQs, matchNumber, h.db)
	h.rooms[key] = r
	go r.run()
	return r
}

// GetRoom returns an existing room or nil.
func (h *Hub) GetRoom(key string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[key]
}

func (h *Hub) removeRoom(key string) {
	h.mu.Lock()
	delete(h.rooms, key)
	h.mu.Unlock()
}

// ServeWS upgrades the HTTP connection and routes the client into a room.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	ticket := r.URL.Query().Get("ticket")
	if ticket == "" {
		http.Error(w, "missing ticket", http.StatusUnauthorized)
		return
	}

	td, err := h.tickets.Redeem(context.Background(), ticket)
	if err != nil {
		slog.Warn("invalid ws ticket", "err", err)
		http.Error(w, "invalid or expired ticket", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("ws upgrade failed", "err", err)
		return
	}

	roomKey := td.SessionID.String()
	room := h.GetRoom(roomKey)
	if room == nil {
		if td.IsHost {
			// Host reconnected after room was dropped; recreate with minimal info.
			// In practice the room should already exist (created in game.Service).
			room = h.CreateRoom(td.SessionID, uuid.Nil, "", 0, "", 0)
		} else {
			_ = conn.WriteMessage(websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.CloseNormalClosure, "room not found"))
			conn.Close()
			return
		}
	}

	c := newClient(conn, room, td)
	room.register <- c
	slog.Info("ws client registered",
		"session", td.SessionID, "participant", td.ParticipantID, "isHost", td.IsHost)

	go c.writePump()
	c.readPump()
}

// encodeEnvelope serialises a typed envelope to JSON bytes.
func encodeEnvelope(msgType MessageType, payload any) ([]byte, error) {
	env := struct {
		Type    MessageType `json:"type"`
		Payload any         `json:"payload,omitempty"`
	}{Type: msgType, Payload: payload}
	return json.Marshal(env)
}
