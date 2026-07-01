import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as authApi } from "../api";
import { useAuth } from "../context/AuthContext";

const COLORS = [
  { seed: "violet", bg: "#6d28d9", label: "Violet" },
  { seed: "blue",   bg: "#1d4ed8", label: "Blue"   },
  { seed: "teal",   bg: "#0f766e", label: "Teal"   },
  { seed: "orange", bg: "#c2410c", label: "Orange"  },
  { seed: "rose",   bg: "#be123c", label: "Rose"    },
  { seed: "slate",  bg: "#475569", label: "Slate"   },
];

function initials(str) {
  return (str || "?")[0].toUpperCase();
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [username,    setUsername]    = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [avatarSeed,  setAvatarSeed]  = useState(user?.avatar_seed || "violet");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("Username must be 3–20 characters: lowercase letters, numbers, and underscores only.");
      return;
    }
    setError(""); setLoading(true);

    try {
      const { user: updated } = await authApi.updateProfile({
        username,
        display_name: displayName || undefined,
        avatar_seed: avatarSeed,
      });
      setUser(updated);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const code = err.data?.error;
      setError(
        code === "username_taken"    ? "That username is already taken. Try another." :
        code === "invalid_username"  ? err.data.message :
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const previewName = displayName || username || "You";
  const previewColor = COLORS.find(c => c.seed === avatarSeed) ?? COLORS[0];

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div>
          <p className="onboarding-step">Step 1 of 1</p>
          <h1 className="onboarding-title">Set up your profile</h1>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="username">
              Username <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="username" type="text" className="input"
              placeholder="e.g. jane_reads"
              value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
              autoFocus required autoCapitalize="none" autoCorrect="off"
            />
            <p className="field-hint">3–20 characters. Letters, numbers, underscores. Used to sign in.</p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="displayName">Display name (optional)</label>
            <input
              id="displayName" type="text" className="input"
              placeholder="e.g. Jane"
              value={displayName} onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label">Accent color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c.seed} type="button"
                    className={`color-swatch${avatarSeed === c.seed ? " selected" : ""}`}
                    style={{ background: c.bg }}
                    title={c.label}
                    onClick={() => setAvatarSeed(c.seed)}
                    aria-label={c.label}
                  />
                ))}
              </div>
              <div
                className={`avatar avatar-${avatarSeed}`}
                style={{ width: 40, height: 40, fontSize: 16 }}
                aria-hidden="true"
              >
                {initials(previewName)}
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Continue to ReadStack →"}
          </button>
        </form>
      </div>
    </div>
  );
}
