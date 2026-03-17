"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Languages, HelpCircle } from "lucide-react";

interface SelectionPopupProps {
  text: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, text: string) => void;
}

export default function SelectionPopup({ text, position, onClose, onAction }: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!text) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-stone-200 flex items-center p-1.5 space-x-1 animate-in fade-in zoom-in duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={() => onAction("summary", text)}
        className="flex items-center space-x-1.5 px-3 py-1.5 hover:bg-amber-50 rounded-lg text-stone-700 hover:text-amber-700 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">摘要</span>
      </button>
      <div className="w-px h-4 bg-stone-200" />
      <button
        onClick={() => onAction("explain", text)}
        className="flex items-center space-x-1.5 px-3 py-1.5 hover:bg-blue-50 rounded-lg text-stone-700 hover:text-blue-700 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-medium">解釋</span>
      </button>
      <div className="w-px h-4 bg-stone-200" />
      <button
        onClick={() => onAction("translate", text)}
        className="flex items-center space-x-1.5 px-3 py-1.5 hover:bg-green-50 rounded-lg text-stone-700 hover:text-green-700 transition-colors"
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm font-medium">翻譯</span>
      </button>
    </div>
  );
}
