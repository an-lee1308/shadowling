"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Youtube } from "lucide-react";
import { youtube } from "@/lib/api";
import type { YouTubeLesson } from "@/types";
import YouTubeShadowingMode from "@/components/practice/YouTubeShadowingMode";
import { useAuthStore } from "@/store/authStore";

export default function YouTubePracticePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [lesson, setLesson] = useState<YouTubeLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    youtube.get(id)
      .then(setLesson)
      .catch((e) => setError(e.message || "Không tìm thấy bài học"))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy bài học"}</p>
        <Link href="/youtube" className="text-primary-600 hover:underline text-sm">
          ← Quay lại thư viện
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/youtube"
          className="mt-0.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-red-500 mb-0.5">
            <Youtube size={13} />
            <span>{lesson.channelName || "YouTube"}</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{lesson.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {lesson.totalSentences} câu · {lesson.completedSentences} đã pass
          </p>
        </div>
      </div>

      {/* Main content */}
      <YouTubeShadowingMode lesson={lesson} />
    </div>
  );
}
