export interface StoredObject {
  body: Buffer;
  contentType: string;
}

/** Where asset bytes live. Metadata lives in Mongo; bytes never do. */
export interface Storage {
  /** Store `body` under `key`, replacing anything already there. */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Remove `key`. Removing a key that does not exist is not an error. */
  delete(key: string): Promise<void>;
  /** Public URL the browser loads the file from. Never use it for private files (payment proofs). */
  publicUrl(key: string): string;
}

/** A `Storage` that can also read objects back. Both real drivers are one; private files need it. */
export interface ReadableStorage extends Storage {
  /** Read `key`: its bytes and content type, or `null` when nothing is stored there. */
  get(key: string): Promise<StoredObject | null>;
}

/** Cache header for stored files. Keys are random and never rewritten, so they are immutable. */
export const ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Cache header for private files (payment proofs): never kept by a browser or a shared cache. */
export const PRIVATE_CACHE_CONTROL = "private, no-store";

/** Folder of the upload directory that holds private files for the local driver. */
export const LOCAL_PRIVATE_DIR = "private";
