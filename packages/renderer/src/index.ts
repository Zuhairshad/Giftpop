export { GiftScene, describeGift } from "./GiftScene";
export type { GiftSceneProps } from "./GiftScene";
export { ITEM_IMAGE_WIDTH, LAYER_IMAGE_WIDTH } from "./scene/image-urls";
export type { ImageUrlFn } from "./scene/image-urls";
// `AnimatedGiftScene` is not re-exported here: importing it from the barrel would put motion on
// every route. Use `<GiftScene motion />` (loads it lazily) or `@giftpop/renderer/animated`.
export {
  LAYOUTS,
  LAYOUT_TYPES,
  computePlacements,
  expandDesignItems,
  getLayout,
  isKnownLayoutType,
  ITEM_BASE_SIZE,
  SCENE_SIZE,
  FULL_SCENE,
  packagingSceneBounds,
  sceneBounds,
} from "./layouts";
export type { KnownLayoutType, LayoutFn, LayoutInput, Placement, SceneBounds } from "./layouts";
export {
  ITEM_ART_SIZE,
  ITEM_ILLUSTRATIONS,
  ItemIllustrationSvg,
  PACKAGING_ILLUSTRATIONS,
} from "./illustrations";
export type {
  ItemIllustration,
  ItemIllustrationProps,
  PackagingIllustration,
  PackagingIllustrationProps,
} from "./illustrations";
