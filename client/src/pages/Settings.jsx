import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function ChangePasswordForm() {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent(""); setNext(""); setConfirm("");
      setSuccess("Password updated.");
    } catch (err) {
      const code = err.data?.error;
      setError(
        code === "wrong_current_password" ? "Current password is incorrect." :
        code === "password_too_short"     ? "New password must be at least 8 characters." :
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
      <div className="field">
        <label className="field-label" htmlFor="current_pw">Current password</label>
        <div className="input-wrap">
          <input id="current_pw" className="input" type={showPw ? "text" : "password"}
            value={current} onChange={e => setCurrent(e.target.value)} required />
          <button type="button" className="input-eye" onClick={() => setShowPw(v => !v)}>
            {showPw ? "🙈" : "👁"}
          </button>
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="new_pw">New password</label>
        <input id="new_pw" className="input" type={showPw ? "text" : "password"}
          placeholder="Min 8 characters"
          value={next} onChange={e => setNext(e.target.value)} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="confirm_pw">Confirm new password</label>
        <input id="confirm_pw" className="input" type={showPw ? "text" : "password"}
          placeholder="Same password again"
          value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      {error   && <p className="form-error">{error}</p>}
      {success && <p style={{ fontSize: 13, color: "var(--success)" }}>{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

const AVATAR_SEEDS = ["violet", "blue", "teal", "orange", "rose", "slate"];

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout }      = useAuth();
  const { setThemePreference }         = useTheme();

  const [form, setForm] = useState({
    username:         user?.username         || "",
    display_name:     user?.display_name     || "",
    avatar_seed:      user?.avatar_seed      || "slate",
    theme_preference: user?.theme_preference || "dark",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const { user: updated } = await authApi.updateProfile(form);
      setUser(updated);
      setThemePreference(form.theme_preference);
      setSuccess("Settings saved.");
    } catch (err) {
      const code = err.data?.error;
      setError(
        code === "username_taken"    ? "That username is already taken." :
        code === "invalid_username"  ? "Username must be 3–20 chars: lowercase letters, numbers, underscores." :
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-shell">
      <header className="settings-topbar">
        <button
          className="btn btn-ghost"
          style={{ fontSize: 13, padding: "5px 12px" }}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
        <span className="settings-topbar-title">Settings</span>
      </header>

      <main className="settings-main">
        {/* Profile section */}
        <form className="settings-section" onSubmit={handleSave}>
          <h2 className="settings-section-title">Profile</h2>

          <div className="field">
            <label className="field-label">Avatar color</label>
            <div className="color-picker">
              {AVATAR_SEEDS.map(seed => (
                <button
                  key={seed}
                  type="button"
                  className={`color-swatch avatar-${seed}${form.avatar_seed === seed ? " selected" : ""}`}
                  onClick={() => set("avatar_seed", seed)}
                  aria-label={seed}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="display_name">Display name</label>
            <input
              id="display_name" className="input" type="text"
              placeholder="How you want to be called"
              value={form.display_name}
              onChange={e => set("display_name", e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username" className="input" type="text"
              placeholder="your_username"
              value={form.username}
              onChange={e => set("username", e.target.value.toLowerCase())}
              autoCapitalize="none" autoCorrect="off"
            />
            <span className="field-hint">3–20 characters: lowercase letters, numbers, underscores</span>
          </div>

          <div className="field">
            <label className="field-label">Theme</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["dark", "light"].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`btn ${form.theme_preference === t ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: 13, padding: "6px 16px" }}
                  onClick={() => set("theme_preference", t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error   && <p className="form-error">{error}</p>}
          {success && <p style={{ fontSize: 13, color: "var(--success)" }}>{success}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ alignSelf: "flex-start" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        {/* Change password section */}
        <div className="settings-section">
          <h2 className="settings-section-title">Change password</h2>
          <ChangePasswordForm />
        </div>

        {/* Account section */}
        <div className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="field">
            <label className="field-label">Email address</label>
            <p style={{ fontSize: 14, color: "var(--text-2)", padding: "9px 0" }}>{user?.email}</p>
            <span className="field-hint">Email cannot be changed at this time.</span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 13, padding: "6px 14px", alignSelf: "flex-start", marginTop: 8 }}
            onClick={logout}
          >
            Sign out of all devices
          </button>
        </div>
      </main>
    </div>
  );
}
