import type {
  ApiResponse,
  AuthResponse,
  DashboardData,
  DeckType,
  DictationScoreResponse,
  LeaderboardEntry,
  Lesson,
  PageResponse,
  PracticeSession,
  SessionResult,
  StudyMode,
  StudySession,
  Word,
  XpStatus,
  YouTubeLesson,
  YouTubeSentenceProgressItem,
} from "@/types";

import { captureError } from "@/lib/monitoring";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    const err = new Error(json.message || "Request failed");
    if (res.status >= 500) captureError(err, { path, status: res.status });
    throw err;
  }

  return json.data;
}

// Auth
export const auth = {
  register: (body: { email: string; name: string; password: string }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<AuthResponse>("/api/auth/me"),

  updateProfile: (body: Partial<{
    name: string;
    level: string;
    goal: string;
    dailyGoalMinutes: number;
    pushSubscription: string;
  }>) =>
    request<AuthResponse>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// Lessons
export const lessons = {
  list: (params?: { level?: string; topic?: string; page?: number; size?: number; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set("level", params.level);
    if (params?.topic) q.set("topic", params.topic);
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.size != null) q.set("size", String(params.size));
    if (params?.sort) q.set("sort", params.sort);
    return request<PageResponse<Lesson>>(`/api/lessons?${q}`);
  },

  get: (id: string) => request<Lesson>(`/api/lessons/${id}`),

  search: (q: string, page = 0) =>
    request<PageResponse<Lesson>>(`/api/lessons/search?q=${encodeURIComponent(q)}&page=${page}`),
};

// Practice
export const practice = {
  scoreDictation: (expected: string, actual: string) =>
    request<DictationScoreResponse>("/api/practice/score/dictation", {
      method: "POST",
      body: JSON.stringify({ expected, actual }),
    }),

  saveDictation: (body: {
    lessonId: string;
    score: number;
    accuracyPercent: number;
    timeSpentSeconds: number;
    errors?: unknown[];
  }) =>
    request<PracticeSession>("/api/practice/dictation", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  saveShadowing: (body: {
    lessonId: string;
    score: number;
    accuracyPercent: number;
    recordingUrl?: string;
  }) =>
    request<PracticeSession>("/api/practice/shadowing", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  history: (page = 0) =>
    request<PracticeSession[]>(`/api/practice/history?page=${page}`),
};

// Words
export const words = {
  forLesson: (lessonId: string) =>
    request<Word[]>(`/api/words/lesson/${lessonId}`),

  list: (page = 0) =>
    request<PageResponse<Word>>(`/api/words?page=${page}`),

  due: () => request<Word[]>("/api/words/due"),

  save: (wordId: string) =>
    request<Word>("/api/words", {
      method: "POST",
      body: JSON.stringify({ wordId }),
    }),

  review: (
    wordId: string,
    quality: string,
    opts?: { sessionId?: string; cramMode?: boolean; responseTimeMs?: number }
  ) =>
    request<Word>(`/api/words/${wordId}/review`, {
      method: "POST",
      body: JSON.stringify({ quality, ...opts }),
    }),

  weak: (limit = 5) => request<Word[]>(`/api/words/weak?limit=${limit}`),

  startSession: (mode: StudyMode, deckType: DeckType, lessonId?: string) =>
    request<StudySession>("/api/words/sessions/start", {
      method: "POST",
      body: JSON.stringify({ mode, deckType, lessonId }),
    }),

  endSession: (sessionId: string) =>
    request<SessionResult>(`/api/words/sessions/${sessionId}/end`, {
      method: "POST",
    }),
};

// Progress
export const progress = {
  dashboard: () => request<DashboardData>("/api/progress/dashboard"),
  analytics: (days = 30) => request<{
    dailyStats: { date: string; accuracy: number; sessions: number }[];
    overallAccuracy: number;
    totalSessions: number;
  }>(`/api/progress/analytics?days=${days}`),
};

// Gamification
export const gamification = {
  xpStatus: () => request<XpStatus>("/api/gamification/xp"),
  leaderboard: (limit = 10) =>
    request<LeaderboardEntry[]>(`/api/gamification/leaderboard?limit=${limit}`),
};

// Recommendations
export const recommendations = {
  continueList: () => request<Lesson[]>("/api/recommendations/continue"),
  recommended: (limit = 6) =>
    request<Lesson[]>(`/api/recommendations?limit=${limit}`),
};

// Admin
export const admin = {
  createLesson: (body: Partial<Lesson>) =>
    request<Lesson>("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateLesson: (id: string, body: Partial<Lesson>) =>
    request<void>(`/api/admin/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteLesson: (id: string) =>
    request<void>(`/api/admin/lessons/${id}`, { method: "DELETE" }),
};

// YouTube
export const youtube = {
  addLesson: (url: string) =>
    request<YouTubeLesson>("/api/youtube/lessons", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  list: () => request<YouTubeLesson[]>("/api/youtube/lessons"),

  get: (id: string) => request<YouTubeLesson>(`/api/youtube/lessons/${id}`),

  delete: (id: string) =>
    request<void>(`/api/youtube/lessons/${id}`, { method: "DELETE" }),

  updateProgress: (lessonId: string, sentenceIndex: number, score: number) =>
    request<YouTubeSentenceProgressItem>(`/api/youtube/lessons/${lessonId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ sentenceIndex, score }),
    }),
};

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

// Speech (multipart — cannot use request() helper)
export const speech = {
  transcribe: (audioBlob: Blob): Promise<string> =>
    withRetry(async () => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${BASE_URL}/api/speech/transcribe`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as string;
    }),

  score: (audioBlob: Blob, referenceText: string) =>
    withRetry(async () => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", referenceText);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${BASE_URL}/api/speech/score`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    }),
};
