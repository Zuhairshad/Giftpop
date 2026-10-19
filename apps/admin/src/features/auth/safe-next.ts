const FALLBACK = "/";
const PROBE_ORIGIN = "http://safe-next.invalid";

/**
 * Returns `raw` when it is a same-origin path we are happy to send the browser to after sign-in,
 * otherwise "/". Blocks protocol-relative URLs, absolute URLs, backslashes, control characters
 * (browsers strip tabs and newlines, so `/\t/evil.com` becomes `//evil.com`) and the login page itself.
 */
export function safeNextPath(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value === "") return FALLBACK;
  if (!value.startsWith("/") || value.startsWith("//")) return FALLBACK;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return FALLBACK;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== PROBE_ORIGIN) return FALLBACK;
  if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return FALLBACK;
  return value;
}
