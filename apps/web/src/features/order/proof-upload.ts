import { PaymentProofUploadResponseSchema } from "@giftpop/contracts";
import type { PaymentProofUploadResponse } from "@giftpop/contracts";

/** The upload failed. `status` is the HTTP status, 0 for no response, -1 for an unexpected body. */
export class ProofUploadError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Proof upload failed (${status})`);
    this.name = "ProofUploadError";
    this.status = status;
  }
}

export function describeUploadError(error: unknown): string {
  const status = error instanceof ProofUploadError ? error.status : -1;
  switch (status) {
    case 404:
      return "We could not match those details to this order. Check the phone or email you used.";
    case 409:
      return "This order is no longer waiting for payment, or it already has the most proofs we accept.";
    case 413:
      return "That image is too big. Choose one under 5 MB.";
    case 415:
      return "We could not read that file. Choose a PNG, JPEG or WebP image.";
    case 429:
      return "Too many tries. Wait a minute and try again.";
    case 0:
      return "Could not reach the server. Check your connection and try again.";
    default:
      return "Something went wrong and the proof was not uploaded. Try again.";
  }
}

type UploadInput = {
  number: string;
  contact: string;
  file: File;
  baseUrl?: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

/** Sends the proof as multipart form data (apiRequest only sends JSON). */
export async function uploadProof(input: UploadInput): Promise<PaymentProofUploadResponse> {
  const form = new FormData();
  form.set("contact", input.contact);
  form.set("file", input.file);
  const doFetch = input.fetch ?? fetch;
  const base = (input.baseUrl ?? "/api").replace(/\/+$/, "");
  let response: Response;
  try {
    response = await doFetch(`${base}/orders/${encodeURIComponent(input.number)}/payment-proof`, {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
      signal: input.signal,
    });
  } catch {
    throw new ProofUploadError(0);
  }
  if (!response.ok) throw new ProofUploadError(response.status);
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProofUploadError(-1);
  }
  const parsed = PaymentProofUploadResponseSchema.safeParse(json);
  if (!parsed.success) throw new ProofUploadError(-1);
  return parsed.data;
}
