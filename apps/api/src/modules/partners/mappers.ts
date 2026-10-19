import { PartnerRequestSchema, type PartnerRequest } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";

import type { PartnerNoteDoc, PartnerRequestDoc } from "./model";

function toNote(note: PartnerNoteDoc) {
  return { at: note.at.toISOString(), actorId: note.actorId.toHexString(), text: note.text };
}

/** Maps a stored document to the contract. Never exposes `_id` or `__v`. */
export function toPartnerRequest(doc: PartnerRequestDoc): PartnerRequest {
  const common = {
    id: doc._id.toHexString(),
    status: doc.status,
    contactName: doc.contactName,
    email: doc.email,
    phone: doc.phone,
    message: doc.message,
    country: doc.country,
    notes: doc.notes.map(toNote),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
  const shaped =
    doc.kind === "brand"
      ? {
          ...common,
          kind: "brand",
          brandName: doc.brandName,
          productCategories: doc.productCategories,
          link: doc.link,
        }
      : { ...common, kind: "country", offering: doc.offering };
  const result = PartnerRequestSchema.safeParse(shaped);
  // A stored row that no longer parses is a data fault on our side, not the caller's mistake.
  if (!result.success) throw new AppError("INTERNAL", 500, "A partner request could not be loaded");
  return result.data;
}
