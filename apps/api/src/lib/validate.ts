import { ObjectIdSchema } from "@giftpop/contracts";
import type { RequestHandler } from "express";
import { z } from "zod";

/** `/:id` route params for any resource keyed by a Mongo ObjectId. */
export const IdParamsSchema = z.object({ id: ObjectIdSchema });
export type IdParams = z.infer<typeof IdParamsSchema>;

type Source = "body" | "query" | "params";

function validateSource(source: Source, schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    // A ZodError thrown here is mapped to VALIDATION_ERROR by the error middleware.
    const parsed: unknown = schema.parse(req[source]);
    // Express 5 defines `req.query` as a getter, so define an own property instead of assigning.
    Object.defineProperty(req, source, {
      value: parsed,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}

/** Parse `req.body` with a contract schema and replace it with the parsed value. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return validateSource("body", schema);
}

/** Parse `req.query` with a contract schema and replace it with the parsed value. */
export function validateQuery(schema: z.ZodType): RequestHandler {
  return validateSource("query", schema);
}

/** Parse `req.params` with a contract schema and replace it with the parsed value. */
export function validateParams(schema: z.ZodType): RequestHandler {
  return validateSource("params", schema);
}
