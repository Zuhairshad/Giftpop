import type {
  AdminOrderListItem,
  AdminOrderListQuery,
  AdminOrderListResponse,
} from "@giftpop/contracts";
import { Types, type QueryFilter } from "mongoose";

import { AppError } from "../../lib/errors";
import { OrderModel, type OrderDoc } from "../orders/model";

const badCursor = () => new AppError("VALIDATION_ERROR", 400, "That page cursor is not valid");

interface Cursor {
  at: number;
  id: string;
}

export function encodeCursor(doc: Pick<OrderDoc, "_id" | "createdAt">): string {
  const cursor: Cursor = { at: doc.createdAt.getTime(), id: doc._id.toHexString() };
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw: string): Cursor {
  try {
    const value: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof value === "object" && value !== null && "at" in value && "id" in value) {
      const { at, id } = value as { at: unknown; id: unknown };
      if (
        typeof at === "number" &&
        Number.isSafeInteger(at) &&
        typeof id === "string" &&
        /^[0-9a-f]{24}$/.test(id)
      ) {
        return { at, id };
      }
    }
  } catch {
    // fall through to the error below
  }
  throw badCursor();
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function startOfDay(day: string): Date {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
    throw new AppError("VALIDATION_ERROR", 400, `${day} is not a real date`);
  }
  return date;
}

function searchClause(search: string): QueryFilter<OrderDoc> {
  const or: QueryFilter<OrderDoc>[] = [
    { number: search.toUpperCase() },
    { "contact.email": { $regex: `^${escapeRegex(search)}$`, $options: "i" } },
  ];
  const digits = search.replace(/\D/g, "");
  if (/^[\d\s+()-]+$/.test(search) && digits.length >= 3) {
    or.push({ "contact.phone": { $regex: `^\\D*${digits.split("").join("\\D*")}\\D*$` } });
  }
  return { $or: or };
}

export function buildFilter(query: AdminOrderListQuery): QueryFilter<OrderDoc> {
  const and: QueryFilter<OrderDoc>[] = [];
  if (query.status) and.push({ status: query.status });
  if (query.paymentStatus) and.push({ paymentStatus: query.paymentStatus });
  if (query.country) and.push({ country: query.country.toUpperCase() });
  if (query.from) and.push({ createdAt: { $gte: startOfDay(query.from) } });
  if (query.to) {
    const end = startOfDay(query.to);
    end.setUTCDate(end.getUTCDate() + 1);
    and.push({ createdAt: { $lt: end } });
  }
  if (query.hasPendingProof === true) {
    and.push({ proofs: { $elemMatch: { status: "pending" } } });
  } else if (query.hasPendingProof === false) {
    and.push({ proofs: { $not: { $elemMatch: { status: "pending" } } } });
  }
  if (query.search) and.push(searchClause(query.search));
  if (query.cursor) {
    const { at, id } = decodeCursor(query.cursor);
    const date = new Date(at);
    and.push({
      $or: [
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new Types.ObjectId(id) } },
      ],
    });
  }
  return and.length > 0 ? { $and: and } : {};
}

function toListItem(doc: OrderDoc): AdminOrderListItem {
  return {
    id: doc._id.toHexString(),
    number: doc.number,
    createdAt: doc.createdAt.toISOString(),
    country: doc.country,
    customerName: doc.contact.name,
    currency: doc.quote.currency,
    totalMinor: doc.quote.totalMinor,
    paymentMode: doc.paymentMode,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    itemCount: doc.items.reduce((sum, item) => sum + item.qty, 0),
    hasPendingProof: (doc.proofs ?? []).some((proof) => proof.status === "pending"),
  };
}

export async function listOrders(query: AdminOrderListQuery): Promise<AdminOrderListResponse> {
  const docs = await OrderModel.find(buildFilter(query))
    .select(
      "number createdAt country contact.name quote paymentMode paymentStatus status items.qty proofs",
    )
    .sort({ createdAt: -1, _id: -1 })
    .limit(query.limit + 1)
    .lean<OrderDoc[]>();
  const page = docs.slice(0, query.limit);
  const last = page.at(-1);
  return {
    items: page.map(toListItem),
    nextCursor: docs.length > query.limit && last ? encodeCursor(last) : null,
  };
}
