export interface IdempotencyKeys {
  /** The key for this submission: the same one while `fingerprint` is unchanged, a new one when it changes. */
  keyFor(fingerprint: string): string;
}

/** Holds one key per distinct submission so a retry never creates a second order. */
export function createIdempotencyKeys(generate: () => string): IdempotencyKeys {
  let lastFingerprint: string | null = null;
  let lastKey = "";
  return {
    keyFor(fingerprint) {
      if (lastFingerprint !== fingerprint) {
        lastFingerprint = fingerprint;
        lastKey = generate();
      }
      return lastKey;
    },
  };
}
