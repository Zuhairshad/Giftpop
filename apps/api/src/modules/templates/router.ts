import {
  TemplateListQuerySchema,
  TemplateStartRequestSchema,
  CreateTemplateRequestSchema,
  UpdateTemplateRequestSchema,
  type CreateTemplateRequest,
  type UpdateTemplateRequest,
} from "@giftpop/contracts";
import { Router, type Request, type RequestHandler } from "express";
import type { z } from "zod";

import {
  IdParamsSchema,
  validateBody,
  validateParams,
  validateQuery,
  type IdParams,
} from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";
import { createIpLimiter } from "../quotes/rate-limit";

import { listPublicTemplates } from "./public.service";
import { defaultStartStore, TEMPLATE_STARTS_PER_MINUTE } from "./rate-limit";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  startTemplate,
  updateTemplate,
} from "./service";

const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export interface TemplatesRouterOptions {
  /** Replace the start limiter, for example with a tighter or fresh one in tests. */
  startLimiter?: RequestHandler;
}

export function createTemplatesRouter({
  startLimiter = createIpLimiter({
    limit: TEMPLATE_STARTS_PER_MINUTE,
    store: defaultStartStore,
    message: "Too many requests. Try again in a minute.",
  }),
}: TemplatesRouterOptions = {}): Router {
  const router = Router();

  // Staff routes: every one is under /admin and behind the staff guard.
  router.use("/admin", requireStaff());
  router.get("/admin", async (_req, res) => {
    res.json(await listTemplates());
  });
  router.post("/admin", validateBody(CreateTemplateRequestSchema), async (req, res) => {
    res.status(201).json(await createTemplate(req.body as CreateTemplateRequest));
  });
  router.patch(
    "/admin/:id",
    validateParams(IdParamsSchema),
    validateBody(UpdateTemplateRequestSchema),
    async (req: Request<IdParams>, res) => {
      res.json(await updateTemplate(req.params.id, req.body as UpdateTemplateRequest));
    },
  );
  router.delete(
    "/admin/:id",
    validateParams(IdParamsSchema),
    async (req: Request<IdParams>, res) => {
      await deleteTemplate(req.params.id);
      res.status(204).end();
    },
  );

  // Public routes.
  router.get("/", validateQuery(TemplateListQuerySchema), async (req, res) => {
    // Unknown query keys (for example a client-sent price) are stripped by the schema and never read.
    const { country, category } = req.query as unknown as z.infer<typeof TemplateListQuerySchema>;
    const templates = await listPublicTemplates(country, category);
    res.set("Cache-Control", PUBLIC_CACHE).json(templates);
  });
  router.post(
    "/:id/start",
    startLimiter,
    validateParams(IdParamsSchema),
    async (req: Request<IdParams>, res) => {
      const { country } = TemplateStartRequestSchema.parse(req.body ?? {});
      res.json(await startTemplate(req.params.id, country));
    },
  );

  return router;
}

export const templatesRouter: Router = createTemplatesRouter();
