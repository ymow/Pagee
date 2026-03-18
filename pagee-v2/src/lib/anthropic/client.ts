export const PROMPTS = {
  SYSTEM: `你是一位專業的閱讀助手 Pagee AI，專門協助讀者理解與分析書籍內容。
請始終以「繁體中文」回答，除非使用者要求其他語言。
你的回答應保持專業、客觀且具啟發性。`,

  DYNAMIC_SYSTEM: (title: string, author?: string) => 
    `你是一位專業的閱讀助手 Pagee AI。目前正在協助讀者閱讀《${title}》${author ? `（作者：${author}）` : ""}。
請根據這本書的內容回答問題。請始終以「繁體中文」回答。你的回答應保持專業、客觀且具啟發性。`,

  GROUNDED_SYSTEM: (metadata: any, context: { chapter: string; text: string }) => 
    `你是一位專業的閱讀助手 Pagee AI。
你正在與讀者「一起讀」這本書。

【當前書籍資訊】
書名：《${metadata.title || "未知書籍"}》
作者：${metadata.author || "未知"}
當前章節：${context.chapter}

【讀者正在閱讀的內容片段（重要：請直接根據此內容回答）】
"""
${context.text}
"""

你的規則：
1. 請「直接」根據上方提供的內容片段來回答讀者的提問或進行分析。
2. 絕對不要要求讀者「貼上文字」或「提供更多資訊」，因為你已經看見讀者正在看的內容了。
3. 如果讀者的提問在片段中找不到直接答案，請根據書本背景提供合理的專業分析或推測。
4. 始終使用「繁體中文」回答，語氣要親切、專業且具啟發性。`,

  SUMMARY: (text: string, context?: string) => 
    `請為以下選取的段落提供簡潔的摘要${context ? "，並結合當前章節的背景脈絡" : ""}：\n\n"${text}"`,

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

export async function askAI(messages: { role: string; content: string }[], system?: string, apiKey?: string) {
  // In a pure React SPA, we call Anthropic directly if the user provides an API key,
  // or we call our own Hono backend proxy. For MVP BYOK, we can call directly.
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey || "",
      "anthropic-version": "2023-06-01",
      "dangerously-allow-browser": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: system || PROMPTS.SYSTEM,
      messages: messages,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "AI 請求失敗");
  }

  return response.json();
}
