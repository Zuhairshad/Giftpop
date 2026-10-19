import {
  CreateStaffRequestSchema,
  ObjectIdSchema,
  UpdateStaffRequestSchema,
  type CreateStaffRequest,
  type StaffUser,
  type UpdateStaffRequest,
} from "@giftpop/contracts";
import { Router } from "express";
import { z } from "zod";

import { AppError } from "../../lib/errors";
import { validateBody, validateParams } from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";
import { readSessionToken } from "../auth/cookie";

import { createStaff, listStaff, updateStaff } from "./service";

const IdParamsSchema = z.object({ id: ObjectIdSchema });

/** Staff management. Every route is owner only. */
export const staffRouter: Router = Router();

staffRouter.use(requireStaff("owner"));

staffRouter.get("/", async (_req, res) => {
  const staff: StaffUser[] = await listStaff();
  res.json(staff);
});

staffRouter.post("/", validateBody(CreateStaffRequestSchema), async (req, res) => {
  const created = await createStaff(req.body as CreateStaffRequest);
  res.status(201).json(created);
});

staffRouter.patch(
  "/:id",
  validateParams(IdParamsSchema),
  validateBody(UpdateStaffRequestSchema),
  async (req, res) => {
    if (!req.staff) throw new AppError("UNAUTHENTICATED", 401, "Sign in to continue");
    const { id } = req.params as z.infer<typeof IdParamsSchema>;
    const updated = await updateStaff(id, req.body as UpdateStaffRequest, {
      actor: req.staff,
      actorToken: readSessionToken(req),
    });
    res.json(updated);
  },
);
