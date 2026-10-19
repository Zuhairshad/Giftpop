import type { ComponentType, ReactNode } from "react";

/** Item art is drawn in a 200 x 200 box and centred on its middle (the anchor). */
export const ITEM_ART_SIZE = 200;

export interface ItemIllustrationProps {
  /** The item's `color`; the art derives its outline, highlight and shade from it. */
  color: string;
}

export type ItemIllustration = (props: ItemIllustrationProps) => ReactNode;

export interface PackagingIllustrationProps {
  wrapper: string;
  ribbon: string;
}

/** Packaging art is drawn in the scene's 1000 x 1000 box: `Back` behind the items, `Front` over them. */
export interface PackagingIllustration {
  Back: ComponentType<PackagingIllustrationProps>;
  Front: ComponentType<PackagingIllustrationProps>;
}
