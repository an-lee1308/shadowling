CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    password_hash VARCHAR(255),
    level VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    goal VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    streak_count INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    transcript TEXT,
    level VARCHAR(20) NOT NULL,
    topic VARCHAR(100),
    duration_seconds INTEGER,
    published_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    best_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMP,
    UNIQUE(user_id, lesson_id, mode)
);

CREATE TABLE words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text VARCHAR(255) NOT NULL,
    definition TEXT,
    pronunciation VARCHAR(255),
    audio_url VARCHAR(500),
    example_sentence TEXT
);

CREATE TABLE lesson_words (
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, word_id)
);

CREATE TABLE user_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMP,
    UNIQUE(user_id, word_id)
);

CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL,
    score DOUBLE PRECISION,
    accuracy_percent DOUBLE PRECISION,
    recording_url VARCHAR(500),
    errors TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ulp_user ON user_lesson_progress(user_id);
CREATE INDEX idx_ulp_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_ps_user ON practice_sessions(user_id);
CREATE INDEX idx_ps_created ON practice_sessions(created_at);
CREATE INDEX idx_uw_user ON user_words(user_id);
CREATE INDEX idx_uw_next_review ON user_words(next_review_at);
CREATE INDEX idx_lessons_level ON lessons(level);
CREATE INDEX idx_lessons_topic ON lessons(topic);
