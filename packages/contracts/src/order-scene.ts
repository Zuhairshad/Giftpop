import type { Item, Packaging } from "./catalog";
import type { Design } from "./design";
import type { ItemSnapshot, PackagingSnapshot } from "./order";

/**
 * Turns an order's frozen snapshots back into the packaging and item documents
 * `<GiftScene/>` draws, so an order is shown exactly as it was built even after
 * the catalog changed. Colour choices come from the design.
 */
export function snapshotsToSceneDocs(source: {
  design: Design;
  packaging: PackagingSnapshot;
  items: readonly ItemSnapshot[];
}): { packaging: Packaging; items: Item[] } {
  const { design, packaging, items } = source;
  return {
    packaging: {
      id: packaging.packagingId,
      slug: "ordered",
      name: packaging.name,
      description: "",
      // An order does not freeze the kind; a scene redraw does not use it.
      kind: "other",
      layoutType: packaging.layoutType,
      minItems: packaging.minItems,
      maxItems: packaging.maxItems,
      capacityUnits: packaging.capacityUnits,
      wrapperColors: [{ name: "Wrapper", hex: design.wrapperColor }],
      ribbonColors: [{ name: "Ribbon", hex: design.ribbonColor }],
      layers: packaging.layers,
      active: true,
      sortOrder: 0,
    },
    items: items.map((item) => ({
      id: item.itemId,
      name: item.name,
      category: "",
      shape: item.shape,
      color: item.color,
      sizeUnits: item.sizeUnits,
      personalizable: false,
      image: item.image,
      active: true,
      sortOrder: 0,
    })),
  };
}
