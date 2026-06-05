"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { lessons as lessonsApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import LessonCard from "@/components/lesson/LessonCard";
import type { Lesson } from "@/types";
import { Search, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { value: "", label: "Tất cả" },
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

const TOPICS = [
  { value: "", label: "Tất cả chủ đề" },
  { value: "Daily Conversation", label: "Giao tiếp" },
  { value: "Business", label: "Kinh doanh" },
  { value: "IELTS", label: "IELTS" },
  { value: "Travel", label: "Du lịch" },
];

const SORTS = [
  { value: "newest", label: "Mới nhất", icon: Clock },
  { value: "popular", label: "Phổ biến", icon: Flame },
];

export default function LessonsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [lessonList, setLessonList] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lessonsApi.list({
        level: level || undefined,
        topic: topic || undefined,
        sort,
        size: 24,
      });
      setLessonList(res.content);
    } finally {
      setLoading(false);
    }
  }, [level, topic, sort]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchLessons();
      return;
    }
    setSearching(true);
    try {
      const res = await lessonsApi.search(searchQuery);
      setLessonList(res.content);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Bài học</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài học..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
              >
                Tìm
              </button>
            </form>

            {/* Level filter */}
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setSearchQuery(""); }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            {/* Topic filter */}
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setSearchQuery(""); }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Sort tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {SORTS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition",
                  sort === value
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading || searching ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : lessonList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">Không tìm thấy bài học nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessonList.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
