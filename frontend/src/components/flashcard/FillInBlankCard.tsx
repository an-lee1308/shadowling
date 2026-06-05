"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Word } from "@/types";
import type { ReviewQuality } from "@/types";

interface Props {
  word: Word;
  onReview: (quality: ReviewQuality) => void;
  disabled?: boolean;
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

/** Replace the target word in a sentence with a blank of the same length */
function blankedSentence(sentence: string, word: string): { before: string; blank: string; after: string } | null {
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  const match = regex.exec(sentence);
  if (!match) return null;
  return {
    before: sentence.slice(0, match.index),
    blank: "_".repeat(match[0].length),
    after: sentence.slice(match.index + match[0].length),
  };
}

/** Normalise for comparison: lowercase, trim, strip punctuation */
function normalise(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export default function FillInBlankCard({ word, onReview, disabled }: Props) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const blank = word.exampleSentence ? blankedSentence(word.exampleSentence, word.text) : null;
  const hasBlank = !!blank;

  useEffect(() => {
    setInput("");
    setSubmitted(false);
    setCorrect(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [word.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key === "p" || e.key === "P") playAudio(word);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, word]);

  function handleSubmit() {
    if (submitted || disabled || !input.trim()) return;
    const isCorrect = normalise(input) === normalise(word.text);
    setCorrect(isCorrect);
    setSubmitted(true);
    setTimeout(() => onReview(isCorrect ? "GOOD" : "AGAIN"), 1200);
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Prompt */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary-200 dark:border-primary-700 p-7 shadow-lg">
        <div className="flex items-start justify-between gap-2 mb-4">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
            {hasBlank ? "Điền từ còn thiếu" : "Gõ từ tiếng Anh có nghĩa là"}
          </p>
          <button
            onClick={() => playAudio(word)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {hasBlank ? (
          <p className="text-lg text-gray-900 dark:text-white leading-relaxed font-medium">
            {blank!.before}
            <span className="inline-block min-w-[80px] border-b-2 border-primary-400 mx-1 text-center">
              {submitted ? (
                <span className={correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {word.text}
                </span>
              ) : (
                <span className="text-transparent select-none">{blank!.blank}</span>
              )}
            </span>
            {blank!.after}
          </p>
        ) : (
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {word.definition ?? "(không có định nghĩa)"}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => !submitted && setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={submitted || disabled}
          placeholder="Gõ từ tiếng Anh…"
          className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm outline-none transition
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-600
            ${submitted
              ? correct
                ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                : "border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-gray-200 dark:border-gray-700 focus:border-primary-400"
            }`}
        />
        <button
          onClick={handleSubmit}
          disabled={submitted || disabled || !input.trim()}
          className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40"
        >
          Kiểm tra
        </button>
      </div>

      {/* Feedback */}
      {submitted && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${correct ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}>
          {correct
            ? "Chính xác! ✓"
            : `Đáp án đúng là: "${word.text}"`}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
        Enter để kiểm tra · P để nghe
      </p>
    </div>
  );
}
