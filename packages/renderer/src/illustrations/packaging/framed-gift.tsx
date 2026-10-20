import type { PackagingIllustration } from "../types";

import { FramedGiftBack } from "./framed-gift-back";
import { FramedGiftFront } from "./framed-gift-front";

/** A flat picture-frame box seen front-on: thick frame, mat, a bow and a hanging cord. */
export const FramedGiftIllustration: PackagingIllustration = {
  Back: FramedGiftBack,
  Front: FramedGiftFront,
};
