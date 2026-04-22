package realtime

import (
	"fmt"
	"sync"

	"github.com/google/uuid"
)

// Hub owns all active rooms and routes new connections to them.
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room // room_code → Room
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]*Room)}
}

// CreateRoom initialises a new room and starts its event loop.
func (h *Hub) CreateRoom(code string, sessionID, hostID uuid.UUID, quiz QuizInfo) *Room {
	r := NewRoom(code, sessionID, hostID, quiz)
	h.mu.Lock()
	h.rooms[code] = r
	h.mu.Unlock()
	go r.Run()
	return r
}

// GetRoom looks up a room by code.
func (h *Hub) GetRoom(code string) (*Room, error) {
	h.mu.RLock()
	r, ok := h.rooms[code]
	h.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("room %q not found", code)
	}
	return r, nil
}

// DeleteRoom stops and removes a room.
func (h *Hub) DeleteRoom(code string) {
	h.mu.Lock()
	if r, ok := h.rooms[code]; ok {
		r.Close()
		delete(h.rooms, code)
	}
	h.mu.Unlock()
}
