-- name: CreateQuiz :one
INSERT INTO quizzes (owner_id, category_id, title, description, cover_url)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, owner_id, category_id, title, description, cover_url, settings,
          is_published, plays_count, created_at, updated_at;

-- name: GetQuizByID :one
SELECT id, owner_id, category_id, title, description, cover_url, settings,
       is_published, plays_count, created_at, updated_at
FROM quizzes
WHERE id = $1;

-- name: ListQuizzesByOwner :many
SELECT id, owner_id, category_id, title, description, cover_url, settings,
       is_published, plays_count, created_at, updated_at
FROM quizzes
WHERE owner_id = $1
ORDER BY updated_at DESC
LIMIT $2 OFFSET $3;

-- name: CountQuizzesByOwner :one
SELECT COUNT(*) FROM quizzes WHERE owner_id = $1;

-- name: UpdateQuiz :one
UPDATE quizzes
SET title       = COALESCE(sqlc.narg('title'),       title),
    description = COALESCE(sqlc.narg('description'), description),
    cover_url   = COALESCE(sqlc.narg('cover_url'),   cover_url),
    category_id = COALESCE(sqlc.narg('category_id'), category_id),
    updated_at  = now()
WHERE id = $1
RETURNING id, owner_id, category_id, title, description, cover_url, settings,
          is_published, plays_count, created_at, updated_at;

-- name: ClearQuizDescription :exec
UPDATE quizzes SET description = NULL, updated_at = now() WHERE id = $1;

-- name: ClearQuizCoverURL :exec
UPDATE quizzes SET cover_url = NULL, updated_at = now() WHERE id = $1;

-- name: ClearQuizCategory :exec
UPDATE quizzes SET category_id = NULL, updated_at = now() WHERE id = $1;

-- name: SetQuizPublished :exec
UPDATE quizzes
SET is_published = $2,
    updated_at   = now()
WHERE id = $1;

-- name: DeleteQuiz :exec
DELETE FROM quizzes WHERE id = $1;

-- name: DuplicateQuiz :one
INSERT INTO quizzes (owner_id, category_id, title, description, cover_url, settings)
SELECT q.owner_id, q.category_id, q.title || ' (copy)',
       q.description, q.cover_url, q.settings
FROM quizzes AS q
WHERE q.id = $1
RETURNING quizzes.id, quizzes.owner_id, quizzes.category_id, quizzes.title,
          quizzes.description, quizzes.cover_url, quizzes.settings,
          quizzes.is_published, quizzes.plays_count,
          quizzes.created_at, quizzes.updated_at;
