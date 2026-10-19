import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { ASSET_CACHE_CONTROL, type ReadableStorage, type StoredObject } from "./types";

/** The S3 calls the driver makes. A real `S3Client` fits; tests pass a fake. */
export interface S3Sender {
  send(command: PutObjectCommand): Promise<unknown>;
  send(command: DeleteObjectCommand): Promise<unknown>;
  send(command: GetObjectCommand): Promise<GetObjectResult>;
}

/** The part of a GetObject response the driver reads. */
export interface GetObjectResult {
  Body?: { transformToByteArray(): Promise<Uint8Array> };
  ContentType?: string;
}

function isMissing(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("name" in error && (error.name === "NoSuchKey" || error.name === "NotFound")) return true;
  const meta = "$metadata" in error ? error.$metadata : undefined;
  return (
    typeof meta === "object" &&
    meta !== null &&
    "httpStatusCode" in meta &&
    meta.httpStatusCode === 404
  );
}

export interface R2StorageOptions {
  client: S3Sender;
  bucket: string;
  publicBaseUrl: string;
  /** Cache-Control stored with each object. Defaults to the public, immutable header. */
  cacheControl?: string;
}

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/** Real client for Cloudflare R2: S3 API on the account endpoint, region `auto`. */
export function createR2Client({
  accountId,
  accessKeyId,
  secretAccessKey,
}: R2Credentials): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Production driver: objects in a Cloudflare R2 bucket, served from `publicBaseUrl`. */
export class R2Storage implements ReadableStorage {
  private readonly client: S3Sender;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly cacheControl: string;

  constructor(options: R2StorageOptions) {
    this.client = options.client;
    this.bucket = options.bucket;
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
    this.cacheControl = options.cacheControl ?? ASSET_CACHE_CONTROL;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: this.cacheControl,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!result.Body) return null;
      return {
        body: Buffer.from(await result.Body.transformToByteArray()),
        contentType: result.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
