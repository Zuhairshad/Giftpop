import type { ErrorResponse } from "@giftpop/contracts";
import type { z } from "zod";

/** The API answered with the contract's `{ error: { code, message, details? } }` shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, body: ErrorResponse["error"]) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

/** The request never produced a response (offline, DNS, refused connection, abort). */
export class ApiNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiNetworkError";
  }
}

/** The API answered, but the body did not match the contract schema (or was not JSON). */
export class ApiSchemaError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(message: string, issues: z.core.$ZodIssue[] = []) {
    super(message);
    this.name = "ApiSchemaError";
    this.issues = issues;
  }
}
