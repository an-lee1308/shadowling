"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { words as wordsApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import ClassicFlipCard from "@/components/flashcard/ClassicFlipCard";
import MultipleChoiceCard from "@/components/flashcard/MultipleChoiceCard";
import FillInBlankCard from "@/components/flashcard/FillInBlankCard";
import DeckSelector from "@/components/flashcard/DeckSelector";
import SessionSummary from "@/components/flashcard/SessionSummary";
import type { DeckType, ReviewQuality, SessionResult, StudyMode, Word } from "@/types";
import { AlertTriangle, BookOpen, RotateCcw } from "lucide-react";

type PageState = "list" | "selecting" | "reviewing" | "summary";

export default function VocabularyPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [pageState, setPageState] = useState<PageState>("list");
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCards, setSessionCards] = useState<Word[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [cramMode, setCramMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    loadVocabulary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVocabulary() {
    setLoading(true);
    try {
      const [due, list] = await Promise.all([wordsApi.due(), wordsApi.list()]);
      setDueCount(due.length);
      setAllWords(list.content);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession(mode: StudyMode, deck: DeckType) {
    setLoading(true);
    try {
      const session = await wordsApi.startSession(mode, deck);
      setSessionId(session.sessionId);
      setSessionCards(session.cards);
      setCardIdx(0);
      setStreak(0);
      setCramMode(mode === "CRAM");
      setPageState("reviewing");
    } finally {
      setLoading(false);
    }
  }

  const handleReview = useCallback(async (quality: ReviewQuality) => {
    const card = sessionCards[cardIdx];
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      await wordsApi.review(card.id, quality, {
        sessionId: sessionId ?? undefined,
        cramMode,
      });

      const correct = quality === "GOOD" || quality === "EASY";
      setStreak(correct ? (s) => s + 1 : 0);

      const nextIdx = cardIdx + 1;
      if (nextIdx < sessionCards.length) {
        setCardIdx(nextIdx);
      } else {
        if (sessionId) {
          const result = await wordsApi.endSession(sessionId);
          setSessionResult(result);
        }
        setPageState("summary");
        await loadVocabulary();
      }
    } finally {
      setSubmitting(false);
    }
  }, [sessionCards, cardIdx, sessionId, cramMode, submitting]);

  if (loading && pageState === "list") {
    return (
      <div className="flex min-h-screen">
        <Navbar />
        <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </main>
      </div>
    );
  }

  const currentCard = sessionCards[cardIdx];
  const progress = sessionCards.length > 0 ? Math.round((cardIdx / sessionCards.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8">
        <div className="max-w-xl mx-auto">

          {/* LIST */}
          {pageState === "list" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Từ vựng</h1>
                <button
                  onClick={() => setPageState("selecting")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition"
                >
                  <RotateCcw size={14} />
                  Bắt đầu ôn tập
                  {dueCount > 0 && (
                    <span className="bg-white/20 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {dueCount}
                    </span>
                  )}
                </button>
              </div>

              {dueCount === 0 && allWords.length > 0 && (
                <div className="mb-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 font-medium">
                  Bạn đã ôn hết từ hôm nay! 🎉 Quay lại ngày mai để tiếp tục.
                </div>
              )}

              <div className="space-y-2">
                {allWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{word.text}</p>
                        {word.leech && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={10} />
                            khó
                          </span>
                        )}
                      </div>
                      {word.pronunciation && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{word.pronunciation}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {word.intervalDays ? `Ôn sau ${word.intervalDays} ngày` : "Chưa ôn"}
                    </p>
                  </div>
                ))}

                {allWords.length === 0 && (
                  <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Chưa có từ vựng. Hoàn thành bài học để lưu từ mới!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SELECTING */}
          {pageState === "selecting" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setPageState("list")}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                  ← Quay lại
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cài đặt phiên ôn</h1>
              </div>
              <DeckSelector
                dueCount={dueCount}
                totalCount={allWords.length}
                onStart={handleStartSession}
                loading={loading}
              />
            </>
          )}

          {/* REVIEWING */}
          {pageState === "reviewing" && currentCard && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setPageState("list")}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                  ✕ Thoát
                </button>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {streak >= 3 && (
                    <span className="text-amber-500 font-semibold text-xs">🔥 {streak} liên tiếp</span>
                  )}
                  <span>{cardIdx + 1} / {sessionCards.length}</span>
                  {cramMode && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      Cram
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {currentCard.cardType === "MULTIPLE_CHOICE" && sessionCards.length >= 4 ? (
                <MultipleChoiceCard
                  word={currentCard}
                  allCards={sessionCards}
                  onReview={handleReview}
                  disabled={submitting}
                />
              ) : currentCard.cardType === "FILL_IN_BLANK" && currentCard.exampleSentence ? (
                <FillInBlankCard
                  word={currentCard}
                  onReview={handleReview}
                  disabled={submitting}
                />
              ) : (
                <ClassicFlipCard
                  word={currentCard}
                  onReview={handleReview}
                  disabled={submitting}
                />
              )}
            </>
          )}

          {/* SUMMARY */}
          {pageState === "summary" && sessionResult && (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Hoàn thành!
              </h1>
              <SessionSummary
                result={sessionResult}
                onStudyAgain={() => setPageState("selecting")}
                onDashboard={() => router.push("/dashboard")}
              />
            </>
          )}

        </div>
      </main>
    </div>
  );
}
