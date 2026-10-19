import {
  CreateOrderRequestSchema,
  TrackOrderRequestSchema,
  type CreateOrderRequest,
  type TrackOrderRequest,
} from "@giftpop/contracts";
import { Router, type RequestHandler } from "express";
import { MemoryStore, type Store } from "express-rate-limit";

import { validateBody } from "../../lib/validate";
import { idempotency } from "../../middleware/idempotency";
import { createIpLimiter } from "../quotes/rate-limit";

import {
  defaultOrderStore,
  defaultTrackStore,
  ORDERS_PER_MINUTE,
  TRACKS_PER_MINUTE,
} from "./rate-limit";
import { createOrder, trackOrder } from "./service";

export interface OrdersRouterOptions {
  /** Replace the tracking limiter, for example with a tighter or fresh one in tests. */
  limiter?: RequestHandler;
  /** Counter store for the default limiter. Each limiter needs its own store. */
  store?: Store;
  /** Limits how many orders one IP can place; replaceable in tests. */
  orderLimiter?: RequestHandler;
  orderStore?: Store;
}

/** Customers type numbers in any case; the contract only accepts upper case. */
const upperCaseNumber: RequestHandler = (req, _res, next) => {
  const body: unknown = req.body;
  if (typeof body === "object" && body !== null && "number" in body) {
    const { number } = body as { number: unknown };
    if (typeof number === "string") req.body = { ...body, number: number.trim().toUpperCase() };
  }
  next();
};

export function createOrdersRouter({
  store = new MemoryStore(),
  limiter = createIpLimiter({
    limit: TRACKS_PER_MINUTE,
    store,
    message: "Too many lookups. Try again in a minute.",
  }),
  orderStore = new MemoryStore(),
  orderLimiter = createIpLimiter({
    limit: ORDERS_PER_MINUTE,
    store: orderStore,
    message: "Too many orders. Try again in a minute.",
  }),
}: OrdersRouterOptions = {}): Router {
  const router = Router();

  // The schema strips unknown keys, so a price sent by the client never reaches the service.
  router.post(
    "/",
    orderLimiter,
    validateBody(CreateOrderRequestSchema),
    idempotency(),
    async (req, res) => {
      res.status(201).json(await createOrder(req.body as CreateOrderRequest));
    },
  );

  router.post(
    "/track",
    limiter,
    upperCaseNumber,
    validateBody(TrackOrderRequestSchema),
    async (req, res) => {
      res.json(await trackOrder(req.body as TrackOrderRequest));
    },
  );

  return router;
}

export const ordersRouter: Router = createOrdersRouter({
  store: defaultTrackStore,
  orderStore: defaultOrderStore,
});
