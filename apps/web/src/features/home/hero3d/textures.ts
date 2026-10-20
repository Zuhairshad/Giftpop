import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

import { PALETTE } from "./constants";
import { STAR_PATH } from "./decor";

export interface Label {
  text: string;
  x: number;
  y: number;
  size: number;
}

export interface SvgTextureSpec {
  /** Complete `<svg ...>` markup with a viewBox but no namespace requirement. */
  svg: string;
  /** The viewBox rectangle, used to place text labels. */
  box: { x: number; y: number; w: number; h: number };
  /** Output size in pixels. */
  width: number;
  height: number;
  labels?: readonly Label[];
  labelColor?: string;
  fontFamily?: string;
  /** Adds a soft contact shadow under the art (poster pixels of blur), so flat art reads as an object. */
  shadowBlur?: number;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return ctx;
}

export function toTexture(
  canvas: HTMLCanvasElement,
  mipmaps = true,
  premultiply = false,
): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.premultiplyAlpha = premultiply;
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = mipmaps;
  texture.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
  texture.anisotropy = 4;
  return texture;
}

/** Resolves the page's script font (next/font gives it a hashed family name) for canvas text. */
export async function resolveFontFamily(cssFontFamily: string): Promise<string> {
  const probe = document.createElement("span");
  probe.style.fontFamily = cssFontFamily;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily;
  probe.remove();
  try {
    await Promise.race([
      document.fonts.load(`700 32px ${family}`),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  } catch {
    // The fallback script face is fine.
  }
  return family;
}

/** Draws an SVG string to a canvas, then any text labels with the page font. */
export async function svgToTexture(spec: SvgTextureSpec): Promise<CanvasTexture> {
  const image = new Image();
  image.decoding = "async";
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spec.svg)}`;
  await image.decode();
  const canvas = makeCanvas(spec.width, spec.height);
  const ctx = context2d(canvas);
  const k = spec.width / spec.box.w;
  if (spec.shadowBlur) {
    ctx.shadowColor = "rgba(43, 23, 51, 0.32)";
    ctx.shadowBlur = spec.shadowBlur * k;
    ctx.shadowOffsetY = spec.shadowBlur * 0.45 * k;
  }
  ctx.drawImage(image, 0, 0, spec.width, spec.height);
  ctx.shadowColor = "transparent";
  if (spec.labels?.length) {
    ctx.fillStyle = spec.labelColor ?? "#000";
    ctx.textAlign = "center";
    for (const label of spec.labels) {
      ctx.font = `700 ${label.size * k}px ${spec.fontFamily ?? "cursive"}`;
      ctx.fillText(label.text, (label.x - spec.box.x) * k, (label.y - spec.box.y) * k);
    }
  }
  return toTexture(canvas, true, true);
}

/** The gold dot pattern of the box: a 2 x 2 block of the poster's 22 px tiles. */
export const DOTS_TILE_WORLD = 0.44;

const DOT_OFFSETS: readonly (readonly [number, number])[] = [
  [5, 5],
  [16, 16],
];

/** Small deterministic PRNG (mulberry32), so the paper grain is the same on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Speckle and short fibres of uncoated card, drawn over whatever the canvas holds. */
function paperGrain(ctx: CanvasRenderingContext2D, px: number, strength: number, seed: number) {
  const random = seededRandom(seed);
  const image = ctx.getImageData(0, 0, px, px);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (random() - 0.5) * 2 * strength;
    data[i] = Math.max(0, Math.min(255, (data[i] ?? 0) + n));
    data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] ?? 0) + n));
    data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] ?? 0) + n));
  }
  ctx.putImageData(image, 0, 0);
  ctx.lineCap = "round";
  for (let i = 0; i < px / 6; i += 1) {
    const x = random() * px;
    const y = random() * px;
    const a = random() * Math.PI;
    const len = 2 + random() * 6;
    ctx.strokeStyle = random() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}

function repeating(texture: CanvasTexture): CanvasTexture {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** The box paper: matte black card with a fine grain and the gold dot print. Tiles every 0.44 units. */
export function dotsTexture(): CanvasTexture {
  const px = 256;
  const canvas = makeCanvas(px, px);
  const ctx = context2d(canvas);
  ctx.fillStyle = PALETTE.body;
  ctx.fillRect(0, 0, px, px);
  paperGrain(ctx, px, 7, 11);
  const k = px / 44;
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      for (const [dx, dy] of DOT_OFFSETS) {
        const cx = (22 * i + dx) * k;
        const cy = (22 * j + dy) * k;
        // Foil-printed dot: gold with a lighter upper-left catch light.
        const g = ctx.createRadialGradient(cx - 0.5 * k, cy - 0.6 * k, 0, cx, cy, 1.8 * k);
        g.addColorStop(0, "#F7DE8A");
        g.addColorStop(0.55, PALETTE.gold);
        g.addColorStop(1, "#9A7418");
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.7 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  return repeating(toTexture(canvas));
}

/** Grey grain for the paper's bump map: same tile as `dotsTexture`, the dots slightly raised. */
export function paperBumpTexture(): CanvasTexture {
  const px = 128;
  const canvas = makeCanvas(px, px);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, px, px);
  paperGrain(ctx, px, 40, 29);
  const k = px / 44;
  ctx.fillStyle = "#B0B0B0";
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      for (const [dx, dy] of DOT_OFFSETS) {
        ctx.beginPath();
        ctx.arc((22 * i + dx) * k, (22 * j + dy) * k, 1.7 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = repeating(toTexture(canvas));
  texture.colorSpace = NoColorSpace;
  return texture;
}

/** A soft round fade, white in the middle and transparent at the edge. Tinted by the material. */
export function radialTexture(): CanvasTexture {
  const px = 128;
  const canvas = makeCanvas(px, px);
  const ctx = context2d(canvas);
  const gradient = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, px, px);
  return toTexture(canvas, false);
}

/** A four-point sparkle filling the texture, or a round dot. */
export function sparkleTexture(kind: "star" | "dot", color: string): CanvasTexture {
  const px = 128;
  const canvas = makeCanvas(px, px);
  const ctx = context2d(canvas);
  ctx.fillStyle = color;
  if (kind === "star") {
    ctx.translate(px / 2, px / 2);
    ctx.scale(px / 24, px / 24);
    ctx.fill(new Path2D(STAR_PATH));
  } else {
    ctx.beginPath();
    ctx.arc(px / 2, px / 2, px / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas, true, true);
}
