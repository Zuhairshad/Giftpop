import type { ClientSession } from "mongoose";

import { AppError } from "../../lib/errors";

import { toObjectId } from "./mappers";
import { CountryPriceModel } from "./model";

export interface StockLine {
  kind: "item" | "packaging";
  targetId: string;
  country: string;
  qty: number;
}

function soldOut(line: StockLine): AppError {
  return new AppError("CONFLICT", 409, "Something in this gift just sold out", {
    outOfStock: [{ kind: line.kind, targetId: line.targetId }],
  });
}

/**
 * Takes units off the shelf for an order. Rows that count stock are decremented in
 * one conditional update, so two orders for the last unit cannot both win; rows
 * that do not count stock only need `inStock`. Throws 409 when a line is short.
 * Pass the order's transaction session so a failure rolls everything back.
 */
export async function reserveStock(lines: StockLine[], session?: ClientSession): Promise<void> {
  for (const line of lines) {
    const filter = {
      country: line.country,
      kind: line.kind,
      targetId: toObjectId(line.targetId),
    };
    const row = await CountryPriceModel.findOne(filter)
      .session(session ?? null)
      .lean();
    if (!row?.inStock) throw soldOut(line);
    if (row.stockQty === undefined || row.stockQty === null) continue;

    const left = { $subtract: ["$stockQty", line.qty] };
    const result = await CountryPriceModel.updateOne(
      { ...filter, inStock: true, stockQty: { $gte: line.qty } },
      [{ $set: { stockQty: left, inStock: { $gt: [left, 0] } } }],
      { session, updatePipeline: true },
    );
    if (result.modifiedCount === 0) throw soldOut(line);
  }
}

/** Puts units back (a cancelled order). A row that sold out because it hit 0 goes back on sale. */
export async function releaseStock(lines: StockLine[], session?: ClientSession): Promise<void> {
  for (const line of lines) {
    await CountryPriceModel.updateOne(
      {
        country: line.country,
        kind: line.kind,
        targetId: toObjectId(line.targetId),
        stockQty: { $exists: true },
      },
      [
        {
          $set: {
            stockQty: { $add: ["$stockQty", line.qty] },
            inStock: { $cond: [{ $eq: ["$stockQty", 0] }, true, "$inStock"] },
          },
        },
      ],
      { session, updatePipeline: true },
    );
  }
}
