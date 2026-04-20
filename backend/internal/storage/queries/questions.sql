-- name: CreateQuestion :one
-- Appends at the next order_idx atomically under READ COMMITTED by computing
-- MAX(order_idx)+1 inside the same statement, avoiding TOCTOU collisions on
-- the UNIQUE (quiz_id, order_idx) index.
INSERT INTO questions (quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points)
SELECT $1,
       COALESCE((SELECT MAX(order_idx) + 1 FROM questions WHERE quiz_id = $1), 0),
       $2, $3, $4, $5, $6
RETURNING id, quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points;

-- name: CreateQuestionAt :one
INSERT INTO questions (quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points;

-- name: GetQuestionByID :one
SELECT id, quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points
FROM questions
WHERE id = $1;

-- name: ListQuestionsByQuiz :many
SELECT id, quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points
FROM questions
WHERE quiz_id = $1
ORDER BY order_idx ASC;

-- name: UpdateQuestion :one
UPDATE questions
SET text               = COALESCE(sqlc.narg('text'),               text),
    image_url          = COALESCE(sqlc.narg('image_url'),          image_url),
    question_type      = COALESCE(sqlc.narg('question_type'),      question_type),
    time_limit_seconds = COALESCE(sqlc.narg('time_limit_seconds'), time_limit_seconds),
    points             = COALESCE(sqlc.narg('points'),             points)
WHERE id = $1
RETURNING id, quiz_id, order_idx, text, image_url, question_type, time_limit_seconds, points;

-- name: DeleteQuestion :exec
DELETE FROM questions WHERE id = $1;

-- name: ShiftQuestionOrderIdx :exec
UPDATE questions
SET order_idx = order_idx + 1000000
WHERE quiz_id = $1;

-- name: SetQuestionOrderIdx :exec
UPDATE questions
SET order_idx = $3
WHERE id = $1 AND quiz_id = $2;

