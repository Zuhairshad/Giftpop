import {
  CountryParamSchema,
  CreateCountryRequestSchema,
  UpdateCountryRequestSchema,
  type CreateCountryRequest,
  type UpdateCountryRequest,
} from "@giftpop/contracts";
import { Router, type Request } from "express";
import { z } from "zod";

import { validateBody, validateParams } from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";

import { createCountry, listCountries, listPublicCountries, updateCountry } from "./service";

const CodeParamsSchema = z.object({ code: CountryParamSchema });

const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export const countriesRouter: Router = Router();

countriesRouter.get("/", async (_req, res) => {
  const countries = await listPublicCountries();
  res.set("Cache-Control", PUBLIC_CACHE).json(countries);
});

countriesRouter.get("/admin", requireStaff(), async (_req, res) => {
  res.json(await listCountries());
});

countriesRouter.post(
  "/",
  requireStaff("owner"),
  validateBody(CreateCountryRequestSchema),
  async (req: Request<unknown, unknown, CreateCountryRequest>, res) => {
    res.status(201).json(await createCountry(req.body));
  },
);

countriesRouter.put(
  "/:code",
  requireStaff("owner"),
  validateParams(CodeParamsSchema),
  validateBody(UpdateCountryRequestSchema),
  async (req: Request<{ code: string }, unknown, UpdateCountryRequest>, res) => {
    res.json(await updateCountry(req.params.code, req.body));
  },
);
