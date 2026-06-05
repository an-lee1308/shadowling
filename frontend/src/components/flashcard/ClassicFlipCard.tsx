"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, AlertTriangle } from "lucide-react";
import type { Word } from "@/types";
import type { ReviewQuality } from "@/types";

interface Props {
  word: Word;
  onReview: (quality: ReviewQuality) => void;
  disabled?: boolean;
}

const QUALITIES: { key: ReviewQuality; label: string; value: 0 | 2 | 4 | 5; color: string }[] = [
  { key: "AGAIN", label: "Lại",  value: 0, color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  { key: "HARD",  label: "Khó",  value: 2, color: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  { key: "GOOD",  label: "Ổn",   value: 4, color: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  { key: "EASY",  label: "Dễ",   value: 5, color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
];

function computeNextInterval(word: Word, qualityValue: 0 | 2 | 4 | 5): string {
  if (qualityValue < 3) return "1 ngày";
  const reps = word.repetitions ?? 0;
  const ef = word.easeFactor ?? 2.5;
  const interval = word.intervalDays ?? 1;
  let days: number;
  if (reps === 0) days = 1;
  else if (reps === 1) days = 6;
  else days = Math.round(interval * ef);
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}

function playAudio(word: Word) {
  if (word.audioUrl) {
    new Audio(word.audioUrl).play().catch(() => {});
    return;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(word.text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

export default function ClassicFlipCard({ word, onReview, disabled }: Props) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when word changes
  useEffect(() => {
    setFlipped(false);
  }, [word.id]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) { setFlipped(true); return; }
      }
      if (!flipped) return;
      if (e.key === "1") onReview("AGAIN");
      if (e.key === "2") onReview("HARD");
      if (e.key === "3") onReview("GOOD");
      if (e.key === "4") onReview("EASY");
      if (e.key === "p" || e.key === "P") playAudio(word);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, word, onReview, disabled]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Card */}
      <div
        className="w-full cursor-pointer select-none"
        style={{ perspective: 1000 }}
        onClick={() => !disabled && setFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d", position: "relative", height: 240 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary-200 dark:border-primary-700 flex flex-col items-center justify-center p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden" }}
          >
            {word.leech && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle size={13} />
                <span>Từ khó</span>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); playAudio(word); }}
              className="absolute top-3 left-3 p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition"
            >
              <Volume2 size={16} />
            </button>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{word.text}</p>
            {word.pronunciation && (
              <p className="text-gray-400 dark:text-gray-500 text-lg">{word.pronunciation}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-6">
              Space / Enter để lật · P để nghe
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border-2 border-primary-300 dark:border-primary-700 flex flex-col items-center justify-center p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-3 leading-relaxed">
              {word.definition}
            </p>
            {word.exampleSentence && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2">
                &ldquo;{word.exampleSentence}&rdquo;
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quality buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="grid grid-cols-4 gap-3 w-full"
          >
            {QUALITIES.map((q) => (
              <button
                key={q.key}
                onClick={() => onReview(q.key)}
                disabled={disabled}
                className={`py-3 px-2 rounded-xl border text-sm font-semibold transition disabled:opacity-50 flex flex-col items-center gap-0.5 ${q.color}`}
              >
                <span>{q.label}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {computeNextInterval(word, q.value)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Phím tắt: 1 Lại · 2 Khó · 3 Ổn · 4 Dễ (sau khi lật)
        </p>
      )}
    </div>
  );
}
