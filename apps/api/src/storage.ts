import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// S3-compatible storage interface. The local driver below implements it;
// a Cloudflare R2 driver with the same function names replaces it in production.
const LOCAL_DIR = process.env.STORAGE_LOCAL_DIR ?? "./storage";

export async function saveUpload(prefix: string, filename: string, data: Buffer): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${randomUUID()}-${safe}`;
  const full = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function removeFile(key: string): Promise<void> {
  await unlink(path.join(LOCAL_DIR, key)).catch(() => {});
}
