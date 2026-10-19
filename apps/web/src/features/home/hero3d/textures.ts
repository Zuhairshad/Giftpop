import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
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
  ctx.drawImage(image, 0, 0, spec.width, spec.height);
  if (spec.labels?.length) {
    const k = spec.width / spec.box.w;
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

export function dotsTexture(): CanvasTexture {
  const px = 176;
  const canvas = makeCanvas(px, px);
  const ctx = context2d(canvas);
  ctx.fillStyle = PALETTE.body;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = PALETTE.gold;
  ctx.globalAlpha = 0.55;
  const k = px / 44;
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      for (const [dx, dy] of DOT_OFFSETS) {
        ctx.beginPath();
        ctx.arc((22 * i + dx) * k, (22 * j + dy) * k, 1.7 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = toTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
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
  const px = 64;
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
