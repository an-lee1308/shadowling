"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { lessons as lessonsApi, admin } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import type { Lesson } from "@/types";
import { Plus, Pencil, Trash2, X, Check, Upload } from "lucide-react";

function parseSrtVtt(text: string): { start: number; end: number; text: string }[] {
  const segments: { start: number; end: number; text: string }[] = [];
  const toSec = (t: string) => {
    const clean = t.replace(",", ".");
    const parts = clean.split(":");
    if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
    if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
    return Number(parts[0]);
  };
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = lines[0]?.trim().startsWith("WEBVTT") ? 1 : 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || /^\d+$/.test(line)) { i++; continue; }
    const m = line.match(/(\S+)\s+-->\s+(\S+)/);
    if (m) {
      const start = toSec(m[1]);
      const end = toSec(m[2]);
      i++;
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") { parts.push(lines[i].trim()); i++; }
      if (parts.length) segments.push({ start, end, text: parts.join(" ") });
    } else { i++; }
  }
  return segments;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  audioUrl: "",
  videoUrl: "",
  thumbnailUrl: "",
  transcript: "",
  level: "BEGINNER",
  topic: "",
  durationSeconds: 0,
};

type FormData = typeof EMPTY_FORM;

export default function AdminLessonsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [lessonList, setLessonList] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    // Role check is done server-side; redirect if no admin role locally
    const typedUser = user as { role?: string } | null;
    if (typedUser && typedUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchLessons();
  }, [isAuthenticated, user, router]);

  function fetchLessons() {
    setLoading(true);
    lessonsApi.list({ size: 50 })
      .then((p) => setLessonList(p.content))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setParsedCount(null);
    setShowForm(true);
  }

  function openEdit(lesson: Lesson) {
    setParsedCount(null);
    setForm({
      title: lesson.title,
      description: lesson.description || "",
      audioUrl: lesson.audioUrl || "",
      videoUrl: lesson.videoUrl || "",
      thumbnailUrl: lesson.thumbnailUrl || "",
      transcript: lesson.transcript || "",
      level: lesson.level,
      topic: lesson.topic || "",
      durationSeconds: lesson.durationSeconds || 0,
    });
    setEditingId(lesson.id);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await admin.updateLesson(editingId, form as Parameters<typeof admin.updateLesson>[1]);
      } else {
        await admin.createLesson(form as Parameters<typeof admin.createLesson>[0]);
      }
      setShowForm(false);
      fetchLessons();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài học "${title}"?`)) return;
    try {
      await admin.deleteLesson(id);
      setLessonList((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const field = (key: keyof FormData, label: string, type: string = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý bài học</h1>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              <Plus size={16} />
              Thêm bài học
            </button>
          </div>

          {/* Lesson table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Tiêu đề</th>
                  <th className="text-left px-6 py-3">Cấp độ</th>
                  <th className="text-left px-6 py-3">Chủ đề</th>
                  <th className="text-left px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {lessonList.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{lesson.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lesson.level === "BEGINNER" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                        lesson.level === "INTERMEDIATE" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}>
                        {lesson.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{lesson.topic || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {lesson.durationSeconds ? `${Math.floor(lesson.durationSeconds / 60)}m` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(lesson)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id, lesson.title)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lessonList.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">Chưa có bài học nào.</p>
            )}
          </div>
        </div>
      </main>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {editingId ? "Cập nhật bài học" : "Thêm bài học mới"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {field("title", "Tiêu đề *")}
              {field("description", "Mô tả")}
              {field("audioUrl", "URL âm thanh")}
              {field("videoUrl", "URL video")}
              {field("thumbnailUrl", "URL ảnh bìa")}
              {field("durationSeconds", "Thời lượng (giây)", "number")}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp độ</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              {field("topic", "Chủ đề")}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transcript (JSON)</label>
                  <label className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">
                    <Upload size={12} />
                    Import SRT/VTT
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const segments = parseSrtVtt(ev.target?.result as string);
                          setParsedCount(segments.length);
                          setForm((f) => ({ ...f, transcript: JSON.stringify(segments) }));
                        };
                        reader.readAsText(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {parsedCount !== null && (
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">{parsedCount} đoạn đã được nhập</p>
                )}
                <textarea
                  rows={4}
                  value={form.transcript}
                  onChange={(e) => setForm((f) => ({ ...f, transcript: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder='[{"start":0,"end":5,"text":"Hello world"}]'
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo bài học"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
