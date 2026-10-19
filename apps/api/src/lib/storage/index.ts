import { join } from "node:path";

import { parseEnv, type Env } from "../../env";

import { LocalStorage } from "./local";
import { resolveUploadDir } from "./package-root";
import { createR2Client, R2Storage } from "./r2";
import {
  LOCAL_PRIVATE_DIR,
  PRIVATE_CACHE_CONTROL,
  type ReadableStorage,
  type Storage,
} from "./types";

export {
  ASSET_CACHE_CONTROL,
  LOCAL_PRIVATE_DIR,
  PRIVATE_CACHE_CONTROL,
  type ReadableStorage,
  type Storage,
  type StoredObject,
} from "./types";
export { LocalStorage } from "./local";
export { R2Storage, type S3Sender } from "./r2";
export { isSafeKey, newAssetKey } from "./keys";

type StorageEnv = Pick<
  Env,
  | "STORAGE_DRIVER"
  | "UPLOAD_DIR"
  | "PUBLIC_ASSET_BASE_URL"
  | "R2_ACCOUNT_ID"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY"
  | "R2_BUCKET"
  | "R2_PRIVATE_BUCKET"
>;

/** Build the driver named by `STORAGE_DRIVER`. Throws if R2 is chosen without its keys. */
export function createStorage(env: StorageEnv): Storage {
  if (env.STORAGE_DRIVER === "local") {
    return new LocalStorage({
      rootDir: resolveUploadDir(env.UPLOAD_DIR),
      publicBaseUrl: env.PUBLIC_ASSET_BASE_URL,
      // The private folder is for payment proofs and is never served to the public.
      hiddenFolders: [LOCAL_PRIVATE_DIR],
    });
  }
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error(
      "STORAGE_DRIVER=r2 needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET",
    );
  }
  return new R2Storage({
    client: createR2Client({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    }),
    bucket: R2_BUCKET,
    publicBaseUrl: env.PUBLIC_ASSET_BASE_URL,
  });
}

/**
 * Where payment proofs live: not reachable from the public asset host. Local: the `private/`
 * folder of UPLOAD_DIR (refused by the public files route). R2: `R2_PRIVATE_BUCKET`, falling
 * back to `R2_BUCKET`, which is only safe if the public host does not serve `proofs/`.
 */
export function createPrivateStorage(env: StorageEnv): ReadableStorage {
  if (env.STORAGE_DRIVER === "local") {
    return new LocalStorage({
      rootDir: join(resolveUploadDir(env.UPLOAD_DIR), LOCAL_PRIVATE_DIR),
      publicBaseUrl: env.PUBLIC_ASSET_BASE_URL,
    });
  }
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  const bucket = env.R2_PRIVATE_BUCKET ?? env.R2_BUCKET;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !bucket) {
    throw new Error(
      "STORAGE_DRIVER=r2 needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET",
    );
  }
  return new R2Storage({
    client: createR2Client({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    }),
    bucket,
    publicBaseUrl: env.PUBLIC_ASSET_BASE_URL,
    cacheControl: PRIVATE_CACHE_CONTROL,
  });
}

let shared: Storage | undefined;
let sharedPrivate: ReadableStorage | undefined;

/**
 * The process-wide storage, built on first use from the environment. Modules are mounted
 * without env, so the assets router asks for it here; env is already validated at boot.
 */
export function getStorage(): Storage {
  // `MONGODB_URI` is not needed for storage: a placeholder stands in when it is unset (tests).
  shared ??= createStorage(parseEnv({ MONGODB_URI: "mongodb://unused", ...process.env }));
  return shared;
}

/** The process-wide private storage (payment proofs), built on first use like `getStorage`. */
export function getPrivateStorage(): ReadableStorage {
  sharedPrivate ??= createPrivateStorage(
    parseEnv({ MONGODB_URI: "mongodb://unused", ...process.env }),
  );
  return sharedPrivate;
}
