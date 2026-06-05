"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import XpBar from "@/components/gamification/XpBar";
import {
  BookOpen,
  LayoutDashboard,
  BookMarked,
  BarChart2,
  LogOut,
  Flame,
  Sun,
  Moon,
  Trophy,
  ShieldCheck,
  Settings,
  Youtube,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/youtube", label: "YouTube", icon: Youtube },
  { href: "/vocabulary", label: "Từ vựng", icon: BookMarked },
  { href: "/progress", label: "Tiến độ", icon: BarChart2 },
  { href: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const isAdmin = (user as { role?: string })?.role === "ADMIN";

  return (
    <>
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🦜</span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Shadowling</span>
        </Link>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname.startsWith(href)
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin/lessons"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname.startsWith("/admin")
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <ShieldCheck size={18} />
            Quản trị
          </Link>
        )}
      </nav>

      {/* XP Bar */}
      <XpBar />

      {/* User section */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <Flame size={12} />
                <span>{user.streakCount} ngày</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      )}
    </aside>

    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around z-30">
      {NAV_ITEMS.filter(({ href }) => href !== "/leaderboard").map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition",
            pathname.startsWith(href)
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-400 dark:text-gray-500"
          )}
        >
          <Icon size={20} />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </Link>
      ))}
    </nav>
    </>
  );
}
