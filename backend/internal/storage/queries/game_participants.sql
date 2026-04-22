-- name: CreateParticipant :one
INSERT INTO game_participants (game_session_id, user_id, nickname, avatar_url)
VALUES ($1, $2, $3, $4)
RETURNING id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at;

-- name: GetParticipantsBySession :many
SELECT id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at
FROM game_participants
WHERE game_session_id = $1 AND status != 'left'
ORDER BY joined_at;

-- name: GetParticipantByID :one
SELECT id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at
FROM game_participants WHERE id = $1;

-- name: GetUserParticipantBySession :one
SELECT id, game_session_id, user_id, nickname, avatar_url, status, total_score, power_ups_left, joined_at, left_at
FROM game_participants WHERE game_session_id = $1 AND user_id = $2;

-- name: UpdateParticipantStatus :exec
UPDATE game_participants SET status = $2 WHERE id = $1;

-- name: MarkParticipantLeft :exec
UPDATE game_participants SET status = 'left', left_at = now() WHERE id = $1;
