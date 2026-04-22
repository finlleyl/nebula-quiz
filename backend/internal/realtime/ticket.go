package realtime

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const ticketTTL = 60 * time.Second
const ticketKeyPrefix = "ws_ticket:"

// TicketData is stored in Redis and redeemed on WS connect.
type TicketData struct {
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	SessionID     uuid.UUID  `json:"session_id"`
	ParticipantID uuid.UUID  `json:"participant_id"`
	IsHost        bool       `json:"is_host"`
	IsGuest       bool       `json:"is_guest"`
	Nickname      string     `json:"nickname"`
}

// TicketStore issues and redeems short-lived WS auth tickets backed by Redis.
type TicketStore struct {
	rdb *redis.Client
}

func NewTicketStore(rdb *redis.Client) *TicketStore {
	return &TicketStore{rdb: rdb}
}

func (ts *TicketStore) Issue(ctx context.Context, d TicketData) (string, error) {
	ticket := uuid.New().String()
	b, err := json.Marshal(d)
	if err != nil {
		return "", fmt.Errorf("marshal ticket: %w", err)
	}
	key := ticketKeyPrefix + ticket
	if err := ts.rdb.Set(ctx, key, b, ticketTTL).Err(); err != nil {
		return "", fmt.Errorf("redis set ticket: %w", err)
	}
	return ticket, nil
}

// Redeem retrieves the ticket data and deletes the key (single-use).
func (ts *TicketStore) Redeem(ctx context.Context, ticket string) (*TicketData, error) {
	key := ticketKeyPrefix + ticket
	b, err := ts.rdb.GetDel(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, fmt.Errorf("ticket not found or expired")
	}
	if err != nil {
		return nil, fmt.Errorf("redis get ticket: %w", err)
	}
	var d TicketData
	if err := json.Unmarshal(b, &d); err != nil {
		return nil, fmt.Errorf("unmarshal ticket: %w", err)
	}
	return &d, nil
}
