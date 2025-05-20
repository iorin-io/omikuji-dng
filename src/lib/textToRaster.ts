/** 文字列 → 1-bit ラスター（row-major, フォント倍率可） */
export function textToRaster(
  text: string,
  fontPx: number,
  fontFamily = "'Noto Sans JP'",
  maxWidthDot = 384
) {
  /* ---------- フォント設定 ---------- */
  const fontCSS = `${fontPx}px ${fontFamily}`;
  const lineHeight = Math.ceil(fontPx * 1.2); // 行送り 120 %

  /* ---------- Canvas 描画 ---------- */
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  ctx.font = fontCSS;

  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.flatMap((l) => wrapText(ctx, l, maxWidthDot));
  const widthDot = Math.min(
    maxWidthDot,
    Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width)))
  );
  const heightDot = lines.length * lineHeight;
  canvas.width = widthDot;
  canvas.height = heightDot;

  ctx.font = fontCSS;
  ctx.textBaseline = "top";

  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, widthDot, heightDot);
  ctx.fillStyle = "#000";
  lines.forEach((l, i) => ctx.fillText(l, 0, i * lineHeight));

  /* ---------- RGBA → 1-bit ---------- */
  const rgba = ctx.getImageData(0, 0, widthDot, heightDot).data;
  const rowBytes = Math.ceil(widthDot / 8);
  const data = new Uint8Array(rowBytes * heightDot);

  for (let y = 0; y < heightDot; y++) {
    for (let x = 0; x < widthDot; x++) {
      if (rgba[(y * widthDot + x) * 4] < 128) {
        data[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  return { widthDot, heightDot, rowBytes, data };
}

/**
 * 中央揃え用 1-bit ラスター（row-major, フォント倍率可）
 */
export function textToRasterCenter(
  text: string,
  fontPx: number,
  fontFamily = "'Noto Sans JP'",
  maxWidthDot = 384
) {
  // フォント設定
  const fontCSS = `${fontPx}px ${fontFamily}`;
  const lineHeight = Math.ceil(fontPx * 1.2);

  // 一旦コンテキスト取得して折り返し行を計算
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = fontCSS;

  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.flatMap((l) => wrapText(ctx, l, maxWidthDot));

  // 幅は常に用紙幅、縦は行数に応じて
  const widthDot = maxWidthDot;
  const heightDot = lines.length * lineHeight;
  canvas.width = widthDot;
  canvas.height = heightDot;

  // 描画設定（中央揃え）
  ctx.font = fontCSS;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";

  // 背景白、文字黒
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, widthDot, heightDot);
  ctx.fillStyle = "#000";
  lines.forEach((line, i) => {
    ctx.fillText(line, widthDot / 2, i * lineHeight);
  });

  // RGBA → 1-bit ラスター化
  const rgba = ctx.getImageData(0, 0, widthDot, heightDot).data;
  const rowBytes = Math.ceil(widthDot / 8);
  const data = new Uint8Array(rowBytes * heightDot);

  for (let y = 0; y < heightDot; y++) {
    for (let x = 0; x < widthDot; x++) {
      if (rgba[(y * widthDot + x) * 4] < 128) {
        data[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return { widthDot, heightDot, rowBytes, data };
}

/**
 * 単一行を maxWidthDot 以下に折り返すヘルパー
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthDot: number
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidthDot) {
      if (current) lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
