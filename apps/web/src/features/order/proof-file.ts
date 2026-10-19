export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_TYPES = ["image/png", "image/webp", "image/jpeg"] as const;

export type ProofFileCheck = { ok: true } | { ok: false; message: string };

/** Checks only what the browser can know. The API checks again. */
export function validateProofFile(file: { type: string; size: number }): ProofFileCheck {
  if (!(PROOF_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: "Choose a PNG, JPEG or WebP image." };
  }
  if (file.size <= 0) return { ok: false, message: "That file is empty. Choose another image." };
  if (file.size > PROOF_MAX_BYTES) {
    return { ok: false, message: "That image is bigger than 5 MB. Choose a smaller one." };
  }
  return { ok: true };
}
