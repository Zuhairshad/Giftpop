import type { BuilderStep } from "../../state";

/**
 * STUB. `web-step-format-items` replaces this with the shared progress bar
 * (five steps, current step marked, back link). Every step renders it.
 */
export function StepProgress({ current }: { current: BuilderStep }) {
  return <p aria-label="Progress">Step: {current}</p>;
}
