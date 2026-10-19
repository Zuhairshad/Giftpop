import { crc32 } from "node:zlib";

import { ASSET_MAX_BYTES, ErrorResponseSchema } from "@giftpop/contracts";
import sharp from "sharp";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { Storage } from "../../src/lib/storage";
import { resetLoginIpRateLimit } from "../../src/middleware/login-ip-limit";
import { createAssetsRouter } from "../../src/modules/assets/router";
import { loginAs, seedStaff } from "../../src/modules/auth/auth.test-utils";
import { resetLoginRateLimit } from "../../src/modules/auth/rate-limit";
import { insertOrder } from "../../src/modules/orders/fixtures";
import { OrderModel } from "../../src/modules/orders/model";
import { createPaymentsRouter, PROOFS_PER_MINUTE } from "../../src/modules/payments/router";
import { PROOF_MAX_BYTES } from "../../src/modules/payments/upload";
import { createTestApp } from "../app";
import { clearDatabase, useTestMongo } from "../mongo";

useTestMongo();

interface Stored {
  key: string;
  body: Buffer;
  contentType: string;
}
let stored: Stored[] = [];
const storage: Storage = {
  put: (key, body, contentType) => {
    stored.push({ key, body, contentType: contentType ?? "" });
    return Promise.resolve();
  },
  delete: () => Promise.resolve(),
  publicUrl: (key) => `https://cdn.test/${key}`,
};

const app = createTestApp([
  { path: "/assets", router: createAssetsRouter(() => storage) },
  // Own limiter: this file sends many proofs from one address.
  {
    path: "/orders",
    router: createPaymentsRouter({
      resolveStorage: () => storage,
      limiter: (_req, _res, next) => next(),
    }),
  },
]);

let cookie = "";
let png: Buffer;

beforeAll(async () => {
  png = await sharp({
    create: { width: 24, height: 24, channels: 3, background: "#cc3333" },
  })
    .png()
    .toBuffer();
});

beforeEach(async () => {
  await clearDatabase();
  stored = [];
  await seedStaff({ email: "owner@giftpop.test", role: "owner" });
  resetLoginRateLimit();
  resetLoginIpRateLimit();
  cookie = await loginAs(createTestApp(), "owner@giftpop.test");
});

const upload = (file: Buffer, filename = "pic.png", contentType = "image/png") =>
  request(app)
    .post("/v1/assets")
    .set("Cookie", cookie)
    .attach("file", file, { filename, contentType });

function expectError(res: request.Response, status: number) {
  expect(res.status).toBe(status);
  ErrorResponseSchema.parse(res.body);
  expect(res.text).not.toMatch(/node_modules|\/home\/|sharp|vips|libpng|stack/i);
  expect(stored).toHaveLength(0);
}

/** A PNG that is only a signature and a header claiming a huge size (a decompression bomb). */
function bombPng(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("asset upload (staff)", () => {
  it("sniffs the type from the bytes: HTML, SVG and script labelled image/png are refused", async () => {
    const html = Buffer.from("<!doctype html><script>alert(document.cookie)</script>");
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>',
    );
    expectError(await upload(html), 415);
    expectError(await upload(svg, "logo.png", "image/png"), 415);
    expectError(await upload(svg, "logo.svg", "image/svg+xml"), 415);
    expectError(await upload(Buffer.from("#!/bin/sh\nrm -rf /\n"), "run.png", "image/png"), 415);
  });

  it("refuses other binary formats even with an image name and type", async () => {
    const gif = Buffer.from(
      "GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00;",
      "latin1",
    );
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj<<>>endobj\n");
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    for (const file of [gif, pdf, zip, Buffer.alloc(0)]) {
      const res = await upload(file);
      expect([400, 415]).toContain(res.status);
      expect(stored).toHaveLength(0);
    }
  });

  it("ignores the client's mime type: a real PNG sent as text/html is still accepted as an image", async () => {
    const res = await upload(png, "x.html", "text/html");
    expect(res.status).toBe(201);
    expect(stored[0]?.contentType).toBe("image/webp");
  });

  it("decodes with sharp: a valid signature with garbage after it is refused (400)", async () => {
    expectError(await upload(Buffer.concat([png.subarray(0, 40), Buffer.from("garbage")])), 400);
    expectError(
      await upload(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)])),
      400,
    );
  });

  it("refuses a decompression bomb by pixel count before decoding it", async () => {
    expectError(await upload(bombPng(20_000, 20_000)), 400);
  });

  it("re-encodes: a script appended to a real image never reaches storage", async () => {
    const polyglot = Buffer.concat([
      png,
      Buffer.from("<script>alert(1)</script><?php system($_GET['c']); ?>"),
    ]);
    const res = await upload(polyglot, "evil.php.png");
    expect(res.status).toBe(201);
    const only = stored[0];
    expect(only?.body.subarray(0, 4).toString()).toBe("RIFF");
    expect(only?.body.subarray(8, 12).toString()).toBe("WEBP");
    expect(only?.body.toString("latin1")).not.toMatch(/<script|<\?php/);
  });

  it("never uses the filename for the storage key or the URL", async () => {
    for (const filename of [
      "../../etc/passwd.png",
      "..\\..\\win.png",
      "a/b/c.png",
      "%2e%2e%2fx.png",
    ]) {
      stored = [];
      const res = await upload(png, filename);
      expect(res.status, filename).toBe(201);
      expect(stored[0]?.key).toMatch(/^assets\/[A-Za-z0-9_-]{32}\.webp$/);
      expect(res.body.asset.url).toMatch(/^https:\/\/cdn\.test\/assets\/[A-Za-z0-9_-]{32}\.webp$/);
    }
  });

  it("caps the size while streaming (413) and says so in the standard shape", async () => {
    const big = Buffer.concat([png, Buffer.alloc(ASSET_MAX_BYTES + 1024, 0)]);
    const res = await upload(big);
    expectError(res, 413);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("refuses extra form fields and extra files", async () => {
    const field = await request(app)
      .post("/v1/assets")
      .set("Cookie", cookie)
      .field("note", "hello")
      .attach("file", png, "a.png");
    expectError(field, 400);
    const twoFiles = await request(app)
      .post("/v1/assets")
      .set("Cookie", cookie)
      .attach("file", png, "a.png")
      .attach("file", png, "b.png");
    expectError(twoFiles, 400);
    const wrongField = await request(app)
      .post("/v1/assets")
      .set("Cookie", cookie)
      .attach("avatar", png, "a.png");
    expectError(wrongField, 400);
  });
});

describe("payment proof upload (public)", () => {
  async function orderWithContact() {
    const id = await insertOrder("awaiting_payment", { number: "GP-PK-ABCDE2" });
    return id;
  }
  const proof = (file: Buffer, contact = "sara@example.com", number = "GP-PK-ABCDE2") =>
    request(app)
      .post(`/v1/orders/${number}/payment-proof`)
      .field("contact", contact)
      .attach("file", file, { filename: "../../receipt.png", contentType: "image/png" });

  it("stores a re-encoded image under a random proofs/ key", async () => {
    const id = await orderWithContact();
    const res = await proof(png);
    expect(res.status).toBe(201);
    expect(stored[0]?.key).toMatch(/^proofs\/[A-Za-z0-9_-]{32}\.webp$/);
    const order = await OrderModel.findById(id).lean();
    expect(order?.proofs).toHaveLength(1);
    expect(order?.proofs[0]?.url).not.toMatch(/receipt|\.\./);
  });

  it("refuses SVG, HTML and truncated images and stores nothing", async () => {
    await orderWithContact();
    for (const file of [
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>'),
      Buffer.from("<html><body onload=alert(1)>"),
      png.subarray(0, 30),
    ]) {
      const res = await proof(file);
      expect([400, 415]).toContain(res.status);
    }
    expect(stored).toHaveLength(0);
  });

  it("caps the size before the order is even looked up (413)", async () => {
    const big = Buffer.concat([png, Buffer.alloc(PROOF_MAX_BYTES + 1024)]);
    const res = await proof(big, "anyone@example.com", "GP-PK-NOPE22");
    expect(res.status).toBe(413);
    ErrorResponseSchema.parse(res.body);
  });

  it("answers an unknown order and a wrong contact identically", async () => {
    await orderWithContact();
    const unknown = await proof(png, "sara@example.com", "GP-PK-ZZZZZ2");
    const wrong = await proof(png, "other@example.com");
    expect(unknown.status).toBe(404);
    expect(wrong.status).toBe(404);
    expect(wrong.body).toEqual(unknown.body);
    expect(stored).toHaveLength(0);
  });

  it("is limited to a sane number per minute by default", () => {
    expect(PROOFS_PER_MINUTE).toBeLessThanOrEqual(10);
  });
});
