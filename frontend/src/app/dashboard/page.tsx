"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { progress, gamification, recommendations } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import DashboardStats from "@/components/dashboard/DashboardStats";
import LessonCard from "@/components/lesson/LessonCard";
import type { DashboardData, Lesson, XpStatus } from "@/types";
import { ArrowRight, Brain, Zap, Star, Play, Target } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [continueLessons, setContinueLessons] = useState<Lesson[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);
  const [xpStatus, setXpStatus] = useState<XpStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    Promise.all([
      progress.dashboard(),
      gamification.xpStatus(),
      recommendations.continueList(),
      recommendations.recommended(6),
    ]).then(([dash, xp, cont, rec]) => {
      setDashData(dash);
      setXpStatus(xp);
      setContinueLessons(cont);
      setRecommendedLessons(rec);
    }).finally(() => setLoading(false));
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
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Chào mừng trở lại, {user?.name?.split(" ").pop()} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Hôm nay học gì nhé?</p>
          </div>

          {/* XP summary */}
          {xpStatus && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Zap className="text-primary-600 dark:text-primary-400" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cấp độ</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{xpStatus.levelName}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">{xpStatus.totalXp} XP</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {dashData && (
          <div className="mb-8">
            <DashboardStats data={dashData} />
          </div>
        )}

        {/* Daily goal progress */}
        {user?.dailyGoalMinutes && dashData && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Target size={16} className="text-primary-600 dark:text-primary-400" />
                <span>Mục tiêu hôm nay: {user.dailyGoalMinutes} phút</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {dashData.todaySessionCount ?? 0} buổi hôm nay
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((dashData.todaySessionCount ?? 0) / Math.max(1, Math.ceil(user.dailyGoalMinutes / 10))) * 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              ~{(dashData.todaySessionCount ?? 0) * 10} / {user.dailyGoalMinutes} phút
              {(dashData.todaySessionCount ?? 0) * 10 >= user.dailyGoalMinutes && " 🎉 Đạt mục tiêu!"}
            </p>
          </div>
        )}

        {/* Words due banner */}
        {dashData && dashData.wordsDueForReview > 0 && (
          <Link
            href="/vocabulary"
            className="block mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="text-purple-600 dark:text-purple-400" size={20} />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-300">
                    {dashData.wordsDueForReview} từ cần ôn hôm nay
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Ôn tập để không quên!</p>
                </div>
              </div>
              <ArrowRight className="text-purple-400" size={20} />
            </div>
          </Link>
        )}

        {/* Continue lessons */}
        {continueLessons.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Play size={16} className="text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tiếp tục học</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended lessons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gợi ý cho bạn</h2>
            </div>
            <Link href="/lessons" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
