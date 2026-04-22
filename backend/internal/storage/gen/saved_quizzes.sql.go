// Manually authored — sqlc not available in this environment.
// Follows the sqlc v1.30.0 codegen pattern used in this package.

package gen

import (
	"context"

	"github.com/google/uuid"
)

const saveQuiz = `-- name: SaveQuiz :exec
INSERT INTO saved_quizzes (user_id, quiz_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING
`

func (q *Queries) SaveQuiz(ctx context.Context, userID uuid.UUID, quizID uuid.UUID) error {
	_, err := q.db.Exec(ctx, saveQuiz, userID, quizID)
	return err
}

const unsaveQuiz = `-- name: UnsaveQuiz :exec
DELETE FROM saved_quizzes WHERE user_id = $1 AND quiz_id = $2
`

func (q *Queries) UnsaveQuiz(ctx context.Context, userID uuid.UUID, quizID uuid.UUID) error {
	_, err := q.db.Exec(ctx, unsaveQuiz, userID, quizID)
	return err
}

const listSavedQuizzesByUser = `-- name: ListSavedQuizzesByUser :many
SELECT q.id, q.owner_id, q.category_id, q.title, q.description, q.cover_url, q.settings,
       q.is_published, q.plays_count, q.created_at, q.updated_at
FROM quizzes q
JOIN saved_quizzes sq ON sq.quiz_id = q.id
WHERE sq.user_id = $1
ORDER BY sq.saved_at DESC
`

func (q *Queries) ListSavedQuizzesByUser(ctx context.Context, userID uuid.UUID) ([]Quiz, error) {
	rows, err := q.db.Query(ctx, listSavedQuizzesByUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Quiz{}
	for rows.Next() {
		var i Quiz
		if err := rows.Scan(
			&i.ID,
			&i.OwnerID,
			&i.CategoryID,
			&i.Title,
			&i.Description,
			&i.CoverUrl,
			&i.Settings,
			&i.IsPublished,
			&i.PlaysCount,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const isQuizSaved = `-- name: IsQuizSaved :one
SELECT EXISTS(SELECT 1 FROM saved_quizzes WHERE user_id = $1 AND quiz_id = $2)
`

func (q *Queries) IsQuizSaved(ctx context.Context, userID uuid.UUID, quizID uuid.UUID) (bool, error) {
	row := q.db.QueryRow(ctx, isQuizSaved, userID, quizID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}
