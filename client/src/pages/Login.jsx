import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { setThemePreference } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);

    try {
      const { user } = await authApi.login(identifier.trim().toLowerCase(), password);
      if (user.theme_preference) setThemePreference(user.theme_preference);
      setUser(user);
      navigate(user.onboarding_complete ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      setError(
        err.data?.error === "invalid_credentials"
          ? "Incorrect username/email or password."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <button className="auth-back" onClick={() => navigate("/")}>← Back</button>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Sign in</h1>
          <p className="auth-card-desc">Use your username or email address.</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="identifier">Username or email</label>
            <input
              id="identifier" type="text" className="input"
              placeholder="username or email@example.com"
              value={identifier} onChange={e => setIdentifier(e.target.value)}
              autoFocus required autoCapitalize="none" autoCorrect="off"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password" type={showPw ? "text" : "password"} className="input"
                placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="input-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="form-footer" style={{ justifyContent: "space-between" }}>
          <button className="link-btn" onClick={() => navigate("/auth/forgot-password")}>
            Forgot password?
          </button>
          <button className="link-btn" onClick={() => navigate("/auth/signup")}>
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
