-- name: InsertRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, token_hash, expires_at, revoked_at, user_agent, ip, created_at;

-- name: GetActiveRefreshTokenByHash :one
SELECT id, user_id, token_hash, expires_at, revoked_at, user_agent, ip, created_at
FROM refresh_tokens
WHERE token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > now();

-- name: GetRefreshTokenByHash :one
SELECT id, user_id, token_hash, expires_at, revoked_at, user_agent, ip, created_at
FROM refresh_tokens
WHERE token_hash = $1;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens
SET revoked_at = now()
WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens
SET revoked_at = now()
WHERE user_id = $1 AND revoked_at IS NULL;
