import { TransitionError } from "@giftpop/contracts";
import type * as SentryNs from "@sentry/node";
import { ZodError } from "zod";

import type { Env } from "../../env";
import { AppError } from "../errors";

import { maskValue } from "./mask";

type SentryModule = typeof SentryNs;

/** Loaded only when a DSN is set; stays undefined otherwise, so the SDK is never imported. */
let sentry: SentryModule | undefined;

/** The slice of a Sentry event that `scrubEvent` touches. */
export interface ScrubbableEvent {
  request?: { url?: string; method?: string; [key: string]: unknown };
  user?: unknown;
  breadcrumbs?: unknown;
  extra?: unknown;
  contexts?: Record<string, unknown>;
  message?: string;
  exception?: unknown;
  [key: string]: unknown;
}

function pathOnly(url: string): string {
  try {
    return new URL(url, "http://local").pathname;
  } catch {
    return "";
  }
}

/** Removes bodies, cookies, headers, query strings, users and breadcrumbs; masks emails and phones. */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const request = event.request;
  const safeRequest = request
    ? {
        ...(request.method ? { method: request.method } : {}),
        ...(request.url ? { url: pathOnly(request.url) } : {}),
      }
    : undefined;
  const masked = maskValue({ ...event, request: undefined }) as T;
  delete masked.user;
  delete masked.breadcrumbs;
  delete masked.extra;
  if (safeRequest) masked.request = safeRequest;
  else delete masked.request;
  return masked;
}

export interface ObservabilityEnv {
  SENTRY_DSN?: string | undefined;
  SENTRY_TRACES_SAMPLE_RATE?: number | undefined;
  NODE_ENV?: Env["NODE_ENV"];
}

/** Starts Sentry only when `SENTRY_DSN` is set. Returns whether error reporting is on. */
export async function initObservability(env: ObservabilityEnv): Promise<boolean> {
  if (!env.SENTRY_DSN) return false;
  const sdk = await import("@sentry/node");
  const options: Parameters<SentryModule["init"]>[0] & { sendDefaultPii: boolean } = {
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // SDK 11 replaced `sendDefaultPii` with `dataCollection`; both say "collect nothing personal".
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? 0,
    maxBreadcrumbs: 0,
    // The last line of defence: whatever the SDK gathered, strip and mask it again.
    beforeSend: (event) =>
      scrubEvent(event as unknown as ScrubbableEvent) as unknown as typeof event,
  };
  sdk.init(options);
  sentry = sdk;
  return true;
}

export function isSentryEnabled(): boolean {
  return sentry !== undefined;
}

/** Errors that mean the caller did something wrong, not that we are broken. */
function isExpected(error: unknown): boolean {
  return error instanceof AppError || error instanceof ZodError || error instanceof TransitionError;
}

/**
 * Reports an unexpected error with the request id as a tag. No-op without a DSN and for
 * expected errors (AppError, validation, state-machine). Call it only for 5xx responses.
 */
export function reportError(error: unknown, requestId?: string): void {
  if (!sentry || isExpected(error)) return;
  sentry.captureException(error, requestId ? { tags: { request_id: requestId } } : undefined);
}

/** Flush queued events before the process exits. */
export async function flushObservability(timeoutMs = 2000): Promise<void> {
  await sentry?.close(timeoutMs);
}

/** Test hook: forget the loaded SDK. */
export function resetObservabilityForTests(): void {
  sentry = undefined;
}
