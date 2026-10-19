import type { Design, Item, Packaging } from "@giftpop/contracts";

import { AnimatedGiftScene } from "./AnimatedGiftScene";
import { SceneSvg, StaticItemArt, StaticLayer } from "./scene/art";
import { buildSceneModel } from "./scene/model";

export { describeGift } from "./describe";

export interface GiftSceneProps {
  design: Design;
  packaging: Packaging;
  /** Catalog items; at least every item the design uses, matched by `id`. */
  items: readonly Item[];
  /**
   * Animate items into and out of their slots, and when the seed changes.
   * Off for static renders. On, the scene is the client-side `AnimatedGiftScene`.
   */
  motion?: boolean;
  className?: string;
}

function placementTransform(x: number, y: number, rotation: number, scale: number): string {
  return `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
}

/**
 * The gift, drawn as one SVG on a 0 to 1000 square so it scales to its container.
 *
 * The static path (`motion` off) is a pure render with no state or effects, so
 * it works in Server Components. `motion` hands over to `AnimatedGiftScene`,
 * a client component that draws the same markup and adds animation.
 */
export function GiftScene({ design, packaging, items, motion = false, className }: GiftSceneProps) {
  if (motion) {
    return (
      <AnimatedGiftScene
        design={design}
        packaging={packaging}
        items={items}
        className={className}
      />
    );
  }
  const model = buildSceneModel({ design, packaging, items });
  return (
    <SceneSvg label={model.label} layoutType={model.layoutType} className={className}>
      <g data-layer="back">
        <StaticLayer side="back" asset={model.layers.back} model={model} />
      </g>
      <g data-layer="items">
        {model.entries.map(({ key, placement: p, art }) => (
          <g
            key={key}
            style={{ transform: placementTransform(p.x, p.y, p.rotation, p.scale) }}
            data-item-index={key}
          >
            <StaticItemArt art={art} />
          </g>
        ))}
      </g>
      <g data-layer="front">
        <StaticLayer side="front" asset={model.layers.front} model={model} />
      </g>
    </SceneSvg>
  );
}
