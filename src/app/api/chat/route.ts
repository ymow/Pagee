import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, system, stream = false } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API Key is not configured." },
        { status: 500 }
      );
    }

    if (stream) {
      // Implement streaming if needed, for MVP we can start with non-streaming
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: system || "你是一位專業的閱讀助手，擅長繁體中文閱讀理解與分析。",
      messages: messages,
      temperature: 0.4,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("AI API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch from AI provider";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
