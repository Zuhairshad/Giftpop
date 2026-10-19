export interface CardSummary {
  recipient: string | null;
  message: string | null;
}

/** What the customer wrote, trimmed; a blank field is `null` so the review can say nothing instead of "None". */
export function cardSummary(personalisation: {
  cardMessage: string;
  recipientName: string;
}): CardSummary | null {
  const message = personalisation.cardMessage.trim() || null;
  const recipient = personalisation.recipientName.trim() || null;
  return message === null && recipient === null ? null : { recipient, message };
}
