/**
 * Asset hosts the Next image optimiser may fetch from: `PUBLIC_ASSET_BASE_URL`, parsed in
 * `next.config.ts` and inlined as `NEXT_PUBLIC_ASSET_BASE_URLS` (public, not a secret).
 */
const CONFIGURED_BASES = parseBases(process.env.NEXT_PUBLIC_ASSET_BASE_URLS ?? "");

/** Widths Next serves by default (`imageSizes` plus `deviceSizes`); a request must use one. */
const NEXT_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

export function parseBases(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => URL.canParse(part))
    .map((part) => {
      const url = new URL(part);
      return `${url.origin}${url.pathname.replace(/\/+$/, "")}/`;
    });
}

/** True when `url` lives under a configured asset host, so the optimiser will accept it. */
export function canOptimise(url: string, bases: readonly string[] = CONFIGURED_BASES): boolean {
  return bases.some((base) => url.startsWith(base));
}

/**
 * A resized copy of an asset through `/_next/image`, or the URL unchanged when its host is not
 * configured (unset config, or an image saved under an earlier base URL): it still loads, just
 * at full size, instead of the optimiser answering 400.
 */
export function optimisedImageUrl(
  url: string,
  width: number,
  bases: readonly string[] = CONFIGURED_BASES,
): string {
  if (!canOptimise(url, bases)) return url;
  const w = NEXT_WIDTHS.find((size) => size >= width) ?? NEXT_WIDTHS[NEXT_WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}
