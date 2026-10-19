import type { NotificationChannel, NotificationType } from "@giftpop/contracts";

/** A message ready to send. `to` is raw contact data: transports must never log it unmasked. */
export interface OutboundMessage {
  type: NotificationType;
  orderNumber: string;
  to: { email: string; phone: string };
  subject: string;
  text: string;
}

export interface Transport {
  send(message: OutboundMessage): Promise<void>;
}

/** What an email provider implements. No provider exists yet. */
export interface EmailTransport {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

export type TransportMap = Partial<Record<NotificationChannel, Transport>>;

export interface MinimalLogger {
  info(obj: Record<string, unknown>, msg?: string): void;
}

/** "sara@example.com" becomes "s***@example.com". */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email.slice(0, 1)}***${email.slice(at)}`;
}

/** Keeps only the last two digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length < 4 ? "***" : `***${digits.slice(-2)}`;
}

/** Writes one structured log line per message. Contact data is masked. */
export function createConsoleTransport(logger: MinimalLogger): Transport {
  return {
    async send(message) {
      logger.info(
        {
          notification: message.type,
          order: message.orderNumber,
          email: maskEmail(message.to.email),
          phone: maskPhone(message.to.phone),
          subject: message.subject,
          text: message.text,
        },
        "notification",
      );
    },
  };
}

/** Adapts a provider to the internal transport shape. */
export function createEmailTransport(provider: EmailTransport): Transport {
  return {
    send: (message) =>
      provider.send({ to: message.to.email, subject: message.subject, text: message.text }),
  };
}

const registry: TransportMap = {};

/** Registers the email provider. Call once at boot; after that `enqueue` adds email entries. */
export function registerEmailTransport(provider: EmailTransport): void {
  registry.email = createEmailTransport(provider);
}

export function registerTransport(channel: NotificationChannel, transport: Transport): void {
  registry[channel] = transport;
}

export function unregisterTransport(channel: NotificationChannel): void {
  delete registry[channel];
}

export function hasTransport(channel: NotificationChannel): boolean {
  return registry[channel] !== undefined;
}

export function registeredTransports(): TransportMap {
  return { ...registry };
}
