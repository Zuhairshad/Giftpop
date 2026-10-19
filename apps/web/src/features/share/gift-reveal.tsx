"use client";

import { useState } from "react";
import type { ReactElement, ReactNode } from "react";

/*
 * Every rule sits inside `no-preference`, so a visitor who asks for less motion gets no animation
 * at all. `backwards` fill only hides things before they start, so nothing can stay invisible.
 */
const REVEAL_CSS = `
@keyframes gp-reveal-pop {
  0% { transform: scale(0.55) rotate(-8deg); opacity: 0; }
  60% { transform: scale(1.06) rotate(1.5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes gp-reveal-rise {
  from { transform: translateY(18px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: no-preference) {
  .gp-reveal-scene { animation: gp-reveal-pop 0.95s cubic-bezier(0.2, 0.9, 0.3, 1.1) backwards; }
  .gp-reveal-details { animation: gp-reveal-rise 0.7s ease-out 0.75s backwards; }
}
`;

type GiftRevealProps = {
  /** The gift drawing. */
  scene: ReactNode;
  /** Everything beside the gift: message, items, buttons. */
  details: ReactNode;
};

/** Animates the gift in, then the details. Under `prefers-reduced-motion` nothing moves. */
export function GiftReveal({ scene, details }: GiftRevealProps): ReactElement {
  const [run, setRun] = useState(0);

  return (
    <div>
      <style>{REVEAL_CSS}</style>
      {/* The key remounts the block, which restarts both animations. */}
      <div
        key={run}
        className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12"
      >
        <div className="gp-reveal-scene mx-auto w-[min(100%,30rem,60dvh)] md:w-[min(100%,32rem)]">
          {scene}
        </div>
        <div className="gp-reveal-details">{details}</div>
      </div>
      <div className="mt-6 text-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="text-muted hover:text-foreground text-sm font-semibold underline underline-offset-4"
        >
          Watch the reveal again
        </button>
      </div>
    </div>
  );
}
