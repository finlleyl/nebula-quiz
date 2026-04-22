package game

import (
	"context"
	"fmt"
	"math/rand/v2"
)

// codeAlphabet excludes visually ambiguous characters (0, O, I, 1).
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// codeChecker abstracts the DB lookup used during generation.
type codeChecker interface {
	RoomCodeExists(ctx context.Context, roomCode string) (bool, error)
}

// GenerateRoomCode returns a unique 7-character code in the format XXX-XXXX.
// It retries up to 5 times on collision before returning an error.
func GenerateRoomCode(ctx context.Context, db codeChecker) (string, error) {
	for range 5 {
		code := randomCode()
		exists, err := db.RoomCodeExists(ctx, code)
		if err != nil {
			return "", fmt.Errorf("room code check: %w", err)
		}
		if !exists {
			return code, nil
		}
	}
	return "", fmt.Errorf("failed to generate unique room code after 5 attempts")
}

func randomCode() string {
	b := make([]byte, 7)
	for i := range b {
		if i == 3 {
			b[i] = '-'
			continue
		}
		b[i] = codeAlphabet[rand.IntN(len(codeAlphabet))]
	}
	return string(b)
}
