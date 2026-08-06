import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AuthPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await signInWithEmail(email);
      setMsg("Check your email for the magic link.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h1>Application Ledger</h1>
      <p className="muted">
        Sign in to evaluate roles, draft applications, and track your pipeline.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit">Send magic link</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <button type="button" className="secondary" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
      </p>
      {msg && <p className="muted">{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
