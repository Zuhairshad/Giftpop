/** The customer's own request, or null when they left it empty. Never shown on share pages. */
export function visibleCustomRequest(customRequest: string | undefined): string | null {
  const text = (customRequest ?? "").trim();
  return text ? text : null;
}
