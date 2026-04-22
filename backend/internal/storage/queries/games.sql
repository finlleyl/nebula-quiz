-- name: CreateGameSession :one
INSERT INTO game_sessions (quiz_id, host_id, room_code, status)
VALUES ($1, $2, $3, 'lobby')
RETURNING id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at;

-- name: GetGameSessionByID :one
SELECT id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at
FROM game_sessions
WHERE id = $1;

-- name: GetActiveGameSessionByCode :one
SELECT id, quiz_id, host_id, room_code, match_number, status, started_at, finished_at, created_at
FROM game_sessions
WHERE room_code = $1
  AND status IN ('lobby', 'in_progress');

-- name: RoomCodeExists :one
SELECT EXISTS (
  SELECT 1 FROM game_sessions
  WHERE room_code = $1
    AND status IN ('lobby', 'in_progress')
) AS exists;

-- name: CreateParticipant :one
INSERT INTO game_participants (game_session_id, user_id, nickname, avatar_url, status)
VALUES ($1, $2, $3, $4, 'joined')
RETURNING id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at;

-- name: ListParticipants :many
SELECT id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at
FROM game_participants
WHERE game_session_id = $1
  AND status != 'left'
ORDER BY joined_at ASC;

-- name: GetParticipantByID :one
SELECT id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at
FROM game_participants
WHERE id = $1;
