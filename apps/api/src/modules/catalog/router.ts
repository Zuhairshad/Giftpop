import { CountryParamSchema } from "@giftpop/contracts";
import { Router, type Request } from "express";
import { z } from "zod";

import { validateQuery } from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";

import { catalogAdminRouter } from "./admin-router";
import { getCountryCatalog } from "./public.service";

const CatalogQuerySchema = z.object({ country: CountryParamSchema });
type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export const catalogRouter: Router = Router();

catalogRouter.get(
  "/",
  validateQuery(CatalogQuerySchema),
  async (req: Request<unknown, unknown, unknown, CatalogQuery>, res) => {
    const catalog = await getCountryCatalog(req.query.country);
    res.set("Cache-Control", PUBLIC_CACHE).json(catalog);
  },
);

catalogRouter.use("/admin", requireStaff(), catalogAdminRouter);
