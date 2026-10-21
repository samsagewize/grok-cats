import { WORLD_W } from "@/lib/constants";

const GLYPHS: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["111", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "011"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "110", "101", "011"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["010", "101", "010", "101", "010"],
  "9": ["011", "101", "011", "001", "110"],
  " ": ["000", "000", "000", "000", "000"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "010", "000"],
  "!": ["010", "010", "010", "000", "010"],
  "?": ["110", "001", "010", "000", "010"],
  "'": ["010", "010", "000", "000", "000"],
  _: ["000", "000", "000", "000", "111"],
};

function glyph(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, scale: number, color: string) {
  ctx.fillStyle = color;
  rows.forEach((row, gy) => {
    for (let gx = 0; gx < row.length; gx++) {
      if (row[gx] === "1") ctx.fillRect(x + gx * scale, y + gy * scale, scale, scale);
    }
  });
}

export function drawNameTag(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  anchorTop: number,
  accent: string,
) {
  const label = name.trim().slice(0, 12);
  if (!label) return;
  const upper = label.toUpperCase();
  const bitmap = [...upper].every((ch) => GLYPHS[ch]);
  const scale = 2;
  const glyphW = 3 * scale;
  const gap = scale;
  const glyphH = 5 * scale;
  ctx.font = "8px ui-monospace, monospace";
  const textW = bitmap
    ? upper.length * glyphW + Math.max(0, upper.length - 1) * gap
    : Math.ceil(ctx.measureText(label).width);
  const padX = 3;
  const padY = 2;
  const bar = 2;
  const w = textW + padX * 2 + bar;
  const h = (bitmap ? glyphH : 8) + padY * 2;
  const left = Math.max(1, Math.min(WORLD_W - w - 1, Math.round(x - w / 2)));
  const top = Math.max(1, Math.round(anchorTop - h - 2));

  ctx.fillStyle = "rgba(44, 34, 28, 0.35)";
  ctx.fillRect(left + 1, top + 2, w, h);
  ctx.fillStyle = "#2c221c";
  ctx.fillRect(left - 1, top - 1, w + 2, h + 2);
  ctx.fillStyle = "#fff8ee";
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(left, top, bar, h);

  if (bitmap) {
    let cursor = left + bar + padX;
    for (const ch of upper) {
      glyph(ctx, GLYPHS[ch], cursor, top + padY, scale, "#2c221c");
      cursor += glyphW + gap;
    }
    return;
  }

  ctx.fillStyle = "#2c221c";
  ctx.font = "8px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, left + bar + padX, top + padY);
}
