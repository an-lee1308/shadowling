-- Add XP and role to users
ALTER TABLE users ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Achievements definition
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    xp_reward INTEGER NOT NULL DEFAULT 0
);

-- User earned achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_users_xp ON users(total_xp DESC);

-- Seed achievements
INSERT INTO achievements (code, name, description, icon, xp_reward) VALUES
('FIRST_LESSON',       'First Steps',         'Hoàn thành bài học đầu tiên',         '🎯', 50),
('STREAK_3',           'On a Roll',           'Duy trì streak 3 ngày liên tiếp',      '🔥', 30),
('STREAK_7',           'Week Warrior',        'Duy trì streak 7 ngày liên tiếp',      '⚡', 100),
('STREAK_30',          'Iron Will',           'Duy trì streak 30 ngày liên tiếp',     '💪', 500),
('WORDS_10',           'Vocabulary Builder',  'Lưu 10 từ vào từ điển',                '📖', 25),
('WORDS_50',           'Word Collector',      'Lưu 50 từ vào từ điển',                '📚', 75),
('WORDS_200',          'Word Master',         'Lưu 200 từ vào từ điển',               '🧠', 300),
('PERFECT_DICTATION',  'Perfect Ear',         'Đạt 100% trong một bài Dictation',     '👂', 150),
('LESSONS_10',         'Dedicated Learner',   'Hoàn thành 10 bài học',                '🏅', 200),
('LESSONS_50',         'Knowledge Seeker',    'Hoàn thành 50 bài học',                '🏆', 500),
('SHADOWING_FIRST',    'Shadow Master',       'Hoàn thành bài Shadowing đầu tiên',    '🎤', 75),
('HIGH_SCORE_90',      'Accuracy Expert',     'Đạt 90%+ trong 5 bài liên tiếp',       '🌟', 200);
