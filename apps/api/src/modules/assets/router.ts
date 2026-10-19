import {
  AssetUploadResponseSchema,
  ObjectIdSchema,
  UpdateAssetAnchorRequestSchema,
  type AssetUploadResponse,
} from "@giftpop/contracts";
import { Router } from "express";
import { z } from "zod";

import { AppError } from "../../lib/errors";
import { ASSET_CACHE_CONTROL, getStorage, LocalStorage, type Storage } from "../../lib/storage";
import { requireStaff } from "../../middleware/require-staff";

import { createAsset, updateAssetAnchor } from "./service";
import { readUpload } from "./upload";

const IdParamsSchema = z.object({ id: ObjectIdSchema });

/**
 * Routes under `/v1/assets`. Pass `resolveStorage` to use a different driver (tests do).
 *
 * - `POST /`            staff, multipart `file`; 201 with `{ asset }`.
 *                       413 too large, 415 not PNG/WebP/JPEG (checked by magic bytes),
 *                       400 corrupt image or no file, 401 anonymous.
 * - `PATCH /:id`        staff, `{ anchor }`; 200 with `{ asset }`, 404 unknown id.
 * - `GET /files/*key`   dev only, local driver; 404 with any other driver.
 */
export function createAssetsRouter(resolveStorage: () => Storage = getStorage): Router {
  const router = Router();

  router.post("/", requireStaff(), readUpload, async (req, res) => {
    const upload = req.file;
    if (!upload) throw new AppError("VALIDATION_ERROR", 400, "No file was uploaded");
    const asset = await createAsset(resolveStorage(), upload.buffer);
    const body: AssetUploadResponse = AssetUploadResponseSchema.parse({ asset });
    res.status(201).json(body);
  });

  router.patch("/:id", requireStaff(), async (req, res) => {
    // A ZodError from either parse is answered as VALIDATION_ERROR by the error middleware.
    const { id } = IdParamsSchema.parse(req.params);
    const request = UpdateAssetAnchorRequestSchema.parse(req.body);
    const asset = await updateAssetAnchor(id, request);
    const body: AssetUploadResponse = AssetUploadResponseSchema.parse({ asset });
    res.json(body);
  });

  // Public on purpose: the browser loads images from here in development.
  router.get("/files/*key", async (req, res) => {
    const storage = resolveStorage();
    if (!(storage instanceof LocalStorage)) throw new AppError("NOT_FOUND", 404, "Not found");
    const segments: unknown = req.params["key"];
    const key = Array.isArray(segments) ? segments.join("/") : "";
    const contentType = storage.contentTypeFor(key);
    const file = contentType ? await storage.read(key) : undefined;
    if (!contentType || !file) throw new AppError("NOT_FOUND", 404, "Not found");
    res.set({
      "Content-Type": contentType,
      "Content-Length": String(file.length),
      "Cache-Control": ASSET_CACHE_CONTROL,
      // helmet defaults to same-origin; the store and admin run on other origins.
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(file);
  });

  return router;
}

export const assetsRouter: Router = createAssetsRouter();
