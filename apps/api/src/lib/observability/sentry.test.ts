import { TransitionError } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../errors";

const sdk = vi.hoisted(() => ({
  loaded: 0,
  init: vi.fn(),
  captureException: vi.fn(),
  close: vi.fn(async () => true),
}));

vi.mock("@sentry/node", () => {
  // Runs only when something imports the SDK.
  sdk.loaded += 1;
  return { init: sdk.init, captureException: sdk.captureException, close: sdk.close };
});

import {
  initObservability,
  isSentryEnabled,
  reportError,
  resetObservabilityForTests,
  scrubEvent,
} from "./sentry";

beforeEach(() => {
  resetObservabilityForTests();
  sdk.init.mockClear();
  sdk.captureException.mockClear();
});
afterEach(() => resetObservabilityForTests());

describe("without a DSN", () => {
  it.each([undefined, ""])("never imports or initialises the SDK (DSN %j)", async (SENTRY_DSN) => {
    const loadedBefore = sdk.loaded;
    expect(await initObservability({ SENTRY_DSN })).toBe(false);
    reportError(new Error("boom"), "req-1");
    expect(isSentryEnabled()).toBe(false);
    expect(sdk.loaded).toBe(loadedBefore);
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.captureException).not.toHaveBeenCalled();
  });
});

describe("with a DSN", () => {
  const dsn = "https://key@o0.ingest.sentry.io/1";

  it("initialises with PII off and scrubbing on", async () => {
    expect(
      await initObservability({
        SENTRY_DSN: dsn,
        SENTRY_TRACES_SAMPLE_RATE: 0.25,
        NODE_ENV: "production",
      }),
    ).toBe(true);
    expect(sdk.init).toHaveBeenCalledTimes(1);
    const config = sdk.init.mock.calls[0]?.[0] as {
      dsn: string;
      sendDefaultPii: boolean;
      tracesSampleRate: number;
      beforeSend: (event: object) => object;
    };
    expect(config).toMatchObject({
      dsn,
      sendDefaultPii: false,
      tracesSampleRate: 0.25,
      maxBreadcrumbs: 0,
    });
    const sent = config.beforeSend({ request: { data: "x", cookies: { a: "b" } } });
    expect(sent).toEqual({ request: {} });
  });

  it("reports unexpected errors with the request id and skips expected ones", async () => {
    await initObservability({ SENTRY_DSN: dsn });
    const unexpected = new Error("db exploded");
    reportError(unexpected, "req-9");
    expect(sdk.captureException).toHaveBeenCalledWith(unexpected, {
      tags: { request_id: "req-9" },
    });

    sdk.captureException.mockClear();
    reportError(new AppError("NOT_FOUND", 404, "x"));
    reportError(new AppError("NOT_AVAILABLE", 503, "x"));
    reportError(new TransitionError("INVALID_TRANSITION", "no", { from: "packed", to: "shipped" }));
    expect(sdk.captureException).not.toHaveBeenCalled();
  });
});

describe("scrubEvent", () => {
  it("strips bodies, cookies, headers, query strings, users and breadcrumbs, and masks text", () => {
    const scrubbed = scrubEvent({
      message: "failed for sara@example.com",
      request: {
        method: "POST",
        url: "https://api.giftpop.test/v1/orders/track?contact=sara@example.com",
        data: { phone: "+92 300 1234567" },
        cookies: { gp_admin: "secret" },
        headers: { cookie: "gp_admin=secret", authorization: "Bearer x" },
        query_string: "contact=sara@example.com",
      },
      user: { email: "sara@example.com", ip_address: "1.2.3.4" },
      breadcrumbs: [{ message: "GET /x?e=sara@example.com" }],
      exception: { values: [{ type: "Error", value: "bad +92 300 1234567" }] },
    });
    const text = JSON.stringify(scrubbed);
    expect(text).not.toContain("sara@example.com");
    expect(text).not.toContain("1234567");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("query_string");
    expect(scrubbed.request).toEqual({ method: "POST", url: "/v1/orders/track" });
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.breadcrumbs).toBeUndefined();
  });
});
