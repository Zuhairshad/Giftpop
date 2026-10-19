import { parseCountryCookie } from "./cookie";

/**
 * Where `/` should send a returning visitor: `/<cc>` (lower case) when they have a valid
 * `gp_country` cookie, otherwise null. Every other path is left alone.
 */
export function homeRedirectTarget(pathname: string, cookieHeader: string | null): string | null {
  if (pathname !== "/") return null;
  const code = parseCountryCookie(cookieHeader);
  return code ? `/${code.toLowerCase()}` : null;
}
