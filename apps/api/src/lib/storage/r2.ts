import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { ASSET_CACHE_CONTROL, type Storage } from "./types";

/** The two S3 calls the driver makes. A real `S3Client` fits; tests pass a fake. */
export interface S3Sender {
  send(command: PutObjectCommand): Promise<unknown>;
  send(command: DeleteObjectCommand): Promise<unknown>;
}

export interface R2StorageOptions {
  client: S3Sender;
  bucket: string;
  publicBaseUrl: string;
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
export class R2Storage implements Storage {
  private readonly client: S3Sender;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(options: R2StorageOptions) {
    this.client = options.client;
    this.bucket = options.bucket;
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: ASSET_CACHE_CONTROL,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
