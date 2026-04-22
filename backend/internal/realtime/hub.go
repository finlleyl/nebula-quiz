package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
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
}

func NewHub(tickets *TicketStore) *Hub {
	return &Hub{
		rooms:   make(map[string]*Room),
		tickets: tickets,
	}
}

// CreateRoom adds a room to the hub and starts its goroutine.
func (h *Hub) CreateRoom(code string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[code]; ok {
		return r
	}
	r := newRoom(code, h)
	h.rooms[code] = r
	go r.run()
	return r
}

// GetRoom returns an existing room or nil.
func (h *Hub) GetRoom(code string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[code]
}

func (h *Hub) removeRoom(code string) {
	h.mu.Lock()
	delete(h.rooms, code)
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
			room = h.CreateRoom(roomKey)
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
