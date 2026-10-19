import { parseEnv, type Env } from "../../env";

import { LocalStorage } from "./local";
import { resolveUploadDir } from "./package-root";
import { createR2Client, R2Storage } from "./r2";
import type { Storage } from "./types";

export { ASSET_CACHE_CONTROL, type Storage } from "./types";
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
>;

/** Build the driver named by `STORAGE_DRIVER`. Throws if R2 is chosen without its keys. */
export function createStorage(env: StorageEnv): Storage {
  if (env.STORAGE_DRIVER === "local") {
    return new LocalStorage({
      rootDir: resolveUploadDir(env.UPLOAD_DIR),
      publicBaseUrl: env.PUBLIC_ASSET_BASE_URL,
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

let shared: Storage | undefined;

/**
 * The process-wide storage, built on first use from the environment. Modules are mounted
 * without env, so the assets router asks for it here; env is already validated at boot.
 */
export function getStorage(): Storage {
  shared ??= createStorage(parseEnv(process.env));
  return shared;
}
