// Upload validation. The browser-supplied MIME type is only a claim, so we
// check it against an allow-list AND against the file's first bytes.

export type MediaKind = "image" | "audio" | "video";

const ALLOWED: Record<string, MediaKind> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/avif": "image",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
  "audio/aac": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/ogg": "audio",
  "audio/webm": "audio",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
};

export function declaredKind(mime: string): MediaKind | null {
  return ALLOWED[(mime || "").toLowerCase().split(";")[0].trim()] ?? null;
}

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  return buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);
}

function ascii(buf: Buffer, start: number, end: number): string {
  return buf.subarray(start, end).toString("latin1");
}

/** Identify the real kind of a file from its leading bytes, or null if unknown. */
export function sniffKind(buf: Buffer): MediaKind | null {
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47])) return "image"; // PNG
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image"; // JPEG
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return "image"; // GIF
  if (ascii(buf, 0, 4) === "RIFF") {
    const form = ascii(buf, 8, 12);
    if (form === "WEBP") return "image";
    if (form === "WAVE") return "audio";
    return null;
  }
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (brand === "avif" || brand === "avis") return "image";
    if (brand === "M4A " || brand === "M4B ") return "audio";
    return "video"; // mp4 / mov family
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return "video"; // WebM / Matroska
  if (ascii(buf, 0, 4) === "OggS") return "audio";
  if (ascii(buf, 0, 3) === "ID3") return "audio"; // MP3 with tag
  if (startsWith(buf, [0xff, 0xfb]) || startsWith(buf, [0xff, 0xf3]) || startsWith(buf, [0xff, 0xf2])) return "audio"; // MP3
  if (startsWith(buf, [0xff, 0xf1]) || startsWith(buf, [0xff, 0xf9])) return "audio"; // AAC (ADTS)
  return null;
}

export type UploadCheck =
  | { ok: true; kind: MediaKind }
  | { ok: false; status: number; error: string };

export function checkUpload(mime: string, data: Buffer): UploadCheck {
  const declared = declaredKind(mime);
  if (!declared) {
    return { ok: false, status: 415, error: "Unsupported file type. Upload an image, audio or video file." };
  }
  if (data.length === 0) return { ok: false, status: 400, error: "The file is empty." };
  const actual = sniffKind(data);
  if (actual !== declared) {
    return { ok: false, status: 415, error: "The file content does not match its type." };
  }
  return { ok: true, kind: declared };
}
