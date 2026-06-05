-- Sample lessons
INSERT INTO lessons (id, title, description, audio_url, thumbnail_url, transcript, level, topic, duration_seconds)
VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Morning Greetings',
    'Practice everyday English greetings used in the morning',
    'https://example.com/audio/morning-greetings.mp3',
    'https://example.com/thumbnails/morning.jpg',
    '[{"start":0,"end":3,"text":"Good morning! How are you today?"},{"start":3,"end":6,"text":"I am doing great, thank you for asking."},{"start":6,"end":10,"text":"Have you had breakfast yet?"}]',
    'BEGINNER',
    'Daily Conversation',
    30
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'At the Coffee Shop',
    'Learn how to order drinks and make small talk at a coffee shop',
    'https://example.com/audio/coffee-shop.mp3',
    'https://example.com/thumbnails/coffee.jpg',
    '[{"start":0,"end":4,"text":"Hello, what can I get for you today?"},{"start":4,"end":8,"text":"I would like a large cappuccino, please."},{"start":8,"end":12,"text":"Would you like that with oat milk or regular milk?"}]',
    'BEGINNER',
    'Daily Conversation',
    45
),
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Job Interview Basics',
    'Key phrases and responses for common job interview questions',
    'https://example.com/audio/job-interview.mp3',
    'https://example.com/thumbnails/interview.jpg',
    '[{"start":0,"end":5,"text":"Tell me a little bit about yourself and your background."},{"start":5,"end":10,"text":"I have been working in software development for over five years."},{"start":10,"end":15,"text":"What would you say is your greatest professional strength?"}]',
    'INTERMEDIATE',
    'Business',
    60
),
(
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'IELTS Listening Practice',
    'Academic listening passage about environmental science',
    'https://example.com/audio/ielts-env.mp3',
    'https://example.com/thumbnails/ielts.jpg',
    '[{"start":0,"end":6,"text":"Climate change refers to long-term shifts in global temperatures and weather patterns."},{"start":6,"end":12,"text":"Since the industrial revolution, human activities have been the main driver of climate change."},{"start":12,"end":18,"text":"The burning of fossil fuels generates greenhouse gas emissions that trap the sun''s heat."}]',
    'ADVANCED',
    'IELTS',
    90
);

-- Sample words
INSERT INTO words (id, text, definition, pronunciation, example_sentence)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'cappuccino', 'An Italian coffee drink made with espresso and steamed milk', '/ˌkæp.uˈtʃiː.noʊ/', 'I ordered a cappuccino at the coffee shop.'),
    ('22222222-2222-2222-2222-222222222222', 'background', 'A person''s experience, education, or social circumstances', '/ˈbæk.ɡraʊnd/', 'Tell me about your educational background.'),
    ('33333333-3333-3333-3333-333333333333', 'greenhouse', 'A glass building for growing plants; used in "greenhouse gas"', '/ˈɡriːn.haʊs/', 'Greenhouse gases trap heat in the atmosphere.'),
    ('44444444-4444-4444-4444-444444444444', 'fossil', 'The remains of prehistoric organisms preserved in rock', '/ˈfɒs.əl/', 'Fossil fuels are formed from ancient organisms.'),
    ('55555555-5555-5555-5555-555555555555', 'strength', 'The quality of being strong; a good or useful quality', '/streŋθ/', 'What is your greatest professional strength?');

-- Link words to lessons
INSERT INTO lesson_words (lesson_id, word_id) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '11111111-1111-1111-1111-111111111111'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', '22222222-2222-2222-2222-222222222222'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', '55555555-5555-5555-5555-555555555555'),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', '33333333-3333-3333-3333-333333333333'),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', '44444444-4444-4444-4444-444444444444');
