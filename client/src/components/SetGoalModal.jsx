import { useState } from "react";
import { items as itemsApi } from "../api";
import Modal from "./Modal";

const UNITS = ["pages", "minutes", "chapters", "percent"];

export default function SetGoalModal({ item, onClose, onSaved }) {
  const [goalUnit, setGoalUnit]     = useState("pages");
  const [goalValue, setGoalValue]   = useState("");
  const [daysPerWeek, setDays]      = useState("3");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await itemsApi.setGoal(item.id, {
        goal_unit:    goalUnit,
        goal_value:   parseFloat(goalValue),
        days_per_week: parseInt(daysPerWeek, 10),
        target_date:  targetDate || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.data?.error ?? "Failed to save goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Set goal — ${item.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          <span>Unit</span>
          <select className="input" value={goalUnit} onChange={e => setGoalUnit(e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          <span>Goal per day ({goalUnit})</span>
          <input
            className="input" type="number" min="1" step="any" required
            value={goalValue} onChange={e => setGoalValue(e.target.value)}
            placeholder="e.g. 10"
          />
        </label>
        <label>
          <span>Days per week</span>
          <input
            className="input" type="number" min="1" max="7" required
            value={daysPerWeek} onChange={e => setDays(e.target.value)}
          />
        </label>
        <label>
          <span>Target finish date (optional)</span>
          <input className="input" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Set goal & start"}
        </button>
      </form>
    </Modal>
  );
}
