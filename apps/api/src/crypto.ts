import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM token vault. SOCIAL_TOKEN_KEY must be 32 random bytes, base64.
// Generate: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
function key(): Buffer {
  const buf = Buffer.from(process.env.SOCIAL_TOKEN_KEY ?? "", "base64");
  if (buf.length !== 32) {
    throw new Error("SOCIAL_TOKEN_KEY must be 32 bytes, base64-encoded. See .env.example.");
  }
  return buf;
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}
