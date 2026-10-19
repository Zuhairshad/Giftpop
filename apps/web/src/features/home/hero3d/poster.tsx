import { useId } from "react";

import { GIFT_TAG, PALETTE, POSTER_ALT, POSTER_VIEWBOX } from "./constants";
import { GiftTagArt, GiftTagText, PolaroidArt, StarArt, TrufflesArt } from "./decor";
import { BoxBody, Interior, Lid, SpriteItem, Sticker } from "./poster-parts";
import { SPARKLES } from "./sprites";

/**
 * The resting state of the hero as one SVG: lid lifted with its bow, ribbon tails, gifts in the
 * box, gifts floating out, the sticker topper, the "For Sara" tag and sparkles.
 * It paints with the page (server-rendered), scales to its box, and is the last frame of the
 * 3D animation. `foreground={false}` hides everything except the soft pink backdrop, which the
 * canvas keeps using; the canvas has no backdrop of its own.
 */
export function Poster({
  foreground = true,
  className,
}: {
  foreground?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dots = `hero-dots-${uid}`;
  const blur8 = `hero-blur8-${uid}`;
  const blur3 = `hero-blur3-${uid}`;
  const { x, y, w, h } = POSTER_VIEWBOX;
  const body = (
    <>
      <ellipse
        cx={380}
        cy={612}
        rx={236}
        ry={26}
        fill={PALETTE.shadow}
        opacity={0.14}
        filter={`url(#${blur8})`}
      />
      <ellipse
        cx={380}
        cy={606}
        rx={176}
        ry={12}
        fill={PALETTE.shadow}
        opacity={0.24}
        filter={`url(#${blur3})`}
      />
      <Interior />
      <SpriteItem id="bottle" />
      <SpriteItem id="jar" />
      <SpriteItem id="soft-toy" />
      <TrufflesArt />
      <g transform="translate(466 280) rotate(11)">
        <PolaroidArt />
      </g>
      <BoxBody dots={dots} />
      <g
        transform={`translate(${GIFT_TAG.x} ${GIFT_TAG.y}) rotate(${GIFT_TAG.rotDeg}) scale(${GIFT_TAG.scale})`}
      >
        <GiftTagArt width={GIFT_TAG.width} />
        <GiftTagText text={GIFT_TAG.text} width={GIFT_TAG.width} />
      </g>
      <path
        d="M300 566 C282 560 262 556 246 562"
        fill="none"
        stroke={PALETTE.gold}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <SpriteItem id="balloon" />
      <SpriteItem id="flower-pink" />
      <SpriteItem id="mug" />
      <SpriteItem id="bar" />
      <SpriteItem id="flower-red" />
      <Sticker />
      <Lid dots={dots} />
      {SPARKLES.map((s) =>
        s.kind === "star" ? (
          <g key={s.id} transform={`translate(${s.x} ${s.y}) scale(${s.size / 12})`}>
            <StarArt fill={s.color} />
          </g>
        ) : (
          <circle key={s.id} cx={s.x} cy={s.y} r={s.size} fill={s.color} />
        ),
      )}
    </>
  );
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={POSTER_ALT}
      className={className}
      data-hero-poster=""
    >
      <defs>
        <pattern id={dots} width={22} height={22} patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={1.7} fill={PALETTE.gold} opacity={0.55} />
          <circle cx={16} cy={16} r={1.7} fill={PALETTE.gold} opacity={0.55} />
        </pattern>
        <filter id={blur8}>
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <filter id={blur3}>
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      <path
        d="M120 330 C80 170 220 70 380 86 C560 100 690 190 676 360 C664 520 520 610 360 606 C210 602 150 500 120 330z"
        fill={PALETTE.blob}
        opacity={0.8}
      />
      <g
        data-hero-poster-foreground=""
        style={{ opacity: foreground ? 1 : 0, transition: "opacity 400ms ease" }}
      >
        {body}
      </g>
    </svg>
  );
}
