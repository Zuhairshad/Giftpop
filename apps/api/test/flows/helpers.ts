// Shared helpers for the end-to-end order flow tests. Tests only; never imported by app code.
import { randomUUID } from "node:crypto";

import {
  CreateOrderResponseSchema,
  IDEMPOTENCY_KEY_HEADER,
  type Contact,
  type CreateOrderResponse,
  type Design,
  type Item,
  type Packaging,
  type PaymentMode,
} from "@giftpop/contracts";
import type { Express } from "express";
import mongoose, { Types } from "mongoose";
import sharp from "sharp";
import request from "supertest";
import { beforeAll, beforeEach, expect } from "vitest";

import { initCatalogModels } from "../../src/modules/catalog/fixtures";
import { modules } from "../../src/modules/index";
import { OrderModel, type OrderDoc } from "../../src/modules/orders/model";
import { resetQuoteRateLimit } from "../../src/modules/quotes/rate-limit";
import { createTestApp } from "../app";
import { clearDatabase, useTestMongo } from "../mongo";

export { makeItem, makePackaging } from "../../src/modules/catalog/fixtures";
export { makeCountry } from "../../src/modules/countries/fixtures";
export { itemPrice, makeDesign, seedWorld, type World } from "../../src/modules/quotes/fixtures";

/** The real app: every module from the registry, mounted under /v1. */
export function buildApp(): Express {
  return createTestApp(modules);
}

/** Start an in-memory replica set, create indexes, and empty the database before each test. */
export function useFlowDatabase(): void {
  useTestMongo();
  beforeAll(async () => {
    await initCatalogModels();
    await OrderModel.init();
  });
  beforeEach(async () => {
    await clearDatabase();
    resetQuoteRateLimit();
  });
}

export function newStaffId(): string {
  return new Types.ObjectId().toHexString();
}

export const SARA: Contact = {
  name: "Sara Khan",
  email: "sara@example.com",
  phone: "+92 300 1234567",
};

export const PK_ADDRESS = { line1: "12 Garden Road", city: "Lahore", region: "Punjab" };

export interface OrderBodyOptions {
  country?: string;
  mode?: PaymentMode;
  contact?: Contact;
  address?: Record<string, unknown>;
}

/** A valid `CreateOrderRequest` body. Callers may add extra fields afterwards. */
export function orderBody(design: Design, options: OrderBodyOptions = {}): Record<string, unknown> {
  return {
    country: options.country ?? "PK",
    design,
    contact: options.contact ?? SARA,
    address: options.address ?? PK_ADDRESS,
    paymentMode: options.mode ?? "cod",
  };
}

export function postOrder(app: Express, body: unknown, key: string = randomUUID()) {
  return request(app)
    .post("/v1/orders")
    .set(IDEMPOTENCY_KEY_HEADER, key)
    .send(body as object);
}

/** Places an order, asserts 201 and returns the parsed response. */
export async function placeOrder(
  app: Express,
  body: unknown,
  key?: string,
): Promise<CreateOrderResponse> {
  const res = await postOrder(app, body, key);
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return CreateOrderResponseSchema.parse(res.body);
}

export function postQuote(app: Express, country: string, design: Design) {
  return request(app).post("/v1/quotes").send({ country, design });
}

export function trackOrder(app: Express, number: string, contact: string) {
  return request(app).post("/v1/orders/track").send({ number, contact });
}

export async function storedOrder(number: string): Promise<OrderDoc> {
  const doc = await OrderModel.findOne({ number }).lean<OrderDoc>();
  if (!doc) throw new Error(`No stored order ${number}`);
  return doc;
}

export async function orderCount(): Promise<number> {
  return OrderModel.countDocuments({});
}

export interface OutboxRow {
  type: string;
  orderId: unknown;
  payload: Record<string, unknown>;
}

/** Rows of the `notificationOutbox` collection, optionally of one type. */
export async function outboxRows(type?: string): Promise<OutboxRow[]> {
  const rows = await mongoose.connection
    .collection("notificationOutbox")
    .find(type ? { type } : {})
    .toArray();
  return rows as unknown as OutboxRow[];
}

/** A small valid PNG, made with sharp. */
export function tinyPng(): Promise<Buffer> {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 30, b: 30 } },
  })
    .png()
    .toBuffer();
}

export interface PriceRowView {
  stockQty?: number | null;
  inStock: boolean;
  priceMinor: number;
}

/** The stored price row for an item or packaging in a country. */
export async function priceRow(
  kind: "item" | "packaging",
  target: Item | Packaging,
  country: string,
): Promise<PriceRowView | null> {
  const row = await mongoose.connection
    .collection("countryPrices")
    .findOne({ kind, targetId: new Types.ObjectId(target.id), country });
  return row as unknown as PriceRowView | null;
}
