import express, { Router } from "express";
import { describe, expect, it } from "vitest";

import { errorHandler } from "../../src/middleware/error";
import { requireStaff } from "../../src/middleware/require-staff";

import { auditRoutes, collectRoutes, routeKey, type RoutePolicy } from "./walk-routes";

/**
 * Route-walk: enumerates every route from the Express router stack (not from a hand list)
 * and fails if
 *   - a route is in neither table below (so a NEW route cannot be forgotten),
 *   - a table entry no longer exists,
 *   - a staff route answers an anonymous caller with anything other than 401.
 *
 * Anything under an `/admin` path segment is staff only without being listed. The staff
 * table lists the routes that are staff only by design but are NOT under `/admin`.
 */

const STAFF_BY_DESIGN: Record<string, string> = {
  "GET /v1/staff": "staff management, owner only",
  "POST /v1/staff": "staff management, owner only",
  "PATCH /v1/staff/:id": "staff management, owner only",
  "POST /v1/countries": "creates a country, owner only (rule 7: countries are data)",
  "PUT /v1/countries/:code": "edits a country, owner only",
  "POST /v1/assets": "image upload for the catalog",
  "PATCH /v1/assets/:id": "changes an asset anchor point",
  "GET /v1/auth/me": "reports the session; 401 is its normal anonymous answer",
};

const PUBLIC_ROUTES: Record<string, string> = {
  "GET /health": "liveness probe",
  "GET /ready": "readiness probe (no data)",
  "POST /v1/auth/login": "how staff sign in; rate limited, answers 401 to bad credentials",
  "POST /v1/auth/logout": "clears the caller's own cookie; no session needed",
  "GET /v1/countries": "public country list for the picker",
  "GET /v1/catalog": "public catalog for a country",
  "GET /v1/assets/files/*key": "local-driver image files, development only (404 with R2)",
  "POST /v1/designs": "customers save a gift design (rate limited)",
  "GET /v1/designs/:shareId": "shared gift link (unguessable share id)",
  "POST /v1/quotes": "price quote for a design (rate limited)",
  "POST /v1/orders": "customer places an order (rate limited, idempotency key)",
  "POST /v1/orders/lookup":
    "customer asks for an email listing their order numbers (rate limited, same answer always)",
  "POST /v1/orders/track": "customer looks up an order with number plus contact (rate limited)",
  "POST /v1/orders/:number/payment-proof": "customer uploads a receipt (needs order contact)",
  "POST /v1/partner-requests": "brand partnership form (rate limited, honeypot)",
  "GET /v1/templates": "public gift templates for a country",
  "POST /v1/templates/:id/start": "start a design from a template (rate limited)",
};

const policy: RoutePolicy = {
  staff: STAFF_BY_DESIGN,
  public: PUBLIC_ROUTES,
  isAdminPath: (path) => path.split("/").includes("admin"),
};

async function loadRealApp() {
  // Dynamic import: walk-routes must wrap Router.use before any router is built.
  const [{ createTestApp }] = await Promise.all([import("../app")]);
  return createTestApp();
}

describe("route walk: the real app", () => {
  it("finds the routes (guards against the walker silently seeing nothing)", async () => {
    const routes = collectRoutes(await loadRealApp()).map(routeKey);
    expect(routes.length).toBeGreaterThan(40);
    expect(routes).toContain("POST /v1/admin/orders/:id/status");
    expect(routes).toContain("GET /v1/catalog/admin/items");
    expect(routes).toContain("GET /v1/templates/admin");
    expect(routes).toContain("GET /v1/partner-requests/admin");
    expect(routes).toContain("PATCH /v1/staff/:id");
  });

  it("classifies every route and answers 401 to an anonymous call on every staff route", async () => {
    const problems = await auditRoutes(await loadRealApp(), policy);
    expect(problems).toEqual([]);
  });

  it("covers every method an admin path declares", async () => {
    const adminRoutes = collectRoutes(await loadRealApp()).filter((route) =>
      policy.isAdminPath(route.path),
    );
    const methods = new Set(adminRoutes.map((route) => route.method));
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      expect(methods.has(method), `an admin ${method} route exists and was checked`).toBe(true);
    }
  });
});

describe("route walk: negative tests (the walker must fail on a bad app)", () => {
  function fakeApp(build: (router: Router) => void) {
    const router = Router();
    build(router);
    const app = express();
    app.use("/v1/things", router);
    app.use(errorHandler);
    return app;
  }
  const emptyPolicy: RoutePolicy = { ...policy, staff: {}, public: {} };

  it("fails when an /admin route has no staff guard, for any method", async () => {
    const app = fakeApp((router) => {
      router.get("/admin/leak", (_req, res) => void res.json({ secret: true }));
      router.delete("/admin/:id", (_req, res) => void res.status(204).end());
    });
    const problems = await auditRoutes(app, emptyPolicy);
    expect(problems).toHaveLength(2);
    expect(problems).toEqual([
      expect.stringMatching(/answered 204 instead of 401.*DELETE \/v1\/things\/admin\/:id/),
      expect.stringMatching(/answered 200 instead of 401.*GET \/v1\/things\/admin\/leak/),
    ]);
  });

  it("fails on an unguarded route behind a mounted sub-router", async () => {
    const app = fakeApp((router) => {
      const inner = Router();
      inner.post("/", (_req, res) => void res.status(201).json({}));
      router.use("/admin", inner);
    });
    const problems = await auditRoutes(app, emptyPolicy);
    expect(problems).toEqual([
      expect.stringMatching(/answered 201 instead of 401.*POST \/v1\/things\/admin$/),
    ]);
  });

  it("passes when the same routes sit behind requireStaff", async () => {
    const app = fakeApp((router) => {
      router.use("/admin", requireStaff());
      router.get("/admin/ok", (_req, res) => void res.json({}));
      router.patch("/admin/:id", (_req, res) => void res.json({}));
    });
    expect(await auditRoutes(app, emptyPolicy)).toEqual([]);
  });

  it("fails on a new route that is in neither table", async () => {
    const app = fakeApp((router) => {
      router.post("/brand-new", (_req, res) => void res.json({}));
    });
    const problems = await auditRoutes(app, emptyPolicy);
    expect(problems).toEqual([
      expect.stringMatching(/unclassified route.*POST \/v1\/things\/brand-new/),
    ]);
  });

  it("fails on a staff-only-by-design route that lost its guard", async () => {
    const app = fakeApp((router) => {
      router.patch("/:id", (_req, res) => void res.json({}));
    });
    const problems = await auditRoutes(app, {
      ...emptyPolicy,
      staff: { "PATCH /v1/things/:id": "owner only" },
    });
    expect(problems).toEqual([expect.stringMatching(/answered 200 instead of 401/)]);
  });

  it("fails on a stale table entry", async () => {
    const app = fakeApp(() => undefined);
    const problems = await auditRoutes(app, {
      ...emptyPolicy,
      public: { "GET /v1/things/gone": "was public" },
    });
    expect(problems).toEqual([expect.stringMatching(/stale policy entry.*gone/)]);
  });

  it("covers router.all() for every method", async () => {
    const app = fakeApp((router) => {
      router.all("/admin/any", (_req, res) => void res.json({}));
    });
    const problems = await auditRoutes(app, emptyPolicy);
    expect(problems).toHaveLength(5);
  });
});
