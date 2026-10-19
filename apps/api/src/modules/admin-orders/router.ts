import {
  AddNoteRequestSchema,
  AdminOrderListQuerySchema,
  ObjectIdSchema,
  OrderStatusSchema,
  RecordPaymentRequestSchema,
  ReviewProofRequestSchema,
  TransitionFieldsSchema,
  type AddNoteRequest,
  type AdminOrderListQuery,
  type RecordPaymentRequest,
  type ReviewProofRequest,
} from "@giftpop/contracts";
import { Router, type Request } from "express";

import { AppError } from "../../lib/errors";
import { IdParamsSchema, validateBody, validateParams, validateQuery } from "../../lib/validate";
import { requireStaff } from "../../middleware/require-staff";

import { listOrders } from "./list";
import { addNote, addPayment, changeStatus, getOrderDetail, reviewProof } from "./service";

/**
 * Not `StatusChangeRequestSchema`: its refinement would answer a missing courier,
 * tracking number or reason with 400. The state machine reports those as 422
 * `MISSING_TRANSITION_FIELD` (and only after it knows the move is allowed).
 */
const StatusBodySchema = TransitionFieldsSchema.extend({ to: OrderStatusSchema });
const ProofParamsSchema = IdParamsSchema.extend({ proofId: ObjectIdSchema });

function staffId(req: Request): string {
  if (!req.staff) throw new AppError("UNAUTHENTICATED", 401, "Sign in to continue");
  return req.staff.id;
}

const orderId = (req: Request): string => IdParamsSchema.parse(req.params).id;

/** Staff routes, mounted at `/v1/admin/orders`. */
export const adminOrdersRouter: Router = Router();

adminOrdersRouter.use(requireStaff());

adminOrdersRouter.get("/", validateQuery(AdminOrderListQuerySchema), async (req, res) => {
  // `validateQuery` replaced `req.query` with the parsed value.
  res.json(await listOrders(req.query as unknown as AdminOrderListQuery));
});

adminOrdersRouter.get("/:id", validateParams(IdParamsSchema), async (req, res) => {
  res.json(await getOrderDetail(orderId(req)));
});

adminOrdersRouter.post(
  "/:id/status",
  validateParams(IdParamsSchema),
  validateBody(StatusBodySchema),
  async (req, res) => {
    const { to, ...fields } = StatusBodySchema.parse(req.body);
    res.json(await changeStatus(orderId(req), to, fields, staffId(req)));
  },
);

adminOrdersRouter.post(
  "/:id/payments",
  validateParams(IdParamsSchema),
  validateBody(RecordPaymentRequestSchema),
  async (req, res) => {
    res.json(await addPayment(orderId(req), req.body as RecordPaymentRequest, staffId(req)));
  },
);

adminOrdersRouter.post(
  "/:id/notes",
  validateParams(IdParamsSchema),
  validateBody(AddNoteRequestSchema),
  async (req, res) => {
    const { text } = req.body as AddNoteRequest;
    res.json(await addNote(orderId(req), text, staffId(req)));
  },
);

adminOrdersRouter.patch(
  "/:id/proofs/:proofId",
  validateParams(ProofParamsSchema),
  validateBody(ReviewProofRequestSchema),
  async (req, res) => {
    const { id, proofId } = ProofParamsSchema.parse(req.params);
    const { status } = req.body as ReviewProofRequest;
    res.json(await reviewProof(id, proofId, status));
  },
);
