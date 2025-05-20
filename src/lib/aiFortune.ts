// lib/fortune.ts
import { fortuneSystemPrompt } from "../prompts/fortuneSystemPrompt";
import OpenAI from "openai";

export type FortuneRank = "大吉" | "中吉" | "小吉" | "吉" | "末吉" | "凶";

export interface FortuneData {
  summary: string;
  love: string;
  work: string;
  health: string;
  money: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFortuneText(rank: FortuneRank): Promise<string> {
  // ① 出力フォーマットを system で指示
  const systemPrompt = fortuneSystemPrompt;

  const userPrompt = `運勢レベルは「${rank}」です。`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userPrompt.trim() },
    ],
    temperature: 0.7,
  });

  return resp.choices[0].message?.content?.trim() ?? "";
}
