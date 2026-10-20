/**
 * Every timing, physics and layout constant of the home hero, in one place so the lead can tune
 * the piece (the storyboard in docs/design/giftpop-DESIGN.md is a DRAFT) without touching logic.
 * Times are seconds, angles are degrees here and converted by the timeline. Lengths in the 3D
 * tables are world units (1 unit = 100 poster pixels, y up). The poster uses poster pixels, y down.
 */

/** The poster's SVG viewBox, in poster pixels. The canvas camera frames exactly this area. */
export const POSTER_VIEWBOX = { x: 46, y: 0, w: 668, h: 650 } as const;
/** Poster pixel that is world (0, 0). */
export const POSTER_ORIGIN = { x: 380, y: 325 } as const;
export const POSTER_UNITS_PER_WORLD_UNIT = 100;

export const DROP = {
  /** Height of the box base above its resting place at t = 0. Above the top of the frame. */
  height: 6.4,
  gravity: 34,
  /** Fraction of impact speed kept after impact 1 and impact 2. Impact 3 only settles. */
  restitution: [0.45, 0.3],
  /** Squash on Y at each of the three impacts, and how long it lasts. */
  /**
   * Squash on Y at each of the three impacts, and how long it lasts. Chosen so the top of the box
   * keeps roughly the speed it arrived with (amount x height x pi / duration ~ impact speed), so
   * the impact reads as a soft squash rather than a hard stop.
   */
  squash: [
    { amount: 0.14, duration: 0.062 },
    { amount: 0.07, duration: 0.06 },
    { amount: 0.03, duration: 0.07 },
  ],
  /** Stretch while moving fast in the air. */
  airStretch: 0.04,
  /** Tilt in degrees when released, easing to flat on first impact. */
  fallTiltDeg: 3,
  /** Tilt in degrees during the two bounce arcs (first, second). */
  bounceTiltDeg: [-1.2, 0.7],
  /** Settle wobble after the last impact. */
  wobble: { amplitudeDeg: 1.5, frequencyHz: 5, decay: 0.12, duration: 0.5 },
  /** The lid chatters on the box while it bounces. */
  lidChatter: { amplitudeDeg: 2, frequencyHz: 9, hop: 0.05 },
} as const;

export const RIBBON = { start: 1.55, end: 1.9, swayAmount: 0.12 } as const;
export const LID = { start: 1.9, end: 2.5, arcHeight: 0.25 } as const;
export const BURST = { start: 2.1, stagger: 0.06, flight: 0.62, popFraction: 0.45 } as const;
export const SPARKLE = { start: 2.25, stagger: 0.09, pop: 0.4 } as const;
/** Everything has landed by `rampStart`; the idle motion fades in until `rampEnd`. */
export const IDLE = {
  rampStart: 3.2,
  rampEnd: 3.8,
  floatPeriod: 6,
  floatAmplitude: 0.08,
  floatTiltDeg: 1.2,
  cameraPeriod: 14,
  cameraDriftDeg: 1.5,
} as const;
/**
 * The page paints the headline and an empty stage; the scene starts this long after the window
 * `load` event, at the next idle moment (at most `START_IDLE_TIMEOUT_MS` later), so the drop is the
 * first thing the visitor sees, about a second after load.
 */
export const START_AFTER_LOAD_MS = 0;
export const START_IDLE_TIMEOUT_MS = 400;
/**
 * If the scene has not drawn its first frame this long after it was armed (slow network or a
 * very slow device), the stage shows the static composition instead and the scene is dropped.
 */
export const STATIC_FALLBACK_MS = 6000;
/**
 * The clock starts this long before the box first shows at the top of the frame, so the
 * stage never sits empty while the box falls through the space above it.
 */
export const DROP_ENTRY_LEAD = 0.06;
/** Height of the closed box's highest point (bow top) above the base, world units. */
export const CLOSED_BOX_REACH = 3.55;
/** Once everything has settled the idle float only needs a gentle frame rate (saves battery on phones). */
export const IDLE_RENDER = { afterSeconds: IDLE.rampEnd + 0.4, fps: 30 } as const;
/** Hard budget from the brief: the resting state is reached before this. */
export const REST_BUDGET_SECONDS = 4;

export const CAMERA = { fov: 32, azimuthDeg: 6, elevationDeg: 11 } as const;

/** Dimensions of the 3D box in world units. Match the poster's SVG rectangles. */
export const BOX = {
  width: 3.36,
  height: 2.36,
  depth: 2.2,
  wall: 0.1,
  /** Radius of the box's vertical corners and of the bevel on every edge. */
  corner: 0.07,
  bevel: 0.025,
  floorY: -2.83,
  /** The box sits with its front face on the z = 0 plane, where the poster layout is exact. */
  frontZ: 0,
} as const;

/** World z of the box group origin (the middle of the box), so its front face is at `frontZ`. */
export const BOX_Z = BOX.frontZ - BOX.depth / 2;

export const LID_SIZE = { width: 2.8, height: 0.7, depth: 1.6 } as const;
/**
 * A closed lid must cover the box (wider and deeper than the rim); the poster's lid is smaller, so
 * the lid body is stretched while closed and eases to its poster size as it lifts.
 */
export const LID_CLOSED_SCALE = { x: 1.27, z: 1.5 } as const;
/** How far the closed lid's skirt comes down over the box walls. */
export const LID_SKIRT = 0.26;
/** Lid centre in box-local coordinates (origin at the middle of the box base). */
export const LID_CLOSED = {
  x: 0,
  y: BOX.height + LID_SIZE.height / 2 - LID_SKIRT,
  z: 0,
  rotDeg: 0,
} as const;
/** Lid in the poster: centre (330, 155), rotated 9 degrees counter-clockwise on screen. */
export const LID_REST = { x: -0.5, y: 1.7 - BOX.floorY, z: BOX.depth / 2, rotDeg: 9 } as const;

export const RIBBON_BAND_WIDTH = 0.58;

/** Colours from the poster, fixed by the brand (black box, gold dots, hot pink ribbon). */
export const PALETTE = {
  body: "#2B1E33",
  bodyDark: "#120B17",
  bodyLight: "#4B3658",
  gold: "#E3B93C",
  ribbon: "#E8467C",
  ribbonDark: "#8A2A57",
  ribbonSheen: "#FFB3D1",
  tissue: "#FFB5D0",
  lavender: "#9468E8",
  blob: "#FFC2D8",
  shadow: "#2B1733",
} as const;

/** The gift tag tied to the left ribbon tail, poster pixels. */
export const GIFT_TAG = {
  x: 232,
  y: 548,
  rotDeg: -6,
  scale: 0.8,
  text: "For Sara",
  width: 150,
} as const;

export const POSTER_ALT =
  "A black gift box with gold dots and a pink ribbon. Its lid has lifted off and gifts float out around it, including a teddy bear, a balloon, a mug and a chocolate bar.";
