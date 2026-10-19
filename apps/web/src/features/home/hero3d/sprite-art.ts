import { ItemIllustrationSvg } from "@giftpop/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Texture } from "three";

import { GIFT_TAG } from "./constants";
import {
  GiftTagArt,
  SCRIPT_FONT,
  STICKER_LABELS,
  STICKER_TEXT_COLOR,
  TAG_TEXT_COLOR,
  tagLabel,
  StickerArt,
} from "./decor";
import { ITEM_ART_BOX, SPARKLES, SPRITES, STICKER_ART } from "./sprites";
import { resolveFontFamily, sparkleTexture, svgToTexture } from "./textures";

/** Every texture the scene needs, built client-side from the same art the poster draws. */
export interface SpriteArt {
  sprites: ReadonlyMap<string, Texture>;
  sparkles: ReadonlyMap<string, Texture>;
  tag: Texture;
  dispose(): void;
}

const ITEM_PX = 256;
const STICKER_SCALE = 1.6;
const TAG_SCALE = 2;

function wrap(
  box: { x: number; y: number; w: number; h: number },
  px: number,
  inner: ReactElement,
) {
  const width = Math.round(box.w * px);
  const height = Math.round(box.h * px);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${width}" height="${height}">${renderToStaticMarkup(inner)}</svg>`;
  return { svg, width, height };
}

/** Renders item illustrations, the sticker and the tag to canvas textures. Rejects on any failure. */
export async function loadSpriteArt(): Promise<SpriteArt> {
  const textures: Texture[] = [];
  const keep = <T extends Texture>(texture: T): T => {
    textures.push(texture);
    return texture;
  };
  try {
    const fontFamily = await resolveFontFamily(SCRIPT_FONT);
    const sprites = new Map<string, Texture>();
    await Promise.all(
      SPRITES.map(async (def) => {
        if (def.kind === "item" && def.shape) {
          const art = wrap(
            { x: 0, y: 0, w: ITEM_ART_BOX.w, h: ITEM_ART_BOX.h },
            ITEM_PX / ITEM_ART_BOX.w,
            createElement(ItemIllustrationSvg, {
              shape: def.shape,
              color: def.color,
              size: ITEM_ART_BOX.w,
            }),
          );
          sprites.set(
            def.id,
            keep(
              await svgToTexture({
                ...art,
                box: { x: 0, y: 0, w: ITEM_ART_BOX.w, h: ITEM_ART_BOX.h },
              }),
            ),
          );
        } else {
          const art = wrap(STICKER_ART, STICKER_SCALE, createElement(StickerArt));
          sprites.set(
            def.id,
            keep(
              await svgToTexture({
                ...art,
                box: STICKER_ART,
                labels: STICKER_LABELS,
                labelColor: STICKER_TEXT_COLOR,
                fontFamily,
              }),
            ),
          );
        }
      }),
    );
    const tagBox = { x: 0, y: 0, w: GIFT_TAG.width, h: 70 };
    const tagArt = wrap(tagBox, TAG_SCALE, createElement(GiftTagArt, { width: GIFT_TAG.width }));
    const tag = keep(
      await svgToTexture({
        ...tagArt,
        box: tagBox,
        labels: [tagLabel(GIFT_TAG.text, GIFT_TAG.width)],
        labelColor: TAG_TEXT_COLOR,
        fontFamily,
      }),
    );
    const sparkles = new Map<string, Texture>();
    for (const def of SPARKLES) sparkles.set(def.id, keep(sparkleTexture(def.kind, def.color)));
    return {
      sprites,
      sparkles,
      tag,
      dispose: () => textures.forEach((t) => t.dispose()),
    };
  } catch (error) {
    textures.forEach((t) => t.dispose());
    throw error;
  }
}
