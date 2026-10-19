export type CopyOutcome = "copied" | "manual";

/** The part of the Clipboard API we use, so tests can pass a fake. */
export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

/**
 * Tries the Clipboard API. Answers "manual" when it is missing (insecure page, old browser)
 * or refuses (permission denied), so the UI selects the text and asks the visitor to copy it.
 */
export async function copyLink(
  text: string,
  clipboard: ClipboardLike | undefined,
): Promise<CopyOutcome> {
  if (!clipboard || typeof clipboard.writeText !== "function") return "manual";
  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "manual";
  }
}

/** What the live region says after a copy attempt. */
export function copyMessage(outcome: CopyOutcome): string {
  return outcome === "copied"
    ? "Link copied."
    : "The link is selected. Press Ctrl+C, or Cmd+C on a Mac, to copy it.";
}
