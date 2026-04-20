-- name: InsertAnswerOption :one
INSERT INTO answer_options (question_id, text, is_correct, order_idx)
VALUES ($1, $2, $3, $4)
RETURNING id, question_id, text, is_correct, order_idx;

-- name: ListAnswerOptionsByQuestion :many
SELECT id, question_id, text, is_correct, order_idx
FROM answer_options
WHERE question_id = $1
ORDER BY order_idx ASC;

-- name: ListAnswerOptionsByQuiz :many
SELECT ao.id, ao.question_id, ao.text, ao.is_correct, ao.order_idx
FROM answer_options ao
JOIN questions q ON q.id = ao.question_id
WHERE q.quiz_id = $1
ORDER BY ao.question_id, ao.order_idx;

-- name: DeleteAnswerOptionsByQuestion :exec
DELETE FROM answer_options WHERE question_id = $1;
