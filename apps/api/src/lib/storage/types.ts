/** Where asset bytes live. Metadata lives in Mongo; bytes never do. */
export interface Storage {
  /** Store `body` under `key`, replacing anything already there. */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Remove `key`. Removing a key that does not exist is not an error. */
  delete(key: string): Promise<void>;
  /** Public URL the browser loads the file from. */
  publicUrl(key: string): string;
}

/** Cache header for stored files. Keys are random and never rewritten, so they are immutable. */
export const ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
