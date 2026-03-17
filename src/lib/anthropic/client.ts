export const PROMPTS = {
  SYSTEM: `你是一位專業的閱讀助手 Pagee AI，專門協助讀者理解與分析書籍內容。
請始終以「繁體中文」回答，除非使用者要求其他語言。
你的回答應保持專業、客觀且具啟發性。`,

  SUMMARY: (text: string) => 
    `請為以下選取的段落提供簡潔的摘要：\n\n"${text}"`,

  EXPLAIN: (text: string, context?: string) => 
    `請解釋以下選取的內容${context ? "（結合前後文脈絡）" : ""}：\n\n"${text}"`,

  TRANSLATE: (text: string) => 
    `請將以下選取的內容翻譯成繁體中文：\n\n"${text}"`,

  CHAPTER_NOTE: (chapterTitle: string, content: string) => 
    `請分析以下章節「${chapterTitle}」的內容，並提供結構化的筆記，包含：
1. 章節摘要
2. 重要情節/觀點
3. 出現的角色及其特徵
4. 值得思考的問題
\n\n內容如下：\n${content}`,

  CHARACTER_ANALYSIS: (content: string) => 
    `請分析以下內容中出現的角色，識別其名稱、性格特點以及與他人的關係：\n\n${content}`
};

export async function askAI(messages: { role: string; content: string }[], system?: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI 請求失敗");
  }

  return response.json();
}
