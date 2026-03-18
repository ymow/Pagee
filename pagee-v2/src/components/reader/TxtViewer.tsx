import { useEffect, useState } from "react";
import { List, MessageSquare, Settings } from "lucide-react";
import SelectionPopup from "@/components/chat/SelectionPopup";

interface TxtViewerProps {
  data: ArrayBuffer;
  onToggleChat?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  onChapterChange?: (title: string, content: string) => void;
}

export default function TxtViewer({ data, onToggleChat, onSelectionAction, onChapterChange }: TxtViewerProps) {
  const [text, setText] = useState("");
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!data) return;
    const decoder = new TextDecoder("utf-8");
    const decodedText = decoder.decode(data);
    setText(decodedText);
    onChapterChange?.("全文內容", decodedText.substring(0, 10000));
  }, [data, onChapterChange]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";
    if (selectedText && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({ text: selectedText, x: rect.left + rect.width / 2, y: rect.top });
    } else {
      setSelection(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white relative" onMouseUp={handleMouseUp}>
      <header className="flex items-center justify-between px-6 py-3 border-b bg-stone-50/50 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors"><List className="w-5 h-5 text-stone-600" /></button>
          <h2 className="font-medium text-stone-800 line-clamp-1 max-w-md">TXT 文件</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onToggleChat} className="p-2 hover:bg-stone-200 rounded-lg transition-colors"><MessageSquare className="w-5 h-5 text-stone-600" /></button>
          <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors"><Settings className="w-5 h-5 text-stone-600" /></button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-stone-100/30 flex justify-center p-8">
        <div className="max-w-3xl w-full bg-white shadow-sm border rounded-xl p-10 leading-relaxed text-stone-800 whitespace-pre-wrap font-sans">{text || "載入中..."}</div>
      </main>
      {selection && (
        <SelectionPopup
          text={selection.text}
          position={{ x: selection.x, y: selection.y }}
          onClose={() => setSelection(null)}
          onAction={(action, text) => { onSelectionAction?.(action, text); setSelection(null); }}
        />
      )}
    </div>
  );
}
