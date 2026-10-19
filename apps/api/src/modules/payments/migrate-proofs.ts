import type { ReadableStorage } from "../../lib/storage";
import { OrderModel } from "../orders/model";

import { proofStorageKey } from "./proof-keys";

export interface ProofMigrationResult {
  moved: number;
  alreadyDone: number;
  /** Proofs whose object was in neither storage (left untouched, safe to retry). */
  missing: number;
  /** Proofs whose old URL gave no usable key. */
  unreadable: number;
}

/**
 * One-off, idempotent: copies every proof that has no `storageKey` from `source` (where the
 * public assets live) into `target` (private storage) and records the key on the proof.
 * A proof is only marked after its copy succeeded, so a rerun continues where it stopped.
 * It never deletes from `source`: remove the old `proofs/` objects from the public bucket
 * yourself once this reports `missing: 0, unreadable: 0`. Not wired to any route or boot step.
 */
export async function migrateProofsToPrivate(
  source: ReadableStorage,
  target: ReadableStorage,
): Promise<ProofMigrationResult> {
  const result: ProofMigrationResult = { moved: 0, alreadyDone: 0, missing: 0, unreadable: 0 };
  const orders = await OrderModel.find({ "proofs.0": { $exists: true } })
    .select("proofs")
    .lean();
  for (const order of orders) {
    for (const proof of order.proofs) {
      if (proof.storageKey) {
        result.alreadyDone += 1;
        continue;
      }
      const key = proofStorageKey(proof);
      if (!key) {
        result.unreadable += 1;
        continue;
      }
      // With one shared bucket the object may already be in `target`.
      const object = (await source.get(key)) ?? (await target.get(key));
      if (!object) {
        result.missing += 1;
        continue;
      }
      await target.put(key, object.body, object.contentType);
      await OrderModel.updateOne(
        { _id: order._id, "proofs._id": proof._id },
        { $set: { "proofs.$.storageKey": key } },
      );
      result.moved += 1;
    }
  }
  return result;
}
