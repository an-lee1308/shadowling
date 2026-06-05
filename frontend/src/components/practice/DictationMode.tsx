"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { practice } from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import WaveformPlayer from "./WaveformPlayer";
import type { DictationScoreResponse, Lesson, TranscriptSegment } from "@/types";
import { CheckCircle2, Eye, RotateCcw, Send } from "lucide-react";

interface Props {
  lesson: Lesson;
  onComplete: (score: number, accuracy: number) => void;
}

export default function DictationMode({ lesson, onComplete }: Props) {
  const segments: TranscriptSegment[] = lesson.transcript
    ? JSON.parse(lesson.transcript)
    : [];

  const [currentSegIdx, setCurrentSegIdx] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(segments.length).fill(""));
  const [results, setResults] = useState<(DictationScoreResponse | null)[]>(
    Array(segments.length).fill(null)
  );
  const [revealed, setRevealed] = useState<boolean[]>(Array(segments.length).fill(false));
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSegIdx]);

  const currentSeg = segments[currentSegIdx];
  const currentResult = results[currentSegIdx];
  const isRevealed = revealed[currentSegIdx];

  async function checkCurrent() {
    if (!currentSeg || checking) return;
    setChecking(true);
    try {
      const result = await practice.scoreDictation(
        currentSeg.text,
        inputs[currentSegIdx]
      );
      setResults((prev) => {
        const next = [...prev];
        next[currentSegIdx] = result;
        return next;
      });
    } finally {
      setChecking(false);
    }
  }

  function revealCurrent() {
    setRevealed((prev) => {
      const next = [...prev];
      next[currentSegIdx] = true;
      return next;
    });
    setInputs((prev) => {
      const next = [...prev];
      next[currentSegIdx] = currentSeg.text;
      return next;
    });
  }

  async function goNext() {
    if (currentSegIdx < segments.length - 1) {
      setCurrentSegIdx((i) => i + 1);
    } else {
      await finishSession();
    }
  }

  async function finishSession() {
    const allResults = results.filter(Boolean) as DictationScoreResponse[];
    const avgAccuracy =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.accuracyPercent, 0) / allResults.length
        : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    setFinished(true);
    onComplete(avgAccuracy, avgAccuracy);
    showToast("Từ vựng đã được lưu tự động vào thư viện của bạn!", "success");
    await practice.saveDictation({
      lessonId: lesson.id,
      score: avgAccuracy,
      accuracyPercent: avgAccuracy,
      timeSpentSeconds: timeSpent,
    });
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Bài học này chưa có transcript.</p>
      </div>
    );
  }

  if (finished) {
    const done = results.filter(Boolean) as DictationScoreResponse[];
    const avg =
      done.length > 0
        ? done.reduce((s, r) => s + r.accuracyPercent, 0) / done.length
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hoàn thành!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Điểm trung bình của bạn</p>
        <div className="text-5xl font-bold text-primary-600 mb-2">{avg.toFixed(1)}%</div>
        <div className="mt-8">
          <button
            onClick={() => {
              setFinished(false);
              setCurrentSegIdx(0);
              setInputs(Array(segments.length).fill(""));
              setResults(Array(segments.length).fill(null));
              setRevealed(Array(segments.length).fill(false));
            }}
            className="flex items-center gap-2 mx-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RotateCcw size={16} />
            Làm lại
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>Câu {currentSegIdx + 1} / {segments.length}</span>
        <span>
          {results.filter(Boolean).length} câu đã kiểm tra
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
        <div
          className="h-1.5 bg-primary-500 rounded-full transition-all"
          style={{ width: `${((currentSegIdx + 1) / segments.length) * 100}%` }}
        />
      </div>

      {/* Audio player */}
      {lesson.audioUrl && (
        <WaveformPlayer audioUrl={lesson.audioUrl} />
      )}

      {/* Input area */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gõ lại những gì bạn nghe được:
        </label>
        <textarea
          ref={inputRef}
          value={inputs[currentSegIdx]}
          onChange={(e) =>
            setInputs((prev) => {
              const next = [...prev];
              next[currentSegIdx] = e.target.value;
              return next;
            })
          }
          disabled={!!currentResult || isRevealed}
          rows={3}
          placeholder="Nhập câu bạn nghe được..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!currentResult) checkCurrent();
            }
          }}
        />

        {/* Word-by-word result */}
        <AnimatePresence>
          {currentResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kết quả</span>
                <span
                  className={`text-sm font-bold ${
                    currentResult.accuracyPercent >= 80
                      ? "text-green-600"
                      : currentResult.accuracyPercent >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {currentResult.accuracyPercent.toFixed(1)}% —{" "}
                  {currentResult.correctWords}/{currentResult.totalWords} từ đúng
                </span>
              </div>

              {/* Highlighted words */}
              <div className="flex flex-wrap gap-1.5">
                {currentResult.wordResults.map((w, i) => (
                  <span
                    key={i}
                    className={
                      w.correct
                        ? "word-correct"
                        : "word-error"
                    }
                    title={w.correct ? "" : `Đúng: "${w.expected}"`}
                  >
                    {w.correct ? w.expected : w.got || "___"}
                  </span>
                ))}
              </div>

              {/* Correct answer */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Đáp án đúng:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{currentSeg.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!currentResult && !isRevealed && (
          <>
            <button
              onClick={checkCurrent}
              disabled={!inputs[currentSegIdx].trim() || checking}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-lg font-medium transition"
            >
              <Send size={16} />
              {checking ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>
            <button
              onClick={revealCurrent}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Eye size={16} />
              Xem đáp án
            </button>
          </>
        )}

        {(currentResult || isRevealed) && (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
          >
            {currentSegIdx < segments.length - 1 ? "Câu tiếp theo →" : "Hoàn thành bài học ✓"}
          </button>
        )}
      </div>

      {/* Segment navigation dots */}
      <div className="flex gap-1.5 flex-wrap">
        {segments.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSegIdx(i)}
            className={`w-6 h-6 rounded-full text-xs font-medium transition ${
              i === currentSegIdx
                ? "bg-primary-600 text-white"
                : results[i]
                ? results[i]!.accuracyPercent >= 80
                  ? "bg-green-200 text-green-700"
                  : "bg-red-200 text-red-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
