import {
  CreatePartnerRequestSchema,
  PARTNER_HONEYPOT_FIELD,
  PartnerRequestListQuerySchema,
  UpdatePartnerRequestSchema,
  type CreatePartnerRequest,
  type PartnerRequestListQuery,
  type PartnerRequestReceived,
  type UpdatePartnerRequest,
} from "@giftpop/contracts";
import { Router, type RequestHandler } from "express";
import { MemoryStore, type Store } from "express-rate-limit";

import { IdParamsSchema, validateBody, validateParams, validateQuery } from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";
import { createIpLimiter } from "../quotes/rate-limit";

import { defaultPartnerStore, PARTNER_REQUESTS_PER_HOUR, PARTNER_WINDOW_MS } from "./rate-limit";
import {
  createPartnerRequest,
  getPartnerRequest,
  listPartnerRequests,
  updatePartnerRequest,
} from "./service";

export interface PartnersRouterOptions {
  /** Replace the public limiter, for example with a fresh one in tests. */
  limiter?: RequestHandler;
  store?: Store;
}

const RECEIVED: PartnerRequestReceived = { received: true };

/** Bots fill the hidden field; they get the normal answer and nothing is stored. */
function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const value = (body as Record<string, unknown>)[PARTNER_HONEYPOT_FIELD];
  return typeof value === "string" && value.length > 0;
}

/** Pasted emails often carry spaces, which the email schema would reject. */
const trimEmail: RequestHandler = (req, _res, next) => {
  const body: unknown = req.body;
  if (typeof body === "object" && body !== null && "email" in body) {
    const { email } = body as { email: unknown };
    if (typeof email === "string") req.body = { ...body, email: email.trim() };
  }
  next();
};

export function createPartnersRouter({
  store = new MemoryStore(),
  limiter = createIpLimiter({
    limit: PARTNER_REQUESTS_PER_HOUR,
    windowMs: PARTNER_WINDOW_MS,
    store,
    message: "Too many requests. Try again in an hour.",
  }),
}: PartnersRouterOptions = {}): Router {
  const router = Router();

  router.post(
    "/",
    limiter,
    (req, res, next) => {
      if (isHoneypotFilled(req.body)) {
        res.status(201).json(RECEIVED);
        return;
      }
      next();
    },
    trimEmail,
    validateBody(CreatePartnerRequestSchema),
    async (req, res) => {
      await createPartnerRequest(req.body as CreatePartnerRequest);
      res.status(201).json(RECEIVED);
    },
  );

  router.get(
    "/admin",
    requireStaff(),
    validateQuery(PartnerRequestListQuerySchema),
    async (req, res) => {
      res.json(await listPartnerRequests(req.query as unknown as PartnerRequestListQuery));
    },
  );

  router.get("/admin/:id", requireStaff(), validateParams(IdParamsSchema), async (req, res) => {
    res.json(await getPartnerRequest(req.params["id"] as string));
  });

  router.patch(
    "/admin/:id",
    requireStaff(),
    validateParams(IdParamsSchema),
    validateBody(UpdatePartnerRequestSchema),
    async (req, res) => {
      const staff = req.staff;
      if (!staff) throw new Error("requireStaff did not set req.staff");
      res.json(
        await updatePartnerRequest(
          req.params["id"] as string,
          req.body as UpdatePartnerRequest,
          staff.id,
        ),
      );
    },
  );

  return router;
}

export const partnersRouter: Router = createPartnersRouter({ store: defaultPartnerStore });
