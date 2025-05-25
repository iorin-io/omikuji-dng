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

export async function generateFortuneText(
  rank: FortuneRank,
  retries = 3
): Promise<FortuneData> {
  if (retries <= 0) {
    throw new Error("運勢データの取得に失敗しました（リトライ上限超過）");
  }

  const fortuneText = await fetchFortuneText(rank);

  try {
    const parsed = JSON.parse(fortuneText) as Partial<FortuneData>;
    const keys: Array<keyof FortuneData> = [
      "summary",
      "love",
      "work",
      "health",
      "money",
    ];
    const allExist = keys.every((k) => typeof parsed[k] === "string");
    if (!allExist) {
      throw new Error("キー不足");
    }
    return parsed as FortuneData;
  } catch (err) {
    console.warn(`パースエラーまたはキー不足（残り${retries - 1}回）：`, err);

    return generateFortuneText(rank, retries - 1);
  }
}

async function fetchFortuneText(rank: FortuneRank): Promise<string> {
  const systemPrompt = fortuneSystemPrompt.trim();
  const userPrompt = `運勢レベルは「${rank}」です。`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4.1-mini-2025-04-14",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  return resp.choices[0].message?.content?.trim() ?? "";
}
