// lib/fortune.ts
import OpenAI from "openai";

export type FortuneRank = "大吉" | "中吉" | "小吉" | "吉" | "凶";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFortuneText(rank: FortuneRank): Promise<string> {
  // ① 出力フォーマットを system で指示
  const systemPrompt = `
以下のフォーマットで出力してください。

総合メッセージ・総合運コメント（2〜3行、60〜90文字程度、ポジティブ）
分野別アドバイス
  恋愛運：1行30文字程度／末尾に❤️
  仕事・学業運：同上（学生／社会人どちらでも読める語彙）
  健康運：簡潔に＋軽い具体策（例「ストレッチ◎」）
  金運：節約 or 投資など一言助言
`;

  // ② ユーザー入力は「今日の運勢レベル」だけ
  const userPrompt = `今日の運勢レベルは「${rank}」です。`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini", // 環境に合わせてモデル名を調整
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userPrompt.trim() },
    ],
    temperature: 0.7,
  });

  return resp.choices[0].message?.content?.trim() ?? "";
}
