import { describe, expect, it } from "vitest";

import { buildSharedItemRows, describeSharedGiftState } from "./shared-gift-view";
import { ID_BAR, ID_MUG, ID_ROSE, makeSharedView } from "./shared-view.fixture";

describe("buildSharedItemRows", () => {
  it("lists lines in slot order with names, quantities and item names", () => {
    const rows = buildSharedItemRows(makeSharedView());
    expect(rows.map((r) => [r.name, r.qty, r.customName])).toEqual([
      ["Rose", 3, null],
      ["Mug", 1, "Sara"],
      ["Chocolate", 2, null],
    ]);
  });

  it("marks unavailable items", () => {
    const rows = buildSharedItemRows(makeSharedView({ unavailableItemIds: [ID_BAR] }));
    expect(rows.filter((r) => r.unavailable).map((r) => r.itemId)).toEqual([ID_BAR]);
  });

  it("does not fail on an item document that is missing", () => {
    const view = makeSharedView();
    const rows = buildSharedItemRows({
      ...view,
      items: view.items.filter((i) => i.id !== ID_ROSE),
    });
    expect(rows[0]?.name).toBe("Unknown item");
  });
});

describe("describeSharedGiftState", () => {
  it("has no notices and can be ordered when all is well", () => {
    const view = makeSharedView();
    expect(describeSharedGiftState(view, buildSharedItemRows(view))).toEqual({
      notices: [],
      canOrder: true,
    });
  });

  it("names unavailable items and says they are left out", () => {
    const view = makeSharedView({ unavailableItemIds: [ID_MUG, ID_BAR] });
    const state = describeSharedGiftState(view, buildSharedItemRows(view));
    expect(state.canOrder).toBe(true);
    expect(state.notices).toEqual([
      "No longer available: Mug, Chocolate. If you order this gift, those items are left out.",
    ]);
  });

  it("cannot be ordered when the packaging is gone", () => {
    const view = makeSharedView({ packagingAvailable: false });
    const state = describeSharedGiftState(view, buildSharedItemRows(view));
    expect(state.canOrder).toBe(false);
    expect(state.notices[0]).toMatch(/Classic bouquet is no longer available/);
  });

  it("cannot be ordered when every item is gone", () => {
    const view = makeSharedView({ unavailableItemIds: [ID_ROSE, ID_MUG, ID_BAR] });
    const state = describeSharedGiftState(view, buildSharedItemRows(view));
    expect(state.canOrder).toBe(false);
    expect(state.notices).toEqual(["No longer available: Rose, Mug, Chocolate."]);
  });
});
