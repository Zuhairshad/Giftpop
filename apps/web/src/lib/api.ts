import { ErrorResponseSchema } from "@giftpop/contracts";
import type { z } from "zod";

import { ApiError, ApiNetworkError, ApiSchemaError } from "./api-errors";
import { parseServerEnv } from "./env";

export { ApiError, ApiNetworkError, ApiSchemaError } from "./api-errors";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON. Never put a price in here: the server owns money. */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
  /** Overrides the base URL. Defaults to `/api` in the browser and `${API_URL}/v1` on the server. */
  baseUrl?: string;
  /** Injected in tests. */
  fetch?: typeof fetch;
};

function defaultBaseUrl(): string {
  // In the browser the Next.js rewrite proxies /api to the API. On the server we call the API directly.
  if (typeof window !== "undefined") return "/api";
  return `${parseServerEnv().API_URL}/v1`;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readJson(response: Response): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const text = await response.text();
  if (text === "") return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/**
 * Calls the API and parses the response with a contract schema.
 * Throws `ApiError` (contract error shape), `ApiSchemaError` (unexpected body) or `ApiNetworkError`.
 */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  options: ApiRequestOptions = {},
): Promise<z.infer<S>> {
  const doFetch = options.fetch ?? fetch;
  const url = joinUrl(options.baseUrl ?? defaultBaseUrl(), path);
  const hasBody = options.body !== undefined;

  let response: Response;
  try {
    response = await doFetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: options.cache ?? "no-store",
    });
  } catch (cause) {
    throw new ApiNetworkError("Could not reach the server. Check your connection and try again.", {
      cause,
    });
  }

  const json = await readJson(response);

  if (!response.ok) {
    const parsed = json.ok ? ErrorResponseSchema.safeParse(json.value) : undefined;
    if (parsed?.success) throw new ApiError(response.status, parsed.data.error);
    throw new ApiSchemaError(
      `The server answered ${response.status} with an unexpected error body.`,
    );
  }

  if (!json.ok) throw new ApiSchemaError("The server answered with a body that is not JSON.");

  const result = schema.safeParse(json.value);
  if (!result.success) {
    throw new ApiSchemaError(
      "The server answered with data we did not expect.",
      result.error.issues,
    );
  }
  return result.data;
}
