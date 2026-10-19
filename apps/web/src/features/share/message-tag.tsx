import type { ReactElement } from "react";

/*
 * The tag is a card with its two left corners cut off, like a shop tag. `clip-path` would also cut a
 * box-shadow, so the lift is a drop-shadow on the wrapper, which follows the cut edge (and the twine).
 * Dark mode swaps the lift for a hairline, as the design system does for every shadow.
 */
const TAG_CSS = `
.gp-tag-card {
  clip-path: polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px), 0 18px);
}
.gp-tag-lift {
  filter:
    drop-shadow(0 1px 1px color-mix(in srgb, var(--gp-ink) 6%, transparent))
    drop-shadow(0 6px 14px color-mix(in srgb, var(--gp-ink) 8%, transparent));
}
@media (prefers-color-scheme: dark) {
  .gp-tag-lift { filter: drop-shadow(0 0 1px var(--gp-border-strong)); }
}
`;

/* Illustration recipe: fill, outline darkened 38%, a light stripe for the twist of the fibres. */
const TWINE = "var(--gp-kraft)";
const TWINE_OUTLINE = "color-mix(in srgb, var(--gp-kraft), black 38%)";
const TWINE_STRIPE = "color-mix(in srgb, var(--gp-kraft), white 55%)";

/*
 * Drawn in a 64x80 box that starts 14px left of the tag, so the hole sits at x 40 (26px into the
 * tag) and the cut tip of the tag at x 14. The strand comes out of the hole, runs over the tip, and
 * two loose ends hang outside the tag.
 */
const STRANDS = [
  "M40 40 C33 38.5 22 38 14 39.5",
  "M14 39.5 C7 40.5 2.5 46 4 54 C5.5 61 3 67 0.5 73",
  "M14 40.5 C9.5 46 10.5 53 15 59 C18.5 64 18.5 70 16 76",
];

function TagHoleAndTwine(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 80"
      className="pointer-events-none absolute top-1/2 -left-3.5 h-20 w-16 -translate-y-1/2 overflow-visible"
    >
      {/* Reinforcement ring around the punched hole. */}
      <circle
        cx="40"
        cy="40"
        r="10"
        strokeWidth="1.2"
        style={{ fill: "var(--gp-surface-deep)", stroke: "var(--gp-border-strong)" }}
      />
      {/* The hole shows the page behind the tag. */}
      <circle
        cx="40"
        cy="40"
        r="5"
        strokeWidth="1.2"
        style={{ fill: "var(--gp-bg)", stroke: "var(--gp-border-strong)" }}
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {STRANDS.map((d) => (
          <path key={`o-${d}`} d={d} strokeWidth="4.5" style={{ stroke: TWINE_OUTLINE }} />
        ))}
        {STRANDS.map((d) => (
          <path key={`f-${d}`} d={d} strokeWidth="2.5" style={{ stroke: TWINE }} />
        ))}
        {STRANDS.map((d) => (
          <path
            key={`s-${d}`}
            d={d}
            strokeWidth="1"
            strokeDasharray="1.5 2.5"
            style={{ stroke: TWINE_STRIPE, opacity: 0.55 }}
          />
        ))}
      </g>
    </svg>
  );
}

/** The recipient's card message as a handwritten gift tag. Customer text, so it wraps anywhere. */
export function MessageTag({ message }: { message: string }): ReactElement {
  return (
    <figure className="gp-tag-lift relative ml-3.5 max-w-md min-w-0 -rotate-1 motion-reduce:rotate-0">
      <style>{TAG_CSS}</style>
      <figcaption className="sr-only">Card message</figcaption>
      <div className="gp-tag-card bg-surface rounded-xs py-5 pr-5 pl-12">
        <blockquote className="font-script text-foreground text-3xl leading-snug font-bold wrap-anywhere whitespace-pre-line">
          {message}
        </blockquote>
      </div>
      <TagHoleAndTwine />
    </figure>
  );
}
