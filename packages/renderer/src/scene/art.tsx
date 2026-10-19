import type { Asset } from "@giftpop/contracts";
import { useId } from "react";
import type { ReactNode, Ref } from "react";

import { ITEM_ART_SIZE, ITEM_ILLUSTRATIONS, PACKAGING_ILLUSTRATIONS } from "../illustrations";
import type { SceneBounds } from "../layouts";
import {
  PackagingBackPlaceholder,
  PackagingFrontPlaceholder,
} from "../placeholders/PackagingPlaceholder";

import { itemImageBox, LAYER_BOX, LAZY_IMAGE_ATTRS } from "./images";
import type { ImageBox } from "./images";
import type { SceneItemArt, SceneModel } from "./model";

// Everything here is a pure render with no state or effects, so Server Components can use it.

/** The `<svg>` both variants share: same viewBox (the layout's bounds), aspect box, label and layer order. */
export function SceneSvg({
  label,
  layoutType,
  bounds,
  className,
  svgRef,
  children,
}: {
  label: string;
  layoutType: string;
  /** The part of the scene square to show; sets the viewBox and the box's aspect ratio. */
  bounds: SceneBounds;
  className?: string | undefined;
  svgRef?: Ref<SVGSVGElement>;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <svg
      ref={svgRef}
      role="img"
      aria-labelledby={titleId}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        aspectRatio: `${bounds.width} / ${bounds.height}`,
      }}
      data-layout={layoutType}
    >
      <title id={titleId}>{label}</title>
      {children}
    </svg>
  );
}

export function SceneImage({
  url,
  box,
  fit = "none",
  hidden = false,
  onLoad,
  onError,
}: {
  url: string;
  box: ImageBox;
  /** `none` for item images (the box already has their aspect ratio), `meet` for layers. */
  fit?: "none" | "meet";
  hidden?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}) {
  return (
    <image
      href={url}
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      preserveAspectRatio={fit === "meet" ? "xMidYMid meet" : "none"}
      style={hidden ? { opacity: 0 } : undefined}
      // SVG <image> fires load and error like <img>; the lint rule only knows HTML tags.
      // eslint-disable-next-line react/no-unknown-property
      onLoad={onLoad}
      // eslint-disable-next-line react/no-unknown-property
      onError={onError}
      {...LAZY_IMAGE_ATTRS}
    />
  );
}

/** An item's silhouette, centred on the origin like an anchored image. */
export function ItemPlaceholderArt({ art }: { art: SceneItemArt }) {
  const half = ITEM_ART_SIZE / 2;
  const Illustration = ITEM_ILLUSTRATIONS[art.shape];
  return (
    <g transform={`translate(${-half} ${-half})`}>
      <Illustration color={art.color} />
    </g>
  );
}

export function LayerPlaceholder({
  side,
  model,
}: {
  side: "back" | "front";
  model: Pick<SceneModel, "layoutType" | "colors">;
}) {
  const illustration = PACKAGING_ILLUSTRATIONS[model.layoutType];
  if (illustration) {
    const Layer = side === "back" ? illustration.Back : illustration.Front;
    return <Layer wrapper={model.colors.wrapper} ribbon={model.colors.ribbon} />;
  }
  const Fallback = side === "back" ? PackagingBackPlaceholder : PackagingFrontPlaceholder;
  return <Fallback layoutType={model.layoutType} {...model.colors} />;
}

/** Static item art: the image if the item has one, otherwise the silhouette. */
export function StaticItemArt({ art }: { art: SceneItemArt }) {
  return art.image ? (
    <SceneImage url={art.image.url} box={itemImageBox(art.image)} />
  ) : (
    <ItemPlaceholderArt art={art} />
  );
}

export function StaticLayer({
  side,
  asset,
  model,
}: {
  side: "back" | "front";
  asset: Asset | undefined;
  model: Pick<SceneModel, "layoutType" | "colors">;
}) {
  return asset ? (
    <SceneImage url={asset.url} box={LAYER_BOX} fit="meet" />
  ) : (
    <LayerPlaceholder side={side} model={model} />
  );
}
