import type { Asset, Design, Item, Packaging } from "@giftpop/contracts";
import { useId } from "react";

import { computePlacements, expandDesignItems, ITEM_BASE_SIZE, SCENE_SIZE } from "./layouts";
import type { Placement } from "./layouts";
import { ItemPlaceholder, PLACEHOLDER_SIZE } from "./placeholders/ItemPlaceholder";
import {
  PackagingBackPlaceholder,
  PackagingFrontPlaceholder,
} from "./placeholders/PackagingPlaceholder";

export interface GiftSceneProps {
  design: Design;
  packaging: Packaging;
  /** Catalog items; at least every item the design uses, matched by `id`. */
  items: readonly Item[];
  /** Animate items to their new slots when the design changes. Off for static renders. */
  motion?: boolean;
  className?: string;
}

const FALLBACK_ITEM = { name: "Unknown item", shape: "other", color: "#b8b8b8" } as const;

/** Describes the gift for assistive tech, for example "Gift in Classic bouquet: 2 x Rose, 1 x Chocolate bar". */
export function describeGift(design: Design, packaging: Packaging, items: readonly Item[]): string {
  const byId = new Map(items.map((item) => [item.id, item]));
  const lines = [...design.items]
    .sort((a, b) => a.slot - b.slot)
    .map((line) => `${line.qty} x ${byId.get(line.itemId)?.name ?? FALLBACK_ITEM.name}`);
  return `Gift in ${packaging.name}: ${lines.length > 0 ? lines.join(", ") : "no items yet"}`;
}

function LayerImage({ asset }: { asset: Asset }) {
  return (
    <image
      href={asset.url}
      x={0}
      y={0}
      width={SCENE_SIZE}
      height={SCENE_SIZE}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

/** Draws an item's image with its anchor on the origin, or a centred placeholder. */
function ItemArt({ item }: { item: Pick<Item, "shape" | "color"> & { image?: Asset } }) {
  const { image } = item;
  if (!image) {
    const half = PLACEHOLDER_SIZE / 2;
    return (
      <g transform={`translate(${-half} ${-half})`}>
        <ItemPlaceholder shape={item.shape} color={item.color} />
      </g>
    );
  }
  const fit = ITEM_BASE_SIZE / Math.max(image.width, image.height);
  const width = image.width * fit;
  const height = image.height * fit;
  return (
    <image
      href={image.url}
      x={-image.anchor.x * width}
      y={-image.anchor.y * height}
      width={width}
      height={height}
      preserveAspectRatio="none"
    />
  );
}

function placementTransform(p: Placement): string {
  return `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`;
}

const MOTION_CSS =
  ".gp-scene-motion{transition:transform .45s ease}" +
  "@media (prefers-reduced-motion:reduce){.gp-scene-motion{transition:none}}";

/**
 * The gift, drawn as one SVG on a 0 to 1000 square so it scales to its container.
 * Pure render with no state or effects, so it works in Server Components.
 */
export function GiftScene({ design, packaging, items, motion = false, className }: GiftSceneProps) {
  const titleId = useId();
  const label = describeGift(design, packaging, items);
  const itemIds = expandDesignItems(design);
  const placements = computePlacements({ design, packaging });
  const byId = new Map(items.map((item) => [item.id, item]));
  const painted = [...placements].sort((a, b) => a.z - b.z);
  const colors = { wrapper: design.wrapperColor, ribbon: design.ribbonColor };
  const { back, front } = packaging.layers;

  return (
    <svg
      role="img"
      aria-labelledby={titleId}
      viewBox={`0 0 ${SCENE_SIZE} ${SCENE_SIZE}`}
      className={className}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "1 / 1" }}
      data-layout={packaging.layoutType}
    >
      <title id={titleId}>{label}</title>
      {motion ? <style>{MOTION_CSS}</style> : null}
      <g data-layer="back">
        {back ? (
          <LayerImage asset={back} />
        ) : (
          <PackagingBackPlaceholder layoutType={packaging.layoutType} {...colors} />
        )}
      </g>
      <g data-layer="items">
        {painted.map((placement) => {
          const itemId = itemIds[placement.itemIndex];
          const item = (itemId ? byId.get(itemId) : undefined) ?? FALLBACK_ITEM;
          return (
            <g
              key={placement.itemIndex}
              className={motion ? "gp-scene-motion" : undefined}
              style={{ transform: placementTransform(placement) }}
              data-item-index={placement.itemIndex}
            >
              <ItemArt item={item} />
            </g>
          );
        })}
      </g>
      <g data-layer="front">
        {front ? (
          <LayerImage asset={front} />
        ) : (
          <PackagingFrontPlaceholder layoutType={packaging.layoutType} {...colors} />
        )}
      </g>
    </svg>
  );
}
