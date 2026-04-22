package gen

import (
	"context"

	"github.com/google/uuid"
)

const insertParticipantAnswer = `
INSERT INTO participant_answers
  (participant_id, question_id, selected_option_ids, response_time_ms, is_correct, score_awarded)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (participant_id, question_id) DO NOTHING
`

type InsertParticipantAnswerParams struct {
	ParticipantID     uuid.UUID   `json:"participant_id"`
	QuestionID        uuid.UUID   `json:"question_id"`
	SelectedOptionIds []uuid.UUID `json:"selected_option_ids"`
	ResponseTimeMs    int32       `json:"response_time_ms"`
	IsCorrect         bool        `json:"is_correct"`
	ScoreAwarded      int32       `json:"score_awarded"`
}

func (q *Queries) InsertParticipantAnswer(ctx context.Context, arg InsertParticipantAnswerParams) error {
	_, err := q.db.Exec(ctx, insertParticipantAnswer,
		arg.ParticipantID,
		arg.QuestionID,
		arg.SelectedOptionIds,
		arg.ResponseTimeMs,
		arg.IsCorrect,
		arg.ScoreAwarded,
	)
	return err
}
