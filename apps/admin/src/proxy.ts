import { STAFF_COOKIE_NAME } from "@giftpop/contracts";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { gateRedirect } from "@/features/auth/gate";

// Next.js 16 calls the `middleware` file convention `proxy`.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = gateRedirect({
    pathname,
    search,
    hasSessionCookie: request.cookies.has(STAFF_COOKIE_NAME),
  });
  if (target === null) return NextResponse.next();
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  // Skip the /api rewrite to the backend, Next internals and the favicon.
  matcher: ["/((?!api/|_next/|favicon\\.ico$).*)"],
};
