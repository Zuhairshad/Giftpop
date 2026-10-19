import { ItemPlaceholder } from "../../placeholders/ItemPlaceholder";
import type { ItemIllustrationProps } from "../types";

/** STUB: wraps the old silhouette. The illustrations slice replaces the body with the real art. */
export function MugIllustration({ color }: ItemIllustrationProps) {
  return <ItemPlaceholder shape="mug" color={color} />;
}
