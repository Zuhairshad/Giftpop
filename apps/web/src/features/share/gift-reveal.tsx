"use client";

import { useState } from "react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui";

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

/** A circular arrow: "play it again". Decorative, the button label says what it does. */
function ReplayIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 10a5.5 5.5 0 1 0 1.7-4" />
      <path d="M4.5 3.5v3h3" />
    </svg>
  );
}

/** Animates the gift in, then the details. Under `prefers-reduced-motion` nothing moves. */
export function GiftReveal({ scene, details }: GiftRevealProps): ReactElement {
  const [run, setRun] = useState(0);

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
      <style>{REVEAL_CSS}</style>
      <div className="flex flex-col items-center gap-3">
        {/* The key remounts the drawing and the details, which restarts both animations. */}
        <div
          key={`scene-${run}`}
          className="gp-reveal-scene relative isolate mx-auto w-[min(100%,30rem,60dvh)] md:w-[min(100%,32rem)]"
        >
          <span
            aria-hidden="true"
            className="bg-pink-soft absolute inset-[4%] -z-10 rounded-full"
          />
          {scene}
        </div>
        {/* Outside the keyed blocks, so focus stays on the button after a replay. */}
        <Button
          variant="ghost"
          size="sm"
          className="gp-reveal-details shadow-hairline motion-reduce:hidden"
          onClick={() => setRun((n) => n + 1)}
        >
          <ReplayIcon />
          Watch the reveal again
        </Button>
      </div>
      <div key={`details-${run}`} className="gp-reveal-details min-w-0">
        {details}
      </div>
    </div>
  );
}
