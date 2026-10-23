// Rules for a profile picture and display name stored on the user record.
// The picture is a small JPEG/PNG/WebP data URL made in the browser (about 192 px), or an https address.
export const MAX_AVATAR_CHARS = 120_000; // ~90 KB of picture data
export const MAX_NAME_CHARS = 80;

export function checkAvatar(image: unknown): { ok: true } | { ok: false; error: string } {
  if (image === null || image === undefined || image === "") return { ok: true }; // removing the picture
  if (typeof image !== "string") return { ok: false, error: "Picture is not valid." };
  if (image.length > MAX_AVATAR_CHARS) return { ok: false, error: "Picture is too large. Choose a smaller one." };
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return { ok: true };
  if (/^https:\/\/[^\s]+$/.test(image)) return { ok: true };
  return { ok: false, error: "Picture must be a JPEG, PNG or WebP image." };
}

export function checkName(name: unknown): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof name !== "string") return { ok: false, error: "Name is not valid." };
  const clean = name.replace(/\s+/g, " ").trim();
  if (clean.length < 1) return { ok: false, error: "Please enter your name." };
  if (clean.length > MAX_NAME_CHARS) return { ok: false, error: `Name is too long (max ${MAX_NAME_CHARS}).` };
  return { ok: true, name: clean };
}
