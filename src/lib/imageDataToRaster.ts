export type Raster = {
  widthDot: number; // 最終的な用紙ドット幅（maxWidthDot）
  heightDot: number; // 画像の高さ
  rowBytes: number; // Math.ceil(widthDot/8)
  data: Uint8Array; // rowBytes * heightDot バイト長
};

/**
 * ImageData → 中央揃え1-bitラスタに変換
 * @param img       元の ImageData
 * @param maxWidthDot 用紙幅ドット数（例: 384）
 */
export function imageDataToRaster(
  img: ImageData,
  maxWidthDot: number = 384
): Raster {
  const { width, height, data: rgba } = img;
  // 用紙幅のバイト幅
  const rowBytes = Math.ceil(maxWidthDot / 8);
  // 新バッファ（用紙幅 × 高さ）
  const buf = new Uint8Array(rowBytes * height);
  // 画像左端を用紙中央に寄せるオフセット
  const offset = Math.floor((maxWidthDot - width) / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = (y * width + x) * 4;
      // 白黒判定
      const lum =
        0.299 * rgba[px] + 0.587 * rgba[px + 1] + 0.114 * rgba[px + 2];
      if (lum < 128) {
        const newX = x + offset;
        const byteIndex = y * rowBytes + (newX >> 3);
        const bitMask = 0x80 >> (newX & 7);
        buf[byteIndex] |= bitMask;
      }
    }
  }

  return {
    widthDot: maxWidthDot,
    heightDot: height,
    rowBytes,
    data: buf,
  };
}
