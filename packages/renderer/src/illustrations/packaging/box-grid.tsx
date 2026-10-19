import type { PackagingIllustration } from "../types";

import { BoxGridBack } from "./box-grid-back";
import { BoxGridFront } from "./box-grid-front";

/** An open gift box seen from slightly above: interior behind the items, rim and ribbon in front. */
export const BoxGridIllustration: PackagingIllustration = {
  Back: BoxGridBack,
  Front: BoxGridFront,
};
