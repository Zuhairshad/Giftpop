import { validateDesign } from "@giftpop/contracts";
import type {
  CatalogResponse,
  Design,
  DesignProblem,
  HexColor,
  Packaging,
} from "@giftpop/contracts";

import { findPackaging, totals } from "./catalog-lookup";
import type { BuilderData } from "./data";

export interface BuilderView {
  packaging: Packaging | null;
  wrapperColor: HexColor | null;
  ribbonColor: HexColor | null;
  itemCount: number;
  usedUnits: number;
  design: Design | null;
  problems: readonly DesignProblem[];
}

/** Everything the screens read that is computed from the chosen data and the catalog. Pure. */
export function deriveView(data: BuilderData, catalog: CatalogResponse): BuilderView {
  const packaging = findPackaging(catalog, data.packagingId);
  const { itemCount, usedUnits } = totals(data.lines, catalog);
  if (!packaging) {
    return {
      packaging: null,
      wrapperColor: null,
      ribbonColor: null,
      itemCount,
      usedUnits,
      design: null,
      problems: [],
    };
  }

  const wrapperColor = data.wrapperColor ?? packaging.wrapperColors[0]?.hex ?? null;
  const ribbonColor = data.ribbonColor ?? packaging.ribbonColors[0]?.hex ?? null;
  if (wrapperColor === null || ribbonColor === null) {
    return {
      packaging,
      wrapperColor,
      ribbonColor,
      itemCount,
      usedUnits,
      design: null,
      problems: [],
    };
  }

  const design: Design = {
    packagingId: packaging.id,
    items: data.lines.map((line, index) => ({ itemId: line.itemId, qty: line.qty, slot: index })),
    wrapperColor,
    ribbonColor,
    arrangementSeed: data.arrangementSeed,
    personalisation: {
      cardMessage: data.cardMessage,
      customRequest: data.customRequest,
      recipientName: data.recipientName,
      itemNames: { ...data.itemNames },
    },
  };
  return {
    packaging,
    wrapperColor,
    ribbonColor,
    itemCount,
    usedUnits,
    design,
    problems: validateDesign(design, catalog),
  };
}
