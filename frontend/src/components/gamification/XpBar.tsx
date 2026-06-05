"use client";

import { useEffect, useState } from "react";
import { gamification } from "@/lib/api";
import type { XpStatus } from "@/types";
import { Zap } from "lucide-react";

export default function XpBar() {
  const [xpStatus, setXpStatus] = useState<XpStatus | null>(null);

  useEffect(() => {
    gamification.xpStatus().then(setXpStatus).catch(() => {});
  }, []);

  if (!xpStatus) return null;

  const { totalXp, levelName, currentLevelXp, nextLevelXp } = xpStatus;
  const progress = Math.min(
    ((totalXp - currentLevelXp) / Math.max(nextLevelXp - currentLevelXp, 1)) * 100,
    100
  );

  return (
    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400">
          <Zap size={12} />
          <span>{levelName}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{totalXp} XP</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {nextLevelXp - totalXp} XP đến cấp tiếp theo
      </p>
    </div>
  );
}
