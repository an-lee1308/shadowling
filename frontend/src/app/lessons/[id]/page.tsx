"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { lessons as lessonsApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import DictationMode from "@/components/practice/DictationMode";
import ShadowingMode from "@/components/practice/ShadowingMode";
import type { Lesson } from "@/types";
import { ArrowLeft, Clock } from "lucide-react";
import { cn, formatDuration, levelColor } from "@/lib/utils";
import Link from "next/link";

type Tab = "dictation" | "shadowing" | "transcript";

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuthStore();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dictation");
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [guideVisible, setGuideVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("lesson_guide_seen");
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    lessonsApi.get(id).then(setLesson).finally(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  function handleComplete(score: number, accuracy: number) {
    setFinalScore(accuracy);
    setCompleted(true);
  }

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

  if (!lesson) {
    return (
      <div className="flex min-h-screen">
        <Navbar />
        <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8 text-center text-gray-500 pt-24">
          Không tìm thấy bài học.
        </main>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "dictation", label: "Dictation" },
    { key: "shadowing", label: "Shadowing" },
    { key: "transcript", label: "Transcript" },
  ];

  function dismissGuide() {
    localStorage.setItem("lesson_guide_seen", "1");
    setGuideVisible(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {/* First-time guide */}
          {guideVisible && (
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-1">Hướng dẫn sử dụng</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400">
                  <strong>Dictation</strong> — nghe và gõ lại từng câu để kiểm tra độ chính xác.{" "}
                  <strong>Shadowing</strong> — nghe rồi ghi âm giọng nói của bạn để AI chấm phát âm.{" "}
                  <strong>Transcript</strong> — xem toàn bộ nội dung bài.
                </p>
              </div>
              <button
                onClick={dismissGuide}
                className="text-indigo-400 hover:text-indigo-600 shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Breadcrumb */}
          <Link
            href="/lessons"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition"
          >
            <ArrowLeft size={15} />
            Quay lại danh sách
          </Link>

          {/* Lesson header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", levelColor(lesson.level))}>
                {lesson.level}
              </span>
              {lesson.topic && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{lesson.topic}</span>
              )}
              {lesson.durationSeconds && (
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock size={12} />
                  {formatDuration(lesson.durationSeconds)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{lesson.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "pb-3 text-sm font-medium border-b-2 transition",
                    activeTab === tab.key
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "dictation" && (
            <DictationMode lesson={lesson} onComplete={handleComplete} />
          )}

          {activeTab === "shadowing" && (
            <ShadowingMode lesson={lesson} onComplete={handleComplete} />
          )}

          {activeTab === "transcript" && lesson.transcript && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Transcript</h3>
              <div className="space-y-3">
                {(JSON.parse(lesson.transcript) as { start: number; end: number; text: string }[]).map(
                  (seg, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-gray-400 font-mono pt-0.5 shrink-0">
                        {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, "0")}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{seg.text}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
