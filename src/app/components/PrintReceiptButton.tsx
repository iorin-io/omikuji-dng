// app/components/PrintReceiptButton.tsx
"use client";

import { FortuneData, FortuneRank } from "../../lib/aiFortune";
import { useEscPosPrinter } from "../../lib/useEscPosPrinter";
import { useState } from "react";

const RANKS: FortuneRank[] = ["大吉", "中吉", "小吉", "吉", "凶"];

export default function PrintReceiptButton() {
  const { status, connect, printBitmap, printSpace, init, cut, printQRCode } =
    useEscPosPrinter();
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    setError(null);

    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];

    console.log("運勢レベル:", rank);

    let fortune: FortuneData;

    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank }),
      });
      const json = (await res.json()) as {
        fortune?: FortuneData;
        error?: string;
      };
      if (!res.ok || !json.fortune)
        throw new Error(json.error || "生成に失敗しました");
      fortune = json.fortune;

      console.log("運勢データ:", fortune);
    } catch (e: unknown) {
      console.error(e);
      setError("運勢の取得に失敗しました");
      return;
    }

    const ok = await connect();
    if (!ok) {
      setError("プリンタの接続に失敗しました");
      return;
    }

    const newsUrl =
      "https://digitalnature.slis.tsukuba.ac.jp/2025/03/lab-exhibition-2025/";

    await init();

    await printBitmap({ text: `ｼﾝｷﾞｭﾗみくじ`, place: "center", fontSize: 30 });

    await printSpace(2);

    await printBitmap({ text: `【${rank}】`, place: "center", fontSize: 60 });

    await printSpace(2);

    await printBitmap({ text: fortune.summary, fontSize: 20 });

    await printSpace(2);

    await printBitmap({
      text: "恋愛運",
      place: "center",
      fontSize: 40,
    });
    await printSpace(1);
    await printBitmap({ text: fortune.love, fontSize: 20 });

    await printSpace(2);

    await printBitmap({
      text: "仕事運",
      place: "center",
      fontSize: 40,
    });
    await printSpace(1);
    await printBitmap({ text: fortune.work, fontSize: 20 });

    await printSpace(2);

    await printBitmap({
      text: "健康運",
      place: "center",
      fontSize: 40,
    });
    await printSpace(1);
    await printBitmap({ text: fortune.health, fontSize: 20 });

    await printSpace(2);

    await printBitmap({
      text: "金運",
      place: "center",
      fontSize: 40,
    });
    await printSpace(1);
    await printBitmap({ text: fortune.money, fontSize: 20 });

    await printSpace(5);

    await printQRCode(
      `http://twitter.com/share?url=${newsUrl}&text=${fortune.summary}&related=labDNG,ochyai&hashtags=落合陽一,ｼﾝｷﾞｭﾗってｺﾝｳﾞｨｳﾞｨ展,ｼﾝｷﾞｭﾗみくじ`,
      350
    );
    await printBitmap({
      text: "#ｼﾝｷﾞｭﾗみくじ",
      place: "right",
      fontSize: 20,
    });

    await printSpace(5);

    await cut();
  };

  return (
    <>
      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={handlePrint}
        disabled={status === "connecting" || status === "printing"}
      >
        {status === "printing"
          ? "印刷中…"
          : status === "done"
          ? "完了！"
          : "レシート印刷"}
      </button>
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </>
  );
}
