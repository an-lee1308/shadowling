"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import type { UserLevel, UserGoal } from "@/types";
import { Check, Bell, BellOff, Target, User } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

const LEVELS: { value: UserLevel; label: string }[] = [
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

const GOALS: { value: UserGoal; label: string }[] = [
  { value: "GENERAL", label: "Giao tiếp hàng ngày" },
  { value: "IELTS", label: "Luyện IELTS" },
  { value: "TOEIC", label: "Luyện TOEIC" },
  { value: "BUSINESS", label: "Tiếng Anh thương mại" },
];

const GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<UserLevel>("BEGINNER");
  const [goal, setGoal] = useState<UserGoal>("GENERAL");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (user) {
      setName(user.name);
      setLevel(user.level);
      setGoal(user.goal);
      setDailyGoalMinutes(user.dailyGoalMinutes ?? 15);
    }
    if ("Notification" in window) {
      setNotifStatus(Notification.permission as "granted" | "denied" | "unknown");
    }
  }, [isAuthenticated, user, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ name, level, goal, dailyGoalMinutes });
      setAuth(updated, updated.token);
      showToast("Đã lưu cài đặt", "success");
    } catch {
      showToast("Lưu thất bại", "error");
    } finally {
      setSaving(false);
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission as "granted" | "denied" | "unknown");
    if (permission === "granted") {
      showToast("Đã bật thông báo!", "success");
      await registerPushSubscription();
    }
  }

  async function registerPushSubscription() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await auth.updateProfile({ pushSubscription: JSON.stringify(sub) });
    } catch {
      // Push subscription failed — notifications still work via browser
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ml-64 pb-20 md:pb-8 flex-1 p-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Cài đặt</h1>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-5">
                <User size={18} className="text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Hồ sơ</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hiển thị</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trình độ</label>
                  <div className="flex gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLevel(l.value)}
                        className={`flex-1 py-2 text-sm rounded-lg border-2 transition font-medium ${
                          level === l.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mục tiêu học tập</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGoal(g.value)}
                        className={`py-2 px-3 text-sm rounded-lg border-2 transition font-medium text-left ${
                          goal === g.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily goal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Target size={18} className="text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Mục tiêu hàng ngày</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Học bao nhiêu phút mỗi ngày?
              </p>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`px-4 py-2 text-sm rounded-lg border-2 transition font-medium ${
                      dailyGoalMinutes === mins
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Bell size={18} className="text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Thông báo</h2>
              </div>

              {notifStatus === "granted" ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <Bell size={16} />
                  <span>Thông báo đã được bật</span>
                </div>
              ) : notifStatus === "denied" ? (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <BellOff size={16} />
                  <span>Thông báo bị từ chối — hãy cấp quyền trong cài đặt trình duyệt</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Nhận nhắc nhở ôn từ vựng và duy trì streak.
                  </p>
                  <button
                    type="button"
                    onClick={requestNotifications}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                  >
                    <Bell size={16} />
                    Bật thông báo
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
