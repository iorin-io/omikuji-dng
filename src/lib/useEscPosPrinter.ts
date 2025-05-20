/// <reference types="w3c-web-usb" />
// app/lib/useEscPosPrinter.ts
"use client";
import { useState, useCallback, useRef } from "react";
import * as Enc from "encoding-japanese";
import { textToRaster, textToRasterCenter } from "./textToRaster";

type Status = "idle" | "connecting" | "printing" | "done" | "error";

export function useEscPosPrinter() {
  const [status, setStatus] = useState<Status>("idle");
  const deviceRef = useRef<USBDevice | null>(null); // ← ここを ref に
  const ep = 1; // Bulk-OUT endpoint

  /** デバイス選択 & Open */
  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const usb = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x0416, productId: 0x5011 }],
      });

      await usb.open();
      if (!usb.configuration) await usb.selectConfiguration(1);
      await usb.claimInterface(0);

      deviceRef.current = usb; // ← ref に格納
      setStatus("idle");
      return true;
    } catch (e) {
      console.error(e);
      setStatus("error");
      return false;
    }
  }, []);

  /** ESC/POS 送信ユーティリティ（64B チャンク） */
  const send = async (buf: Uint8Array, label = "") => {
    const dev = deviceRef.current!;
    if (label || buf.length <= 16) {
      const hex = [...buf]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      console.log(`${label} (${buf.length}B):`, hex);
    }
    for (let i = 0; i < buf.length; i += 64) {
      await dev.transferOut(ep, buf.slice(i, i + 64));
    }
  };

  /** 印字 */
  const print = useCallback(async (text: string) => {
    const dev = deviceRef.current;
    if (!dev) throw new Error("Device not connected");

    setStatus("printing");

    const init = Uint8Array.from([0x1b, 0x40]);
    const body = Uint8Array.from(
      Enc.convert(text + "\n", { to: "SJIS", type: "array" })
    );
    const cut = Uint8Array.from([0x1d, 0x56, 0x41, 0x10]);

    await send(init);
    await send(body);
    await send(cut);

    setStatus("done");
  }, []);

  /* ---------- ビットマップ印字（ESC * 24-dot） ---------- */
  type PrintBitmapOptions = {
    text: string;
    place?: "right" | "center";
  };

  const printBitmap = useCallback(
    async ({ text, place = "right" }: PrintBitmapOptions) => {
      if (!deviceRef.current) throw new Error("Device not connected");
      setStatus("printing");

      let widthDot, heightDot, rowBytes, data;

      if (place === "center") {
        ({ widthDot, heightDot, rowBytes, data } = textToRasterCenter(
          text,
          60
        ));
      } else {
        ({ widthDot, heightDot, rowBytes, data } = textToRaster(text, 20));
      }

      console.log("widthDot", widthDot);
      console.log("heightDot", heightDot);
      console.log("rowBytes", rowBytes);
      console.log("data", data);

      /* --- GS v 0 m xL xH yL yH --- */
      const m = 0x00; // 通常倍率
      const xL = (rowBytes * 1) & 0xff;
      const xH = (rowBytes * 1) >> 8;
      const yL = heightDot & 0xff;
      const yH = heightDot >> 8;

      await send(Uint8Array.from([0x1b, 0x40]), "ESC @"); // 初期化
      await send(
        Uint8Array.from([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]),
        "GS v 0"
      );
      await send(data); // ラスター本体
      for (let i = 0; i < 5; i++) {
        await send(Uint8Array.from([0x0a]), "LF");
      }
      await send(Uint8Array.from([0x1d, 0x56, 0x00, 0x10]));

      setStatus("done");
    },
    []
  );

  // /* ---------- デバッグ: 正方形ベタ塗り ---------- */

  // const printBitmapDebug = async () => {
  //   if (!deviceRef.current) throw new Error("not connected");
  //   setStatus("printing");

  //   /* ------ 正方形サイズ ------ */
  //   const sideDot = 64; // 1 辺
  //   const cols = sideDot; // 列数
  //   const rows24 = Math.ceil(sideDot / 24); // =3
  //   const bytesPerRow = cols * 3; // 64×3 = 192B
  //   const fullLine = new Uint8Array(bytesPerRow).fill(0xff);
  //   /* ------------------------- */

  //   await send(Uint8Array.from([0x1b, 0x40]), "ESC @"); // 初期化
  //   await send(Uint8Array.from([0x1b, 0x33, 0x00]), "ESC 3 0"); // 行間 0dot

  //   for (let row = 0; row < rows24; row++) {
  //     // ESC * 24-dot ダブル密度 (m=33)
  //     await send(Uint8Array.from([0x1b, 0x2a, 0x21, cols, 0x00]));
  //     await send(fullLine); // 192B 黒
  //     await send(Uint8Array.from([0x0a])); // LF → 行送り 0dot
  //   }

  //   await send(Uint8Array.from([0x1d, 0x56, 0x41, 0x10]), "CUT");
  //   setStatus("done");
  // };

  return { status, connect, print, printBitmap };
}
