import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { homeRedirectTarget } from "@/features/country/home-redirect";

/** Sends a returning visitor from `/` to their country's home. Runs on `/` only (see `matcher`). */
export function proxy(request: NextRequest) {
  const target = homeRedirectTarget(request.nextUrl.pathname, request.headers.get("cookie"));
  if (!target) return NextResponse.next();
  return NextResponse.redirect(new URL(target, request.url), 307);
}

export const config = { matcher: "/" };
