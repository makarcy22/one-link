import { useState } from "react";
import { authClient, signIn, twoFactor } from "../auth/auth-client";

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [totp, setTotp] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data, error } = await signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign in failed.");
      return;
    }
    const needs2fa = (data as unknown as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect;
    if (needs2fa) {
      setNeedTotp(true);
      return;
    }
    onDone();
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await twoFactor.verifyTotp({ code: totp });
    if (error) {
      setError(error.message ?? "Invalid code.");
      return;
    }
    onDone();
  }

  async function handleGoogle() {
    setError("");
    await signIn.social({ provider: "google", callbackURL: "http://localhost:5173" });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotMsg("Sending…");
    const { error } = await authClient.requestPasswordReset({
      email: forgotEmail,
      redirectTo: "http://localhost:5173",
    });
    setForgotMsg(error ? error.message ?? "Request failed." : "Reset link sent — check your inbox.");
  }

  return (
    <>
      <h2>Welcome back</h2>
      <p className="muted">Sign in to your One Link studio.</p>
      {needTotp && (
        <form onSubmit={handleTotp} style={{ marginBottom: 12 }}>
          <label>
            Two-factor code
            <input required inputMode="numeric" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="123456" />
          </label>
          <div className="row">
            <button className="btn btn-dark" type="submit">
              Verify
            </button>
          </div>
        </form>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <br />
        <br />
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <div className="row">
          <button className="btn btn-dark" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button className="btn" type="button" onClick={() => setShowForgot((v) => !v)}>
            Forgot password?
          </button>
          <button className="btn" type="button" onClick={handleGoogle}>
            Continue with Google
          </button>
        </div>
      </form>
      {showForgot && (
        <form onSubmit={handleForgot} style={{ marginTop: 12 }}>
          <label>
            Account email
            <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
          </label>
          {forgotMsg && <p className="muted">{forgotMsg}</p>}
          <div className="row">
            <button className="btn btn-dark" type="submit">
              Send reset link
            </button>
          </div>
        </form>
      )}
    </>
  );
}
