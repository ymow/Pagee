import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, type BookRecord } from "../lib/store/db";
import EpubViewer from "../components/reader/EpubViewer";
import TxtViewer from "../components/reader/TxtViewer";
import { Loader2, Send, Bot, User, Sparkles, FileText, Users } from "lucide-react";
import { askAI, PROMPTS } from "../lib/anthropic/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<{ title: string; text: string } | null>(null);
  const currentChapterRef = useRef<{ title: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync for AI context
  useEffect(() => {
    currentChapterRef.current = currentChapter;
  }, [currentChapter]);

  useEffect(() => {
    if (!id) return;
    const loadBook = async () => {
      try {
        const bookId = parseInt(id, 10);
        const record = await db.books.get(bookId);
        if (record) setBook(record);
        else setError("找不到這本書。");
      } catch (err) {
        console.error("Failed to load book:", err);
        setError("讀取書籍時出錯。");
      }
    };
    loadBook();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string, displayPrompt?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: displayPrompt || text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsChatOpen(true);

    try {
      const chapter = currentChapterRef.current;
      const systemPrompt = (book && chapter)
        ? PROMPTS.GROUNDED_SYSTEM(book.metadata || { title: book.name }, { 
            chapter: chapter.title, 
            text: chapter.text.slice(0, 5000) 
          })
        : book 
          ? PROMPTS.DYNAMIC_SYSTEM(book.metadata?.title || book.name, book.metadata?.author) 
          : PROMPTS.SYSTEM;
        
      const response = await askAI([...messages, { role: "user", content: text }], systemPrompt);
      const assistantMessage = response.content[0].text;
      setMessages(prev => [...prev, { role: "assistant" as const, content: assistantMessage }]);
    } catch (err: unknown) {
      console.error("AI Error:", err);
      const errorMessage = err instanceof Error ? err.message : "未知錯誤";
      setMessages(prev => [...prev, { role: "assistant" as const, content: `錯誤: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [book, isLoading, messages]);

  const handleSelectionAction = useCallback(async (action: string, text: string) => {
    let prompt = "";
    let display = "";
    switch (action) {
      case "summary":
        prompt = PROMPTS.SUMMARY(text);
        display = `摘要：「${text.slice(0, 20)}...」`;
        break;
      case "explain":
        prompt = PROMPTS.EXPLAIN(text);
        display = `解釋：「${text.slice(0, 20)}...」`;
        break;
      case "translate":
        prompt = PROMPTS.TRANSLATE(text);
        display = `翻譯：「${text.slice(0, 20)}...」`;
        break;
      default:
        return;
    }
    handleSendMessage(prompt, display);
  }, [handleSendMessage]);

  const generateChapterNote = useCallback(() => {
    if (!currentChapter) return;
    const prompt = PROMPTS.CHAPTER_NOTE(currentChapter.title, currentChapter.text.slice(0, 3000));
    handleSendMessage(prompt, `生成「${currentChapter.title}」的章節筆記`);
  }, [currentChapter, handleSendMessage]);

  const analyzeCharacters = useCallback(() => {
    if (!currentChapter) return;
    const prompt = PROMPTS.CHARACTER_ANALYSIS(currentChapter.text.slice(0, 3000));
    handleSendMessage(prompt, `分析「${currentChapter.title}」中的角色關係`);
  }, [currentChapter, handleSendMessage]);

  const handleToggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);
  const handleChapterChange = useCallback((title: string, text: string) => setCurrentChapter({ title, text }), []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors">
          返回首頁
        </button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <div className={`flex-1 transition-all duration-300 relative ${isChatOpen ? "mr-[400px]" : ""}`}>
        {book.format === "txt" ? (
          <TxtViewer
            data={book.data}
            onToggleChat={handleToggleChat}
            onSelectionAction={handleSelectionAction}
            onChapterChange={handleChapterChange}
          />
        ) : (
          <EpubViewer 
            data={book.data} 
            onToggleChat={handleToggleChat}
            onSelectionAction={handleSelectionAction}
            onChapterChange={handleChapterChange}
          />
        )}
      </div>
      
      <aside className={`fixed right-0 top-0 h-full w-[400px] border-l bg-stone-50 transition-transform duration-300 transform shadow-2xl z-20 ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-100 p-1.5 rounded-lg"><Sparkles className="w-4 h-4 text-amber-700" /></div>
              <h3 className="font-bold text-stone-800 text-lg">Pagee AI 助手</h3>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors text-stone-500">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 px-2">
            <button onClick={generateChapterNote} disabled={!currentChapter || isLoading} className="flex items-center justify-center space-x-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors">
              <FileText className="w-3.5 h-3.5 text-amber-600" /><span>生成章節筆記</span>
            </button>
            <button onClick={analyzeCharacters} disabled={!currentChapter || isLoading} className="flex items-center justify-center space-x-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors">
              <Users className="w-3.5 h-3.5 text-blue-600" /><span>分析角色關係</span>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 px-8">
                <Bot className="w-12 h-12 text-stone-400" /><p className="text-sm">選取書中文字進行摘要，<br />或直接在下方輸入問題。</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-stone-800 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${msg.role === "user" ? "bg-stone-800 text-white rounded-tr-none" : "bg-white border shadow-sm text-stone-800 rounded-tl-none"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex space-x-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Bot className="w-5 h-5 text-amber-300" /></div>
                <div className="p-3 rounded-2xl bg-white border shadow-sm text-stone-300 text-sm">正在思考中...</div>
              </div>
            )}
          </div>

          <div className="mt-4 p-2 border-t bg-stone-50">
            <div className="relative">
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); } }} placeholder="詢問有關本書的問題..." className="w-full p-4 pr-12 border rounded-2xl resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none h-24 shadow-inner bg-white text-sm" />
              <button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isLoading} className="absolute right-3 bottom-3 p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:bg-stone-300 transition-colors shadow-sm">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
