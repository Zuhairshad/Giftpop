import { BOX, BOX_Z, BURST, IDLE, SPARKLE } from "./constants";
import { clamp01, easeOutBack, easeOutCubic, lerp } from "./easing";
import { degToRad, posterToWorld } from "./layout";
import { SPARKLES, SPRITES } from "./sprites";
import type { SparkleDef, SpriteDef } from "./sprites";

export interface SpriteState {
  /** World units, y up. */
  x: number;
  y: number;
  z: number;
  /** Radians, positive is counter-clockwise on screen. */
  rotZ: number;
  /** 0 while hidden inside the box. */
  scale: number;
}

export interface SparkleState {
  x: number;
  y: number;
  scale: number;
  rotZ: number;
}

/** Where a sprite rests: the poster layout, in world units. */
export function spriteRest(def: SpriteDef): SpriteState {
  const p = posterToWorld(def.x, def.y);
  return { x: p.x, y: p.y, z: def.z, rotZ: -degToRad(def.rotDeg), scale: 1 };
}

/** Where a sprite starts: tucked inside the box, a little spread so the burst has a fan. */
function spriteStart(def: SpriteDef): { x: number; y: number } {
  const mouthY = BOX.floorY + BOX.height;
  return {
    x: (def.burst - (SPRITES.length - 1) / 2) * 0.12,
    y: mouthY - (def.inBox ? 1.1 : 0.7),
  };
}

export function spriteStartTime(def: SpriteDef): number {
  return BURST.start + def.burst * BURST.stagger;
}

export const SPRITES_LANDED_AT = Math.max(...SPRITES.map((d) => spriteStartTime(d) + BURST.flight));

/** A ballistic hop out of the box that eases into the floating spot, then the idle float. */
export function spriteAt(def: SpriteDef, t: number, idle: number): SpriteState {
  const rest = spriteRest(def);
  const start = spriteStartTime(def);
  const u = clamp01((t - start) / BURST.flight);
  const from = spriteStart(def);
  const p = easeOutCubic(u);
  const wave = Math.sin(2 * Math.PI * (t / IDLE.floatPeriod + def.phase));
  return {
    x: lerp(from.x, rest.x, p),
    y:
      lerp(from.y, rest.y, p) + def.arc * Math.sin(Math.PI * p) + idle * IDLE.floatAmplitude * wave,
    z: lerp(BOX_Z, rest.z, p),
    rotZ:
      rest.rotZ +
      degToRad(def.spinDeg) * (1 - p) * (1 - p) +
      idle *
        degToRad(IDLE.floatTiltDeg) *
        Math.sin(2 * Math.PI * (t / IDLE.floatPeriod + def.phase) + 1),
    scale: t < start ? 0 : easeOutBack(u / BURST.popFraction),
  };
}

export function sparkleStartTime(index: number): number {
  return SPARKLE.start + index * SPARKLE.stagger;
}

export const SPARKLES_DONE_AT = sparkleStartTime(SPARKLES.length - 1) + SPARKLE.pop;

export function sparkleRest(def: SparkleDef): { x: number; y: number } {
  return posterToWorld(def.x, def.y);
}

/** Sparkles pop with the burst, then twinkle. */
export function sparkleAt(def: SparkleDef, index: number, t: number, idle: number): SparkleState {
  const u = clamp01((t - sparkleStartTime(index)) / SPARKLE.pop);
  const p = sparkleRest(def);
  const twinkle = Math.sin((2 * Math.PI * t) / (2.4 + index * 0.3) + index);
  return {
    x: p.x,
    y: p.y,
    scale: easeOutBack(u) * (1 + idle * 0.2 * twinkle),
    rotZ: (1 - u) * 1.2 + idle * 0.15 * twinkle,
  };
}
