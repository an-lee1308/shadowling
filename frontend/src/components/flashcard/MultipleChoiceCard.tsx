"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Word } from "@/types";
import type { ReviewQuality } from "@/types";

interface Props {
  word: Word;
  allCards: Word[]; // pool for distractors
  onReview: (quality: ReviewQuality) => void;
  disabled?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playAudio(word: Word) {
  if (word.audioUrl) {
    new Audio(word.audioUrl).play().catch(() => {});
    return;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(word.text);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }
}

export default function MultipleChoiceCard({ word, allCards, onReview, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const options = useMemo(() => {
    const distractors = allCards
      .filter((w) => w.id !== word.id && w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition!);

    const correctIdx = Math.floor(Math.random() * 4);
    const opts = [...distractors];
    opts.splice(correctIdx, 0, word.definition ?? word.text);
    return { opts, correctIdx };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  // Reset on card change
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [word.id]);

  // Keyboard shortcuts: 1-4 to pick, P to play
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled || submitted) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) handleSelect(n - 1);
      if (e.key === "p" || e.key === "P") playAudio(word);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, submitted, word]);

  function handleSelect(idx: number) {
    if (submitted || disabled) return;
    setSelected(idx);
    setSubmitted(true);
    const correct = idx === options.correctIdx;
    // Brief delay so user sees the feedback before advancing
    setTimeout(() => onReview(correct ? "GOOD" : "AGAIN"), 900);
  }

  function optionStyle(idx: number): string {
    const base = "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition ";
    if (!submitted) {
      return base + "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-white";
    }
    if (idx === options.correctIdx) {
      return base + "border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    }
    if (idx === selected) {
      return base + "border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    }
    return base + "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600";
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary-200 dark:border-primary-700 p-7 shadow-lg">
        <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">
          Từ nào có nghĩa là…
        </p>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
            {word.definition ?? "(không có định nghĩa)"}
          </p>
          <button
            onClick={() => playAudio(word)}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition"
          >
            <Volume2 size={16} />
          </button>
        </div>
        {word.exampleSentence && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic mt-3">
            &ldquo;{word.exampleSentence.replace(new RegExp(word.text, "gi"), "___")}&rdquo;
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.opts.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={submitted || disabled}
            className={optionStyle(idx)}
          >
            <span className="text-gray-400 dark:text-gray-500 mr-2">{idx + 1}.</span>
            {opt}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
        Phím tắt: 1–4 để chọn · P để nghe
      </p>
    </div>
  );
}
