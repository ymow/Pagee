"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-2xl font-bold text-red-600">發生了點問題</h2>
      <p className="text-stone-600 max-w-md">
        {error.message || "讀取頁面時出錯，請嘗試重新整理。"}
      </p>
      <div className="space-x-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          再試一次
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2 bg-stone-100 text-stone-900 rounded-lg hover:bg-stone-200 transition-colors"
        >
          返回首頁
        </button>
      </div>
    </div>
  );
}
