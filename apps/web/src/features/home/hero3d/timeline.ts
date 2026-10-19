import {
  CAMERA,
  DROP,
  IDLE,
  LID,
  LID_CLOSED,
  LID_CLOSED_SCALE,
  LID_REST,
  RIBBON,
} from "./constants";
import { boxMotionAt, CONTACTS, LAST_CONTACT, WOBBLE_END } from "./drop-physics";
import { clamp01, easeInOutCubic, easeOutBack, easeOutCubic, lerp, smoothstep } from "./easing";
import { degToRad } from "./layout";
import { SPARKLES_DONE_AT, SPRITES_LANDED_AT, sparkleAt, spriteAt } from "./sprite-timeline";
import type { SparkleState, SpriteState } from "./sprite-timeline";
import { SPARKLES, SPRITES } from "./sprites";

export interface BoxState {
  /** Height of the base above its resting place. */
  y: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotZ: number;
}

export interface LidState {
  /** Box-local, origin at the middle of the box base. */
  x: number;
  y: number;
  z: number;
  rotZ: number;
  /** Stretch of the lid body: wider and deeper while closed so it covers the box. */
  scaleX: number;
  scaleZ: number;
}

export interface HeroState {
  time: number;
  box: BoxState;
  lid: LidState;
  /** `tail` 0 = rolled up behind the band, 1 = unrolled down the front. `sway` is a sideways wobble. */
  ribbon: { tail: number; sway: number };
  /** Multipliers for the floor shadow and the dust ring (opacity is relative to the scene's base). */
  shadow: { scale: number; opacity: number };
  ring: { scale: number; opacity: number };
  sprites: SpriteState[];
  sparkles: SparkleState[];
  /** Radians. */
  camera: { azimuth: number; elevation: number };
  /** 0 until the idle float begins, 1 when fully idle. */
  idle: number;
}

/** Time when every non-idle motion has stopped. Must stay under `REST_BUDGET_SECONDS`. */
export const SETTLED_AT = Math.max(
  WOBBLE_END,
  LID.end,
  RIBBON.end,
  SPRITES_LANDED_AT,
  SPARKLES_DONE_AT,
);

export interface HeroStateOptions {
  /** Set false to get the pure resting pose with no idle float or camera drift. */
  idle?: boolean;
}

const RING_STRENGTH = [0.35, 0.18, 0.08];
const RING_DURATION = 0.5;

function lidAt(t: number, box: ReturnType<typeof boxMotionAt>, idle: number): LidState {
  const p = clamp01((t - LID.start) / (LID.end - LID.start));
  const e = easeInOutCubic(p);
  const { lidChatter } = DROP;
  const air = box.flight >= 0 ? Math.sin(Math.PI * box.flight) : 0;
  const chatter =
    air > 0 ? Math.sin(2 * Math.PI * lidChatter.frequencyHz * box.flight * 0.5) * air : 0;
  const wave = Math.sin((2 * Math.PI * t) / IDLE.floatPeriod + 2);
  return {
    x: lerp(LID_CLOSED.x, LID_REST.x, e),
    y:
      lerp(LID_CLOSED.y, LID_REST.y, e) +
      LID.arcHeight * Math.sin(Math.PI * p) +
      lidChatter.hop * air +
      idle * IDLE.floatAmplitude * 0.8 * wave,
    z: lerp(LID_CLOSED.z, LID_REST.z, e),
    scaleX: lerp(LID_CLOSED_SCALE.x, 1, e),
    scaleZ: lerp(LID_CLOSED_SCALE.z, 1, e),
    rotZ:
      lerp(degToRad(LID_CLOSED.rotDeg), degToRad(LID_REST.rotDeg), e) +
      degToRad(lidChatter.amplitudeDeg) * chatter +
      idle * degToRad(IDLE.floatTiltDeg) * Math.sin((2 * Math.PI * t) / IDLE.floatPeriod + 3),
  };
}

function ringAt(t: number): { scale: number; opacity: number } {
  for (const [k, c] of CONTACTS.entries()) {
    const dt = t - c.start;
    if (dt >= 0 && dt < RING_DURATION) {
      const u = dt / RING_DURATION;
      return {
        scale: 0.8 + 1.4 * easeOutCubic(u),
        opacity: (RING_STRENGTH[k] ?? 0) * (1 - u) * (1 - u),
      };
    }
  }
  return { scale: 1, opacity: 0 };
}

/**
 * The whole hero at time `t` (seconds): a pure function of time, so tests, the poster and the
 * canvas agree. Rest pose (idle off, `t >= SETTLED_AT`) is the poster layout.
 */
export function heroStateAt(time: number, options: HeroStateOptions = {}): HeroState {
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  const idle = options.idle === false ? 0 : smoothstep(IDLE.rampStart, IDLE.rampEnd, t);
  const m = boxMotionAt(t);
  const squashAmount = m.squash;
  const ribbonP = clamp01((t - RIBBON.start) / (RIBBON.end - RIBBON.start));
  const drift = Math.sin((2 * Math.PI * t) / IDLE.cameraPeriod);
  return {
    time: t,
    box: {
      y: m.y,
      scaleX: 1 + squashAmount * 0.5 - m.stretch * 0.4,
      scaleY: 1 - squashAmount + m.stretch,
      scaleZ: 1 + squashAmount * 0.5 - m.stretch * 0.4,
      rotZ: m.rotZ,
    },
    lid: lidAt(t, m, idle),
    ribbon: {
      tail: easeOutBack(ribbonP, 1),
      sway: RIBBON.swayAmount * Math.sin(2 * Math.PI * ribbonP) * (1 - ribbonP),
    },
    shadow: { scale: (1 + squashAmount * 0.8) / (1 + m.y * 0.12), opacity: 1 / (1 + m.y * 0.9) },
    ring: ringAt(t),
    sprites: SPRITES.map((def) => spriteAt(def, t, idle)),
    sparkles: SPARKLES.map((def, i) => sparkleAt(def, i, t, idle)),
    camera: {
      azimuth: degToRad(CAMERA.azimuthDeg) + idle * degToRad(IDLE.cameraDriftDeg) * drift,
      elevation:
        degToRad(CAMERA.elevationDeg) +
        idle * degToRad(IDLE.cameraDriftDeg * 0.4) * Math.cos(drift),
    },
    idle,
  };
}

/** The settled pose: what the poster shows. */
export function restState(): HeroState {
  return heroStateAt(SETTLED_AT + 1, { idle: false });
}

export { CONTACTS, LAST_CONTACT };
