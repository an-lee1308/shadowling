import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function levelColor(level: string) {
  return {
    BEGINNER: "bg-green-100 text-green-700",
    INTERMEDIATE: "bg-yellow-100 text-yellow-700",
    ADVANCED: "bg-red-100 text-red-700",
  }[level] ?? "bg-gray-100 text-gray-700";
}

export function statusColor(status?: string) {
  return {
    COMPLETED: "text-green-600",
    IN_PROGRESS: "text-yellow-600",
    NOT_STARTED: "text-gray-400",
  }[status ?? "NOT_STARTED"] ?? "text-gray-400";
}
