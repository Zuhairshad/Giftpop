import type { NotificationType } from "@giftpop/contracts";
import type { ClientSession } from "mongoose";

export interface EnqueueInput {
  type: NotificationType;
  orderId: string;
  /** What the template needs. Never staff notes. */
  payload: Record<string, unknown>;
}

/**
 * Queues a message in the outbox. Call it with the session of the transaction that
 * caused it, so the message exists if and only if the change does.
 *
 * STUB: does nothing until `api-notifications` implements the outbox.
 */
export async function enqueue(_input: EnqueueInput, _session?: ClientSession): Promise<void> {
  // STUB
}

/** Sends queued messages that are due, with retry and backoff. Returns how many were sent. STUB. */
export async function processOutbox(): Promise<number> {
  return 0;
}
