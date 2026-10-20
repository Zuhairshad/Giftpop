import type { PackagingIllustration } from "../types";

import { RoundBoxBack } from "./round-box-back";
import { RoundBoxFront } from "./round-box-front";

/** A round hat box from a slight three-quarter view: lid propped behind, tissue and a bow in front. */
export const RoundBoxIllustration: PackagingIllustration = {
  Back: RoundBoxBack,
  Front: RoundBoxFront,
};
