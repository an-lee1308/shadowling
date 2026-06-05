"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { gamification } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import type { LeaderboardEntry } from "@/types";
import { Trophy, Flame, Zap } from "lucide-react";

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-orange-600"];
const RANK_BG = ["bg-yellow-50 dark:bg-yellow-900/20", "bg-gray-50 dark:bg-gray-800/50", "bg-orange-50 dark:bg-orange-900/20"];

export default function LeaderboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    gamification.leaderboard(20)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="text-yellow-500" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bảng xếp hạng</h1>
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-16">Chưa có dữ liệu xếp hạng.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isMe = entry.name === user?.name;
                const rankStyle = entry.rank <= 3
                  ? RANK_BG[entry.rank - 1]
                  : "bg-white dark:bg-gray-800";

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition ${rankStyle} ${
                      isMe
                        ? "border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800"
                        : "border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 text-center font-bold text-lg ${
                      entry.rank <= 3
                        ? RANK_COLORS[entry.rank - 1]
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm flex-shrink-0">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.name}</p>
                        {isMe && (
                          <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.level}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame size={14} />
                        <span className="font-medium">{entry.streakCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                        <Zap size={14} />
                        <span className="font-bold">{entry.totalXp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
