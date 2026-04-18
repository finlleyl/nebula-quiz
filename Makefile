.PHONY: help up down logs ps migrate-up migrate-down migrate-status sqlc-gen backend-build backend-run backend-test front-install front-dev front-build

SHELL        := /bin/bash
COMPOSE_FILE := deploy/docker-compose.dev.yml
DB_DSN       := postgres://nebula:nebula@localhost:5432/nebula?sslmode=disable
MIGRATIONS   := backend/internal/storage/migrations

# Load .env into every target's environment (if present).
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

## --- infrastructure (postgres + redis + minio) ---

up: ## Start postgres + redis + minio in the background
	docker compose -f $(COMPOSE_FILE) up -d

down: ## Stop the dev stack and remove containers
	docker compose -f $(COMPOSE_FILE) down

logs: ## Tail logs from the dev stack
	docker compose -f $(COMPOSE_FILE) logs -f

ps: ## Show dev-stack container status
	docker compose -f $(COMPOSE_FILE) ps

## --- migrations (goose) ---

migrate-up: ## Apply all pending migrations
	cd backend && goose -dir internal/storage/migrations postgres "$(DB_DSN)" up

migrate-down: ## Roll back the last migration
	cd backend && goose -dir internal/storage/migrations postgres "$(DB_DSN)" down

migrate-status: ## Show migration status
	cd backend && goose -dir internal/storage/migrations postgres "$(DB_DSN)" status

## --- sqlc ---

sqlc-gen: ## Regenerate sqlc code from SQL
	cd backend && sqlc generate

## --- backend ---

backend-build: ## Build the backend binary
	cd backend && go build ./...

backend-run: ## Run the backend server (requires make up)
	cd backend && go run ./cmd/server

backend-test: ## Run backend tests
	cd backend && go test ./...

## --- frontend ---

front-install: ## Install frontend dependencies
	cd frontend && pnpm install

front-dev: ## Start the Vite dev server
	cd frontend && pnpm dev

front-build: ## Build the frontend for production
	cd frontend && pnpm build
