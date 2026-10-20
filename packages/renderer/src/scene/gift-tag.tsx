import type { SceneBounds } from "../layouts";

/** Most characters the tag shows before it squeezes the name to fit. */
const ROOMY_CHARS = 8;

/**
 * A kraft-string gift tag reading "For <name>", hung at the lower right of the scene box so it
 * sits on the wrapper of any layout. Scene units; the name is the one the customer typed.
 */
export function SceneGiftTag({ name, bounds }: { name: string; bounds: SceneBounds }) {
  const x = bounds.x + bounds.width * 0.68;
  const y = bounds.y + bounds.height * 0.7;
  const text = `For ${name}`;
  const squeeze = Array.from(text).length > ROOMY_CHARS + 4;
  return (
    <g data-gift-tag="" transform={`translate(${x} ${y}) rotate(-8)`}>
      <path
        d="M-70 -18C-110 -40 -150 -30 -178 -60"
        fill="none"
        stroke="#a87d52"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M-70 -34H150a10 10 0 0 1 10 10V34a10 10 0 0 1-10 10H-70L-100 5Z"
        fill="#fffaf2"
        stroke="#8a6a48"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle cx="-76" cy="5" r="9" fill="#f6e4de" stroke="#8a6a48" strokeWidth="4" />
      <text
        x="35"
        y="18"
        textAnchor="middle"
        fontFamily="var(--font-script), 'Caveat', cursive"
        fontWeight="700"
        fontSize="48"
        fill="#2b1733"
        {...(squeeze ? { textLength: 200, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {text}
      </text>
    </g>
  );
}
