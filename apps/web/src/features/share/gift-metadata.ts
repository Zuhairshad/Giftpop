import type { SharedDesignView } from "@giftpop/contracts";
import type { Metadata } from "next";

export const DESCRIPTION_MAX_LENGTH = 150;
const FALLBACK_DESCRIPTION =
  "Someone made this gift on The Giftpop. See it, then order the same gift or make your own.";

/** Collapses whitespace and cuts to `max` characters (not UTF-16 units), ending in an ellipsis when cut. */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  if (chars.length <= max) return clean;
  return `${chars
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}

export function shareTitle(recipientName: string): string {
  const name = recipientName.trim();
  return name ? `A gift for ${name}` : "A Giftpop gift";
}

export function shareDescription(cardMessage: string): string {
  const message = truncateText(cardMessage, DESCRIPTION_MAX_LENGTH);
  return message || FALLBACK_DESCRIPTION;
}

/** Title and description for `/g/<shareId>`; the Open Graph and Twitter cards repeat them. */
export function buildShareMetadata(view: Pick<SharedDesignView, "design">): Metadata {
  const title = shareTitle(view.design.personalisation.recipientName);
  const description = shareDescription(view.design.personalisation.cardMessage);
  const cardTitle = `${title} | The Giftpop`;
  return {
    title,
    description,
    // A shared gift is meant for the people who got the link, not for search results.
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName: "The Giftpop", title: cardTitle, description },
    twitter: { card: "summary", title: cardTitle, description },
  };
}

export const NOT_FOUND_METADATA: Metadata = { title: "Gift not found" };
