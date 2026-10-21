import { ShareIdSchema } from "@giftpop/contracts";

/**
 * Reads a share id from what staff paste: a bare id, or a full `/g/<shareId>` link with or
 * without a trailing slash, query or hash. Anything else gives null.
 */
export function extractShareId(input: string): string | null {
  return readShareInput(input).shareId;
}

export interface ShareInputReading {
  kind: "empty" | "id" | "link" | "unreadable";
  shareId: string | null;
}

/** Like `extractShareId`, but also says whether a bare id or a link was understood, for the dialog to echo back. */
export function readShareInput(input: string): ShareInputReading {
  const text = input.trim();
  if (text === "") return { kind: "empty", shareId: null };

  const bare = ShareIdSchema.safeParse(text);
  if (bare.success) return { kind: "id", shareId: bare.data };

  const fromLink = shareIdFromLink(text);
  return fromLink ? { kind: "link", shareId: fromLink } : { kind: "unreadable", shareId: null };
}

function shareIdFromLink(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const segments = url.pathname.split("/").filter((part) => part !== "");
  if (segments.length !== 2 || segments[0] !== "g") return null;
  const id = ShareIdSchema.safeParse(segments[1]);
  return id.success ? id.data : null;
}
