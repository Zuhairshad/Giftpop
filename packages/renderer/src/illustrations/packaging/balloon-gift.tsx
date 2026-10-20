import type { PackagingIllustration } from "../types";

import { BalloonGiftBack } from "./balloon-gift-back";
import { BalloonGiftFront } from "./balloon-gift-front";

/** A small wrapped base box with balloon strings gathered above it. */
export const BalloonGiftIllustration: PackagingIllustration = {
  Back: BalloonGiftBack,
  Front: BalloonGiftFront,
};
