import { useEffect, useRef, useState } from "react";
import ePub, { Rendition, Contents } from "epubjs";
import { ChevronLeft, ChevronRight, Settings, List, MessageSquare } from "lucide-react";
import SelectionPopup from "@/components/chat/SelectionPopup";

interface EpubViewerProps {
  data: ArrayBuffer;
  onToggleChat?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  onChapterChange?: (title: string, content: string) => void;
}

export default function EpubViewer({ 
  data, 
  onToggleChat, 
  onSelectionAction,
  onChapterChange
}: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!viewerRef.current || !data) return;

    const buffer = data.slice(0);
    const book = ePub(buffer);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: "100%",
      height: "100%",
      flow: "paginated",
      manager: "default",
    });

    renditionRef.current = rendition;

    rendition.display().then(() => {
      setIsLoaded(true);
    });

    book.loaded.metadata.then((meta) => {
      setTitle(meta.title);
    });

    rendition.on("relocated", async (loc: { start: { cfi: string } }) => {
      const updateChapter = async () => {
        try {
          const section = book.spine.get(loc.start.cfi);
          if (section) {
            const chapter = book.navigation.get(section.href);
            const chapterTitle = chapter ? chapter.label : "未命名章節";
            const doc = await section.load(book.load.bind(book)) as unknown as Document;
            if (doc && doc.body) {
              const text = doc.body.innerText || doc.body.textContent || "";
              onChapterChange?.(chapterTitle, text);
            }
          }
        } catch (e) {
          console.warn("Failed to extract chapter text", e);
        }
      };
      updateChapter();
      setTimeout(updateChapter, 500);
    });

    rendition.on("selected", (cfiRange: string, contents: Contents) => {
      const sel = contents.window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (text && sel) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iframe = contents.document.defaultView?.frameElement;
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          setSelection({
            text,
            x: rect.left + iframeRect.left + rect.width / 2,
            y: rect.top + iframeRect.top,
          });
        }
      }
    });

    rendition.on("click", () => setSelection(null));

    return () => {
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn("Epub cleanup error", e);
        }
      }
    };
  }, [data, onChapterChange]);

  return (
    <div className="flex flex-col h-screen bg-white relative">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-stone-50/50 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <List className="w-5 h-5 text-stone-600" />
          </button>
          <h2 className="font-medium text-stone-800 line-clamp-1 max-w-md">{title || "載入中..."}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onToggleChat} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <MessageSquare className="w-5 h-5 text-stone-600" />
          </button>
          <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex justify-center bg-stone-100/30">
        <div ref={viewerRef} className="w-full max-w-4xl h-full shadow-lg bg-white" />
        <button onClick={() => renditionRef.current?.prev()} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white shadow-md rounded-full transition-all text-stone-400 hover:text-stone-900 z-10">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button onClick={() => renditionRef.current?.next()} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white shadow-md rounded-full transition-all text-stone-400 hover:text-stone-900 z-10">
          <ChevronRight className="w-8 h-8" />
        </button>
      </main>

      {selection && (
        <SelectionPopup
          text={selection.text}
          position={{ x: selection.x, y: selection.y }}
          onClose={() => setSelection(null)}
          onAction={(action, text) => {
            onSelectionAction?.(action, text);
            setSelection(null);
          }}
        />
      )}
    </div>
  );
}
