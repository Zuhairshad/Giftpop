import type { PackagingIllustration } from "../types";

import { BouquetFanBack } from "./bouquet-fan-back";
import { BouquetFanFront } from "./bouquet-fan-front";

/** A hand-tied bouquet wrapper: pleated paper behind the blooms, cellophane panels and a bow in front. */
export const BouquetFanIllustration: PackagingIllustration = {
  Back: BouquetFanBack,
  Front: BouquetFanFront,
};
