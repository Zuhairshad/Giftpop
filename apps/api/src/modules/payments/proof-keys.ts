import { isSafeKey } from "../../lib/storage/keys";

/**
 * The URL an `<img src>` in the admin app uses for a proof. Relative to the admin origin,
 * where `/api/*` is rewritten to the API's `/v1/*`. Only a signed-in staff session can load it.
 */
export function proofFileUrl(orderId: string, proofId: string): string {
  return `/api/admin/orders/${orderId}/proofs/${proofId}/file`;
}

const LEGACY_PROOF_KEY = /(?:^|\/)(proofs\/[A-Za-z0-9_-]+\.webp)$/;

interface StoredProof {
  url: string;
  storageKey?: string | undefined;
}

/**
 * Storage key of a proof: `storageKey`, or for proofs stored before they went private, the
 * `proofs/...` key at the end of the old public URL. `undefined` when neither gives a safe key.
 */
export function proofStorageKey(proof: StoredProof): string | undefined {
  if (proof.storageKey) return isSafeKey(proof.storageKey) ? proof.storageKey : undefined;
  let path = proof.url;
  try {
    path = new URL(proof.url).pathname;
  } catch {
    // Not an absolute URL: treat it as a bare key.
  }
  const key = LEGACY_PROOF_KEY.exec(path)?.[1];
  return key && isSafeKey(key) ? key : undefined;
}
