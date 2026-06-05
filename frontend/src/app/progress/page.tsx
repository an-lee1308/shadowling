"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { practice, progress as progressApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import type { PracticeSession } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Word } from "@/types";
import { words as wordsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type AnalyticsData = Awaited<ReturnType<typeof progressApi.analytics>>;

export default function ProgressPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [weakWords, setWeakWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    Promise.all([
      progressApi.analytics(365),
      practice.history(),
      wordsApi.weak(5),
    ]).then(([ana, hist, weak]) => {
      setAnalytics(ana);
      setHistory(hist);
      setWeakWords(weak);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Tiến độ học tập</h1>

          {/* Overall stats */}
          {analytics && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Độ chính xác tổng thể</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {analytics.overallAccuracy.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tổng buổi luyện</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalSessions}</p>
              </div>
            </div>
          )}

          {/* Activity heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Hoạt động (365 ngày)</h2>
            <ActivityHeatmap dailyStats={analytics?.dailyStats ?? []} />
          </div>

          {/* Accuracy chart (30-day subset) */}
          {analytics && analytics.dailyStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Độ chính xác theo ngày (30 ngày gần nhất)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.dailyStats.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Accuracy"]} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#6366f1"
                    fill="#eef2ff"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak words */}
          {weakWords.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Từ khó nhất của bạn
              </h2>
              <div className="space-y-3">
                {weakWords.map((word) => (
                  <div key={word.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{word.text}</p>
                      {word.definition && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{word.definition}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>EF: <span className="font-mono text-red-500">{word.easeFactor?.toFixed(2)}</span></span>
                      <span>{word.repetitions} lần ôn</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Lịch sử luyện tập</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">Chưa có buổi luyện tập nào.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Bài học</th>
                    <th className="text-left px-6 py-3">Chế độ</th>
                    <th className="text-left px-6 py-3">Điểm</th>
                    <th className="text-left px-6 py-3">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {history.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                        {s.lessonTitle || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.mode === "DICTATION"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                        }`}>
                          {s.mode === "DICTATION" ? "Dictation" : "Shadowing"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          (s.accuracyPercent ?? 0) >= 80 ? "text-green-600" :
                          (s.accuracyPercent ?? 0) >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {s.accuracyPercent?.toFixed(1) ?? "—"}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 dark:text-gray-500">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
