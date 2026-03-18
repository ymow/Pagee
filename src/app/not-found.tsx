import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">404 - 找不到頁面</h2>
      <p className="text-stone-600">抱歉，我們找不到您要求的頁面。</p>
      <Link
        href="/"
        className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
      >
        返回首頁
      </Link>
    </div>
  );
}
