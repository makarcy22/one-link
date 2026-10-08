import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Storage interface with two drivers:
// - local: filesystem under STORAGE_LOCAL_DIR (development).
// - r2: Cloudflare R2 via its S3-compatible endpoint (production).
// Switch with STORAGE_DRIVER; application code never changes.

const DRIVER = process.env.STORAGE_DRIVER ?? "local";
const LOCAL_DIR = process.env.STORAGE_LOCAL_DIR ?? "./storage";

let s3: S3Client | null = null;

function s3client(): S3Client {
  if (!s3) {
    const endpoint = process.env.R2_ENDPOINT ?? "";
    const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
    }
    s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3;
}

function bucket(): string {
  const name = process.env.R2_BUCKET ?? "";
  if (!name) throw new Error("R2_BUCKET is not configured.");
  return name;
}

function safeName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUpload(prefix: string, filename: string, data: Buffer): Promise<string> {
  const key = `${prefix}/${randomUUID()}-${safeName(filename)}`;
  if (DRIVER === "r2") {
    await s3client().send(
      new PutObjectCommand({ Bucket: bucket(), Key: key, Body: data })
    );
    return key;
  }
  const full = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function removeFile(key: string): Promise<void> {
  if (DRIVER === "r2") {
    await s3client()
      .send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
      .catch(() => {});
    return;
  }
  await unlink(path.join(LOCAL_DIR, key)).catch(() => {});
}

export function publicUrl(key: string): string {
  if (DRIVER === "r2") {
    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    return base ? `${base}/${key}` : key;
  }
  return `/storage/${key}`;
}
