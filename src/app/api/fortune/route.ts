// app/api/fortune/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import type { FortuneRank } from "../../../lib/aiFortune";
import { generateFortuneText } from "../../../lib/aiFortune";

export async function POST(req: Request): Promise<NextResponse> {
  const { rank } = (await req.json()) as { rank?: FortuneRank };

  const validRanks = ["大吉", "中吉", "小吉", "吉", "末吉", "凶"] as const;
  if (!rank || !validRanks.includes(rank as FortuneRank)) {
    return NextResponse.json(
      {
        error:
          "rank は 大吉・中吉・小吉・吉・末吉・凶 のいずれかで指定してください。",
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
  } catch {
    const res = POST(req);
    return res;
  }
}
