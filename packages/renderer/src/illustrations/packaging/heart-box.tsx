import type { PackagingIllustration } from "../types";

import { HeartBoxBack } from "./heart-box-back";
import { HeartBoxFront } from "./heart-box-front";

/** A heart-shaped box with the lid propped behind and a bow in front. */
export const HeartBoxIllustration: PackagingIllustration = {
  Back: HeartBoxBack,
  Front: HeartBoxFront,
};
