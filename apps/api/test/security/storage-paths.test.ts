import { resolve, sep } from "node:path";

import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  isSafeKey,
  LocalStorage,
  newAssetKey,
  R2Storage,
  type Storage,
} from "../../src/lib/storage";
import { createAssetsRouter } from "../../src/modules/assets/router";
import { createTestApp } from "../app";

const ROOT = resolve("test-uploads-never-created");
const local = new LocalStorage({
  rootDir: ROOT,
  publicBaseUrl: "http://localhost:4000/v1/assets/files",
});

const UNSAFE = [
  "../secret",
  "a/../../secret",
  "assets/../../../etc/passwd",
  "/etc/passwd",
  "C:\\windows\\win.ini",
  "a\\..\\b",
  ".env",
  "assets/.hidden",
  "a//b",
  "a/./b",
  "a%2e%2e/b",
  "a\0b.webp",
  "",
  "x".repeat(400),
  "assets/ok.webp\n",
];

describe("storage keys and paths", () => {
  it("refuses every traversal and odd key", () => {
    for (const key of UNSAFE) {
      expect(isSafeKey(key), JSON.stringify(key)).toBe(false);
      expect(local.resolvePath(key), JSON.stringify(key)).toBeUndefined();
    }
  });

  it("resolves a good key inside the root only", () => {
    const path = local.resolvePath("assets/abc_DEF-1.webp");
    expect(path?.startsWith(ROOT + sep)).toBe(true);
  });

  it("throws on put and delete for an unsafe key instead of writing outside the root", async () => {
    await expect(local.put("../escape.webp", Buffer.from("x"))).rejects.toThrow(/Unsafe/);
    await expect(local.delete("../escape.webp")).rejects.toThrow(/Unsafe/);
    await expect(local.read("../escape.webp")).resolves.toBeUndefined();
  });

  it("generates keys from random bytes only, never from input", () => {
    const keys = new Set(Array.from({ length: 200 }, () => newAssetKey()));
    expect(keys.size).toBe(200);
    for (const key of keys) expect(key).toMatch(/^assets\/[A-Za-z0-9_-]{32}\.webp$/);
  });

  it("serves only image extensions from the local driver", () => {
    expect(local.contentTypeFor("assets/a.webp")).toBe("image/webp");
    for (const name of ["a.svg", "a.html", "a.js", "a.php", "a", "a.webp.html", "a.SVG"]) {
      expect(local.contentTypeFor(`assets/${name}`), name).toBeUndefined();
    }
  });
});

describe("GET /v1/assets/files/*key", () => {
  const serve = (storage: Storage) =>
    createTestApp([{ path: "/assets", router: createAssetsRouter(() => storage) }]);
  const app = serve(local);

  it("answers 404 for traversal, encoded traversal, dotfiles and non-image extensions", async () => {
    const paths = [
      "/v1/assets/files/../../etc/passwd",
      "/v1/assets/files/..%2f..%2fetc%2fpasswd",
      "/v1/assets/files/%2e%2e/%2e%2e/etc/passwd",
      "/v1/assets/files/assets/..%5c..%5csecret.webp",
      "/v1/assets/files/assets/%00.webp",
      "/v1/assets/files/.env",
      "/v1/assets/files/assets/a.svg",
      "/v1/assets/files/assets/a.html",
      "/v1/assets/files/package.json",
    ];
    for (const path of paths) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(404);
      expect(res.text).not.toMatch(/root:|node_modules|\/home\//);
    }
  });

  it("is not served at all by the R2 driver", async () => {
    const r2 = new R2Storage({
      client: { send: () => Promise.resolve({}) },
      bucket: "b",
      publicBaseUrl: "https://cdn.test",
    });
    expect((await request(serve(r2)).get("/v1/assets/files/assets/a.webp")).status).toBe(404);
  });
});
