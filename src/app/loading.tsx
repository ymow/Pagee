import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        <p className="text-stone-500 font-medium">載入中...</p>
      </div>
    </div>
  );
}
