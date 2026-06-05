"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Có lỗi xảy ra
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {error.message || "Lỗi không xác định. Vui lòng thử lại."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
