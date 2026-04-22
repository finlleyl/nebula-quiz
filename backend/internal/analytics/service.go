package analytics

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Overview holds the KPI numbers shown on the organizer dashboard.
type Overview struct {
	TotalPlayers      int64   `json:"total_players"`
	ActiveSessions    int64   `json:"active_sessions"`
	AvgCompletionRate float64 `json:"avg_completion_rate"` // 0–100 percent
}

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// GetOverview returns KPI stats for a specific host.
func (s *Service) GetOverview(ctx context.Context, hostID uuid.UUID) (Overview, error) {
	var o Overview

	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT gp.id)
		FROM game_participants gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		WHERE gs.host_id = $1
	`, hostID).Scan(&o.TotalPlayers)
	if err != nil {
		return o, err
	}

	err = s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM game_sessions
		WHERE host_id = $1 AND status IN ('lobby','in_progress')
	`, hostID).Scan(&o.ActiveSessions)
	if err != nil {
		return o, err
	}

	// Completion rate: answered / (participants × questions) across finished sessions.
	err = s.pool.QueryRow(ctx, `
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
	`, hostID).Scan(&o.AvgCompletionRate)
	if err != nil {
		return o, err
	}

	return o, nil
}
