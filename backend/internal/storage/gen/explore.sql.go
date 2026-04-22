// Manually authored — sqlc not available in this environment.
// Follows the sqlc v1.30.0 codegen pattern used in this package.

package gen

import (
	"context"

	"github.com/google/uuid"
)

const listPublishedQuizzes = `-- name: ListPublishedQuizzes :many
SELECT id, owner_id, category_id, title, description, cover_url, settings,
       is_published, plays_count, created_at, updated_at
FROM quizzes
WHERE is_published = true
ORDER BY plays_count DESC, updated_at DESC
LIMIT $1 OFFSET $2
`

type ListPublishedQuizzesParams struct {
	Limit  int32 `json:"limit"`
	Offset int32 `json:"offset"`
}

func (q *Queries) ListPublishedQuizzes(ctx context.Context, arg ListPublishedQuizzesParams) ([]Quiz, error) {
	rows, err := q.db.Query(ctx, listPublishedQuizzes, arg.Limit, arg.Offset)
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

const searchPublishedQuizzes = `-- name: SearchPublishedQuizzes :many
SELECT id, owner_id, category_id, title, description, cover_url, settings,
       is_published, plays_count, created_at, updated_at
FROM quizzes
WHERE is_published = true
  AND ($3::uuid IS NULL OR category_id = $3)
  AND ($4 = '' OR title ILIKE '%' || $4 || '%')
ORDER BY plays_count DESC, updated_at DESC
LIMIT $1 OFFSET $2
`

type SearchPublishedQuizzesParams struct {
	Limit      int32      `json:"limit"`
	Offset     int32      `json:"offset"`
	CategoryID *uuid.UUID `json:"category_id"`
	Query      string     `json:"query"`
}

func (q *Queries) SearchPublishedQuizzes(ctx context.Context, arg SearchPublishedQuizzesParams) ([]Quiz, error) {
	rows, err := q.db.Query(ctx, searchPublishedQuizzes, arg.Limit, arg.Offset, arg.CategoryID, arg.Query)
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

const listCategories = `-- name: ListCategories :many
SELECT id, name, slug, icon FROM categories ORDER BY name
`

func (q *Queries) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := q.db.Query(ctx, listCategories)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Category{}
	for rows.Next() {
		var i Category
		if err := rows.Scan(&i.ID, &i.Name, &i.Slug, &i.Icon); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
