/** Returns the URL only when it is http or https, so a `javascript:` link never becomes an href. */
export function safeTrackingUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}
