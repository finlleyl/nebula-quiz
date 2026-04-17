-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role          AS ENUM ('participant', 'organizer', 'admin');
CREATE TYPE question_type      AS ENUM ('single', 'multiple');
CREATE TYPE game_status        AS ENUM ('lobby', 'in_progress', 'finished', 'aborted');
CREATE TYPE participant_status AS ENUM ('joined', 'ready', 'vip', 'left');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'participant',
    display_name  TEXT NOT NULL,
    avatar_url    TEXT,
    plan          TEXT NOT NULL DEFAULT 'free',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    user_agent TEXT,
    ip         INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);

CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT
);

CREATE TABLE quizzes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID REFERENCES categories(id),
    title        TEXT NOT NULL,
    description  TEXT,
    cover_url    TEXT,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    plays_count  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_owner_id_idx          ON quizzes (owner_id);
CREATE INDEX quizzes_published_category_idx ON quizzes (is_published, category_id);

CREATE TABLE questions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id            UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    order_idx          INT NOT NULL,
    text               TEXT NOT NULL,
    image_url          TEXT,
    question_type      question_type NOT NULL,
    time_limit_seconds INT NOT NULL DEFAULT 20 CHECK (time_limit_seconds IN (10, 20, 30, 60)),
    points             INT NOT NULL DEFAULT 1000,
    UNIQUE (quiz_id, order_idx)
);

CREATE TABLE answer_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    order_idx   INT NOT NULL
);
CREATE INDEX answer_options_question_id_idx ON answer_options (question_id);

CREATE TABLE game_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id      UUID NOT NULL REFERENCES quizzes(id),
    host_id      UUID NOT NULL REFERENCES users(id),
    room_code    CHAR(7) NOT NULL,
    match_number SERIAL,
    status       game_status NOT NULL DEFAULT 'lobby',
    started_at   TIMESTAMPTZ,
    finished_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX game_sessions_active_code_idx
    ON game_sessions (room_code)
    WHERE status IN ('lobby','in_progress');

CREATE TABLE game_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    nickname        TEXT NOT NULL,
    avatar_url      TEXT,
    status          participant_status NOT NULL DEFAULT 'joined',
    total_score     INT NOT NULL DEFAULT 0,
    power_ups_left  INT NOT NULL DEFAULT 1,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at         TIMESTAMPTZ
);
CREATE UNIQUE INDEX game_participants_session_user_idx
    ON game_participants (game_session_id, user_id)
    WHERE user_id IS NOT NULL;
CREATE INDEX game_participants_session_idx ON game_participants (game_session_id);

CREATE TABLE participant_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id      UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES questions(id),
    selected_option_ids UUID[] NOT NULL,
    answered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_time_ms    INT NOT NULL,
    is_correct          BOOLEAN NOT NULL,
    score_awarded       INT NOT NULL,
    used_power_up       TEXT,
    UNIQUE (participant_id, question_id)
);

CREATE TABLE saved_quizzes (
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id  UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, quiz_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS saved_quizzes;
DROP TABLE IF EXISTS participant_answers;
DROP TABLE IF EXISTS game_participants;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS answer_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS participant_status;
DROP TYPE IF EXISTS game_status;
DROP TYPE IF EXISTS question_type;
DROP TYPE IF EXISTS user_role;
-- +goose StatementEnd
