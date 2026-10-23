import { useEffect, useRef, useState } from "react";
import { platformLabel } from "@one-link/shared";
import { api, API_BASE, MOCK, errorText } from "../lib/api";
import { authClient, twoFactor, useSession } from "../auth/auth-client";
import type { Section } from "../lib/sections";
import BillingCard from "../components/BillingCard";
import FacebookPages from "../components/FacebookPages";
import AccountCard from "../components/AccountCard";
import { PageHead, PlatformDot, StatusPill } from "../components/ui";

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
  const [sub, setSub] = useState<{ plan: string; used: number; limit: number } | null>(null);
  const [subMsg, setSubMsg] = useState("");

  async function loadSub() {
    try {
      setSub(await api.get("/api/billing/status"));
    } catch {
      setSub(null);
    }
  }

  async function checkout(plan: string) {
    setSubMsg("Opening checkout…");
    try {
      const res = await api.post("/api/billing/checkout", { plan });
      if (res.authorization_url) window.location.href = res.authorization_url as string;
      else setSubMsg("Checkout failed — billing keys may be missing. See docs/payments.md.");
    } catch {
      setSubMsg("Checkout failed — billing keys may be missing. See docs/payments.md.");
    }
  }
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
    loadSub();
  }, []);

  async function enable2fa() {
    setTfMsg("Enabling…");
    const { data, error } = await twoFactor.enable({ password: tfPassword });
    if (error) {
      setTfMsg(error.message ?? "Enable failed.");
      return;
    }
    if (data && data.method === "totp") {
      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes);
      setTfMsg("Scan the URI below in your authenticator app (Google Authenticator, Authy, 1Password), then verify a code.");
    } else {
      setTfMsg(`Enabled with method: ${data?.method ?? "unknown"}.`);
    }
  }

  async function verify2fa() {
    const { error } = await twoFactor.verifyTotp({ code: tfCode });
    setTfMsg(error ? error.message ?? "Invalid code." : "Two-factor enabled for your account.");
  }

  async function disable2fa() {
    const { error } = await twoFactor.disable({ password: tfPassword });
    setTfMsg(error ? error.message ?? "Disable failed." : "Two-factor disabled.");
    if (!error) {
      setTotpUri("");
      setBackupCodes([]);
    }
  }

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
      <PageHead title="Profile" sub="Your account, your brand, your plan, your connected accounts and security." />
      <AccountCard />
      <div className="card">
        <h3>Brand profile</h3>
        <p className="muted">The AI uses this to keep your posts sounding like you.</p>
        {status && <p className="muted">{status}</p>}
        <div className="stack">
          <label className="field" htmlFor="b-name">Brand name<input autoComplete="off" id="b-name" ref={nameRef} value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></label>
          <label className="field" htmlFor="b-desc">What you do<input autoComplete="off" id="b-desc" value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} /></label>
          <label className="field" htmlFor="b-web">Website<input autoComplete="off" id="b-web" value={brand.website} onChange={(e) => setBrand({ ...brand, website: e.target.value })} /></label>
          <label className="field" htmlFor="b-voice">Voice
            <select id="b-voice" value={brand.voice} onChange={(e) => setBrand({ ...brand, voice: e.target.value })}>
              {["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
        </div>
        <div className="row"><button className="btn btn-dark" onClick={save}>Save profile</button></div>
      </div>
      {connectNote && <p className="notice notice-info">{connectNote}</p>}
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
      <BillingCard />
      <div className="card">
        <h3>Two-factor authentication</h3>
        <p>
          Status:{" "}
          <strong>
            {String((session?.user as unknown as Record<string, unknown>)?.twoFactorEnabled ?? "unknown")}
          </strong>
        </p>
        <label>
          Account password (to confirm changes)
          <input
            type="password"
            value={tfPassword}
            onChange={(e) => setTfPassword(e.target.value)}
          />
        </label>
        <div className="row">
          <button className="btn btn-dark" onClick={enable2fa}>
            Enable 2FA
          </button>
          <button className="btn" onClick={disable2fa}>
            Disable 2FA
          </button>
        </div>
        {totpUri && (
          <>
            <p style={{ wordBreak: "break-all" }}>{totpUri}</p>
            {backupCodes.length > 0 && (
              <p>Backup codes (save these somewhere safe): {backupCodes.join(", ")}</p>
            )}
            <label>
              6-digit code from your app
              <input value={tfCode} onChange={(e) => setTfCode(e.target.value)} placeholder="123456" />
            </label>
            <div className="row">
              <button className="btn btn-dark" onClick={verify2fa}>
                Verify and finish
              </button>
            </div>
          </>
        )}
        {tfMsg && <p className="muted">{tfMsg}</p>}
      </div>
      <div className="card">
        <h3>Connected accounts</h3>
        <p className="muted">Facebook posts for you automatically. For the others, connecting now means they are ready when automatic posting arrives. Until then we prepare your post and remind you.</p>
        <div className="list">
          {(["facebook", "instagram", "tiktok", "linkedin", "x"] as const).map((p) => {
            const conn = conns.find((c) => c.platform === p);
            const ready = config[p];
            return (
              <div key={p} className="list-item">
                <div className="grow">
                  <div className="title"><PlatformDot platform={p} />{platformLabel(p)}{p === "facebook" ? "" : <span className="pill pill-warn" style={{ marginLeft: 8 }}>Posting soon</span>}</div>
                  <div className="muted small">{conn ? conn.account_name : ready ? "Not connected" : "Needs setup by the owner. See docs/social-connectors.md"}</div>
                </div>
                {conn && <StatusPill status={conn.status} />}
                {conn ? (
                  <>
                    <button className="btn btn-sm" onClick={async () => {
                      try { await api.post(`/api/social/${p}/refresh`, {}); setConnectNote("Connection renewed."); } catch (e) { setConnectNote(errorText(e)); }
                      await loadSocial();
                    }}>Renew</button>
                    <button className="btn btn-sm btn-quiet" onClick={async () => { await api.del(`/api/social/${p}`).catch(() => {}); await loadSocial(); }}>Disconnect</button>
                  </>
                ) : ready ? (
                  <button className="btn btn-sm btn-dark" onClick={() => { if (MOCK) { import("../dev/mockApi").then((m) => { if (p === "facebook") m.connectDemoFacebook(); setConnectNote("Preview only: nothing real was connected. On your own server this opens the network's sign-in."); loadSocial(); }); return; } window.location.href = `${API_BASE}/api/social/${p}/connect`; }}>Connect</button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <FacebookPages connected={conns.some((c) => c.platform === "facebook" && c.status === "connected")} reloadKey={conns.length} />
    </>
  );
}
