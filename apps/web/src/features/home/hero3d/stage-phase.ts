/**
 * What the hero stage shows:
 * - `pending`: first paint. The headline and an empty stage (backdrop, floor shadow); with
 *   reduced motion, CSS shows the static composition straight away.
 * - `loading`: the 3D scene is building, invisible, over the empty stage.
 * - `live`: the scene has drawn its first frame and plays the drop.
 * - `static`: the SVG composition, still. Reduced motion, no (hardware) WebGL, an error, a lost
 *   context, or a scene that took too long to start.
 */
export type StagePhase = "pending" | "loading" | "live" | "static";

export type StageEvent =
  | { type: "reduced-motion"; reduced: boolean }
  | { type: "no-webgl" }
  | { type: "arm" }
  | { type: "first-frame" }
  | { type: "fail" }
  | { type: "timeout" };

export function nextStagePhase(phase: StagePhase, event: StageEvent): StagePhase {
  switch (event.type) {
    case "reduced-motion":
      return event.reduced ? "static" : phase;
    case "no-webgl":
    case "fail":
      return "static";
    case "arm":
      return phase === "pending" ? "loading" : phase;
    case "first-frame":
      return phase === "loading" ? "live" : phase;
    case "timeout":
      return phase === "loading" ? "static" : phase;
  }
}

/** How the SVG composition's foreground is shown for a phase. `auto` = only for reduced motion. */
export function posterForeground(phase: StagePhase): "show" | "hide" | "auto" {
  if (phase === "static") return "show";
  if (phase === "pending") return "auto";
  return "hide";
}
