/** "Bouquet, 6 items": the packaging and how many things go in it, for the compact summary row. */
export function giftContentsLine(packagingName: string, itemCount: number): string {
  return `${packagingName}, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;
}

/** "For Sara", or null when no recipient was given. */
export function giftRecipientLine(recipientName: string): string | null {
  const name = recipientName.trim();
  return name === "" ? null : `For ${name}`;
}
