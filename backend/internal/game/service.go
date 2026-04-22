package game

import (
	"context"
	"errors"
	"fmt"
	"math/rand/v2"

	"github.com/finlleyl/nebula-quiz/internal/realtime"
	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// codeAlphabet excludes visually ambiguous characters per spec §7.
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// generateRoomCode produces a 7-char code formatted as XXX-XXXX.
// Alphabet has 32 chars; dash is always at position 3.
func generateRoomCode() string {
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

type Service struct {
	q       *gen.Queries
	pool    *pgxpool.Pool
	tickets *realtime.TicketStore
	hub     *realtime.Hub
}

func NewService(pool *pgxpool.Pool, tickets *realtime.TicketStore, hub *realtime.Hub) *Service {
	return &Service{
		q:       gen.New(pool),
		pool:    pool,
		tickets: tickets,
		hub:     hub,
	}
}

// CreateSessionResult is returned to the host after creating a game session.
type CreateSessionResult struct {
	GameID      uuid.UUID
	RoomCode    string
	MatchNumber int32
	WSTicket    string
}

// CreateSession creates a new lobby for a quiz and issues a host WS ticket.
// Retries room code generation on collision up to 5 times (spec §7).
func (s *Service) CreateSession(ctx context.Context, quizID, hostID uuid.UUID) (*CreateSessionResult, error) {
	quizRow, err := s.q.GetQuizByID(ctx, quizID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrQuizNotFound
		}
		return nil, fmt.Errorf("get quiz: %w", err)
	}
	if quizRow.OwnerID != hostID {
		return nil, ErrForbidden
	}

	hostUser, err := s.q.GetUserByID(ctx, hostID)
	if err != nil {
		return nil, fmt.Errorf("get host user: %w", err)
	}

	// Count questions so we can display total in lobby room state.
	questions, err := s.q.ListQuestionsByQuiz(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("list questions: %w", err)
	}

	var session gen.GameSession
	for attempt := range 5 {
		code := generateRoomCode()
		session, err = s.q.CreateGameSession(ctx, gen.CreateGameSessionParams{
			QuizID:   quizID,
			HostID:   hostID,
			RoomCode: code,
		})
		if err == nil {
			break
		}
		if isUniqueViolation(err) {
			if attempt == 4 {
				return nil, fmt.Errorf("room code collision after 5 attempts")
			}
			continue
		}
		return nil, fmt.Errorf("create session: %w", err)
	}

	participantID := uuid.New() // host pseudo-participant (no row in game_participants)
	ticket, err := s.tickets.Issue(ctx, realtime.TicketData{
		UserID:        &hostID,
		SessionID:     session.ID,
		ParticipantID: participantID,
		IsHost:        true,
		IsGuest:       false,
		Nickname:      hostUser.DisplayName,
	})
	if err != nil {
		return nil, fmt.Errorf("issue host ticket: %w", err)
	}

	matchNum := int32(0)
	if session.MatchNumber != nil {
		matchNum = *session.MatchNumber
	}

	// Pre-create the room so it's ready for the host WS connection.
	s.hub.CreateRoom(
		session.ID,
		quizID,
		quizRow.Title,
		len(questions),
		session.RoomCode,
		matchNum,
	)

	return &CreateSessionResult{
		GameID:      session.ID,
		RoomCode:    session.RoomCode,
		MatchNumber: matchNum,
		WSTicket:    ticket,
	}, nil
}

// JoinResult is returned to a player after joining a lobby.
type JoinResult struct {
	GameID        uuid.UUID
	ParticipantID uuid.UUID
	RoomCode      string
	WSTicket      string
}

// JoinByCode adds a participant to an open lobby and issues a player WS ticket.
func (s *Service) JoinByCode(
	ctx context.Context,
	code, nickname string,
	avatarURL *string,
	userID *uuid.UUID,
) (*JoinResult, error) {
	session, err := s.q.GetActiveGameSessionByCode(ctx, code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("get session: %w", err)
	}
	if session.Status != gen.GameStatusLobby {
		return nil, ErrSessionNotInLobby
	}

	// Prevent a logged-in user from joining the same session twice.
	if userID != nil {
		_, checkErr := s.q.GetUserParticipantBySession(ctx, gen.GetUserParticipantBySessionParams{
			GameSessionID: session.ID,
			UserID:        *userID,
		})
		if checkErr == nil {
			return nil, ErrAlreadyJoined
		}
		if !errors.Is(checkErr, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check duplicate: %w", checkErr)
		}
	}

	participant, err := s.q.CreateParticipant(ctx, gen.CreateParticipantParams{
		GameSessionID: session.ID,
		UserID:        userID,
		Nickname:      nickname,
		AvatarUrl:     avatarURL,
	})
	if err != nil {
		return nil, fmt.Errorf("create participant: %w", err)
	}

	ticket, err := s.tickets.Issue(ctx, realtime.TicketData{
		UserID:        userID,
		SessionID:     session.ID,
		ParticipantID: participant.ID,
		IsHost:        false,
		IsGuest:       userID == nil,
		Nickname:      nickname,
	})
	if err != nil {
		return nil, fmt.Errorf("issue player ticket: %w", err)
	}

	return &JoinResult{
		GameID:        session.ID,
		ParticipantID: participant.ID,
		RoomCode:      session.RoomCode,
		WSTicket:      ticket,
	}, nil
}

// GetSession returns session details for the GET /games/:id endpoint.
func (s *Service) GetSession(ctx context.Context, gameID uuid.UUID) (gen.GameSession, error) {
	sess, err := s.q.GetGameSessionByID(ctx, gameID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return gen.GameSession{}, ErrSessionNotFound
		}
		return gen.GameSession{}, fmt.Errorf("get session: %w", err)
	}
	return sess, nil
}
