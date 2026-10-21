import { describe, expect, it } from "vitest";

import { buildShareMetadata } from "./gift-metadata";
import { buildSharedItemRows } from "./shared-gift-view";
import { makeSharedView } from "./shared-view.fixture";

const SECRET = "Please leave out the peanuts, allergy";

function viewWithRequest() {
  const base = makeSharedView();
  return {
    ...base,
    design: {
      ...base.design,
      personalisation: { ...base.design.personalisation, customRequest: SECRET },
    },
  };
}

describe("a custom request on a shared design", () => {
  it("never reaches the page metadata or Open Graph cards", () => {
    expect(JSON.stringify(buildShareMetadata(viewWithRequest()))).not.toContain(SECRET);
  });

  it("never reaches the metadata of a ready-made gift either", () => {
    const view = {
      ...viewWithRequest(),
      readyMade: { title: "Birthday box", description: "Sweet" },
    };
    expect(JSON.stringify(buildShareMetadata(view))).not.toContain(SECRET);
  });

  it("never reaches the item rows the share page draws", () => {
    expect(JSON.stringify(buildSharedItemRows(viewWithRequest()))).not.toContain(SECRET);
  });
});
