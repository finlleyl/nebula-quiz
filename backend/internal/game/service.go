package game

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/finlleyl/nebula-quiz/internal/realtime"
	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrQuizNotFound    = errors.New("quiz not found")
	ErrSessionNotFound = errors.New("game session not found")
	ErrForbidden       = errors.New("forbidden")
	ErrValidation      = errors.New("validation error")
	ErrNotInLobby      = errors.New("game is not in lobby state")
)

// CreateGameInput holds the request body for POST /games.
type CreateGameInput struct {
	QuizID uuid.UUID
}

// CreateGameResult is returned after creating a session.
type CreateGameResult struct {
	GameID      uuid.UUID
	RoomCode    string
	MatchNumber *int32
}

// JoinGameInput holds the request body for POST /games/by-code/:code/join.
type JoinGameInput struct {
	Nickname  string
	AvatarURL *string
	UserID    *uuid.UUID // nil for guests
}

// JoinGameResult is returned after joining.
type JoinGameResult struct {
	GameID        uuid.UUID
	ParticipantID uuid.UUID
	WSTicket      string
}

type Service struct {
	pool    *pgxpool.Pool
	q       *gen.Queries
	tickets *TicketStore
	hub     *realtime.Hub
}

func NewService(pool *pgxpool.Pool, tickets *TicketStore, hub *realtime.Hub) *Service {
	return &Service{
		pool:    pool,
		q:       gen.New(pool),
		tickets: tickets,
		hub:     hub,
	}
}

// CreateGame creates a game session and the corresponding realtime room.
func (s *Service) CreateGame(ctx context.Context, hostID uuid.UUID, in CreateGameInput) (CreateGameResult, error) {
	// Load quiz to validate ownership and get metadata.
	quiz, err := s.q.GetQuizByID(ctx, in.QuizID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CreateGameResult{}, ErrQuizNotFound
		}
		return CreateGameResult{}, err
	}
	if quiz.OwnerID != hostID {
		return CreateGameResult{}, ErrForbidden
	}

	code, err := GenerateRoomCode(ctx, s.q)
	if err != nil {
		return CreateGameResult{}, fmt.Errorf("generate room code: %w", err)
	}

	session, err := s.q.CreateGameSession(ctx, gen.CreateGameSessionParams{
		QuizID:   in.QuizID,
		HostID:   hostID,
		RoomCode: code,
	})
	if err != nil {
		return CreateGameResult{}, fmt.Errorf("create game session: %w", err)
	}

	// Count questions for quiz summary.
	questions, err := s.q.ListQuestionsByQuiz(ctx, in.QuizID)
	if err != nil {
		return CreateGameResult{}, err
	}

	s.hub.CreateRoom(code, session.ID, hostID, realtime.QuizInfo{
		Title:          quiz.Title,
		TotalQuestions: len(questions),
	})

	return CreateGameResult{
		GameID:      session.ID,
		RoomCode:    code,
		MatchNumber: session.MatchNumber,
	}, nil
}

// JoinGame adds a participant to a lobby-state session and issues a WS ticket.
func (s *Service) JoinGame(ctx context.Context, code string, in JoinGameInput) (JoinGameResult, error) {
	nickname := strings.TrimSpace(in.Nickname)
	if nickname == "" || len(nickname) > 50 {
		return JoinGameResult{}, fmt.Errorf("%w: nickname must be 1..50 characters", ErrValidation)
	}

	session, err := s.q.GetActiveGameSessionByCode(ctx, code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return JoinGameResult{}, ErrSessionNotFound
		}
		return JoinGameResult{}, err
	}
	if session.Status != gen.GameStatusLobby {
		return JoinGameResult{}, ErrNotInLobby
	}

	participant, err := s.q.CreateParticipant(ctx, gen.CreateParticipantParams{
		GameSessionID: session.ID,
		UserID:        in.UserID,
		Nickname:      nickname,
		AvatarUrl:     in.AvatarURL,
	})
	if err != nil {
		return JoinGameResult{}, fmt.Errorf("create participant: %w", err)
	}

	ticket, err := s.tickets.Issue(TicketClaims{
		UserID:        coalesceUUID(in.UserID),
		ParticipantID: participant.ID,
		GameSessionID: session.ID,
		RoomCode:      session.RoomCode,
		IsHost:        false,
		IsGuest:       in.UserID == nil,
		Nickname:      nickname,
	})
	if err != nil {
		return JoinGameResult{}, fmt.Errorf("issue ticket: %w", err)
	}

	return JoinGameResult{
		GameID:        session.ID,
		ParticipantID: participant.ID,
		WSTicket:      ticket,
	}, nil
}

// IssueHostTicket issues a WS ticket for the host of an existing session.
func (s *Service) IssueHostTicket(ctx context.Context, sessionID, hostID uuid.UUID, displayName string) (string, error) {
	session, err := s.q.GetGameSessionByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrSessionNotFound
		}
		return "", err
	}
	if session.HostID != hostID {
		return "", ErrForbidden
	}

	return s.tickets.Issue(TicketClaims{
		UserID:        hostID,
		ParticipantID: hostID, // host uses their own user ID as participant key
		GameSessionID: session.ID,
		RoomCode:      session.RoomCode,
		IsHost:        true,
		Nickname:      displayName,
	})
}

func coalesceUUID(u *uuid.UUID) uuid.UUID {
	if u == nil {
		return uuid.UUID{}
	}
	return *u
}
