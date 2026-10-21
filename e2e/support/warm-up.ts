import { ADMIN_URL, WEB_URL } from "./env";

const WEB_ROUTES = [
  "/",
  "/countries",
  "/pk",
  "/pk/build",
  "/pk/checkout",
  "/us",
  "/us/build",
  "/us/gifts",
  "/track",
  "/order/GP-PK-AAAAAA",
  "/partners",
  "/partners/brands",
];
const ADMIN_ROUTES = ["/login", "/", "/orders", `/orders/${"0".repeat(24)}`, "/partners"];

async function visit(url: string, cookie?: string): Promise<void> {
  try {
    await fetch(url, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  } catch {
    // Warming is best effort; the tests report any real problem.
  }
}

/**
 * Next dev servers compile a route on its first visit, which can take half a minute on a
 * busy machine and made the first click of a flow time out. Visiting each route once, before
 * any test runs, moves that cost out of the tests. Only pages are fetched; nothing here
 * touches a rate-limited API route.
 */
export async function warmUpRoutes(staffCookie: string): Promise<void> {
  for (const route of WEB_ROUTES) await visit(`${WEB_URL}${route}`);
  for (const route of ADMIN_ROUTES) await visit(`${ADMIN_URL}${route}`, staffCookie);
}
