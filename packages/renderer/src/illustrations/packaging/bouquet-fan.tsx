import {
  PackagingBackPlaceholder,
  PackagingFrontPlaceholder,
} from "../../placeholders/PackagingPlaceholder";
import type { PackagingIllustration, PackagingIllustrationProps } from "../types";

/** STUB: wraps the old wrapper art. The illustrations slice replaces both layers with the real art. */
function Back(props: PackagingIllustrationProps) {
  return <PackagingBackPlaceholder layoutType="bouquet-fan" {...props} />;
}

function Front(props: PackagingIllustrationProps) {
  return <PackagingFrontPlaceholder layoutType="bouquet-fan" {...props} />;
}

export const BouquetFanIllustration: PackagingIllustration = { Back, Front };
