import { useState } from "react";
import { items as itemsApi } from "../api";
import Modal from "./Modal";

export default function ReviewModal({ item, onClose, onSaved }) {
  const [body, setBody]             = useState("");
  const [visibility, setVisibility] = useState("private");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await itemsApi.addReview(item.id, { body, visibility });
      onSaved();
    } catch (err) {
      setError(err.data?.error ?? "Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Review — ${item.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          <span>Your review</span>
          <textarea
            className="input" rows={5} required
            placeholder="What did you think?"
            value={body} onChange={e => setBody(e.target.value)}
          />
        </label>
        <div className="radio-group">
          {["private", "public"].map(v => (
            <label key={v} className="radio-label">
              <input
                type="radio" name="visibility" value={v}
                checked={visibility === v} onChange={() => setVisibility(v)}
              />
              {v === "private" ? "Private (just me)" : "Public"}
            </label>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Submit review & mark done"}
        </button>
      </form>
    </Modal>
  );
}
