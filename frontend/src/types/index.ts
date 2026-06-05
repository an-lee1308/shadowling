export type UserLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type UserGoal = "GENERAL" | "IELTS" | "TOEIC" | "BUSINESS";
export type PracticeMode = "DICTATION" | "SHADOWING";
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type ReviewQuality = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  level: UserLevel;
  goal: UserGoal;
  streakCount: number;
  totalXp?: number;
  role?: string;
  dailyGoalMinutes?: number;
}

export interface AuthResponse extends User {
  token: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  transcript?: string;
  level: UserLevel;
  topic?: string;
  durationSeconds?: number;
  publishedAt: string;
  userStatus?: ProgressStatus;
  userBestScore?: number;
  playCount?: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface PracticeSession {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  mode: PracticeMode;
  score?: number;
  accuracyPercent?: number;
  recordingUrl?: string;
  errors?: string;
  createdAt: string;
}

export interface WordResult {
  position: number;
  expected: string;
  got: string;
  correct: boolean;
}

export interface DictationScoreResponse {
  accuracyPercent: number;
  correctWords: number;
  totalWords: number;
  wordResults: WordResult[];
}

export interface Word {
  id: string;
  text: string;
  definition?: string;
  pronunciation?: string;
  audioUrl?: string;
  exampleSentence?: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  leech?: boolean;
  suspended?: boolean;
  againCount?: number;
  cardType?: "CLASSIC_FLIP" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
}

export type StudyMode = "NORMAL" | "CRAM";
export type DeckType = "TODAY" | "ALL" | "WEAK" | "LESSON";

export interface StudySession {
  sessionId: string;
  cards: Word[];
  totalCards: number;
}

export interface SessionResult {
  sessionId: string;
  totalCards: number;
  correctCount: number;
  againCount: number;
  xpEarned: number;
  durationSeconds: number;
}

export interface DashboardData {
  streakCount: number;
  lessonsCompleted: number;
  totalSessions: number;
  recentAccuracy?: number;
  wordsDueForReview: number;
  totalWordsLearned: number;
  recentSessions: {
    lessonTitle?: string;
    mode: string;
    score?: number;
    createdAt: string;
  }[];
  todaySessionCount?: number;
}

export interface PronunciationScoreResponse {
  transcript: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  correctWords: number;
  totalWords: number;
  wordScores: {
    word: string;
    recognized: string;
    correct: boolean;
    score: number;
  }[];
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

export interface XpStatus {
  totalXp: number;
  level: number;
  levelName: string;
  currentLevelXp: number;
  nextLevelXp: number;
  achievements: Achievement[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  totalXp: number;
  streakCount: number;
  level: string;
}

export interface YouTubeCaptionSegment {
  startMs: number;
  endMs: number;
  text: string;
}

export interface YouTubeSentenceProgressItem {
  sentenceIndex: number;
  bestScore: number;
  attemptCount: number;
  completed: boolean;
}

export interface YouTubeLesson {
  id: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  thumbnailUrl?: string;
  channelName?: string;
  durationSeconds?: number;
  captions: YouTubeCaptionSegment[];
  totalSentences: number;
  completedSentences: number;
  createdAt: string;
  lastPracticedAt?: string;
  sentenceProgress: YouTubeSentenceProgressItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
