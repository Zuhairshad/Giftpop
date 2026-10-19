import { ItemPlaceholder } from "../../placeholders/ItemPlaceholder";
import type { ItemIllustrationProps } from "../types";

/** STUB: wraps the old silhouette. The illustrations slice replaces the body with the real art. */
export function SoftToyIllustration({ color }: ItemIllustrationProps) {
  return <ItemPlaceholder shape="soft-toy" color={color} />;
}
