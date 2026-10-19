export { GiftScene, describeGift } from "./GiftScene";
export type { GiftSceneProps } from "./GiftScene";
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
} from "./layouts";
export type { KnownLayoutType, LayoutFn, LayoutInput, Placement } from "./layouts";
