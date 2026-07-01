import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as authApi } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center", gap: 20 }}>
          <p className="sent-icon">📬</p>
          <div className="auth-card-header">
            <h1 className="auth-card-title">Check your email</h1>
            <p className="auth-card-desc">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
              It expires in 15 minutes.
            </p>
          </div>
          <button className="link-btn" onClick={() => navigate("/auth/login")}>← Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell" style={{ position: "relative" }}>
      <button className="auth-back" onClick={() => navigate("/auth/login")}>← Back</button>

      <p className="auth-wordmark">ReadStack</p>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Reset your password</h1>
          <p className="auth-card-desc">Enter your email and we'll send a reset link.</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email" type="email" className="input"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoFocus required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
