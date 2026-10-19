import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import { isSafeKey } from "./keys";
import type { ReadableStorage, StoredObject } from "./types";

export interface LocalStorageOptions {
  /** Directory files are written under. */
  rootDir: string;
  publicBaseUrl: string;
  /** First path segments this instance refuses to read, write or serve (the private folder). */
  hiddenFolders?: readonly string[];
}

/** Content types the local driver serves, by extension. Anything else is not served. */
const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Development driver: files on disk, served by `GET /v1/assets/files/*`. */
export class LocalStorage implements ReadableStorage {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;
  private readonly hiddenFolders: readonly string[];

  constructor(options: LocalStorageOptions) {
    this.rootDir = resolve(options.rootDir);
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
    this.hiddenFolders = options.hiddenFolders ?? [];
  }

  /** Absolute path for a key, or `undefined` if the key could escape the upload directory. */
  resolvePath(key: string): string | undefined {
    if (!isSafeKey(key)) return undefined;
    if (this.hiddenFolders.includes(key.split("/")[0] ?? "")) return undefined;
    const path = resolve(this.rootDir, key);
    return path.startsWith(this.rootDir + sep) ? path : undefined;
  }

  /** Content type for a key, or `undefined` for an extension the driver does not serve. */
  contentTypeFor(key: string): string | undefined {
    const extension = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
    return CONTENT_TYPES[extension];
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.requirePath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async delete(key: string): Promise<void> {
    await rm(this.requirePath(key), { force: true });
  }

  /** Read a stored file, or `undefined` when it does not exist or the key is unsafe. */
  async read(key: string): Promise<Buffer | undefined> {
    const path = this.resolvePath(key);
    if (!path) return undefined;
    try {
      return await readFile(path);
    } catch (error) {
      // ENOENT: missing. EISDIR: the key names a folder. Neither is a server fault.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "ENOENT" || error.code === "EISDIR")
      ) {
        return undefined;
      }
      throw error;
    }
  }

  async get(key: string): Promise<StoredObject | null> {
    const body = await this.read(key);
    if (!body) return null;
    return { body, contentType: this.contentTypeFor(key) ?? "application/octet-stream" };
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  private requirePath(key: string): string {
    const path = this.resolvePath(key);
    if (!path) throw new Error(`Unsafe storage key: ${key}`);
    return path;
  }
}
