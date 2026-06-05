import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import ThemeProvider from "@/providers/ThemeProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Shadowling — Học tiếng Anh qua Dictation & Shadowing",
  description: "Nền tảng học tiếng Anh hiệu quả với Dictation, Shadowing và Spaced Repetition",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <ToastContainer />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
