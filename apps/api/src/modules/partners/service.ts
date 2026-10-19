import type {
  CreatePartnerRequest,
  Paginated,
  PartnerRequest,
  PartnerRequestListQuery,
  UpdatePartnerRequest,
} from "@giftpop/contracts";
import mongoose, { type QueryFilter } from "mongoose";

import { AppError } from "../../lib/errors";
import { CountryModel } from "../countries/model";
import { enqueueStaffAlert } from "../notifications/service";

import { toPartnerRequest } from "./mappers";
import { PartnerRequestModel, type PartnerRequestDoc } from "./model";

/** Contact details never go in the alert: its text is logged. */
export function alertFor(
  input: CreatePartnerRequest,
  countryName: string,
): { subject: string; text: string } {
  if (input.kind === "brand") {
    return {
      subject: "New brand partner request",
      text: `New brand partner request: ${input.brandName} (${countryName}). Open the admin to read it.`,
    };
  }
  return {
    subject: "New country request",
    text: `New country request for ${countryName}. Open the admin to read it.`,
  };
}

export async function createPartnerRequest(input: CreatePartnerRequest): Promise<void> {
  const country = await CountryModel.findOne({ code: input.country }).lean();
  if (!country) throw new AppError("VALIDATION_ERROR", 422, "Unknown country");
  if (input.kind === "country" && country.status === "live") {
    throw new AppError("VALIDATION_ERROR", 422, "The Giftpop already ships to this country");
  }
  const now = new Date();
  const doc = {
    ...input,
    email: input.email.trim().toLowerCase(),
    status: "new" as const,
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await PartnerRequestModel.create([doc], { session });
      await enqueueStaffAlert(alertFor(input, country.name), session);
    });
  } finally {
    await session.endSession();
  }
}

export async function listPartnerRequests(
  query: PartnerRequestListQuery,
): Promise<Paginated<PartnerRequest>> {
  const filter: QueryFilter<PartnerRequestDoc> = {};
  if (query.kind) filter.kind = query.kind;
  if (query.status) filter.status = query.status;
  if (query.country) filter.country = query.country;
  const [docs, total] = await Promise.all([
    PartnerRequestModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    PartnerRequestModel.countDocuments(filter),
  ]);
  return { items: docs.map(toPartnerRequest), page: query.page, pageSize: query.pageSize, total };
}

export async function getPartnerRequest(id: string): Promise<PartnerRequest> {
  const doc = await PartnerRequestModel.findById(id).lean();
  if (!doc) throw new AppError("NOT_FOUND", 404, "Partner request not found");
  return toPartnerRequest(doc);
}

export async function updatePartnerRequest(
  id: string,
  update: UpdatePartnerRequest,
  actorId: string,
): Promise<PartnerRequest> {
  if (update.status === undefined && update.note === undefined) {
    throw new AppError("VALIDATION_ERROR", 422, "Give a status, a note, or both");
  }
  const actor = new mongoose.Types.ObjectId(actorId);
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await PartnerRequestModel.findById(id).lean();
    if (!current) throw new AppError("NOT_FOUND", 404, "Partner request not found");
    const at = new Date();
    const notes: PartnerRequestDoc["notes"] = [];
    const changesStatus = update.status !== undefined && update.status !== current.status;
    if (changesStatus) {
      notes.push({
        at,
        actorId: actor,
        text: `Status changed from ${current.status} to ${update.status}`,
      });
    }
    if (update.note !== undefined) notes.push({ at, actorId: actor, text: update.note });
    // The filter on the status read above stops two staff overwriting each other's change.
    const updated = await PartnerRequestModel.findOneAndUpdate(
      { _id: current._id, status: current.status },
      {
        $set: { updatedAt: at, ...(changesStatus && { status: update.status }) },
        ...(notes.length > 0 && { $push: { notes: { $each: notes } } }),
      },
      { returnDocument: "after" },
    ).lean();
    if (updated) return toPartnerRequest(updated);
  }
  throw new AppError("CONFLICT", 409, "The request changed while saving. Try again.");
}
