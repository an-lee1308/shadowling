"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      const done = localStorage.getItem("onboarding_done");
      router.replace(done ? "/dashboard" : "/onboarding");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return null;
}
