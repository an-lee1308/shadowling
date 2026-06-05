"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, TrendingDown, BookOpen, Play } from "lucide-react";
import type { DeckType, StudyMode } from "@/types";

interface Props {
  dueCount: number;
  totalCount: number;
  onStart: (mode: StudyMode, deck: DeckType) => void;
  loading?: boolean;
}

const DECKS: { key: DeckType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: "TODAY",
    label: "Từ hôm nay",
    desc: "Chỉ từ đến hạn ôn, cập nhật lịch SRS",
    icon: <Brain size={18} />,
  },
  {
    key: "ALL",
    label: "Tất cả",
    desc: "Toàn bộ từ vựng đã lưu",
    icon: <BookOpen size={18} />,
  },
  {
    key: "WEAK",
    label: "Từ yếu nhất",
    desc: "Ưu tiên từ có easeFactor thấp",
    icon: <TrendingDown size={18} />,
  },
];

const MODES: { key: StudyMode; label: string; desc: string; badge?: string }[] = [
  {
    key: "NORMAL",
    label: "SRS bình thường",
    desc: "Cập nhật lịch ôn tập theo kết quả",
  },
  {
    key: "CRAM",
    label: "Ôn nhanh (Cram)",
    desc: "Ôn tự do, không ảnh hưởng lịch SRS",
    badge: "Không tính XP",
  },
];

export default function DeckSelector({ dueCount, totalCount, onStart, loading }: Props) {
  const [deck, setDeck] = useState<DeckType>("TODAY");
  const [mode, setMode] = useState<StudyMode>("NORMAL");

  const cardCount = deck === "TODAY" ? dueCount : totalCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-3 border border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Đến hạn hôm nay</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{dueCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng từ vựng</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{totalCount}</p>
        </div>
      </div>

      {/* Deck selection */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Chọn bộ thẻ</p>
        <div className="flex flex-col gap-2">
          {DECKS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDeck(d.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition
                ${deck === d.key
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-200 dark:hover:border-primary-800"
                }`}
            >
              <span className={deck === d.key ? "text-primary-500" : "text-gray-400"}>{d.icon}</span>
              <div>
                <p className="font-semibold text-sm">{d.label}</p>
                <p className="text-xs opacity-70">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode selection */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Chế độ</p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-3 rounded-xl border-2 text-left transition
                ${mode === m.key
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200"
                }`}
            >
              <p className={`text-sm font-semibold ${mode === m.key ? "text-primary-700 dark:text-primary-300" : "text-gray-700 dark:text-gray-300"}`}>
                {m.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.desc}</p>
              {m.badge && (
                <span className="mt-1 inline-block text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-1.5 py-0.5">
                  {m.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Start */}
      <button
        onClick={() => onStart(mode, deck)}
        disabled={loading || cardCount === 0}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl font-semibold transition text-sm"
      >
        <Play size={16} />
        {loading ? "Đang tải…" : cardCount === 0 ? "Không có từ để ôn" : `Bắt đầu ${cardCount} thẻ`}
      </button>
    </motion.div>
  );
}
