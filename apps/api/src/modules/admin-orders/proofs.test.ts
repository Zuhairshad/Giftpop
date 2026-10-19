import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Types } from "mongoose";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { LocalStorage } from "../../lib/storage";
import { createAssetsRouter } from "../assets/router";
import { createLoginLimiter } from "../auth/rate-limit";
import { createAuthRouter } from "../auth/router";
import { insertOrder } from "../orders/fixtures";
import { OrderModel } from "../orders/model";
import { migrateProofsToPrivate } from "../payments/migrate-proofs";
import { proofStorageKey } from "../payments/proof-keys";
import { createPaymentsRouter } from "../payments/router";
import { createIpLimiter } from "../quotes/rate-limit";

import { signIn, type StaffSession } from "./admin-orders.test-utils";
import { createAdminOrdersRouter } from "./router";

useTestMongo();

let dir: string;
let publicStorage: LocalStorage;
let privateStorage: LocalStorage;
let app: ReturnType<typeof createTestApp>;
let session: StaffSession;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "giftpop-private-proofs-"));
  publicStorage = new LocalStorage({
    rootDir: dir,
    publicBaseUrl: "http://assets.test/files",
    hiddenFolders: ["private"],
  });
  privateStorage = new LocalStorage({
    rootDir: join(dir, "private"),
    publicBaseUrl: "http://assets.test/files",
  });
  app = createTestApp([
    {
      path: "/auth",
      router: createAuthRouter({ loginLimiter: createLoginLimiter({ limit: 100_000 }) }),
    },
    { path: "/admin/orders", router: createAdminOrdersRouter(() => privateStorage) },
    { path: "/assets", router: createAssetsRouter(() => publicStorage) },
    {
      path: "/orders",
      router: createPaymentsRouter({
        limiter: createIpLimiter({ limit: 1000, store: undefined }),
        resolveStorage: () => privateStorage,
      }),
    },
  ]);
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  await clearDatabase();
  session = await signIn(app);
});

const png = () =>
  sharp({ create: { width: 40, height: 30, channels: 3, background: "#336699" } })
    .png()
    .toBuffer();

/** Order with a real proof uploaded through the customer route. */
async function orderWithUploadedProof() {
  const number = "GP-PK-ABC234";
  const id = await insertOrder("awaiting_payment", { number });
  const res = await request(app)
    .post(`/v1/orders/${number}/payment-proof`)
    .field("contact", "sara@example.com")
    .attach("file", await png(), { filename: "p.png", contentType: "image/png" });
  expect(res.status).toBe(201);
  const proofId = (res.body as { proof: { id: string } }).proof.id;
  const stored = await OrderModel.findById(id).lean();
  const key = stored?.proofs[0]?.storageKey;
  if (!key) throw new Error("proof has no storage key");
  return { id, number, proofId, key, uploadBody: res.body as unknown };
}

const fileUrl = (id: string, proofId: string) => `/v1/admin/orders/${id}/proofs/${proofId}/file`;

describe("GET /v1/admin/orders/:id/proofs/:proofId/file", () => {
  it("streams the stored image to staff with private headers", async () => {
    const { id, proofId } = await orderWithUploadedProof();
    const res = await request(app)
      .get(fileUrl(id, proofId))
      .set("Cookie", session.cookie)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on("data", (c: Buffer) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-disposition"]).toBe("inline");
    expect((await sharp(res.body as Buffer).metadata()).format).toBe("webp");
  });

  it("is staff only", async () => {
    const { id, proofId } = await orderWithUploadedProof();
    const anonymous = await request(app).get(fileUrl(id, proofId));
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers["content-type"]).not.toBe("image/webp");
  });

  it("answers 404 for an unknown order, unknown proof, or missing object", async () => {
    const { id, proofId, key } = await orderWithUploadedProof();
    const get = (o: string, p: string) =>
      request(app).get(fileUrl(o, p)).set("Cookie", session.cookie);
    expect((await get(new Types.ObjectId().toHexString(), proofId)).status).toBe(404);
    expect((await get(id, new Types.ObjectId().toHexString())).status).toBe(404);
    await privateStorage.delete(key);
    expect((await get(id, proofId)).status).toBe(404);
  });

  it("answers 400 for malformed ids", async () => {
    const { id } = await orderWithUploadedProof();
    const get = (path: string) => request(app).get(path).set("Cookie", session.cookie);
    expect((await get(fileUrl("nope", "nope"))).status).toBe(400);
    expect((await get(fileUrl(id, "nope"))).status).toBe(400);
  });

  it("gives staff the file route path as the proof url in the order detail", async () => {
    const { id, proofId } = await orderWithUploadedProof();
    const res = await request(app).get(`/v1/admin/orders/${id}`).set("Cookie", session.cookie);
    expect(res.body.proofs[0].url).toBe(`/api/admin/orders/${id}/proofs/${proofId}/file`);
    expect(JSON.stringify(res.body.proofs)).not.toContain("assets.test");
  });
});

describe("customers cannot reach a proof", () => {
  it("has no customer route for the file and the upload response has no URL", async () => {
    const { id, number, proofId, key, uploadBody } = await orderWithUploadedProof();
    const guess = await request(app)
      .get(`/v1/orders/${number}/proofs/${proofId}/file`)
      .query({ contact: "sara@example.com" });
    expect(guess.status).toBe(404);
    const viaAdmin = await request(app)
      .get(fileUrl(id, proofId))
      .query({ number, contact: "sara@example.com" });
    expect(viaAdmin.status).toBe(401);
    const text = JSON.stringify(uploadBody);
    expect(text).not.toContain(key);
    expect(text).not.toMatch(/url|http/);
  });

  it("the public assets route refuses proof keys, plain and with traversal", async () => {
    const { key } = await orderWithUploadedProof();
    const attempts = [
      `/v1/assets/files/${key}`,
      `/v1/assets/files/private/${key}`,
      `/v1/assets/files/private/../private/${key}`,
      `/v1/assets/files/%2e%2e/private/${key}`,
      `/v1/assets/files/private%2F${key.replace("/", "%2F")}`,
    ];
    for (const path of attempts) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(404);
      expect(res.headers["content-type"], path).not.toBe("image/webp");
    }
  });
});

describe("legacy proofs and migration", () => {
  const oldUrl = (name: string) => `http://assets.test/files/proofs/${name}.webp`;

  it("derives the key from an old public URL, a bare key or storageKey", () => {
    expect(proofStorageKey({ url: oldUrl("abc_-9") })).toBe("proofs/abc_-9.webp");
    expect(proofStorageKey({ url: "proofs/x.webp" })).toBe("proofs/x.webp");
    expect(proofStorageKey({ url: "https://x/y", storageKey: "proofs/k.webp" })).toBe(
      "proofs/k.webp",
    );
    expect(proofStorageKey({ url: "https://x/a.webp" })).toBeUndefined();
    expect(proofStorageKey({ url: "https://x/proofs/../../a.webp" })).toBeUndefined();
    expect(proofStorageKey({ url: "x", storageKey: "../a.webp" })).toBeUndefined();
  });

  it("serves a legacy proof to staff from its derived key", async () => {
    const proofId = new Types.ObjectId();
    const id = await insertOrder("confirmed", {
      proofs: [{ _id: proofId, url: oldUrl("legacy1"), status: "pending", uploadedAt: new Date() }],
    });
    const webp = await sharp(await png())
      .webp()
      .toBuffer();
    await privateStorage.put("proofs/legacy1.webp", webp);
    const res = await request(app)
      .get(fileUrl(id, proofId.toHexString()))
      .set("Cookie", session.cookie);
    expect(res.status).toBe(200);
  });

  it("migrates old proofs into private storage, idempotently, keeping the source", async () => {
    const webp = await sharp(await png())
      .webp()
      .toBuffer();
    await publicStorage.put("proofs/legacy2.webp", webp);
    const id = await insertOrder("confirmed", {
      proofs: [
        {
          _id: new Types.ObjectId(),
          url: oldUrl("legacy2"),
          status: "pending",
          uploadedAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          url: oldUrl("gone"),
          status: "pending",
          uploadedAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          url: "https://x/odd.webp",
          status: "pending",
          uploadedAt: new Date(),
        },
      ],
    });

    const first = await migrateProofsToPrivate(publicStorage, privateStorage);
    expect(first).toEqual({ moved: 1, alreadyDone: 0, missing: 1, unreadable: 1 });
    expect(await privateStorage.get("proofs/legacy2.webp")).not.toBeNull();
    expect(await publicStorage.get("proofs/legacy2.webp")).not.toBeNull();
    const stored = await OrderModel.findById(id).lean();
    expect(stored?.proofs.map((p) => p.storageKey)).toEqual([
      "proofs/legacy2.webp",
      undefined,
      undefined,
    ]);

    const second = await migrateProofsToPrivate(publicStorage, privateStorage);
    expect(second).toEqual({ moved: 0, alreadyDone: 1, missing: 1, unreadable: 1 });
  });
});
