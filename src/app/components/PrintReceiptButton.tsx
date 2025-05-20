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
