import { ErrorResponseSchema } from "@giftpop/contracts";
import type { ErrorResponse } from "@giftpop/contracts";
import type { z } from "zod";

import { getApiUrl } from "./env";

/** Browser calls go through the Next.js rewrite; server calls go straight to the API. */
const BROWSER_BASE = "/api";

export type ApiErrorBody = ErrorResponse["error"];

/** Thrown for every failed API call. `code` comes from the API's `ErrorResponse` when there is one. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON, or as multipart when it is a `FormData`. Build JSON from a contract type; never include prices. */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Override for tests. */
  fetchImpl?: typeof fetch;
  /** Override for tests. Defaults to `/api` in the browser and `${API_URL}/v1` on the server. */
  baseUrl?: string;
}

function resolveBase(override?: string): string {
  if (override !== undefined) return override.replace(/\/+$/, "");
  return typeof window === "undefined" ? `${getApiUrl()}/v1` : BROWSER_BASE;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Calls the API and parses the response with a contract schema.
 * Always sends the session cookie (`credentials: "include"`).
 */
export async function apiFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  options: ApiRequestOptions = {},
): Promise<z.infer<S>> {
  const { method = "GET", body, headers, signal, fetchImpl = fetch, baseUrl } = options;
  const url = `${resolveBase(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;

  // The browser sets the multipart boundary itself, so a form body gets no Content-Type.
  const isForm = body instanceof FormData;
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: isForm ? body : JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  };

  let response: Response;
  try {
    response = await fetchImpl(url, init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, { code: "NETWORK_ERROR", message: "Could not reach the server." });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const parsedError = ErrorResponseSchema.safeParse(payload);
    if (parsedError.success) throw new ApiError(response.status, parsedError.data.error);
    throw new ApiError(response.status, {
      code: "UNEXPECTED_RESPONSE",
      message: `The server answered with status ${response.status}.`,
    });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(response.status, {
      code: "INVALID_RESPONSE",
      message: "The server sent a response in an unexpected shape.",
      details: parsed.error.issues,
    });
  }
  return parsed.data;
}
