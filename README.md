# Nebula Quiz

Live real-time quiz platform. See `nebula-quiz-spec.md` for the authoritative product, architecture, and protocol spec.

## Layout

```
backend/    Go modular monolith (chi, gorilla/websocket, pgx, sqlc, goose)
frontend/   React 18 + Vite + TypeScript (Tailwind, shadcn/ui)
deploy/     docker-compose.dev.yml + nginx.conf
```

`nebula-quiz-spec.md` and `CLAUDE.md` live at the repo root — both are shared across backend and frontend.

## Prerequisites

- Go 1.25
- Node 20+ and pnpm 9+
- Docker + Docker Compose
- [`goose`](https://github.com/pressly/goose) and [`sqlc`](https://github.com/sqlc-dev/sqlc) on `$PATH`

## First run

```bash
cp .env.example .env

# 1. Start postgres/redis/minio
make up

# 2. Apply schema
make migrate-up

# 3. Backend (health-check only in iteration 1)
make backend-run   # :8080/healthz

# 4. Frontend
make front-install
make front-dev     # :5173
```

## Common tasks

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `make up` / `down`   | Start / stop the dev infrastructure  |
| `make migrate-up`    | Apply pending goose migrations       |
| `make sqlc-gen`      | Regenerate sqlc code                 |
| `make backend-build` | `go build ./...` inside `backend/`   |
| `make backend-test`  | `go test ./...` inside `backend/`    |
| `make front-dev`     | Vite dev server                      |

## WS / REST contracts

Single sources of truth for the wire format:

- Go:         `backend/internal/realtime/protocol.go`
- TypeScript: `frontend/src/shared/lib/ws/protocol.ts`

Both mirror spec §9. Keep them in lockstep.

## Status — iteration 1

Scaffolding only. Health-check backend, empty sqlc queries, Tailwind + shadcn with Nebula tokens, WS protocol types. Iteration 2 wires up auth + first REST endpoints.
