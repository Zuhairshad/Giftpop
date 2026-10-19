import type { Express } from "express";
import express from "express";
import request from "supertest";

/**
 * Route enumeration from the real Express router stack.
 *
 * Express 5 throws away the path a sub-router was mounted at (`router.use("/admin", sub)`
 * keeps only a compiled matcher), so this file records it: importing this module wraps
 * `Router.use` once, and every layer added afterwards remembers its mount path. Import it
 * BEFORE anything that builds routers, and load the app with a dynamic `import()`.
 */

interface LayerLike {
  name: string;
  handle: { stack?: LayerLike[] };
  route?: { path: unknown; methods: Record<string, boolean>; stack: unknown[] };
  mountPath?: string;
}

interface RouterLike {
  stack: LayerLike[];
  use: (...args: unknown[]) => unknown;
}

const RECORDER = Symbol.for("giftpop.mountRecorder");

function installMountRecorder(): void {
  const proto = express.Router.prototype as unknown as RouterLike & Record<symbol, boolean>;
  if (proto[RECORDER]) return;
  const original = proto.use;
  proto.use = function use(this: RouterLike, ...args: unknown[]): unknown {
    const before = this.stack.length;
    const result = original.apply(this, args);
    const path = typeof args[0] === "string" ? args[0] : "/";
    for (const layer of this.stack.slice(before)) layer.mountPath = path;
    return result;
  };
  proto[RECORDER] = true;
}
installMountRecorder();

export interface FoundRoute {
  method: string;
  /** Full path as declared, e.g. `/v1/assets/:id`. */
  path: string;
}

export const routeKey = (route: FoundRoute): string => `${route.method} ${route.path}`;

function joinPath(...parts: string[]): string {
  const joined = parts.join("/").replace(/\/+/g, "/");
  return joined.length > 1 ? joined.replace(/\/$/, "") : joined;
}

function walk(stack: LayerLike[], prefix: string, out: FoundRoute[]): void {
  for (const layer of stack) {
    if (layer.route) {
      const declared = layer.route.path;
      if (typeof declared !== "string") {
        throw new Error(`Unsupported route path (use a string): ${String(declared)}`);
      }
      const full = joinPath(prefix, declared);
      const methods = Object.keys(layer.route.methods).filter((m) => m !== "_all");
      // `router.all()` answers every method: audit the ones that matter.
      const every = layer.route.methods["_all"]
        ? ["get", "post", "put", "patch", "delete"]
        : methods;
      for (const method of every) out.push({ method: method.toUpperCase(), path: full });
    } else if (layer.name === "router" && layer.handle.stack) {
      walk(layer.handle.stack, joinPath(prefix, layer.mountPath ?? "/"), out);
    }
  }
}

/** Every method and path the app declares, from its router stack. */
export function collectRoutes(app: Express): FoundRoute[] {
  const out: FoundRoute[] = [];
  const router = (app as unknown as { router: RouterLike }).router;
  walk(router.stack, "", out);
  return out.sort((a, b) => routeKey(a).localeCompare(routeKey(b)));
}

export interface RoutePolicy {
  /** Routes that must answer 401 to an anonymous caller, with the reason they are staff only. */
  staff: Record<string, string>;
  /** Routes anyone may call, with the reason they are public. */
  public: Record<string, string>;
  /** Any path matching this is treated as staff only even if it is not in the table. */
  isAdminPath: (path: string) => boolean;
}

const OBJECT_ID = "0".repeat(24);

/** Fill `:param` and `*wildcard` segments with plausible values. */
function concretePath(path: string): string {
  return path.replace(/:[A-Za-z]+/g, OBJECT_ID).replace(/\*[A-Za-z]+/g, "a.webp");
}

/**
 * Returns a list of problems (empty when every route is accounted for and every staff
 * route turns an anonymous caller away with 401).
 */
export async function auditRoutes(app: Express, policy: RoutePolicy): Promise<string[]> {
  const problems: string[] = [];
  const routes = collectRoutes(app);
  const found = new Set(routes.map(routeKey));

  for (const key of [...Object.keys(policy.staff), ...Object.keys(policy.public)]) {
    if (!found.has(key)) problems.push(`stale policy entry (route no longer exists): ${key}`);
  }

  for (const route of routes) {
    const key = routeKey(route);
    const isStaff = key in policy.staff || policy.isAdminPath(route.path);
    const isPublic = key in policy.public;
    if (isStaff && isPublic) {
      problems.push(`listed as both staff and public: ${key}`);
      continue;
    }
    if (!isStaff && !isPublic) {
      problems.push(`unclassified route (add it to the staff or public table): ${key}`);
      continue;
    }
    if (!isStaff) continue;

    const method = route.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
    const res = await request(app)[method](concretePath(route.path)).send();
    if (res.status !== 401) {
      problems.push(
        `staff route answered ${res.status} instead of 401 to an anonymous call: ${key}`,
      );
    }
  }
  return problems;
}
