"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Youtube, Plus, Trash2, PlayCircle, Clock, CheckCircle2 } from "lucide-react";
import { youtube } from "@/lib/api";
import type { YouTubeLesson } from "@/types";
import { useAuthStore } from "@/store/authStore";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });
}

export default function YouTubePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [lessons, setLessons] = useState<YouTubeLesson[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    youtube.list()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, [isAuthenticated, router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    setError("");
    try {
      const lesson = await youtube.addLesson(url.trim());
      router.push(`/youtube/${lesson.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể thêm video. Hãy kiểm tra URL và thử lại.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Xoá video này khỏi thư viện?")) return;
    setDeletingId(id);
    try {
      await youtube.delete(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Youtube size={28} className="text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">YouTube Shadowing</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Nhập link YouTube bất kỳ để luyện shadowing theo từng câu với AI chấm điểm phát âm.
        </p>
      </div>

      {/* URL input */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Thêm video YouTube mới
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition"
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Đang tải phụ đề..." : "Thêm"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
        )}
        <p className="text-xs text-gray-400">
          Hỗ trợ: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...
          <br />
          Video cần có phụ đề tiếng Anh (auto-generated cũng được).
        </p>
      </form>

      {/* Library */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Thư viện của bạn ({lessons.length} video)
        </h2>

        {loadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Youtube size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có video nào. Thêm video đầu tiên của bạn!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lessons.map((lesson) => {
              const progressPct = lesson.totalSentences > 0
                ? Math.round((lesson.completedSentences / lesson.totalSentences) * 100)
                : 0;
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push(`/youtube/${lesson.id}`)}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition"
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gray-900">
                    {lesson.thumbnailUrl ? (
                      <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Youtube size={32} className="text-red-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <PlayCircle size={40} className="text-white drop-shadow" />
                    </div>
                    {progressPct === 100 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(lesson.id, e)}
                      disabled={deletingId === lesson.id}
                      className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      {deletingId === lesson.id
                        ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">{lesson.title}</p>
                    {lesson.channelName && (
                      <p className="text-xs text-gray-400 mb-2">{lesson.channelName}</p>
                    )}
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-2">
                      <div
                        className="h-1 bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{lesson.completedSentences}/{lesson.totalSentences} câu pass</span>
                      {lesson.lastPracticedAt ? (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDate(lesson.lastPracticedAt)}
                        </span>
                      ) : (
                        <span>Chưa luyện</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
