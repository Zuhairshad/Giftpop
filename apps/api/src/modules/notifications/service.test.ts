import mongoose from "mongoose";
import { beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { insertOrder } from "../orders/fixtures";
import { OrderModel } from "../orders/model";

import { OutboxModel } from "./model";
import { BACKOFF_MS, enqueue, enqueueStaffAlert, processOutbox } from "./service";
import {
  registerEmailTransport,
  unregisterTransport,
  type OutboundMessage,
  type Transport,
} from "./transports";

useTestMongo();
beforeAll(async () => {
  await OrderModel.init();
  await OutboxModel.createCollection();
  await OutboxModel.init();
});
beforeEach(clearDatabase);
afterEach(() => unregisterTransport("email"));

const silent = { info: () => undefined };

function recorder(): { transport: Transport; sent: OutboundMessage[] } {
  const sent: OutboundMessage[] = [];
  return {
    sent,
    transport: {
      async send(message) {
        sent.push(message);
      },
    },
  };
}

const failing: Transport = {
  async send() {
    throw new Error("provider down");
  },
};

async function queue(type: "order_created" | "status_changed" = "order_created") {
  const orderId = await insertOrder();
  await enqueue({ type, orderId, payload: { status: "confirmed" } });
  return orderId;
}

describe("enqueue", () => {
  it("writes one console entry, and an email entry once a provider is registered", async () => {
    await queue();
    expect(await OutboxModel.countDocuments({ channel: "console" })).toBe(1);
    expect(await OutboxModel.countDocuments({ channel: "email" })).toBe(0);

    registerEmailTransport({ send: async () => undefined });
    await queue();
    expect(await OutboxModel.countDocuments({ channel: "email" })).toBe(1);
  });

  it("rejects invalid input as a programming error", async () => {
    await expect(
      enqueue({ type: "order_created", orderId: "nope", payload: {} }),
    ).rejects.toBeDefined();
    expect(await OutboxModel.countDocuments()).toBe(0);
  });

  it("commits with the caller's transaction", async () => {
    const orderId = await insertOrder();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await enqueue({ type: "order_created", orderId, payload: {} }, session);
        // Not visible outside the transaction yet.
        expect(await OutboxModel.countDocuments()).toBe(0);
      });
    } finally {
      await session.endSession();
    }
    expect(await OutboxModel.countDocuments()).toBe(1);
  });

  it("vanishes when the transaction aborts", async () => {
    const orderId = await insertOrder();
    const session = await mongoose.startSession();
    try {
      await expect(
        session.withTransaction(async () => {
          await enqueue({ type: "order_created", orderId, payload: {} }, session);
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
    } finally {
      await session.endSession();
    }
    expect(await OutboxModel.countDocuments()).toBe(0);
  });
});

describe("processOutbox", () => {
  it("sends a due entry, marks it sent and does not send it again", async () => {
    await queue();
    const { transport, sent } = recorder();
    expect(await processOutbox({ transports: { console: transport } })).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.orderNumber).toMatch(/^GP-PK-/);
    expect(sent[0]?.text).toContain("Thank you for your order");
    expect((await OutboxModel.findOne().lean())?.status).toBe("sent");
    expect(await processOutbox({ transports: { console: transport } })).toBe(0);
    expect(sent).toHaveLength(1);
  });

  it("logs through the console transport with masked contact data by default", async () => {
    await queue();
    const lines: Record<string, unknown>[] = [];
    await processOutbox({ logger: { info: (obj) => void lines.push(obj) } });
    const all = JSON.stringify(lines);
    expect(lines).toHaveLength(1);
    expect(all).not.toContain("sara@example.com");
    expect(all).not.toContain("1234567");
    expect(all).not.toContain("Garden Road");
  });

  it("retries with exponential backoff using the supplied clock", async () => {
    await queue();
    const t0 = new Date("2030-01-01T00:00:00Z");
    const { transport, sent } = recorder();
    let healthy = false;
    const flaky: Transport = {
      send: (message) => (healthy ? transport.send(message) : failing.send(message)),
    };
    const transports = { console: flaky };

    expect(await processOutbox({ now: t0, transports })).toBe(0);
    let entry = await OutboxModel.findOne().lean();
    expect(entry).toMatchObject({ status: "pending", attempts: 1, lastError: "provider down" });
    expect(entry?.nextAttemptAt.getTime()).toBe(t0.getTime() + BACKOFF_MS[0]);

    // Not due yet.
    expect(
      await processOutbox({ now: new Date(t0.getTime() + BACKOFF_MS[0] - 1), transports }),
    ).toBe(0);
    expect((await OutboxModel.findOne().lean())?.attempts).toBe(1);

    const t1 = new Date(t0.getTime() + BACKOFF_MS[0]);
    expect(await processOutbox({ now: t1, transports })).toBe(0);
    entry = await OutboxModel.findOne().lean();
    expect(entry?.attempts).toBe(2);
    expect(entry?.nextAttemptAt.getTime()).toBe(t1.getTime() + BACKOFF_MS[1]);

    healthy = true;
    const t2 = new Date(t1.getTime() + BACKOFF_MS[1]);
    expect(await processOutbox({ now: t2, transports })).toBe(1);
    expect(sent).toHaveLength(1);
    expect((await OutboxModel.findOne().lean())?.status).toBe("sent");
  });

  it("marks the entry failed after five attempts and stops retrying", async () => {
    await queue();
    let now = new Date("2030-01-01T00:00:00Z");
    const transports = { console: failing };
    for (let i = 0; i < 5; i += 1) {
      await processOutbox({ now, transports });
      now = new Date(now.getTime() + 7 * 3_600_000);
    }
    const entry = await OutboxModel.findOne().lean();
    expect(entry).toMatchObject({ status: "failed", attempts: 5, lastError: "provider down" });
    expect(await processOutbox({ now: new Date(now.getTime() + 1e10), transports })).toBe(0);
    expect((await OutboxModel.findOne().lean())?.attempts).toBe(5);
  });

  it("does not throw when a transport fails, and still sends the next entry", async () => {
    registerEmailTransport({ send: async () => undefined });
    await queue(); // console + email entries
    const { transport, sent } = recorder();
    const count = await processOutbox({
      transports: { console: failing, email: transport },
    });
    expect(count).toBe(1);
    expect(sent).toHaveLength(1);
    expect(await OutboxModel.countDocuments({ status: "sent" })).toBe(1);
    expect(await OutboxModel.countDocuments({ status: "pending", attempts: 1 })).toBe(1);
  });

  it("fails an entry whose order is gone instead of throwing", async () => {
    await queue();
    await OrderModel.deleteMany({});
    await expect(processOutbox({ logger: silent })).resolves.toBe(0);
    expect((await OutboxModel.findOne().lean())?.lastError).toBe("Order not found");
  });

  it("sends each entry once when two workers run at the same time", async () => {
    for (let i = 0; i < 6; i += 1) await queue();
    const { transport, sent } = recorder();
    const slow: Transport = {
      async send(message) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        await transport.send(message);
      },
    };
    const results = await Promise.all([
      processOutbox({ transports: { console: slow } }),
      processOutbox({ transports: { console: slow } }),
      processOutbox({ transports: { console: slow } }),
    ]);
    expect(results.reduce((a, b) => a + b, 0)).toBe(6);
    expect(sent).toHaveLength(6);
    expect(await OutboxModel.countDocuments({ status: "sent" })).toBe(6);
  });
});

describe("staff alerts", () => {
  it("are delivered without an order and carry only their own subject and text", async () => {
    await enqueueStaffAlert({
      subject: "New partner request",
      text: "A brand asked to join. Open the admin.",
    });
    const sent: { subject: string; text: string; orderNumber: string }[] = [];
    const count = await processOutbox({
      transports: { console: { send: async (m) => void sent.push(m) } },
    });
    expect(count).toBe(1);
    expect(sent).toEqual([
      expect.objectContaining({ subject: "New partner request", orderNumber: "" }),
    ]);
    expect(await OutboxModel.countDocuments({ status: "sent", type: "staff_alert" })).toBe(1);
  });

  it("reject an empty subject and write nothing", async () => {
    await expect(enqueueStaffAlert({ subject: "", text: "x" })).rejects.toThrow();
    expect(await OutboxModel.countDocuments()).toBe(0);
  });
});
