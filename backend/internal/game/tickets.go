package game

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/google/uuid"
)

// TicketClaims is the data stored behind a short-lived WS ticket.
type TicketClaims struct {
	UserID        uuid.UUID
	ParticipantID uuid.UUID
	GameSessionID uuid.UUID
	RoomCode      string
	IsHost        bool
	IsGuest       bool
	Nickname      string
}

type ticketEntry struct {
	claims    TicketClaims
	expiresAt time.Time
}

// TicketStore is an in-memory store for short-lived WS authentication tickets.
// TTL is 60 seconds per spec §14. A Redis-backed implementation can be
// substituted by satisfying the same Issue/Consume interface.
type TicketStore struct {
	mu      sync.Mutex
	entries map[string]ticketEntry
}

func NewTicketStore() *TicketStore {
	ts := &TicketStore{entries: make(map[string]ticketEntry)}
	go ts.sweepLoop()
	return ts
}

// Issue creates a new random ticket valid for 60 seconds.
func (ts *TicketStore) Issue(claims TicketClaims) (string, error) {
	raw := make([]byte, 24)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	ticket := hex.EncodeToString(raw)

	ts.mu.Lock()
	ts.entries[ticket] = ticketEntry{claims: claims, expiresAt: time.Now().Add(60 * time.Second)}
	ts.mu.Unlock()
	return ticket, nil
}

// Consume validates the ticket and removes it (one-time use).
func (ts *TicketStore) Consume(ticket string) (TicketClaims, bool) {
	ts.mu.Lock()
	defer ts.mu.Unlock()
	e, ok := ts.entries[ticket]
	if !ok || time.Now().After(e.expiresAt) {
		delete(ts.entries, ticket)
		return TicketClaims{}, false
	}
	delete(ts.entries, ticket)
	return e.claims, true
}

func (ts *TicketStore) sweepLoop() {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		ts.mu.Lock()
		for k, v := range ts.entries {
			if now.After(v.expiresAt) {
				delete(ts.entries, k)
			}
		}
		ts.mu.Unlock()
	}
}
