-- name: CreateGameSession :one
INSERT INTO game_sessions (quiz_id, host_id, room_code)
VALUES ($1, $2, $3)
RETURNING id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at;

-- name: GetActiveGameSessionByCode :one
SELECT id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at
FROM game_sessions
WHERE room_code = $1 AND status IN ('lobby', 'in_progress');

-- name: GetGameSessionByID :one
SELECT id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at
FROM game_sessions WHERE id = $1;

-- name: StartGameSession :exec
UPDATE game_sessions SET status = 'in_progress', started_at = now() WHERE id = $1;

-- name: FinishGameSession :exec
UPDATE game_sessions SET status = 'finished', finished_at = now() WHERE id = $1;
