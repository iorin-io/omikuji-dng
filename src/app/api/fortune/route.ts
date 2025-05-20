// app/api/fortune/route.ts
import { NextResponse } from "next/server";
import type { FortuneRank } from "../../../lib/aiFortune";
import { generateFortuneText } from "../../../lib/aiFortune";

export async function POST(req: Request) {
  const { rank } = (await req.json()) as { rank?: FortuneRank };

  const validRanks = ["大吉", "中吉", "小吉", "吉", "凶"] as const;
  if (!rank || !validRanks.includes(rank as FortuneRank)) {
    return NextResponse.json(
      {
        error:
          "rank は 大吉・中吉・小吉・吉・凶 のいずれかで指定してください。",
      },
      { status: 400 }
    );
  }

  try {
    const raw = await generateFortuneText(rank);

    const data = JSON.parse(raw) as {
      summary: string;
      love: string;
      work: string;
      health: string;
      money: string;
    };

    return NextResponse.json({ fortune: data });
  } catch (e) {
    console.error("Fortune generation error:", e);
    return NextResponse.json(
      { error: "運勢の生成中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
