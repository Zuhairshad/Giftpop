import type { Asset, Design, Item, Packaging } from "@giftpop/contracts";

import { describeGift, FALLBACK_ITEM } from "../describe";
import { computePlacements, expandDesignItems } from "../layouts";
import type { Placement } from "../layouts";

/** What a scene needs to know to draw one item. */
export type SceneItemArt = Pick<Item, "shape" | "color"> & { image?: Asset };

export interface SceneEntry {
  /** Stable key: the item's index in the expanded design, so a shuffle moves items instead of remounting them. */
  key: number;
  placement: Placement;
  art: SceneItemArt;
}

export interface SceneModel {
  label: string;
  layoutType: string;
  colors: { wrapper: string; ribbon: string };
  layers: { back?: Asset; front?: Asset };
  /** In paint order, lowest `z` first. */
  entries: SceneEntry[];
}

export interface SceneInput {
  design: Design;
  packaging: Packaging;
  /** Catalog items; at least every item the design uses, matched by `id`. */
  items: readonly Item[];
}

/** Everything both scene variants render, computed once and free of React. */
export function buildSceneModel({ design, packaging, items }: SceneInput): SceneModel {
  const itemIds = expandDesignItems(design);
  const byId = new Map(items.map((item) => [item.id, item]));
  const entries = computePlacements({ design, packaging })
    .map((placement): SceneEntry => {
      const itemId = itemIds[placement.itemIndex];
      const art: SceneItemArt = (itemId ? byId.get(itemId) : undefined) ?? FALLBACK_ITEM;
      return { key: placement.itemIndex, placement, art };
    })
    .sort((a, b) => a.placement.z - b.placement.z);
  return {
    label: describeGift(design, packaging, items),
    layoutType: packaging.layoutType,
    colors: { wrapper: design.wrapperColor, ribbon: design.ribbonColor },
    layers: packaging.layers,
    entries,
  };
}
