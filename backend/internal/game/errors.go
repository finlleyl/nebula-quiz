package game

import (
	"errors"
	"strings"
)

var (
	ErrQuizNotFound      = errors.New("quiz not found")
	ErrForbidden         = errors.New("forbidden")
	ErrSessionNotFound   = errors.New("game session not found")
	ErrSessionNotInLobby = errors.New("game session is not in lobby")
	ErrAlreadyJoined     = errors.New("already joined this session")
)

// isUniqueViolation detects PostgreSQL unique-constraint errors from pgx.
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "SQLSTATE 23505") ||
		strings.Contains(err.Error(), "unique constraint")
}
