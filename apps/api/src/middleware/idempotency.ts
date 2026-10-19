import { createHash } from "node:crypto";

import { IDEMPOTENCY_KEY_HEADER } from "@giftpop/contracts";
import type { RequestHandler, Response } from "express";
import { model, Schema, type Types } from "mongoose";

import { AppError, isDuplicateKeyError } from "../lib/errors";

export interface IdempotencyOptions {
  /** How long a stored response is replayed. Defaults to 24 hours. */
  ttlMs?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** A "processing" marker older than this belongs to a request that died; it may be taken over. */
const STALE_PROCESSING_MS = 60_000;
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

interface IdempotencyDoc {
  _id: Types.ObjectId;
  key: string;
  route: string;
  bodyHash: string;
  state: "processing" | "done";
  status?: number;
  response?: unknown;
  createdAt: Date;
}

const idempotencySchema = new Schema<IdempotencyDoc>(
  {
    key: { type: String, required: true },
    route: { type: String, required: true },
    bodyHash: { type: String, required: true },
    state: { type: String, required: true },
    status: { type: Number },
    response: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { versionKey: false, collection: "idempotencyKeys", minimize: false },
);
// A key is unique per route; the TTL index removes stored responses after 24 hours.
idempotencySchema.index({ key: 1, route: 1 }, { unique: true });
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: DAY_MS / 1000 });

export const IdempotencyModel = model<IdempotencyDoc>("IdempotencyKey", idempotencySchema);

let indexesReady: Promise<unknown> | undefined;

/** Canonical JSON: object keys sorted, so key order in the body never changes the hash. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function hashBody(body: unknown): string {
  return createHash("sha256").update(canonical(body)).digest("hex");
}

/**
 * Makes a POST safe to retry. Requires the `Idempotency-Key` header (8 to 100
 * URL-safe characters). The first request with a key inserts a "processing" marker
 * (unique per key and route); the same key with the same body then replays the first
 * successful response, the same key with a different body answers 409, and a second
 * request while the first is still running answers 409 "request in progress".
 * Only 2xx responses are stored: a failed attempt (4xx or 5xx) frees the key so the
 * client can retry. Mount it after body validation so the hash covers the parsed body.
 */
export function idempotency({ ttlMs = DAY_MS }: IdempotencyOptions = {}): RequestHandler {
  return async (req, res, next) => {
    try {
      const key = req.header(IDEMPOTENCY_KEY_HEADER);
      if (!key || !KEY_PATTERN.test(key)) {
        throw new AppError(
          "VALIDATION_ERROR",
          400,
          `${IDEMPOTENCY_KEY_HEADER} header is required (8 to 100 letters, digits, - or _)`,
        );
      }
      indexesReady ??= IdempotencyModel.init();
      await indexesReady;

      const route = `${req.method} ${req.baseUrl}${req.path}`;
      const bodyHash = hashBody(req.body);
      const scope = { key, route };

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await IdempotencyModel.create({ ...scope, bodyHash, state: "processing" });
          watchResponse(res, scope);
          next();
          return;
        } catch (error) {
          if (!isDuplicateKeyError(error)) throw error;
        }

        const existing = await IdempotencyModel.findOne(scope).lean<IdempotencyDoc>();
        if (!existing) continue; // removed in between: try to claim it again
        const age = Date.now() - existing.createdAt.getTime();
        if (existing.state === "done" && age > ttlMs) {
          await IdempotencyModel.deleteOne({ _id: existing._id, state: "done" });
          continue;
        }
        if (existing.state === "processing" && age > STALE_PROCESSING_MS) {
          await IdempotencyModel.deleteOne({ _id: existing._id, state: "processing" });
          continue;
        }
        if (existing.bodyHash !== bodyHash) {
          throw new AppError(
            "CONFLICT",
            409,
            "This Idempotency-Key was already used with a different request",
          );
        }
        if (existing.state === "processing") {
          throw new AppError("CONFLICT", 409, "A request with this key is already in progress");
        }
        res.status(existing.status ?? 200).json(existing.response);
        return;
      }
      throw new AppError("CONFLICT", 409, "A request with this key is already in progress");
    } catch (error) {
      next(error);
    }
  };
}

/** Stores a 2xx response before it is sent, and frees the key for anything else. */
function watchResponse(res: Response, scope: { key: string; route: string }): void {
  const send = res.json.bind(res);
  let settled = false;

  res.json = ((body?: unknown) => {
    if (settled) return send(body);
    settled = true;
    const status = res.statusCode;
    const done =
      status >= 200 && status < 300
        ? IdempotencyModel.updateOne(scope, {
            $set: { state: "done", status, response: body, createdAt: new Date() },
          })
        : IdempotencyModel.deleteOne({ ...scope, state: "processing" });
    // Persist first so an immediate retry cannot see "processing". Always send.
    void done.then(
      () => send(body),
      () => send(body),
    );
    return res;
  }) as Response["json"];

  // A response that never went through json (client left, crash) frees the key.
  res.on("close", () => {
    if (settled) return;
    settled = true;
    void IdempotencyModel.deleteOne({ ...scope, state: "processing" }).catch(() => undefined);
  });
}
