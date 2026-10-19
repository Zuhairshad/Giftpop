import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isSafeKey, newAssetKey } from "./keys";
import { LocalStorage } from "./local";
import { apiPackageRoot, resolveUploadDir } from "./package-root";
import { R2Storage, type S3Sender } from "./r2";

import { createStorage } from "./index";

describe("keys", () => {
  it("makes unguessable, unique, safe keys", () => {
    const a = newAssetKey();
    const b = newAssetKey();
    expect(a).toMatch(/^assets\/[A-Za-z0-9_-]{32}\.webp$/);
    expect(a).not.toBe(b);
    expect(isSafeKey(a)).toBe(true);
  });

  it.each([
    "",
    "..",
    "../secret",
    "assets/../../secret",
    "assets//file.webp",
    "/etc/passwd",
    "assets\\file.webp",
    ".env",
    "assets/.hidden",
    "assets/a\0b.webp",
  ])("rejects the unsafe key %j", (key) => {
    expect(isSafeKey(key)).toBe(false);
  });
});

describe("LocalStorage", () => {
  let dir: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "giftpop-local-"));
    storage = new LocalStorage({ rootDir: dir, publicBaseUrl: "http://cdn.test/files/" });
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes, reads and deletes files, and tolerates deleting twice", async () => {
    await storage.put("assets/a.webp", Buffer.from("hello"));
    expect(await readFile(join(dir, "assets", "a.webp"), "utf8")).toBe("hello");
    expect((await storage.read("assets/a.webp"))?.toString()).toBe("hello");

    await storage.delete("assets/a.webp");
    await storage.delete("assets/a.webp");
    expect(await storage.read("assets/a.webp")).toBeUndefined();
    await expect(stat(join(dir, "assets", "a.webp"))).rejects.toThrow();
  });

  it("builds public URLs without a doubled slash", () => {
    expect(storage.publicUrl("assets/a.webp")).toBe("http://cdn.test/files/assets/a.webp");
  });

  it("refuses to write, delete or read outside the upload directory", async () => {
    await expect(storage.put("../escape.webp", Buffer.from("x"))).rejects.toThrow("Unsafe");
    await expect(storage.delete("../escape.webp")).rejects.toThrow("Unsafe");
    expect(storage.resolvePath("../escape.webp")).toBeUndefined();
    expect(await storage.read("../escape.webp")).toBeUndefined();
    expect(storage.resolvePath("assets/ok.webp")?.startsWith(dir + sep)).toBe(true);
  });

  it("reads a folder name as missing, not as an error", async () => {
    await storage.put("assets/a.webp", Buffer.from("x"));
    expect(await storage.read("assets")).toBeUndefined();
  });

  it("serves only image extensions", () => {
    expect(storage.contentTypeFor("assets/a.webp")).toBe("image/webp");
    expect(storage.contentTypeFor("assets/a.PNG")).toBe("image/png");
    expect(storage.contentTypeFor("assets/a.jpg")).toBe("image/jpeg");
    expect(storage.contentTypeFor("assets/a.html")).toBeUndefined();
    expect(storage.contentTypeFor("assets/noextension")).toBeUndefined();
  });
});

describe("R2Storage", () => {
  function fakeClient() {
    const sent: unknown[] = [];
    const client: S3Sender = {
      send: (command: PutObjectCommand | DeleteObjectCommand) => {
        sent.push(command);
        return Promise.resolve({});
      },
    };
    return { client, sent };
  }

  it("puts objects with content type and a long cache header", async () => {
    const { client, sent } = fakeClient();
    const storage = new R2Storage({ client, bucket: "giftpop", publicBaseUrl: "https://cdn.test" });
    const body = Buffer.from("bytes");
    await storage.put("assets/a.webp", body, "image/webp");

    expect(sent).toHaveLength(1);
    const command = sent[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toEqual({
      Bucket: "giftpop",
      Key: "assets/a.webp",
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    });
  });

  it("deletes objects by key", async () => {
    const { client, sent } = fakeClient();
    const storage = new R2Storage({ client, bucket: "giftpop", publicBaseUrl: "https://cdn.test" });
    await storage.delete("assets/a.webp");
    expect(sent[0]).toBeInstanceOf(DeleteObjectCommand);
    expect((sent[0] as DeleteObjectCommand).input).toEqual({
      Bucket: "giftpop",
      Key: "assets/a.webp",
    });
  });

  it("lets storage errors reach the caller", async () => {
    const client: S3Sender = { send: () => Promise.reject(new Error("R2 is down")) };
    const storage = new R2Storage({ client, bucket: "b", publicBaseUrl: "https://cdn.test" });
    await expect(storage.put("assets/a.webp", Buffer.from("x"), "image/webp")).rejects.toThrow(
      "R2 is down",
    );
  });

  it("builds public URLs from the base URL", () => {
    const { client } = fakeClient();
    const storage = new R2Storage({ client, bucket: "b", publicBaseUrl: "https://cdn.test/" });
    expect(storage.publicUrl("assets/a.webp")).toBe("https://cdn.test/assets/a.webp");
  });
});

describe("createStorage", () => {
  const base = {
    UPLOAD_DIR: "uploads",
    PUBLIC_ASSET_BASE_URL: "http://localhost:4000/v1/assets/files",
  };

  it("builds the local driver under the api package root, not the cwd", () => {
    const storage = createStorage({ ...base, STORAGE_DRIVER: "local" });
    expect(storage).toBeInstanceOf(LocalStorage);
    const path = (storage as LocalStorage).resolvePath("assets/a.webp");
    expect(path).toBe(join(apiPackageRoot(), "uploads", "assets", "a.webp"));
  });

  it("keeps an absolute UPLOAD_DIR as it is", () => {
    const absolute = join(tmpdir(), "giftpop-abs");
    expect(resolveUploadDir(absolute)).toBe(absolute);
  });

  it("builds the r2 driver when all keys are present", () => {
    const storage = createStorage({
      ...base,
      STORAGE_DRIVER: "r2",
      R2_ACCOUNT_ID: "acct",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET: "bucket",
    });
    expect(storage).toBeInstanceOf(R2Storage);
  });

  it("refuses r2 without its keys", () => {
    expect(() => createStorage({ ...base, STORAGE_DRIVER: "r2" })).toThrow("R2_ACCOUNT_ID");
  });
});
