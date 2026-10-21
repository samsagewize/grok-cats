import { COLS, ROWS, TILE, WORLD_H, WORLD_W } from "@/lib/constants";
import { mix, shade } from "@/lib/color";
import { getProps, getTiles, tileAt, type Prop, type TileName } from "@/lib/map";
import type { CatStatus, Dir, Pattern, Pose } from "@/lib/types";
import { CAT_ANCHOR_X, CAT_ANCHOR_Y, CAT_H, CAT_W, catGrid, type Anim } from "./cat-art";
import { drawNameTag } from "./font";

export type DrawCat = {
  id: string;
  name: string;
  color: string;
  pattern: Pattern;
  dir: Dir;
  state: CatStatus;
  pose: Pose;
  task: string;
  rx: number;
  ry: number;
  walkPx: number;
  moving: boolean;
  opacity: number;
  tagAlpha: number;
  selected: boolean;
  hovered: boolean;
  talking: boolean;
};

const sprites = new Map<string, HTMLCanvasElement>();
let floor: HTMLCanvasElement | null = null;

function hash(x: number, y: number): number {
  return Math.abs((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const h = hash(x, y);
  ctx.fillStyle = (h & 1) === 0 ? "#74ae4e" : "#69a246";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#5d943c";
  ctx.fillRect(x + (h % 13), y + ((h >> 3) % 12), 2, 1);
  ctx.fillStyle = "#8fc45f";
  ctx.fillRect(x + ((h >> 5) % 12), y + ((h >> 8) % 11), 1, 1);
  if (h % 11 === 0) {
    ctx.fillStyle = "#d7e38a";
    ctx.fillRect(x + ((h >> 2) % 10), y + ((h >> 6) % 10), 1, 2);
  }
}

function drawTile(ctx: CanvasRenderingContext2D, tx: number, ty: number, tile: TileName) {
  const x = tx * TILE;
  const y = ty * TILE;
  if (tile === "grass" || tile === "flower") {
    drawGrass(ctx, x, y);
    if (tile === "flower") {
      const colors = ["#f2d35a", "#e07a9a", "#fff6ea", "#e09a4a"];
      ctx.fillStyle = "#3e7a3c";
      ctx.fillRect(x + 7, y + 8, 1, 5);
      ctx.fillStyle = colors[hash(tx, ty) % colors.length];
      ctx.fillRect(x + 6, y + 5, 3, 3);
      ctx.fillStyle = "#fff6d8";
      ctx.fillRect(x + 7, y + 6, 1, 1);
    }
    return;
  }
  if (tile === "path") {
    ctx.fillStyle = "#d8bc90";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(x + 2, y + 4, 2, 2);
    ctx.fillRect(x + 10, y + 10, 3, 2);
    ctx.fillStyle = "#ead3ae";
    ctx.fillRect(x + 6, y + 2, 1, 1);
    if (tx === 11 && ty === 5) {
      ctx.fillStyle = "#c45b5b";
      ctx.fillRect(x + 2, y + 9, 12, 5);
      ctx.fillStyle = "#f0d2c4";
      ctx.fillRect(x + 3, y + 10, 10, 3);
    }
    return;
  }
  if (tile === "wood") {
    ctx.fillStyle = "#e0c088";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#c9a56a";
    ctx.fillRect(x, y + (ty % 2 === 0 ? 0 : 8), TILE, 1);
    ctx.fillStyle = "#f0d7a8";
    ctx.fillRect(x + 3, y + 4, 1, 1);
    ctx.fillRect(x + 11, y + 12, 1, 1);
    return;
  }
  if (tile === "rug") {
    ctx.fillStyle = "#f4e6d0";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#e3c2a4";
    ctx.fillRect(x + 7, y + 3, 2, 2);
    ctx.fillRect(x + 5, y + 5, 6, 2);
    ctx.fillRect(x + 6, y + 7, 4, 2);
    ctx.fillRect(x + 7, y + 9, 2, 2);
    ctx.fillStyle = "#c45b5b";
    if (tileAt(tx, ty - 1) !== "rug") ctx.fillRect(x, y, TILE, 2);
    if (tileAt(tx, ty + 1) !== "rug") ctx.fillRect(x, y + 14, TILE, 2);
    if (tileAt(tx - 1, ty) !== "rug") ctx.fillRect(x, y, 2, TILE);
    if (tileAt(tx + 1, ty) !== "rug") ctx.fillRect(x + 14, y, 2, TILE);
    return;
  }
  if (tile === "hedge") {
    ctx.fillStyle = "#24562a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#3d8a46";
    for (let i = 0; i < 5; i++) {
      const h = hash(tx + i * 3, ty + 5);
      ctx.fillRect(x + (h % 12), y + ((h >> 4) % 11), 4, 3);
    }
    ctx.fillStyle = "#1b3f20";
    ctx.fillRect(x, y + 14, TILE, 2);
    return;
  }
  ctx.fillStyle = "#6e4c34";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#c49262";
  ctx.fillRect(x + 1, y + 1, 14, 6);
  ctx.fillStyle = "#a67c52";
  ctx.fillRect(x + 1, y + 8, 14, 6);
  ctx.fillStyle = "#4e3424";
  ctx.fillRect(x, y + 7, TILE, 1);
  ctx.fillRect(x, y + 15, TILE, 1);
  if (ty === 2 && tx >= 13 && tx <= 15) {
    ctx.fillStyle = "#d9f2ea";
    ctx.fillRect(x + 3, y + 2, 10, 5);
    ctx.fillStyle = "#8ecfc0";
    ctx.fillRect(x + 4, y + 3, 8, 3);
    ctx.fillStyle = "#4e3424";
    ctx.fillRect(x + 7, y + 2, 1, 5);
  }
}

function floorCanvas(): HTMLCanvasElement {
  if (floor) return floor;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  const tiles = getTiles();
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) drawTile(ctx, tx, ty, tiles[ty * COLS + tx]);
  }
  floor = canvas;
  return canvas;
}

function blit(ctx: CanvasRenderingContext2D, rows: string[], fur: string, pattern: Pattern) {
  const dark = shade(fur, -36);
  const belly = mix(fur, "#fff6ee", 0.78);
  const ear = mix(fur, "#f3b7c2", 0.62);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      let color = "#ff00ff";
      if (ch === "o") color = "#3a2a22";
      else if (ch === "f" || ch === "d") {
        color = ch === "d" ? dark : fur;
        if (pattern === "stripes" && y % 3 === 0) color = dark;
        if (pattern === "spots" && (x * 5 + y * 3) % 11 === 0) color = dark;
        if (pattern === "socks" && y >= rows.length - 5) color = "#fff6ee";
        if (pattern === "tuxedo" && y > 12 && x > 7 && x < row.length - 7) color = "#fff6ee";
      } else if (ch === "b") color = pattern === "tuxedo" ? "#fff8f2" : belly;
      else if (ch === "w") color = "#fffaf4";
      else if (ch === "p") color = "#2a211c";
      else if (ch === "n") color = "#e98998";
      else if (ch === "i") color = ear;
      else if (ch === "k") color = "#f3b4bc";
      else if (ch === "s") color = "#b7e3d6";
      else if (ch === "l") color = "#4d5966";
      else if (ch === "g") color = "#d5dde4";
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

function spriteFor(cat: DrawCat, pose: Anim, frame: number): HTMLCanvasElement {
  const key = `${cat.color}|${cat.pattern}|${cat.dir}|${pose}|${frame}`;
  const cached = sprites.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = CAT_W;
  canvas.height = CAT_H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    blit(ctx, catGrid(cat.dir, pose, frame), cat.color, cat.pattern);
  }
  sprites.set(key, canvas);
  return canvas;
}

function animOf(cat: DrawCat, time: number): { pose: Anim; frame: number; bob: number } {
  if (cat.state === "sleeping") return { pose: "sleep", frame: Math.floor(time / 500) % 2, bob: 0 };
  if (cat.state === "working") return { pose: "work", frame: Math.floor(time / 160) % 2, bob: 0 };
  if (cat.moving) {
    const frame = Math.floor(cat.walkPx / 4) % 4;
    return { pose: "walk", frame, bob: [0, -1, 0, 1][frame] };
  }
  if (cat.pose === "sit") return { pose: "sit", frame: 0, bob: 0 };
  const blink = Math.floor(time / 420) % 10 === 9;
  return { pose: "idle", frame: blink ? 1 : 0, bob: Math.floor(time / 500) % 2 === 0 ? 0 : -1 };
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "rgba(48, 36, 24, 0.28)";
  ctx.fillRect(x - 5, y - 1, 10, 2);
  ctx.fillRect(x - 3, y - 2, 6, 1);
  ctx.fillRect(x - 3, y, 6, 1);
}

function drawProp(ctx: CanvasRenderingContext2D, prop: Prop) {
  if (prop.kind === "desk") {
    const x = prop.x;
    const y = prop.y;
    ctx.fillStyle = "#6b442c";
    ctx.fillRect(x, y + 4, prop.w, prop.h - 4);
    ctx.fillStyle = "#d7ae72";
    ctx.fillRect(x + 2, y + 2, prop.w - 4, prop.h - 8);
    ctx.fillStyle = "#8d5a32";
    ctx.fillRect(x + 1, y + prop.h - 4, prop.w - 2, 3);
    ctx.fillStyle = "#3e4852";
    ctx.fillRect(x + 6, y + 6, 16, 12);
    ctx.fillStyle = "#d7ebe3";
    ctx.fillRect(x + 7, y + 7, 14, 6);
    ctx.fillStyle = "#9fd0c2";
    ctx.fillRect(x + 8, y + 8, 12, 4);
    ctx.fillStyle = "#2c343c";
    ctx.fillRect(x + 7, y + 14, 14, 3);
    ctx.fillStyle = "#f4f7f8";
    ctx.fillRect(x + 30, y + 8, 8, 7);
    ctx.fillStyle = "#8eb7d6";
    ctx.fillRect(x + 31, y + 9, 6, 3);
    ctx.fillStyle = "#f4f7f8";
    ctx.fillRect(x + 38, y + 10, 2, 3);
    ctx.fillStyle = "#fff8ee";
    ctx.fillRect(x + 20, y + 16, 10, 7);
    ctx.fillStyle = "#d9c4a6";
    ctx.fillRect(x + 21, y + 18, 7, 1);
    ctx.fillRect(x + 21, y + 20, 5, 1);
    return;
  }
  if (prop.kind === "plant") {
    const x = prop.x;
    const y = prop.y;
    const leaf = ["#2f7a3c", "#3e8f48", "#67b15a"][prop.variant % 3];
    ctx.fillStyle = leaf;
    ctx.fillRect(x + 5, y - 4, 6, 6);
    ctx.fillRect(x + 2, y, 5, 5);
    ctx.fillRect(x + 9, y - 1, 5, 5);
    ctx.fillRect(x + 6, y + 2, 5, 5);
    ctx.fillStyle = prop.variant % 2 === 0 ? "#f2d35a" : "#e07a9a";
    ctx.fillRect(x + 7, y - 2, 2, 2);
    ctx.fillStyle = "#b8643f";
    ctx.fillRect(x + 3, y + 8, 10, 7);
    ctx.fillStyle = "#e0986c";
    ctx.fillRect(x + 3, y + 8, 10, 2);
    ctx.fillStyle = "#8a4630";
    ctx.fillRect(x + 3, y + 14, 10, 2);
    ctx.fillStyle = "#3d6b34";
    ctx.fillRect(x + 5, y + 6, 6, 3);
    return;
  }
  ctx.fillStyle = "#c46b84";
  ctx.fillRect(prop.x, prop.y, 14, 10);
  ctx.fillStyle = "#f3c0ce";
  ctx.fillRect(prop.x + 1, prop.y + 1, 12, 8);
  ctx.fillStyle = "#c46b84";
  ctx.fillRect(prop.x + 6, prop.y + 2, 1, 6);
  ctx.fillStyle = "#fff4f7";
  ctx.fillRect(prop.x + 2, prop.y + 2, 3, 2);
}

function drawThought(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const dot = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = "#3a2a22";
    ctx.fillRect(cx - r - 1, cy - r - 1, r * 2 + 3, r * 2 + 3);
    ctx.fillStyle = "#fffaf3";
    ctx.fillRect(cx - r, cy - r, r * 2 + 1, r * 2 + 1);
  };
  dot(x + 8, y - 2, 1);
  dot(x + 12, y - 6, 1);
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(x + 12, y - 16, 14, 9);
  ctx.fillStyle = "#fffaf3";
  ctx.fillRect(x + 13, y - 15, 12, 7);
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(x + 15, y - 12, 1, 1);
  ctx.fillRect(x + 18, y - 12, 1, 1);
  if (frame % 2 === 0) ctx.fillRect(x + 21, y - 12, 1, 1);
}

function drawZzz(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const base = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const phase = (time / 18 + i * 9) % 26;
    const size = i === 1 ? 5 : 3;
    ctx.globalAlpha = base * (1 - phase / 30);
    ctx.fillStyle = "#6f8fbf";
    const zx = x + 8 + i * 4;
    const zy = y - phase;
    ctx.fillRect(zx, zy, size, 1);
    ctx.fillRect(zx + size - 2, zy + 1, 1, 1);
    ctx.fillRect(zx + 1, zy + 2, 1, 1);
    ctx.fillRect(zx, zy + 3, size, 1);
  }
  ctx.globalAlpha = base;
}

function drawCat(ctx: CanvasRenderingContext2D, cat: DrawCat, time: number) {
  const anim = animOf(cat, time);
  const pose = spriteFor(cat, anim.pose, anim.frame);
  ctx.save();
  ctx.globalAlpha = cat.opacity;
  drawShadow(ctx, Math.round(cat.rx), Math.round(cat.ry));
  const left = Math.round(cat.rx - CAT_ANCHOR_X);
  const top = Math.round(cat.ry - CAT_ANCHOR_Y + anim.bob);
  ctx.drawImage(pose, left, top);
  if (cat.selected || cat.hovered) {
    ctx.fillStyle = cat.selected ? "#fffaf3" : cat.color;
    ctx.fillRect(left + 1, top + 1, CAT_W - 2, 1);
    ctx.fillRect(left + 1, top + CAT_H - 4, CAT_W - 2, 1);
    ctx.fillRect(left + 1, top + 1, 1, CAT_H - 4);
    ctx.fillRect(left + CAT_W - 2, top + 1, 1, CAT_H - 4);
  }
  if (cat.state === "working" && !cat.talking) drawThought(ctx, Math.round(cat.rx), top, anim.frame);
  if (cat.state === "sleeping") drawZzz(ctx, Math.round(cat.rx), top, time);
  ctx.globalAlpha = cat.opacity * cat.tagAlpha;
  drawNameTag(ctx, cat.name, cat.rx, top, cat.color);
  ctx.restore();
}

export function drawWorld(ctx: CanvasRenderingContext2D, cats: DrawCat[], time: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  ctx.drawImage(floorCanvas(), 0, 0);
  const items: { sortY: number; draw: () => void }[] = getProps().map((prop) => ({
    sortY: prop.sortY,
    draw: () => drawProp(ctx, prop),
  }));
  for (const cat of cats) {
    items.push({ sortY: cat.ry, draw: () => drawCat(ctx, cat, time) });
  }
  items.sort((a, b) => a.sortY - b.sortY);
  for (const item of items) item.draw();
}

export function catHit(cat: { rx: number; ry: number }, x: number, y: number): boolean {
  return x >= cat.rx - 12 && x <= cat.rx + 12 && y >= cat.ry - CAT_ANCHOR_Y && y <= cat.ry + 2;
}
