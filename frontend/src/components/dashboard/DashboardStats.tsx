import { Flame, BookOpen, Target, Brain } from "lucide-react";
import type { DashboardData } from "@/types";

export default function DashboardStats({ data }: { data: DashboardData }) {
  const stats = [
    {
      label: "Streak",
      value: `${data.streakCount} ngày`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Bài hoàn thành",
      value: data.lessonsCompleted,
      icon: BookOpen,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Độ chính xác",
      value: data.recentAccuracy != null ? `${data.recentAccuracy.toFixed(1)}%` : "—",
      icon: Target,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Từ cần ôn",
      value: data.wordsDueForReview,
      icon: Brain,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
            <s.icon size={20} className={s.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
