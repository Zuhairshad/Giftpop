import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ASSET_MAX_BYTES, AssetUploadResponseSchema } from "@giftpop/contracts";
import type { Express } from "express";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { LocalStorage, type Storage } from "../../lib/storage";

import { AssetModel } from "./model";
import { createAssetsRouter } from "./router";

// Stand-in for the real session check (owned by api-auth): a staff user exists when the
// test sends `x-test-staff`, otherwise the request is anonymous.
vi.mock("../../middleware/require-staff", async () => {
  const { AppError } = await import("../../lib/errors");
  return {
    requireStaff:
      () =>
      (
        req: { headers: Record<string, unknown>; staff?: unknown },
        _res: unknown,
        next: (error?: unknown) => void,
      ) => {
        if (req.headers["x-test-staff"] !== "1") {
          next(new AppError("UNAUTHENTICATED", 401, "Sign in to continue"));
          return;
        }
        req.staff = {
          id: "a".repeat(24),
          email: "staff@example.com",
          name: "Test Staff",
          role: "staff",
          active: true,
          createdAt: new Date().toISOString(),
        };
        next();
      },
  };
});

useTestMongo();

let uploadDir: string;
let storage: LocalStorage;
let app: Express;

beforeAll(async () => {
  uploadDir = await mkdtemp(join(tmpdir(), "giftpop-assets-"));
  storage = new LocalStorage({ rootDir: uploadDir, publicBaseUrl: "http://assets.test/files" });
  app = createTestApp([{ path: "/assets", router: createAssetsRouter(() => storage) }]);
});
afterAll(async () => {
  await rm(uploadDir, { recursive: true, force: true });
});
beforeEach(clearDatabase);

const STAFF = { "x-test-staff": "1" };

function solidPng(width: number, height: number, alpha = 1) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha } },
  })
    .png()
    .toBuffer();
}

function upload(file: Buffer, filename = "item.png", contentType = "image/png") {
  return request(app).post("/v1/assets").set(STAFF).attach("file", file, { filename, contentType });
}

describe("POST /v1/assets", () => {
  it("converts a transparent PNG to WebP, keeps alpha and records size and anchor", async () => {
    const res = await upload(await solidPng(120, 80, 0.5));

    expect(res.status).toBe(201);
    const { asset } = AssetUploadResponseSchema.parse(res.body);
    expect(asset).toMatchObject({ width: 120, height: 80, anchor: { x: 0.5, y: 1 } });
    expect(asset.url).toMatch(/^http:\/\/assets\.test\/files\/assets\/[A-Za-z0-9_-]{32}\.webp$/);

    // The stored bytes are a real WebP with an alpha channel and the recorded dimensions.
    const key = asset.url.replace("http://assets.test/files/", "");
    const stored = await readFile(join(uploadDir, key));
    const meta = await sharp(stored).metadata();
    expect(meta).toMatchObject({ format: "webp", hasAlpha: true, width: 120, height: 80 });

    // Metadata is in Mongo; the bytes are not.
    const doc = await AssetModel.findById(asset.id).lean();
    expect(doc?.key).toBe(key);
    expect(Object.keys(doc ?? {})).not.toContain("data");
  });

  it("keeps real transparency, not just an alpha channel", async () => {
    const { data } = await sharp(await solidPng(10, 10, 0))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0);

    const res = await upload(await solidPng(10, 10, 0));
    const key = (res.body as { asset: { url: string } }).asset.url.replace(
      "http://assets.test/files/",
      "",
    );
    const raw = await sharp(await readFile(join(uploadDir, key)))
      .ensureAlpha()
      .raw()
      .toBuffer();
    expect(raw[3]).toBe(0);
  });

  it("caps the longest side at 1600 px and keeps the aspect ratio", async () => {
    const res = await upload(await solidPng(3000, 1000));
    expect(res.status).toBe(201);
    expect(res.body.asset).toMatchObject({ width: 1600, height: 533 });

    const tall = await upload(await solidPng(500, 2400));
    expect(tall.body.asset).toMatchObject({ width: 333, height: 1600 });
  });

  it("never upscales a small image", async () => {
    const res = await upload(await solidPng(40, 30));
    expect(res.body.asset).toMatchObject({ width: 40, height: 30 });
  });

  it("applies EXIF rotation before measuring", async () => {
    const rotated = await sharp({
      create: { width: 200, height: 100, channels: 3, background: "#336699" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const res = await upload(rotated, "photo.jpg", "image/jpeg");
    expect(res.status).toBe(201);
    expect(res.body.asset).toMatchObject({ width: 100, height: 200 });
  });

  it("accepts WebP and JPEG uploads", async () => {
    const webp = await sharp(await solidPng(30, 30))
      .webp()
      .toBuffer();
    const jpeg = await sharp(await solidPng(30, 30))
      .flatten({ background: "#fff" })
      .jpeg()
      .toBuffer();
    expect((await upload(webp, "a.webp", "image/webp")).status).toBe(201);
    expect((await upload(jpeg, "a.jpg", "image/jpeg")).status).toBe(201);
  });

  it("rejects text content that is named .png and claims image/png", async () => {
    const res = await upload(
      Buffer.from("this is not an image, just text"),
      "fake.png",
      "image/png",
    );
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/PNG, WebP or JPEG/);
    expect(await AssetModel.countDocuments()).toBe(0);
  });

  it("rejects a GIF and an SVG even with an image mime type", async () => {
    const gif = Buffer.from("GIF89a\x01\x00\x01\x00\x00\x00\x00;", "binary");
    expect((await upload(gif, "a.png", "image/png")).status).toBe(415);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect((await upload(svg, "a.png", "image/png")).status).toBe(415);
  });

  it("accepts a real PNG whose client mime type and name are wrong", async () => {
    const res = await upload(await solidPng(20, 20), "photo.txt", "text/plain");
    expect(res.status).toBe(201);
  });

  it("rejects a corrupt image that has valid magic bytes", async () => {
    const png = await solidPng(200, 200);
    const corrupt = Buffer.concat([png.subarray(0, 40), Buffer.alloc(60, 7)]);
    const res = await upload(corrupt);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/could not be read/);
    expect(await AssetModel.countDocuments()).toBe(0);
  });

  it("rejects a file over 8 MB with 413", async () => {
    const big = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(ASSET_MAX_BYTES),
    ]);
    const res = await upload(big);
    expect(res.status).toBe(413);
    expect(res.body.error).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(res.body.error.message).toMatch(/8 MB/);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at .*\(/);
  });

  it("rejects a request with no file", async () => {
    const res = await request(app).post("/v1/assets").set(STAFF).field("note", "hi");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");

    const json = await request(app).post("/v1/assets").set(STAFF).send({ a: 1 });
    expect(json.status).toBe(400);
  });

  it("rejects a file sent under the wrong field name", async () => {
    const res = await request(app)
      .post("/v1/assets")
      .set(STAFF)
      .attach("image", await solidPng(10, 10), { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(400);
  });

  it("rejects anonymous callers before reading the file", async () => {
    const res = await request(app)
      .post("/v1/assets")
      .attach("file", await solidPng(10, 10), { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
    expect(await AssetModel.countDocuments()).toBe(0);
  });

  it("removes the stored file when the metadata cannot be saved", async () => {
    const deleted: string[] = [];
    const flaky: Storage = {
      put: () => Promise.resolve(),
      delete: (key) => {
        deleted.push(key);
        return Promise.resolve();
      },
      publicUrl: (key) => `http://assets.test/${key}`,
    };
    const flakyApp = createTestApp([{ path: "/assets", router: createAssetsRouter(() => flaky) }]);
    const spy = vi.spyOn(AssetModel, "create").mockRejectedValueOnce(new Error("mongo down"));
    const res = await request(flakyApp)
      .post("/v1/assets")
      .set(STAFF)
      .attach("file", await solidPng(10, 10), { filename: "a.png", contentType: "image/png" });
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe("Something went wrong");
    expect(deleted).toHaveLength(1);
  });
});

describe("PATCH /v1/assets/:id", () => {
  async function createOne() {
    const res = await upload(await solidPng(50, 50));
    return (res.body as { asset: { id: string } }).asset.id;
  }

  it("updates the anchor and returns the asset", async () => {
    const id = await createOne();
    const res = await request(app)
      .patch(`/v1/assets/${id}`)
      .set(STAFF)
      .send({ anchor: { x: 0.25, y: 0.75 } });
    expect(res.status).toBe(200);
    const { asset } = AssetUploadResponseSchema.parse(res.body);
    expect(asset).toMatchObject({ id, anchor: { x: 0.25, y: 0.75 }, width: 50, height: 50 });
    expect((await AssetModel.findById(id).lean())?.anchor).toEqual({ x: 0.25, y: 0.75 });
  });

  it("accepts the edges 0 and 1", async () => {
    const id = await createOne();
    const res = await request(app)
      .patch(`/v1/assets/${id}`)
      .set(STAFF)
      .send({ anchor: { x: 0, y: 1 } });
    expect(res.status).toBe(200);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .patch(`/v1/assets/${"b".repeat(24)}`)
      .set(STAFF)
      .send({ anchor: { x: 0.5, y: 0.5 } });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a malformed id", async () => {
    const res = await request(app)
      .patch("/v1/assets/not-an-id")
      .set(STAFF)
      .send({ anchor: { x: 0.5, y: 0.5 } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it.each([
    { anchor: { x: 1.5, y: 0.5 } },
    { anchor: { x: -0.1, y: 0.5 } },
    { anchor: { x: 0.5 } },
    { anchor: "middle" },
    {},
  ])("rejects the invalid body %j", async (body) => {
    const id = await createOne();
    const res = await request(app).patch(`/v1/assets/${id}`).set(STAFF).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects anonymous callers and leaves the anchor alone", async () => {
    const id = await createOne();
    const res = await request(app)
      .patch(`/v1/assets/${id}`)
      .send({ anchor: { x: 0, y: 0 } });
    expect(res.status).toBe(401);
    expect((await AssetModel.findById(id).lean())?.anchor).toEqual({ x: 0.5, y: 1 });
  });
});

describe("GET /v1/assets/files/*", () => {
  it("serves an uploaded file with its content type and long cache headers", async () => {
    const created = await upload(await solidPng(30, 30));
    const key = (created.body as { asset: { url: string } }).asset.url.replace(
      "http://assets.test/files/",
      "",
    );

    const res = await request(app).get(`/v1/assets/files/${key}`).responseType("blob");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect(res.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    expect((await sharp(res.body as Buffer).metadata()).format).toBe("webp");
  });

  it("needs no login", async () => {
    await storage.put(
      "assets/public.webp",
      await sharp(await solidPng(5, 5))
        .webp()
        .toBuffer(),
    );
    const res = await request(app).get("/v1/assets/files/assets/public.webp");
    expect(res.status).toBe(200);
  });

  it("returns 404 for a missing file", async () => {
    const res = await request(app).get("/v1/assets/files/assets/missing.webp");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it.each([
    "/v1/assets/files/../../package.json",
    "/v1/assets/files/assets/../../package.json",
    "/v1/assets/files/%2e%2e/%2e%2e/package.json",
    "/v1/assets/files/assets/%2e%2e%2f%2e%2e%2fpackage.json",
    "/v1/assets/files/assets%2f..%2f..%2fpackage.json",
    "/v1/assets/files/..%5c..%5cpackage.json",
    "/v1/assets/files/assets/%00.webp",
    "/v1/assets/files/.env",
  ])("blocks the traversal attempt %s", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.error).toBeDefined();
  });

  it("does not serve a file whose extension is not an image", async () => {
    await storage.put("assets/notes.txt", Buffer.from("secret"));
    const res = await request(app).get("/v1/assets/files/assets/notes.txt");
    expect(res.status).toBe(404);
  });

  it("returns 404 for every file when the driver is not local", async () => {
    const remote: Storage = {
      put: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      publicUrl: (key) => `https://cdn.test/${key}`,
    };
    const remoteApp = createTestApp([
      { path: "/assets", router: createAssetsRouter(() => remote) },
    ]);
    // Even though a file with this name exists under the local upload dir.
    await storage.put("assets/exists.webp", Buffer.from("x"));
    const res = await request(remoteApp).get("/v1/assets/files/assets/exists.webp");
    expect(res.status).toBe(404);
  });
});
