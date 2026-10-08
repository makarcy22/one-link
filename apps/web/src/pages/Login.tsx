import { useState } from "react";
import { authClient, signIn } from "../auth/auth-client";

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign in failed.");
      return;
    }
    onDone();
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
