/// <reference types="w3c-web-usb" />
// app/lib/useEscPosPrinter.ts
"use client";
import { useState, useCallback, useRef } from "react";
import QRCode from "qrcode";
import * as Enc from "encoding-japanese";
import {
  textToRasterCenter,
  textToRasterLeft,
  textToRasterRight,
} from "./textToRaster";
import { imageDataToRaster } from "./imageDataToRaster";

type Status = "idle" | "connecting" | "printing" | "done" | "error";

export function useEscPosPrinter() {
  const [status, setStatus] = useState<Status>("idle");
  const deviceRef = useRef<USBDevice | null>(null); // ← ここを ref に
  const ep = 1; // Bulk-OUT endpoint

  /** デバイス選択 & Open */
  const connect = useCallback(async () => {
    setStatus("connecting");

    try {
      let usb: USBDevice | null = deviceRef.current;
      if (!usb) {
        const devices = await navigator.usb.getDevices();
        usb =
          devices.find(
            (d) => d.vendorId === 0x0416 && d.productId === 0x5011
          ) ?? null;
      }

      if (!usb) {
        usb = await navigator.usb.requestDevice({
          filters: [{ vendorId: 0x0416, productId: 0x5011 }],
        });
      }

      if (!usb.opened) {
        await usb.open();
        if (usb.configuration === null) {
          await usb.selectConfiguration(1);
        }
        await usb.claimInterface(0);
      }

      deviceRef.current = usb;
      setStatus("idle");
      return true;
    } catch (e) {
      console.error("USB接続失敗:", e);
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

    const body = Uint8Array.from(
      Enc.convert(text + "\n", { to: "SJIS", type: "array" })
    );

    await send(body);

    setStatus("done");
  }, []);

  /* ---------- ビットマップ印字（ESC * 24-dot） ---------- */
  type PrintBitmapOptions = {
    text: string;
    place?: "left" | "center" | "right";
    fontSize?: number;
  };

  const printBitmap = useCallback(
    async ({ text, place = "left", fontSize = 20 }: PrintBitmapOptions) => {
      if (!deviceRef.current) throw new Error("Device not connected");

      let widthDot, heightDot, rowBytes, data;

      if (place === "center") {
        ({ widthDot, heightDot, rowBytes, data } = textToRasterCenter(
          text,
          fontSize
        ));
      } else if (place === "right") {
        ({ widthDot, heightDot, rowBytes, data } = textToRasterRight(
          text,
          fontSize
        ));
      } else {
        ({ widthDot, heightDot, rowBytes, data } = textToRasterLeft(
          text,
          fontSize
        ));
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

      await send(
        Uint8Array.from([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]),
        "GS v 0"
      );
      await send(data); // ラスター本体

      await send(Uint8Array.from([0x1d, 0x56, 0x00, 0x10]));
    },
    []
  );

  const printSpace = async (returnLines: number) => {
    if (!deviceRef.current) throw new Error("Device not connected");

    const fontSize = 20;
    const maxWidthDot = 384;

    // 1行分の空ラスタを生成
    const { heightDot, rowBytes, data } = textToRasterCenter(
      "", // 空文字
      fontSize,
      "'Noto Sans JP'",
      maxWidthDot
    );

    // 総高さ
    const totalHeight = heightDot * returnLines;

    // ESC/POS: GS v 0 m xL xH yL yH
    const m = 0x00;
    const xL = rowBytes & 0xff;
    const xH = rowBytes >> 8;
    const yL = totalHeight & 0xff;
    const yH = totalHeight >> 8;

    // ビットマップヘッダー
    await send(
      Uint8Array.from([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]),
      "GS v 0"
    );

    // ラスター本体を行数分送信
    for (let i = 0; i < returnLines; i++) {
      await send(data, "blank raster");
    }
  };

  const init = useCallback(async () => {
    if (!deviceRef.current) throw new Error("Device not connected");
    setStatus("printing");
    await send(Uint8Array.from([0x1b, 0x40]), "ESC @");
  }, []);

  const cut = useCallback(async () => {
    if (!deviceRef.current) throw new Error("Device not connected");
    await send(Uint8Array.from([0x1d, 0x56, 0x41, 0x10]), "CUT");
    setStatus("done");
  }, []);

  const printQRCode = useCallback(async (url: string, size = 200) => {
    if (!deviceRef.current) throw new Error("Device not connected");

    // 1. Canvas に QR を描画
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    await QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, size, size);
    const { widthDot, heightDot, rowBytes, data } = imageDataToRaster(imgData);

    console.log("widthDot", widthDot);
    console.log("heightDot", heightDot);
    console.log("rowBytes", rowBytes);
    console.log("data", data);

    // 2. ESC/POS でビットマップ出力
    const m = 0; // 通常倍率
    const xL = rowBytes & 0xff;
    const xH = rowBytes >> 8;
    const yL = heightDot & 0xff;
    const yH = heightDot >> 8;

    // 初期化（必要なら一度だけ外で呼び出してもOK）
    await send(Uint8Array.from([0x1b, 0x40]), "ESC @");
    // ビットマップ命令
    await send(
      Uint8Array.from([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]),
      "GS v 0"
    );
    // データ本体
    await send(data, "QR raster");
    // 改行少々
    for (let i = 0; i < 4; i++) {
      await send(Uint8Array.from([0x0a]), "LF");
    }
  }, []);

  return {
    status,
    connect,
    print,
    printBitmap,
    printSpace,
    init,
    cut,
    printQRCode,
  };
}
