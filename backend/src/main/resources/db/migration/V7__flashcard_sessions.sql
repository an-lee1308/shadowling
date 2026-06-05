ALTER TABLE user_words
    ADD COLUMN again_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN leech       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN suspended   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE word_review_sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode          VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    started_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    ended_at      TIMESTAMP,
    total_cards   INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    again_count   INTEGER NOT NULL DEFAULT 0,
    xp_earned     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_wrs_user ON word_review_sessions(user_id);
