import type { PackagingIllustration } from "../types";

import { PhotoBouquetBack } from "./photo-bouquet-back";
import { PhotoBouquetFront } from "./photo-bouquet-front";

/** Picks standing in a tall dome, stems gathered into a slim paper cone tied with a bow. */
export const PhotoBouquetIllustration: PackagingIllustration = {
  Back: PhotoBouquetBack,
  Front: PhotoBouquetFront,
};
