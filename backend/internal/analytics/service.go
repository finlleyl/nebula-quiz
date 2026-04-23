package analytics

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Overview holds the KPI numbers shown on the organizer dashboard.
type Overview struct {
	TotalPlayers      int64   `json:"total_players"`
	ActiveSessions    int64   `json:"active_sessions"`
	AvgCompletionRate float64 `json:"avg_completion_rate"` // 0–100 percent
	TotalQuizzes      int64   `json:"total_quizzes"`
	TotalSessions     int64   `json:"total_sessions"`
	FinishedSessions  int64   `json:"finished_sessions"`
	AvgScore          float64 `json:"avg_score"`
	AvgPlayersPerGame float64 `json:"avg_players_per_game"`
}

// TopQuiz is a row of the "most-played quizzes" analytics table.
type TopQuiz struct {
	QuizID        string  `json:"quiz_id"`
	Title         string  `json:"title"`
	SessionsCount int64   `json:"sessions_count"`
	PlayersCount  int64   `json:"players_count"`
	AvgScore      float64 `json:"avg_score"`
}

// RecentSession is a row of the "recent activity" timeline.
type RecentSession struct {
	SessionID    string  `json:"session_id"`
	RoomCode     string  `json:"room_code"`
	QuizTitle    string  `json:"quiz_title"`
	Status       string  `json:"status"`
	FinishedAt   *string `json:"finished_at"`
	StartedAt    *string `json:"started_at"`
	PlayersCount int64   `json:"players_count"`
	AvgScore     float64 `json:"avg_score"`
}

// Report is the full analytics payload returned by GET /analytics/overview.
type Report struct {
	Overview       Overview        `json:"overview"`
	TopQuizzes     []TopQuiz       `json:"top_quizzes"`
	RecentSessions []RecentSession `json:"recent_sessions"`
}

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// GetOverview returns the full analytics report for a specific host.
func (s *Service) GetOverview(ctx context.Context, hostID uuid.UUID) (Report, error) {
	var r Report

	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT gp.id)
		FROM game_participants gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		WHERE gs.host_id = $1
	`, hostID).Scan(&r.Overview.TotalPlayers); err != nil {
		return r, fmt.Errorf("total players: %w", err)
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM game_sessions
		WHERE host_id = $1 AND status IN ('lobby','in_progress')
	`, hostID).Scan(&r.Overview.ActiveSessions); err != nil {
		return r, fmt.Errorf("active sessions: %w", err)
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE TRUE)                      AS total,
			COUNT(*) FILTER (WHERE status = 'finished')       AS finished
		FROM game_sessions WHERE host_id = $1
	`, hostID).Scan(&r.Overview.TotalSessions, &r.Overview.FinishedSessions); err != nil {
		return r, fmt.Errorf("session counts: %w", err)
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM quizzes WHERE owner_id = $1
	`, hostID).Scan(&r.Overview.TotalQuizzes); err != nil {
		return r, fmt.Errorf("total quizzes: %w", err)
	}

	// Completion rate: answered / (participants × questions) across finished sessions.
	if err := s.pool.QueryRow(ctx, `
		SELECT COALESCE(
			ROUND(100.0 * SUM(answered)::numeric / NULLIF(SUM(expected), 0), 1),
			0
		)
		FROM (
			SELECT
				gs.id,
				COUNT(DISTINCT pa.id)                                           AS answered,
				COUNT(DISTINCT gp.id) * COUNT(DISTINCT q.id)                   AS expected
			FROM game_sessions gs
			JOIN game_participants gp ON gp.game_session_id = gs.id
			JOIN quizzes           qz ON qz.id = gs.quiz_id
			JOIN questions         q  ON q.quiz_id = qz.id
			LEFT JOIN participant_answers pa
				   ON pa.participant_id = gp.id AND pa.question_id = q.id
			WHERE gs.host_id = $1 AND gs.status = 'finished'
			GROUP BY gs.id
		) sub
	`, hostID).Scan(&r.Overview.AvgCompletionRate); err != nil {
		return r, fmt.Errorf("avg completion: %w", err)
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT
			COALESCE(ROUND(AVG(gp.total_score)::numeric, 0), 0),
			COALESCE(ROUND(AVG(per_session.cnt)::numeric, 1), 0)
		FROM game_sessions gs
		LEFT JOIN game_participants gp ON gp.game_session_id = gs.id
		LEFT JOIN (
			SELECT game_session_id, COUNT(*) AS cnt
			FROM game_participants
			GROUP BY game_session_id
		) per_session ON per_session.game_session_id = gs.id
		WHERE gs.host_id = $1 AND gs.status = 'finished'
	`, hostID).Scan(&r.Overview.AvgScore, &r.Overview.AvgPlayersPerGame); err != nil {
		return r, fmt.Errorf("avg score/players: %w", err)
	}

	topQuizzes, err := s.topQuizzes(ctx, hostID)
	if err != nil {
		return r, err
	}
	r.TopQuizzes = topQuizzes

	recent, err := s.recentSessions(ctx, hostID)
	if err != nil {
		return r, err
	}
	r.RecentSessions = recent

	return r, nil
}

func (s *Service) topQuizzes(ctx context.Context, hostID uuid.UUID) ([]TopQuiz, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			qz.id, qz.title,
			COUNT(DISTINCT gs.id)                                       AS sessions_count,
			COUNT(DISTINCT gp.id)                                       AS players_count,
			COALESCE(ROUND(AVG(gp.total_score)::numeric, 0), 0)         AS avg_score
		FROM quizzes qz
		LEFT JOIN game_sessions gs       ON gs.quiz_id = qz.id
		LEFT JOIN game_participants gp   ON gp.game_session_id = gs.id
		WHERE qz.owner_id = $1
		GROUP BY qz.id, qz.title
		HAVING COUNT(DISTINCT gs.id) > 0
		ORDER BY sessions_count DESC, players_count DESC
		LIMIT 5
	`, hostID)
	if err != nil {
		return nil, fmt.Errorf("top quizzes: %w", err)
	}
	defer rows.Close()

	out := []TopQuiz{}
	for rows.Next() {
		var t TopQuiz
		var id uuid.UUID
		if err := rows.Scan(&id, &t.Title, &t.SessionsCount, &t.PlayersCount, &t.AvgScore); err != nil {
			return nil, fmt.Errorf("scan top quiz: %w", err)
		}
		t.QuizID = id.String()
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Service) recentSessions(ctx context.Context, hostID uuid.UUID) ([]RecentSession, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			gs.id, gs.room_code, qz.title, gs.status,
			gs.finished_at, gs.started_at,
			(SELECT COUNT(*) FROM game_participants gp WHERE gp.game_session_id = gs.id) AS players_count,
			COALESCE(
				(SELECT ROUND(AVG(total_score)::numeric, 0)
				 FROM game_participants WHERE game_session_id = gs.id),
				0
			) AS avg_score
		FROM game_sessions gs
		JOIN quizzes qz ON qz.id = gs.quiz_id
		WHERE gs.host_id = $1
		ORDER BY COALESCE(gs.finished_at, gs.started_at, gs.created_at) DESC
		LIMIT 10
	`, hostID)
	if err != nil {
		return nil, fmt.Errorf("recent sessions: %w", err)
	}
	defer rows.Close()

	out := []RecentSession{}
	for rows.Next() {
		var r RecentSession
		var id uuid.UUID
		var finishedAt, startedAt pgtype.Timestamptz
		if err := rows.Scan(&id, &r.RoomCode, &r.QuizTitle, &r.Status,
			&finishedAt, &startedAt, &r.PlayersCount, &r.AvgScore); err != nil {
			return nil, fmt.Errorf("scan recent: %w", err)
		}
		r.SessionID = id.String()
		if finishedAt.Valid {
			t := finishedAt.Time.Format("2006-01-02T15:04:05Z")
			r.FinishedAt = &t
		}
		if startedAt.Valid {
			t := startedAt.Time.Format("2006-01-02T15:04:05Z")
			r.StartedAt = &t
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
