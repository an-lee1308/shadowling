CREATE TABLE youtube_lessons (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    youtube_video_id  VARCHAR(20)  NOT NULL,
    youtube_url       VARCHAR(500) NOT NULL,
    title             VARCHAR(500) NOT NULL,
    thumbnail_url     VARCHAR(500),
    channel_name      VARCHAR(200),
    duration_seconds  INTEGER,
    captions          TEXT,
    total_sentences   INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_practiced_at TIMESTAMP
);

CREATE TABLE youtube_sentence_progress (
    id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_lesson_id UUID    NOT NULL REFERENCES youtube_lessons(id) ON DELETE CASCADE,
    sentence_index    INTEGER NOT NULL,
    best_score        INTEGER NOT NULL DEFAULT 0,
    attempt_count     INTEGER NOT NULL DEFAULT 0,
    completed         BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (youtube_lesson_id, sentence_index)
);

CREATE INDEX idx_yl_user ON youtube_lessons(user_id);
CREATE INDEX idx_ysp_lesson ON youtube_sentence_progress(youtube_lesson_id);
