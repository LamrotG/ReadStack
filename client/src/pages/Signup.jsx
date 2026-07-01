import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as authApi } from "../api";
import { useAuth } from "../context/AuthContext";

function passwordStrength(pw) {
  if (pw.length === 0) return null;
  if (pw.length < 8)   return "weak";
  if (pw.length < 12 && !/[^a-zA-Z0-9]/.test(pw)) return "medium";
  return "strong";
}

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const strength = passwordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);

    try {
      const { user } = await authApi.signup(email.trim().toLowerCase(), password);
      setUser(user);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const code = err.data?.error;
      setError(
        code === "email_taken"     ? "An account with this email already exists." :
        code === "invalid_email"   ? "Enter a valid email address." :
        code === "password_too_short" ? `Password must be at least ${err.data.min} characters.` :
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell" style={{ position: "relative" }}>
      <button className="auth-back" onClick={() => navigate("/")}>← Back</button>

      <p className="auth-wordmark">ReadStack</p>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Create your account</h1>
          <p className="auth-card-desc">You'll set a username after signing up.</p>
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

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password" type={showPw ? "text" : "password"} className="input"
                placeholder="Min 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="input-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {password.length > 0 && (
              <div className={`pw-strength pw-${strength}`}>
                <div className="pw-segment" /><div className="pw-segment" /><div className="pw-segment" />
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="form-footer" style={{ justifyContent: "center" }}>
          Already have an account?{" "}
          <button className="link-btn" onClick={() => navigate("/auth/login")}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
