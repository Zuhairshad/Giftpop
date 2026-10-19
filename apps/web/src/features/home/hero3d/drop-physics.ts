import { DROP } from "./constants";
import { clamp01 } from "./easing";
import { degToRad } from "./layout";

/** One ground contact: the box is squashed on the floor from `start` to `takeoff`. */
export interface Contact {
  start: number;
  takeoff: number;
  /** Downward speed on arrival and upward speed on leaving, world units per second. */
  inSpeed: number;
  outSpeed: number;
  /** Peak squash on Y while it is on the floor. */
  squash: number;
}

function buildContacts(): readonly Contact[] {
  const { height, gravity, restitution, squash } = DROP;
  const contacts: Contact[] = [];
  let start = Math.sqrt((2 * height) / gravity);
  let inSpeed = gravity * start;
  squash.forEach((hit, k) => {
    const takeoff = start + hit.duration;
    const outSpeed = inSpeed * (restitution[k] ?? 0);
    contacts.push({ start, takeoff, inSpeed, outSpeed, squash: hit.amount });
    start = takeoff + (2 * outSpeed) / gravity;
    inSpeed = outSpeed;
  });
  return contacts;
}

/** Three contacts: two rebounds, then the box settles on the third. */
export const CONTACTS: readonly Contact[] = buildContacts();

function pick(index: number): Contact {
  const contact = CONTACTS[index < 0 ? CONTACTS.length + index : index];
  if (!contact) throw new Error("DROP.squash must list at least one impact");
  return contact;
}

export const FIRST_CONTACT: Contact = pick(0);
export const LAST_CONTACT: Contact = pick(-1);
export const WOBBLE_END = LAST_CONTACT.takeoff + DROP.wobble.duration;

export interface BoxMotion {
  /** Height of the box base above its resting place, world units. */
  y: number;
  /** Squash amount, 0 at rest up to the impact's amount. */
  squash: number;
  /** Stretch from speed while airborne, 0 at rest. */
  stretch: number;
  /** Radians, positive is counter-clockwise on screen. */
  rotZ: number;
  /** 0..1 progress through the active bounce flight, or -1 when on the floor or falling. */
  flight: number;
  flightIndex: number;
}

interface Height {
  y: number;
  vy: number;
  flight: number;
  flightIndex: number;
}

function heightAt(t: number): Height {
  const { height, gravity } = DROP;
  if (t < FIRST_CONTACT.start) {
    return { y: height - 0.5 * gravity * t * t, vy: -gravity * t, flight: -1, flightIndex: -1 };
  }
  for (const [k, c] of CONTACTS.entries()) {
    if (t < c.takeoff) return { y: 0, vy: 0, flight: -1, flightIndex: k };
    const next = CONTACTS[k + 1];
    if (next && t < next.start) {
      const dt = t - c.takeoff;
      return {
        y: c.outSpeed * dt - 0.5 * gravity * dt * dt,
        vy: c.outSpeed - gravity * dt,
        flight: clamp01(dt / (next.start - c.takeoff)),
        flightIndex: k,
      };
    }
  }
  return { y: 0, vy: 0, flight: -1, flightIndex: -1 };
}

/** Everything about the box body at time `t`: gravity drop, two rebounds, squash, settle wobble. */
export function boxMotionAt(t: number): BoxMotion {
  const { fallTiltDeg, bounceTiltDeg, wobble, airStretch } = DROP;
  const fall = heightAt(t);
  let squash = 0;
  for (const c of CONTACTS) {
    if (t >= c.start && t < c.takeoff) {
      squash += c.squash * Math.sin((Math.PI * (t - c.start)) / (c.takeoff - c.start));
    }
  }
  let rotZ = 0;
  if (t < FIRST_CONTACT.start) {
    rotZ = degToRad(fallTiltDeg) * (1 - t / FIRST_CONTACT.start);
  } else if (fall.flight >= 0) {
    rotZ = degToRad(bounceTiltDeg[fall.flightIndex] ?? 0) * Math.sin(Math.PI * fall.flight);
  } else if (t >= LAST_CONTACT.takeoff && t < WOBBLE_END) {
    const dt = t - LAST_CONTACT.takeoff;
    rotZ =
      degToRad(wobble.amplitudeDeg) *
      Math.exp(-dt / wobble.decay) *
      Math.sin(2 * Math.PI * wobble.frequencyHz * dt);
  }
  const speed = Math.min(1, Math.abs(fall.vy) / FIRST_CONTACT.inSpeed);
  return {
    y: Math.max(0, fall.y),
    squash,
    stretch: fall.y > 0 ? airStretch * speed : 0,
    rotZ,
    flight: fall.flight,
    flightIndex: fall.flightIndex,
  };
}
