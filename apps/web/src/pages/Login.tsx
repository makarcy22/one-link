import { useState } from "react";
import { authClient, signIn, twoFactor } from "../auth/auth-client";
import { Logo } from "../components/ui";
import { SLEEPING_MESSAGE } from "../lib/api";
import { useSlow } from "../lib/useSlow";

export default function Login({ onDone, onSwitch }: { onDone: () => void; onSwitch?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const slow = useSlow(busy);
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
      setError(/<!doctype|unexpected token/i.test(error.message ?? "") ? SLEEPING_MESSAGE : error.message ?? "Sign in failed.");
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
    await signIn.social({ provider: "google", callbackURL: window.location.origin });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotMsg("Sending…");
    const { error } = await authClient.requestPasswordReset({
      email: forgotEmail,
      redirectTo: window.location.origin,
    });
    setForgotMsg(error ? error.message ?? "Request failed." : "Reset link sent — check your inbox.");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={34} /></div>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to your One Link studio.</p>
        {needTotp && (
          <form onSubmit={handleTotp} className="auth-form">
            <label className="field">
              Two-factor code
              <input required autoFocus inputMode="numeric" autoComplete="one-time-code" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="123456" />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn btn-hero" type="submit">Verify</button>
          </form>
        )}
        {!needTotp && (
          <>
            <button className="btn auth-google" type="button" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M6 14.1a6.6 6.600 0 0 1 0-4.2V7.1H2.400a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.400c1.600 0 3 .6 4.200 1.600l3.100-3.100A11 11 0 0 0 2.400 7.1L6 9.900c.8-2.600 3.200-4.500 6-4.500z"/></svg>
              Continue with Google
            </button>
            <div className="auth-or"><span>or with email</span></div>
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="field">
                Email
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                Password
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="btn btn-hero" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
              {slow && <p className="auth-hint" role="status">Still working. The server may have been asleep, so the first time can take up to a minute.</p>}
              <button className="btn btn-quiet btn-sm auth-link" type="button" onClick={() => setShowForgot((v) => !v)}>Forgot password?</button>
            </form>
          </>
        )}
        {showForgot && (
          <form onSubmit={handleForgot} className="auth-form auth-forgot">
            <label className="field">
              Account email
              <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </label>
            {forgotMsg && <p className="muted">{forgotMsg}</p>}
            <button className="btn btn-dark" type="submit">Send reset link</button>
          </form>
        )}
        {onSwitch && <p className="auth-switch">New here? <button type="button" onClick={onSwitch}>Create an account</button></p>}
      </div>
    </div>
  );
}
