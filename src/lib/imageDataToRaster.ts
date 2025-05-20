type Raster = {
  widthDot: number;
  heightDot: number;
  rowBytes: number;
  data: Uint8Array;
};

/** ImageData → 1-bit ラスターに変換するユーティリティ */
export function imageDataToRaster(img: ImageData): Raster {
  const { width, height, data: rgba } = img;
  const rowBytes = Math.ceil(width / 8);
  const buf = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      // RGB のいずれかが黒めならドットON
      const luminance =
        0.299 * rgba[offset] +
        0.587 * rgba[offset + 1] +
        0.114 * rgba[offset + 2];
      if (luminance < 128) {
        buf[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  return { widthDot: width, heightDot: height, rowBytes, data: buf };
}
