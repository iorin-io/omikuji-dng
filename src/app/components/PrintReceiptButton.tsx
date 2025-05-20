// app/components/PrintReceiptButton.tsx
"use client";
import { useEscPosPrinter } from "@/lib/useEscPosPrinter";

export default function PrintReceiptButton() {
  const { status, connect, print, printBitmap, printBitmapCenter } =
    useEscPosPrinter();

  const handlePrint = async () => {
    const ok = await connect();
    if (ok) {
      // await print(`debug`);
      // await printBitmapDebug();
      await printBitmapCenter(`大吉`);

      // await print(`-------bitmap------`);
      await printBitmap(`そのころわたくしは、モリーオ市の博物局に勤めて居りました。

十八等官でしたから役所のなかでも、ずうっと下の方でしたし俸給ほうきゅうもほんのわずかでしたが、受持ちが標本の採集や整理で生れ付き好きなことでしたから、わたくしは毎日ずいぶん愉快にはたらきました。殊にそのころ、モリーオ市では競馬場を植物園に拵こしらえ直すというので、その景色のいいまわりにアカシヤを植え込んだ広い地面が、切符売場や信号所の建物のついたまま、わたくしどもの役所の方へまわって来たものですから、わたくしはすぐ宿直という名前で月賦で買った小さな蓄音器と二十枚ばかりのレコードをもって、その番小屋にひとり住むことになりました。わたくしはそこの馬を置く場所に板で小さなしきいをつけて一疋の山羊を飼いました。毎朝その乳をしぼってつめたいパンをひたしてたべ、それから黒い革のかばんへすこしの書類や雑誌を入れ、靴もきれいにみがき、並木のポプラの影法師を大股にわたって市の役所へ出て行くのでした。
`);
    }
  };

  return (
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
  );
}
