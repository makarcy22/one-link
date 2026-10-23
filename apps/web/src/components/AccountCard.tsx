import { useEffect, useRef, useState } from "react";
import { authClient, useSession } from "../auth/auth-client";
import { fileToAvatar } from "../lib/avatar";
import { Avatar, Icon, useToast } from "./ui";

/** Who you are: your name, your picture, your email. Shown at the top of Profile. */
export default function AccountCard() {
  const { data: session } = useSession();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const user = session?.user as { name?: string; email: string; image?: string | null; emailVerified?: boolean } | undefined;
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState<"" | "name" | "photo">("");
  const [error, setError] = useState("");

  useEffect(() => { setName(user?.name ?? ""); }, [user?.name]);
  if (!user) return null;

  const changed = name.trim() !== (user.name ?? "").trim();

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.replace(/\s+/g, " ").trim();
    if (!clean) { setError("Please enter your name."); return; }
    setError(""); setBusy("name");
    const { error: err } = await authClient.updateUser({ name: clean });
    setBusy("");
    if (err) { setError(err.message ?? "Could not save your name."); return; }
    toast("Name saved");
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setBusy("photo");
    try {
      const image = await fileToAvatar(file);
      const { error: err } = await authClient.updateUser({ image });
      if (err) throw new Error(err.message ?? "Could not save your picture.");
      toast("Picture updated");
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Could not save your picture.");
    } finally {
      setBusy("");
    }
  }

  async function removePhoto() {
    setError(""); setBusy("photo");
    const { error: err } = await authClient.updateUser({ image: null });
    setBusy("");
    if (err) { setError(err.message ?? "Could not remove your picture."); return; }
    toast("Picture removed");
  }

  return (
    <div className="card account-card">
      <div className="account-head">
        <Avatar name={user.name} email={user.email} src={user.image} size={88} />
        <div className="account-id">
          <h3>{user.name || user.email.split("@")[0]}</h3>
          <p className="muted">{user.email}</p>
          <div className="row" style={{ marginTop: 8 }}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} aria-label="Choose a profile picture" />
            <button className="btn btn-sm" type="button" disabled={busy !== ""} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} />{busy === "photo" ? "Saving…" : user.image ? "Change picture" : "Upload picture"}
            </button>
            {user.image && <button className="btn btn-quiet btn-sm" type="button" disabled={busy !== ""} onClick={removePhoto}>Remove</button>}
          </div>
        </div>
      </div>
      <form onSubmit={saveName} className="account-form">
        <label className="field">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
        </label>
        <button className="btn btn-hero" type="submit" disabled={busy !== "" || !changed}>{busy === "name" ? "Saving…" : "Save name"}</button>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="muted" style={{ fontSize: 13, margin: "10px 0 0" }}>Pictures are cropped to a square and made small. JPEG, PNG or WebP.</p>
    </div>
  );
}
