import type { ItemShape } from "@giftpop/contracts";

import { BalloonIllustration } from "./items/balloon";
import { BarIllustration } from "./items/bar";
import { BottleIllustration } from "./items/bottle";
import { BoxIllustration } from "./items/box";
import { BraceletIllustration } from "./items/bracelet";
import { CandleIllustration } from "./items/candle";
import { CardIllustration } from "./items/card";
import { CosmeticIllustration } from "./items/cosmetic";
import { CupcakeIllustration } from "./items/cupcake";
import { FlowerIllustration } from "./items/flower";
import { FrameIllustration } from "./items/frame";
import { JarIllustration } from "./items/jar";
import { JewelleryIllustration } from "./items/jewellery";
import { MugIllustration } from "./items/mug";
import { NecklaceIllustration } from "./items/necklace";
import { OtherIllustration } from "./items/other";
import { PerfumeIllustration } from "./items/perfume";
import { SoftToyIllustration } from "./items/soft-toy";
import { BalloonGiftIllustration } from "./packaging/balloon-gift";
import { BasketIllustration } from "./packaging/basket";
import { BouquetFanIllustration } from "./packaging/bouquet-fan";
import { BoxGridIllustration } from "./packaging/box-grid";
import { HeartBoxIllustration } from "./packaging/heart-box";
import { MugBouquetIllustration } from "./packaging/mug-bouquet";
import { RoundBoxIllustration } from "./packaging/round-box";
import type { ItemIllustration, PackagingIllustration } from "./types";

/**
 * One illustration per item shape. A real uploaded image always wins over these.
 * Adding a shape means adding one entry here (and to `ITEM_SHAPES` in contracts).
 */
export const ITEM_ILLUSTRATIONS: Record<ItemShape, ItemIllustration> = {
  bar: BarIllustration,
  bottle: BottleIllustration,
  jar: JarIllustration,
  box: BoxIllustration,
  mug: MugIllustration,
  flower: FlowerIllustration,
  card: CardIllustration,
  "soft-toy": SoftToyIllustration,
  balloon: BalloonIllustration,
  perfume: PerfumeIllustration,
  candle: CandleIllustration,
  jewellery: JewelleryIllustration,
  necklace: NecklaceIllustration,
  bracelet: BraceletIllustration,
  cosmetic: CosmeticIllustration,
  cupcake: CupcakeIllustration,
  frame: FrameIllustration,
  other: OtherIllustration,
};

/**
 * One illustration per layout type. A layout type with no entry falls back to the plain tray
 * placeholder, so adding a layout never requires touching this file (but should, for good art).
 */
export const PACKAGING_ILLUSTRATIONS: Readonly<Record<string, PackagingIllustration | undefined>> =
  {
    "bouquet-fan": BouquetFanIllustration,
    "box-grid": BoxGridIllustration,
    "round-box": RoundBoxIllustration,
    "heart-box": HeartBoxIllustration,
    "mug-bouquet": MugBouquetIllustration,
    basket: BasketIllustration,
    "balloon-gift": BalloonGiftIllustration,
  };
