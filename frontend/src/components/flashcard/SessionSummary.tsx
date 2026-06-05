"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Zap, Clock, RotateCcw, LayoutDashboard } from "lucide-react";
import type { SessionResult } from "@/types";

interface Props {
  result: SessionResult;
  onStudyAgain: () => void;
  onDashboard: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function SessionSummary({ result, onStudyAgain, onDashboard }: Props) {
  const accuracy = result.totalCards > 0
    ? Math.round((result.correctCount / result.totalCards) * 100)
    : 0;

  const accentColor =
    accuracy >= 80 ? "text-green-600 dark:text-green-400" :
    accuracy >= 50 ? "text-blue-600 dark:text-blue-400" :
    "text-red-600 dark:text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-md mx-auto py-4"
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Kết quả phiên ôn tập
        </p>
        <p className={`text-7xl font-extrabold ${accentColor}`}>{accuracy}%</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">chính xác</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <Stat icon={<CheckCircle2 size={18} className="text-green-500" />} label="Đúng" value={result.correctCount} />
        <Stat icon={<XCircle size={18} className="text-red-500" />} label="Sai" value={result.againCount} />
        <Stat icon={<Zap size={18} className="text-amber-500" />} label="XP kiếm được" value={`+${result.xpEarned}`} />
        <Stat icon={<Clock size={18} className="text-primary-500" />} label="Thời gian" value={formatDuration(result.durationSeconds)} />
      </div>

      {/* Message */}
      <div className={`w-full text-center rounded-xl px-4 py-3 text-sm font-medium
        ${accuracy >= 80
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          : accuracy >= 50
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
        }`}>
        {accuracy >= 80
          ? "Tuyệt vời! Bạn đang tiến bộ rất tốt."
          : accuracy >= 50
          ? "Tiếp tục luyện tập nhé. Sẽ tốt hơn."
          : "Đừng nản, tiếp tục ôn những từ khó."}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onStudyAgain}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
        >
          <RotateCcw size={16} />
          Ôn tiếp
        </button>
        <button
          onClick={onDashboard}
          className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <LayoutDashboard size={16} />
          Về dashboard
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
      {icon}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
