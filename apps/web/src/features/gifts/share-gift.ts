import type { ClipboardLike } from "@/features/share/copy-link";
import { copyLink } from "@/features/share/copy-link";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/** The part of `navigator` the share button uses, so tests can pass a fake. */
export interface ShareTarget {
  share?: (data: SharePayload) => Promise<void>;
  clipboard?: ClipboardLike;
}

export type ShareOutcome = "shared" | "cancelled" | "copied" | "manual";

const FALLBACK_TEXT = "A ready-made gift from The Giftpop.";

/** What a share sheet or a pasted message says: the gift's title, its description, its link. */
export function giftSharePayload(
  gift: { title: string; description: string },
  url: string,
): SharePayload {
  return { title: gift.title, text: gift.description.trim() || FALLBACK_TEXT, url };
}

/**
 * Opens the device's share sheet when there is one; otherwise copies the link. A visitor who closes
 * the sheet is "cancelled" (not an error). A sheet that fails for another reason falls back to copy.
 */
export async function shareGift(target: ShareTarget, payload: SharePayload): Promise<ShareOutcome> {
  if (typeof target.share === "function") {
    try {
      await target.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  return copyLink(payload.url, target.clipboard);
}

/** What the live region says after sharing; empty when the share sheet did the talking. */
export function shareMessage(outcome: ShareOutcome, url: string): string {
  switch (outcome) {
    case "copied":
      return "Link copied.";
    case "manual":
      return `Copy this link: ${url}`;
    default:
      return "";
  }
}
