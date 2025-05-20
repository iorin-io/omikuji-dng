// app/components/PrintReceiptButton.tsx
"use client";

import { FortuneData, FortuneRank } from "../../lib/aiFortune";
import { useEscPosPrinter } from "../../lib/useEscPosPrinter";
import { useState } from "react";
import styled from "styled-components";
import { Yuji_Boku } from "next/font/google";

const RANKS: FortuneRank[] = ["大吉", "中吉", "小吉", "吉", "凶"];

const Button = styled.button<{ disabled: boolean }>`
  border-radius: 1rem;
  background-color: #dc2626;
  padding: 0.5rem 1rem;
  color: #fff;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  &:hover {
    background-color: ${({ disabled }) => (disabled ? "#dc2626" : "#b91c1c")};
  }
  border: none;
  font-size: 50px;
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  color: #dc2626; /* red-500 */
`;

const yujiBoku = Yuji_Boku({
  subsets: ["latin"],
  weight: "400",
});

export default function PrintReceiptButton() {
  const { status, connect, printBitmap, printSpace, init, cut, printQRCode } =
    useEscPosPrinter();
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    setError(null);
    setIsGenerating(true);

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

    setIsGenerating(false);

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
  // ボタンが生成中 or 接続中 or 印刷中 のときは押せないように
  const disabled =
    isGenerating || status === "connecting" || status === "printing";

  // 表示テキストの切り替え
  let label = "おみくじを引く";
  if (isGenerating) label = "ヌルの神が考え中...";
  else if (status === "printing") label = "印刷中...";
  else if (status === "done") label = "おみくじを引く";

  return (
    <>
      <div>
        <Button
          onClick={handlePrint}
          disabled={disabled}
          className={yujiBoku.className}
        >
          {label}
        </Button>
      </div>
      <div>{error && <ErrorText>{error}</ErrorText>}</div>
    </>
  );
}
