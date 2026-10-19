import {
  ItemListQuerySchema,
  PaginationQuerySchema,
  SaveItemRequestSchema,
  SavePackagingRequestSchema,
  SetPricesRequestSchema,
  type SaveItemRequest,
  type SavePackagingRequest,
  type SetPricesRequest,
} from "@giftpop/contracts";
import { Router, type Request } from "express";

import { IdParamsSchema, validateBody, validateParams, type IdParams } from "../../lib/validate";

import {
  createItem,
  getItem,
  getItemPrices,
  listCategories,
  listItems,
  replaceItem,
  setItemPrices,
} from "./items.service";
import {
  createPackaging,
  getPackaging,
  getPackagingPrices,
  listPackagings,
  replacePackaging,
  setPackagingPrices,
} from "./packagings.service";

/**
 * Staff routes, mounted at `/admin`. The parent router puts `requireStaff()` in
 * front of this whole router, so every route here is behind it.
 */
export const catalogAdminRouter: Router = Router();

catalogAdminRouter.get("/categories", async (_req, res) => {
  res.json(await listCategories());
});

// Items

catalogAdminRouter.get("/items", async (req, res) => {
  // Parsed here, not in middleware: the output has numbers and booleans, which
  // Express's `req.query` type cannot carry.
  res.json(await listItems(ItemListQuerySchema.parse(req.query)));
});

catalogAdminRouter.post(
  "/items",
  validateBody(SaveItemRequestSchema),
  async (req: Request<unknown, unknown, SaveItemRequest>, res) => {
    res.status(201).json(await createItem(req.body));
  },
);

catalogAdminRouter.get(
  "/items/:id",
  validateParams(IdParamsSchema),
  async (req: Request<IdParams>, res) => {
    res.json(await getItem(req.params.id));
  },
);

catalogAdminRouter.put(
  "/items/:id",
  validateParams(IdParamsSchema),
  validateBody(SaveItemRequestSchema),
  async (req: Request<IdParams, unknown, SaveItemRequest>, res) => {
    res.json(await replaceItem(req.params.id, req.body));
  },
);

catalogAdminRouter.get(
  "/items/:id/prices",
  validateParams(IdParamsSchema),
  async (req: Request<IdParams>, res) => {
    res.json(await getItemPrices(req.params.id));
  },
);

catalogAdminRouter.put(
  "/items/:id/prices",
  validateParams(IdParamsSchema),
  validateBody(SetPricesRequestSchema),
  async (req: Request<IdParams, unknown, SetPricesRequest>, res) => {
    res.json(await setItemPrices(req.params.id, req.body));
  },
);

// Packagings

catalogAdminRouter.get("/packagings", async (req, res) => {
  res.json(await listPackagings(PaginationQuerySchema.parse(req.query)));
});

catalogAdminRouter.post(
  "/packagings",
  validateBody(SavePackagingRequestSchema),
  async (req: Request<unknown, unknown, SavePackagingRequest>, res) => {
    res.status(201).json(await createPackaging(req.body));
  },
);

catalogAdminRouter.get(
  "/packagings/:id",
  validateParams(IdParamsSchema),
  async (req: Request<IdParams>, res) => {
    res.json(await getPackaging(req.params.id));
  },
);

catalogAdminRouter.put(
  "/packagings/:id",
  validateParams(IdParamsSchema),
  validateBody(SavePackagingRequestSchema),
  async (req: Request<IdParams, unknown, SavePackagingRequest>, res) => {
    res.json(await replacePackaging(req.params.id, req.body));
  },
);

catalogAdminRouter.get(
  "/packagings/:id/prices",
  validateParams(IdParamsSchema),
  async (req: Request<IdParams>, res) => {
    res.json(await getPackagingPrices(req.params.id));
  },
);

catalogAdminRouter.put(
  "/packagings/:id/prices",
  validateParams(IdParamsSchema),
  validateBody(SetPricesRequestSchema),
  async (req: Request<IdParams, unknown, SetPricesRequest>, res) => {
    res.json(await setPackagingPrices(req.params.id, req.body));
  },
);
