"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, Book, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/store/db";
import ePub from "epubjs";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LandingPage() {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let format: "epub" | "txt" | "pdf" = "epub";
      let metadata: any = {};

      if (file.name.endsWith(".txt")) {
        format = "txt";
        metadata = { title: file.name };
      } else if (file.name.endsWith(".pdf")) {
        format = "pdf";
        try {
          // Dynamically import pdfjs to avoid SSR errors
          const { pdfjs } = await import("react-pdf");
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
          
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const pdfInfo = await pdf.getMetadata();
          metadata = {
            title: pdfInfo.info.Title || file.name,
            author: pdfInfo.info.Author || "",
          };
        } catch (e) {
          console.warn("Failed to extract PDF metadata", e);
          metadata = { title: file.name };
        }
      } else {
        format = "epub";
        try {
          const book = ePub(arrayBuffer.slice(0));
          const meta = await book.loaded.metadata;
          metadata = {
            title: meta.title || file.name,
            author: meta.creator || "",
            publisher: meta.publisher || "",
            description: meta.description || "",
            language: meta.language || "",
          };
        } catch (e) {
          console.warn("Failed to extract ePub metadata", e);
          metadata = { title: file.name };
        }
      }
      
      const id = await db.books.add({
        name: file.name,
        data: arrayBuffer,
        format,
        lastRead: Date.now(),
        metadata,
      });

      router.push(`/reader/${id}`);
    } catch (err) {
      console.error("Failed to save book:", err);
      setError("無法儲存書籍，請稍後再試。");
      setIsUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/epub+zip": [".epub"],
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 text-stone-900">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-amber-100 p-4 rounded-full">
              <Book className="w-12 h-12 text-amber-700" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Pagee</h1>
          <p className="text-lg text-stone-600">
            繁體中文 AI 輔助閱讀平台 —— 您的電子書 AI 領讀員
          </p>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer",
            "flex flex-col items-center justify-center space-y-4",
            isDragActive
              ? "border-amber-500 bg-amber-50"
              : "border-stone-300 hover:border-amber-400 hover:bg-white"
          )}
        >
          <input {...getInputProps()} />
          <div className="bg-stone-100 p-4 rounded-full">
            {isUploading ? (
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-stone-500" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "放開以開始閱讀" : "點擊或拖入 ePub/txt 檔案"}
            </p>
            <p className="text-sm text-stone-400 mt-1">最大限制 50MB</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-4 space-y-2">
            <div className="font-semibold flex items-center justify-center space-x-2">
              <span>選取即觸發</span>
            </div>
            <p className="text-sm text-stone-500">反白文字立即摘要、翻譯或解釋</p>
          </div>
          <div className="p-4 space-y-2">
            <div className="font-semibold flex items-center justify-center space-x-2">
              <span>深度問答</span>
            </div>
            <p className="text-sm text-stone-500">針對書本內容進行脈絡化問答</p>
          </div>
          <div className="p-4 space-y-2">
            <div className="font-semibold flex items-center justify-center space-x-2">
              <span>角色追蹤</span>
            </div>
            <p className="text-sm text-stone-500">分析複雜的人物關係與性格特點</p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 text-sm text-stone-400">
        © 2026 Pagee. 隱私至上，檔案僅在本地瀏覽器解析。
      </footer>
    </main>
  );
}
