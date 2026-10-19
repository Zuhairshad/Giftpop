"use client";

import type { Asset, Design, Item, Packaging } from "@giftpop/contracts";
import { AnimatePresence, useReducedMotion } from "motion/react";

import { AnimatedItem } from "./scene/AnimatedItem";
import { LayerPlaceholder, SceneSvg } from "./scene/art";
import { useHasMounted, useSceneObservers } from "./scene/hooks";
import { LAYER_BOX } from "./scene/images";
import { LoadableImage } from "./scene/LoadableImage";
import { buildSceneModel } from "./scene/model";
import type { SceneModel } from "./scene/model";

export interface AnimatedGiftSceneProps {
  design: Design;
  packaging: Packaging;
  /** Catalog items; at least every item the design uses, matched by `id`. */
  items: readonly Item[];
  className?: string | undefined;
  /** Hears the scene's rendered width in CSS pixels, now and on every resize. */
  onSizeChange?: (width: number) => void;
}

function AnimatedLayer({
  side,
  asset,
  model,
  nearViewport,
}: {
  side: "back" | "front";
  asset: Asset | undefined;
  model: SceneModel;
  nearViewport: boolean;
}) {
  const placeholder = <LayerPlaceholder side={side} model={model} />;
  if (!asset) return placeholder;
  return (
    <LoadableImage
      key={asset.url}
      url={asset.url}
      box={LAYER_BOX}
      fit="meet"
      nearViewport={nearViewport}
      placeholder={placeholder}
    />
  );
}

/**
 * `GiftScene` with motion: the same SVG, but items spring into their slots,
 * fade in and out, and glide when the arrangement seed changes. All of it is
 * skipped under `prefers-reduced-motion`. Images load lazily over a placeholder.
 */
export function AnimatedGiftScene({
  design,
  packaging,
  items,
  className,
  onSizeChange,
}: AnimatedGiftSceneProps) {
  const model = buildSceneModel({ design, packaging, items });
  const reduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const { ref, nearViewport } = useSceneObservers(onSizeChange);

  return (
    <SceneSvg label={model.label} layoutType={model.layoutType} className={className} svgRef={ref}>
      <g data-layer="back">
        <AnimatedLayer
          side="back"
          asset={model.layers.back}
          model={model}
          nearViewport={nearViewport}
        />
      </g>
      <g data-layer="items">
        <AnimatePresence initial={false}>
          {model.entries.map((entry) => (
            <AnimatedItem
              key={entry.key}
              entry={entry}
              reduced={reduced}
              entering={mounted}
              nearViewport={nearViewport}
            />
          ))}
        </AnimatePresence>
      </g>
      <g data-layer="front">
        <AnimatedLayer
          side="front"
          asset={model.layers.front}
          model={model}
          nearViewport={nearViewport}
        />
      </g>
    </SceneSvg>
  );
}
