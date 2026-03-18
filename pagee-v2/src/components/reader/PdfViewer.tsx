import { useEffect, useState, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, MessageSquare, Settings, List, Loader2 } from "lucide-react";
import SelectionPopup from "@/components/chat/SelectionPopup";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set worker source for pdfjs
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  data: ArrayBuffer;
  onToggleChat?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  onChapterChange?: (title: string, content: string) => void;
}

export default function PdfViewer({ 
  data, 
  onToggleChat, 
  onSelectionAction,
  onChapterChange 
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const file = useMemo(() => ({ data }), [data]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    
    if (text && sel) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    } else {
      setSelection(null);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      onChapterChange?.(`第 ${pageNumber} 頁`, `這是 PDF 的第 ${pageNumber} 頁內容。`);
    }
  }, [pageNumber, isLoaded, onChapterChange]);

  const prevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber(p => Math.min(p + 1, numPages));

  return (
    <div className="flex flex-col h-screen bg-white relative" onMouseUp={handleMouseUp}>
      <header className="flex items-center justify-between px-6 py-3 border-b bg-stone-50/50 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <List className="w-5 h-5 text-stone-600" />
          </button>
          <h2 className="font-medium text-stone-800 line-clamp-1 max-w-md">PDF 文件</h2>
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

      <main className="flex-1 relative overflow-hidden flex justify-center bg-stone-100/30 custom-scrollbar overflow-y-auto pt-8 pb-12">
        <div className="shadow-2xl bg-white mb-8">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="w-[600px] h-[800px] flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>}
          >
            <Page pageNumber={pageNumber} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
          </Document>
        </div>
        
        <button onClick={prevPage} disabled={pageNumber <= 1} className="fixed left-8 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white shadow-md rounded-full transition-all text-stone-400 hover:text-stone-900 z-10 disabled:opacity-30">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button onClick={nextPage} disabled={pageNumber >= numPages} className="fixed right-8 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white shadow-md rounded-full transition-all text-stone-400 hover:text-stone-900 z-10 disabled:opacity-30">
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
