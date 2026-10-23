import { useState } from "react";
import { signUp } from "../auth/auth-client";
import { Logo } from "../components/ui";

export default function Signup({ onDone, onSwitch }: { onDone: () => void; onSwitch?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data, error } = await signUp.email({ name, email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign up failed.");
      return;
    }
    // When email verification is required there is no session yet: ask them to check their inbox.
    const signedIn = Boolean((data as { token?: string | null } | null)?.token);
    if (signedIn) onDone();
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo"><Logo size={34} /></div>
          <h2>Welcome, {name.split(" ")[0] || "friend"}</h2>
          <p className="muted">Your account is created. We sent a confirmation link to <strong>{sentTo}</strong>. Open it, then sign in.</p>
          <div className="auth-form">
            {onSwitch && <button className="btn btn-hero" type="button" onClick={onSwitch}>Go to sign in</button>}
          </div>
          <p className="auth-hint" style={{ marginTop: 14 }}>Nothing in your inbox? Check spam, or ask for a new link from the sign-in screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={34} /></div>
        <h2>Create your account</h2>
        <p className="muted">One account for creating, publishing, and analytics.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            Name
            <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            Password
            <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <span className="auth-hint">At least 10 characters.</span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn btn-hero" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
        {onSwitch && <p className="auth-switch">Already have an account? <button type="button" onClick={onSwitch}>Sign in</button></p>}
      </div>
    </div>
  );
}
