import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth as authApi } from "../api";

export default function ResetPassword() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const token           = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm)  { setError("Passwords don't match."); return; }
    if (password.length < 8)   { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const code = err.data?.error;
      setError(
        code === "token_expired"      ? "This link has expired. Request a new one." :
        code === "token_already_used" ? "This link has already been used." :
        code === "invalid_token"      ? "Invalid reset link. Request a new one." :
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="form-error">No reset token found. Request a new reset link.</p>
          <button className="link-btn" style={{ marginTop: 12 }} onClick={() => navigate("/auth/forgot-password")}>
            Request reset link
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center", gap: 20 }}>
          <p className="sent-icon">🔐</p>
          <div className="auth-card-header">
            <h1 className="auth-card-title">Password updated</h1>
            <p className="auth-card-desc">You can now sign in with your new password.</p>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => navigate("/auth/login")}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <p className="auth-wordmark">ReadStack</p>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Set a new password</h1>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="password">New password</label>
            <div className="input-wrap">
              <input
                id="password" type={showPw ? "text" : "password"} className="input"
                placeholder="Min 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                autoFocus required
              />
              <button type="button" className="input-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm" type={showPw ? "text" : "password"} className="input"
              placeholder="Same password again"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
