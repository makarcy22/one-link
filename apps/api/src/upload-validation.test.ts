import { describe, expect, it } from "vitest";
import { checkUpload, declaredKind, sniffKind } from "./upload-validation.js";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(8)]);
const m4a = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypM4A "), Buffer.alloc(8)]);
const exe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "latin1");

describe("declaredKind", () => {
  it("maps allowed types and ignores parameters", () => {
    expect(declaredKind("image/png")).toBe("image");
    expect(declaredKind("video/mp4; codecs=avc1")).toBe("video");
  });
  it("rejects everything else", () => {
    expect(declaredKind("application/x-msdownload")).toBeNull();
    expect(declaredKind("image/svg+xml")).toBeNull();
    expect(declaredKind("")).toBeNull();
  });
});

describe("sniffKind", () => {
  it("recognizes common formats by their first bytes", () => {
    expect(sniffKind(png)).toBe("image");
    expect(sniffKind(jpeg)).toBe("image");
    expect(sniffKind(mp4)).toBe("video");
    expect(sniffKind(m4a)).toBe("audio");
  });
  it("returns null for unknown content", () => {
    expect(sniffKind(exe)).toBeNull();
  });
});

describe("checkUpload", () => {
  it("accepts a real PNG", () => {
    expect(checkUpload("image/png", png)).toEqual({ ok: true, kind: "image" });
  });
  it("rejects a program renamed to .mp4", () => {
    const r = checkUpload("video/mp4", exe);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(415);
  });
  it("rejects a PNG that claims to be a video", () => {
    expect(checkUpload("video/mp4", png).ok).toBe(false);
  });
  it("rejects disallowed types and empty files", () => {
    expect(checkUpload("application/pdf", png).ok).toBe(false);
    expect(checkUpload("image/png", Buffer.alloc(0)).ok).toBe(false);
  });
});
