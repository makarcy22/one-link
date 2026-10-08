import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { authClient, twoFactor, useSession } from "../auth/auth-client";
import type { Section } from "../lib/sections";

interface Brand {
  id: string;
  name: string;
  description: string;
  website: string;
  voice: string;
}

const EMPTY: Brand = { id: "", name: "", description: "", website: "", voice: "Casual" };

export default function Profile({ go }: { go: (s: Section) => void }) {
  void go;
  const [brand, setBrand] = useState<Brand>(EMPTY);
  const [status, setStatus] = useState("Loading…");
  const [connectNote, setConnectNote] = useState("");
  const [verifyNote, setVerifyNote] = useState("");
  const [tfPassword, setTfPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [tfCode, setTfCode] = useState("");
  const [tfMsg, setTfMsg] = useState("");
  const [conns, setConns] = useState<
    { platform: string; account_name: string; status: string; expires_at: string | null }[]
  >([]);
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  async function loadSocial() {
    try {
      const [c, list] = await Promise.all([api.get("/api/social/config"), api.get("/api/social")]);
      setConfig(c);
      setConns(list);
    } catch {
      setConns([]);
    }
  }

  async function resendVerification() {
    const email = session?.user.email;
    if (!email) {
      setVerifyNote("Sign in first, then resend.");
      return;
    }
    setVerifyNote("Sending…");
    const { error } = await authClient.sendVerificationEmail({ email });
    setVerifyNote(error ? error.message ?? "Send failed." : "Verification email sent — check your inbox.");
  }

  useEffect(() => {
    api
      .get("/api/brands")
      .then((rows: Brand[]) => {
        if (rows[0]) setBrand(rows[0]);
        setStatus("");
      })
      .catch(() => setStatus("Could not reach the API — is it running?"));
    loadSocial();
  }, []);

  async function save() {
    setStatus("Saving…");
    try {
      const saved = brand.id
        ? await api.put(`/api/brands/${brand.id}`, brand)
        : await api.post("/api/brands", brand);
      setBrand(saved);
      setStatus("Saved.");
    } catch {
      setStatus("Save failed.");
    }
  }

  return (
    <>
      <h2>Brand profile</h2>
      <p className="muted">The AI uses this to keep content consistent.</p>
      {status && <p className="muted">{status}</p>}
      <label>
        Brand name
        <input
          ref={nameRef}
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
        />
      </label>
      <br />
      <br />
      <label>
        Description
        <input value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} />
      </label>
      <br />
      <br />
      <label>
        Website
        <input value={brand.website} onChange={(e) => setBrand({ ...brand, website: e.target.value })} />
      </label>
      <br />
      <br />
      <label>
        Voice
        <select value={brand.voice} onChange={(e) => setBrand({ ...brand, voice: e.target.value })}>
          {["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <div className="row">
        <button className="btn btn-dark" onClick={save}>
          Save profile
        </button>
        <button className="btn" onClick={() => nameRef.current?.focus()}>
          Edit name
        </button>
        <button
          className="btn"
          onClick={() =>
            setConnectNote(
              "Social connectors arrive in the review pass — your One Link login is the connected identity for now."
            )
          }
        >
          Connect account
        </button>
      </div>
      {connectNote && <p className="muted">{connectNote}</p>}
      <div className="card">
        <h3>Email verification</h3>
        <p>
          Status:{" "}
          <strong>{session?.user.emailVerified ? "Verified" : "Not verified"}</strong>
        </p>
        {!session?.user.emailVerified && (
          <div className="row">
            <button className="btn btn-dark" onClick={resendVerification}>
              Resend verification email
            </button>
          </div>
        )}
        {verifyNote && <p className="muted">{verifyNote}</p>}
      </div>
      <div className="grid">
        <div className="card">
          <h3>Connected accounts</h3>
          {["tiktok", "instagram", "facebook", "linkedin"].map((p) => {
            const conn = conns.find((c) => c.platform === p);
            const ready = config[p];
            return (
              <p key={p}>
                <strong style={{ textTransform: "capitalize" }}>{p}</strong>:{" "}
                {conn ? `${conn.account_name} · ${conn.status}` : "not connected"}{" "}
                {conn ? (
                  <>
                    <button
                      className="btn"
                      onClick={async () => {
                        await api.del(`/api/social/${p}`).catch(() => {});
                        await loadSocial();
                      }}
                    >
                      Disconnect
                    </button>{" "}
                    <button
                      className="btn"
                      onClick={async () => {
                        const res = await api.post(`/api/social/${p}/refresh`, {}).catch((e) => e);
                        setConnectNote(res?.ok ? "Tokens refreshed." : String(res?.message || res));
                        await loadSocial();
                      }}
                    >
                      Refresh
                    </button>
                  </>
                ) : ready ? (
                  <button
                    className="btn btn-dark"
                    onClick={() => {
                      window.location.href = `http://localhost:3000/api/social/${p}/connect`;
                    }}
                  >
                    Connect
                  </button>
                ) : (
                  <span className="muted">keys needed — see docs/social-connectors.md</span>
                )}
              </p>
            );
          })}
        </div>
        <div className="card">
          <h3>Saved assets</h3>
          <p>Captions, hashtag groups, templates.</p>
        </div>
      </div>
    </>
  );
}
