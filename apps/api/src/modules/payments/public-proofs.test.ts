import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { orderDocInput } from "../orders/fixtures";
import { toOrder } from "../orders/mappers";
import type { OrderDoc } from "../orders/model";
import { toPublicOrderView } from "../orders/public-view";

import { proofFileUrl } from "./proof-keys";

function docWithProof(): OrderDoc {
  return {
    ...orderDocInput(),
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    proofs: [
      {
        _id: new Types.ObjectId(),
        url: "proofs/secretkey123.webp",
        storageKey: "proofs/secretkey123.webp",
        status: "pending",
        uploadedAt: new Date(),
      },
    ],
  } as OrderDoc;
}

describe("proof URLs", () => {
  it("the customer view carries no proof URL or key", () => {
    const view = toPublicOrderView(docWithProof(), "Pay by bank transfer");
    expect(view.proofs).toHaveLength(1);
    expect(Object.keys(view.proofs[0] ?? {}).sort()).toEqual(["status", "uploadedAt"]);
    expect(JSON.stringify(view)).not.toContain("secretkey123");
  });

  it("the staff order maps a proof to the admin file route, never the key", () => {
    const doc = docWithProof();
    const order = toOrder(doc);
    const proof = doc.proofs[0];
    expect(order.proofs[0]?.url).toBe(
      proofFileUrl(doc._id.toHexString(), proof?._id.toHexString() ?? ""),
    );
    expect(JSON.stringify(order.proofs)).not.toContain("secretkey123");
  });
});
