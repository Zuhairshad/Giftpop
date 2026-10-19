import { randomInt } from "node:crypto";

import {
  ORDER_NUMBER_ALPHABET,
  validateAddress,
  type ColourOption,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type ItemSnapshot,
  type PackagingSnapshot,
  type PublicOrderView,
  type TrackOrderRequest,
} from "@giftpop/contracts";
import mongoose from "mongoose";

import { AppError, isDuplicateKeyError } from "../../lib/errors";
import { reserveStock, type StockLine } from "../catalog/stock.service";
import { CountryModel, type CountryDoc } from "../countries/model";
import { enqueue } from "../notifications/service";
import { loadValidatedDesign, priceDesign, type DesignContext } from "../quotes/service";

import { contactMatches } from "./contact";
import { OrderModel, type OrderDoc } from "./model";
import { toPublicOrderView } from "./public-view";

const NUMBER_ATTEMPTS = 5;
const NUMBER_SUFFIX_LENGTH = 6;

export function generateOrderNumber(country: string): string {
  let suffix = "";
  for (let i = 0; i < NUMBER_SUFFIX_LENGTH; i += 1) {
    suffix += ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)];
  }
  return `GP-${country}-${suffix}`;
}

/** Frozen copies of everything sold, taken from the database catalog, never from the client. */
function buildSnapshots(
  { catalog }: DesignContext,
  request: CreateOrderRequest,
): { packaging: PackagingSnapshot; items: ItemSnapshot[] } {
  const priced = catalog.packagings.find((p) => p.packaging.id === request.design.packagingId);
  if (!priced) throw new AppError("INTERNAL", 500, "Validated packaging is missing");
  const { packaging } = priced;

  const items = request.design.items.map((line): ItemSnapshot => {
    const entry = catalog.items.find((i) => i.item.id === line.itemId);
    if (!entry) throw new AppError("INTERNAL", 500, "Validated item is missing");
    const { item } = entry;
    return {
      itemId: item.id,
      name: item.name,
      shape: item.shape,
      color: item.color,
      sizeUnits: item.sizeUnits,
      unitPriceMinor: entry.priceMinor,
      qty: line.qty,
      ...(item.image ? { image: item.image } : {}),
    };
  });

  const wrapperColorName = paletteName(packaging.wrapperColors, request.design.wrapperColor);
  const ribbonColorName = paletteName(packaging.ribbonColors, request.design.ribbonColor);
  return {
    packaging: {
      packagingId: packaging.id,
      name: packaging.name,
      layoutType: packaging.layoutType,
      priceMinor: priced.priceMinor,
      minItems: packaging.minItems,
      maxItems: packaging.maxItems,
      capacityUnits: packaging.capacityUnits,
      layers: packaging.layers,
      ...(wrapperColorName ? { wrapperColorName } : {}),
      ...(ribbonColorName ? { ribbonColorName } : {}),
    },
    items,
  };
}

/** The palette name for a chosen hex, so staff read "Blush" on the order even after the palette changes. */
function paletteName(palette: readonly ColourOption[], hex: string): string | undefined {
  return palette.find((option) => option.hex.toLowerCase() === hex.toLowerCase())?.name;
}

function stockLines(
  country: string,
  snapshots: { packaging: PackagingSnapshot; items: ItemSnapshot[] },
): StockLine[] {
  const perItem = new Map<string, number>();
  for (const item of snapshots.items) {
    perItem.set(item.itemId, (perItem.get(item.itemId) ?? 0) + item.qty);
  }
  return [
    { kind: "packaging", targetId: snapshots.packaging.packagingId, country, qty: 1 },
    ...[...perItem].map(([targetId, qty]): StockLine => ({ kind: "item", targetId, country, qty })),
  ];
}

function assertCanOrder(country: CountryDoc, request: CreateOrderRequest): void {
  if (!country.paymentModes.includes(request.paymentMode)) {
    throw new AppError(
      "VALIDATION_ERROR",
      422,
      `${country.name} does not take ${request.paymentMode} payment`,
      { allowed: country.paymentModes },
    );
  }
  const problems = validateAddress(request.address, country.addressFormat);
  if (problems.length > 0) {
    throw new AppError("VALIDATION_ERROR", 422, "The address is incomplete", problems);
  }
}

/**
 * Places an order. Everything that must hold together (stock, order, outbox message)
 * happens in one transaction, so a failure at any step leaves nothing behind. Prices
 * come only from the database. A duplicate order number retries the transaction.
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const context = await loadValidatedDesign(request.country, request.design);
  const { country } = context;
  assertCanOrder(country, request);

  const quote = priceDesign(context, request.design).quotes.find(
    (q) => q.mode === request.paymentMode,
  );
  if (!quote) throw new AppError("INTERNAL", 500, "Quote for the chosen payment mode is missing");
  const snapshots = buildSnapshots(context, request);
  const lines = stockLines(country.code, snapshots);

  for (let attempt = 1; ; attempt += 1) {
    const number = generateOrderNumber(country.code);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await reserveStock(lines, session);
        const now = new Date();
        const doc: Omit<OrderDoc, "_id" | "createdAt" | "updatedAt"> = {
          number,
          country: country.code,
          contact: request.contact,
          address: request.address,
          design: request.design,
          packaging: snapshots.packaging,
          items: snapshots.items,
          quote,
          paymentMode: request.paymentMode,
          paymentStatus: "unpaid",
          status: "awaiting_payment",
          history: [{ from: null, to: "awaiting_payment", at: now, actorId: null }],
          shipment: null,
          payments: [],
          notes: [],
          proofs: [],
        };
        const [created] = await OrderModel.create([doc], { session });
        if (!created) throw new AppError("INTERNAL", 500, "Order was not stored");
        await enqueue(
          {
            type: "order_created",
            orderId: created._id.toHexString(),
            payload: {
              number,
              country: country.code,
              paymentMode: request.paymentMode,
              totalMinor: quote.totalMinor,
              dueNowMinor: quote.dueNowMinor,
              currency: quote.currency,
              paymentInstructions: country.paymentInstructions,
            },
          },
          session,
        );
      });
      return {
        number,
        quote,
        paymentMode: request.paymentMode,
        paymentInstructions: country.paymentInstructions,
      };
    } catch (error) {
      if (isDuplicateKeyError(error) && attempt < NUMBER_ATTEMPTS) continue;
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

/**
 * Customer tracking. An unknown number and a wrong phone or email answer with the
 * same 404, so a number cannot be probed.
 */
export async function trackOrder({ number, contact }: TrackOrderRequest): Promise<PublicOrderView> {
  const order = await OrderModel.findOne({ number: number.toUpperCase() }).lean<OrderDoc>();
  if (!order || !contactMatches(order.contact, contact)) {
    throw new AppError("NOT_FOUND", 404, "We could not find an order with those details");
  }
  const country = await CountryModel.findOne({ code: order.country }).lean<CountryDoc>();
  return toPublicOrderView(order, country?.paymentInstructions ?? "");
}
