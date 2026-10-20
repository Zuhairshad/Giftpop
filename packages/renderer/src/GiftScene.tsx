import type { Design, Item, Packaging } from "@giftpop/contracts";

import { SceneSvg, StaticItemArt, StaticLayer } from "./scene/art";
import { SceneGiftTag } from "./scene/gift-tag";
import { withImageUrls, type ImageUrlFn } from "./scene/image-urls";
import { buildSceneModel } from "./scene/model";
import { MotionScene } from "./scene/MotionScene";

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
  /**
   * Rewrites each image URL for the width it is drawn at (for example to an image resizing
   * service). Applied here, before either path, so only plain data reaches the client scene.
   */
  imageUrl?: ImageUrlFn;
}

function placementTransform(x: number, y: number, rotation: number, scale: number): string {
  return `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
}

/**
 * The gift, drawn as one SVG on a 0 to 1000 square so it scales to its container.
 *
 * The static path (`motion` off) is a pure render with no state or effects, so
 * it works in Server Components. `motion` hands over to `AnimatedGiftScene`,
 * a client component that draws the same markup and adds animation, loaded lazily
 * with this static scene shown until it arrives.
 */
export function GiftScene({
  design,
  motion = false,
  className,
  imageUrl,
  ...assets
}: GiftSceneProps) {
  const { packaging, items } = withImageUrls(assets, imageUrl);
  const scene = (
    <StaticScene design={design} packaging={packaging} items={items} className={className} />
  );
  if (!motion) return scene;
  return (
    <MotionScene
      design={design}
      packaging={packaging}
      items={items}
      className={className}
      fallback={scene}
    />
  );
}

function StaticScene({
  design,
  packaging,
  items,
  className,
}: Omit<GiftSceneProps, "motion" | "imageUrl">) {
  const model = buildSceneModel({ design, packaging, items });
  return (
    <SceneSvg
      label={model.label}
      layoutType={model.layoutType}
      bounds={model.bounds}
      className={className}
    >
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
      {model.tagName ? (
        <g data-layer="tag" aria-hidden="true">
          <SceneGiftTag name={model.tagName} bounds={model.bounds} />
        </g>
      ) : null}
    </SceneSvg>
  );
}
