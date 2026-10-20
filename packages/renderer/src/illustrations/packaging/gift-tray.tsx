import type { PackagingIllustration } from "../types";

import { GiftTrayBack } from "./gift-tray-back";
import { GiftTrayFront } from "./gift-tray-front";

/** A wide, flat serving tray with two side handles, a low rim and a ribbon bow. */
export const GiftTrayIllustration: PackagingIllustration = {
  Back: GiftTrayBack,
  Front: GiftTrayFront,
};
