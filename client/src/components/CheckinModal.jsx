import { useState } from "react";
import { checkins as checkinsApi } from "../api";
import Modal from "./Modal";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CheckinModal({ item, onClose, onSaved }) {
  const [date, setDate]   = useState(today());
  const [note, setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await checkinsApi.create({
        item_id:      item?.id ?? undefined,
        checkin_date: date,
        note:         note || undefined,
      });
      onSaved();
    } catch (err) {
      if (err.data?.error === "already_checked_in") {
        setError("Already checked in for this item on that day.");
      } else {
        setError(err.data?.error ?? "Failed to save check-in.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={item ? `Check in — ${item.title}` : "General check-in"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          <span>Date</span>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label>
          <span>Note (optional)</span>
          <textarea
            className="input" rows={3}
            placeholder="What did you read? Any thoughts?"
            value={note} onChange={e => setNote(e.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Log check-in"}
        </button>
      </form>
    </Modal>
  );
}
