import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { setUser }     = useAuth();
  const [error, setError] = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("No sign-in token found. Try requesting a new link.");
      return;
    }

    auth.verify(token)
      .then(({ user }) => {
        setUser(user);
        navigate("/dashboard", { replace: true });
      })
      .catch(err => {
        const msg = {
          token_expired:      "This link has expired. Request a new one.",
          token_already_used: "This link has already been used. Request a new one.",
          invalid_token:      "Invalid sign-in link. Request a new one.",
        }[err.data?.error] ?? "Something went wrong. Try again.";
        setError(msg);
      });
  }, []);

  if (error) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="form-error">{error}</p>
          <a href="/login" className="btn-primary" style={{ display: "block", textAlign: "center" }}>
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="muted">Signing you in…</p>
      </div>
    </div>
  );
}
