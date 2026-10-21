import type { EmailTransport } from "./transports";

const RESEND_URL = "https://api.resend.com/emails";

export interface ResendOptions {
  apiKey: string;
  /** Sender, for example `The Giftpop <orders@yourdomain.com>`. */
  from: string;
  /** Replaceable in tests. */
  fetchImpl?: typeof fetch;
}

/** Sends plain-text email through the Resend HTTP API. Throws on any non-2xx so the outbox retries. */
export function createResendProvider({
  apiKey,
  from,
  fetchImpl = fetch,
}: ResendOptions): EmailTransport {
  return {
    async send({ to, subject, text }) {
      const response = await fetchImpl(RESEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        // The body names the problem ("domain not verified"); it never echoes the key.
        const detail = (await response.text().catch(() => "")).slice(0, 300);
        throw new Error(`Resend returned ${response.status}: ${detail}`);
      }
    },
  };
}
