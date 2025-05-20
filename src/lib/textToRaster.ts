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
 * 単一行のテキストを maxWidthDot 以下になるよう
 * 文字単位で折り返す
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthDot: number
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidthDot) {
      if (current) lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
