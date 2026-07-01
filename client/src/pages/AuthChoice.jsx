import { useNavigate } from "react-router-dom";

export default function AuthChoice() {
  const navigate = useNavigate();

  return (
    <div className="auth-shell" style={{ position: "relative" }}>
      <button className="auth-back" onClick={() => navigate("/")}>← Back</button>

      <p className="auth-wordmark">ReadStack</p>

      <div className="auth-choice">
        <div>
          <p className="auth-choice-title">Welcome</p>
          <p className="auth-choice-desc" style={{ marginTop: 6 }}>How do you want to continue?</p>
        </div>

        <div className="auth-choice-btns">
          <button className="btn btn-primary btn-full" onClick={() => navigate("/auth/signup")}>
            Create account
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => navigate("/auth/login")}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
