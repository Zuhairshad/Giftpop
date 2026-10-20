import type { PackagingIllustration } from "../types";

import { SnackHamperBack } from "./snack-hamper-back";
import { SnackHamperFront } from "./snack-hamper-front";

/** A shallow open slatted crate with shredded-paper filler and a ribbon band across the front. */
export const SnackHamperIllustration: PackagingIllustration = {
  Back: SnackHamperBack,
  Front: SnackHamperFront,
};
