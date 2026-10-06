import { useState } from "react";
import { signUp } from "../auth/auth-client";

export default function Signup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signUp.email({ name, email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign up failed.");
      return;
    }
    onDone();
  }

  return (
    <>
      <h2>Create your account</h2>
      <p className="muted">One account for creating, publishing, and analytics.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <br />
        <br />
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <div className="row">
          <button className="btn btn-dark" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </>
  );
}
