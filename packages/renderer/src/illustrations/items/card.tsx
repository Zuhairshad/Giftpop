import { ItemPlaceholder } from "../../placeholders/ItemPlaceholder";
import type { ItemIllustrationProps } from "../types";

/** STUB: wraps the old silhouette. The illustrations slice replaces the body with the real art. */
export function CardIllustration({ color }: ItemIllustrationProps) {
  return <ItemPlaceholder shape="card" color={color} />;
}
