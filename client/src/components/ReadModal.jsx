import { useEffect, useRef, useState } from "react";
import { items as itemsApi } from "../api";
import CheckinModal from "./CheckinModal";
import ProgressBar from "./ProgressBar";
import ReviewModal from "./ReviewModal";
import SetGoalModal from "./SetGoalModal";

const TYPES = ["book", "article", "post", "other"];
const TYPE_LABEL = { book: "Book", article: "Article", post: "Post", other: "Other" };
const TYPE_ICON  = { book: "📖", article: "📄", post: "🔗", other: "📌" };

export default function ReadModal({ item: initialItem, onClose, onRefresh }) {
  const [item, setItem] = useState(initialItem);
  const [draft, setDraft] = useState({
    title:       initialItem.title       || "",
    description: initialItem.description || "",
    type:        initialItem.type        || "article",
    link:        initialItem.link        || "",
    source_note: initialItem.source_note || "",
  });
  const [saveState,  setSaveState]  = useState("idle"); // idle | saving | saved
  const [subModal,   setSubModal]   = useState(null);   // 'goal' | 'checkin' | 'review'
  const [progress,   setProgress]   = useState(null);
  const backdropRef = useRef(null);

  // Keep a snapshot of what's been saved to detect changes
  const saved = useRef({ ...draft });

  useEffect(() => {
    if (item.status === "active" || item.status === "paused") {
      itemsApi.progress(item.id).then(setProgress).catch(() => {});
    }
  }, [item.id, item.status]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !subModal) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, subModal]);

  async function saveFields(fields) {
    const changed = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== saved.current[k]) changed[k] = v;
    }
    if (Object.keys(changed).length === 0) return;
    setSaveState("saving");
    try {
      const updated = await itemsApi.update(item.id, changed);
      Object.assign(saved.current, changed);
      setItem(prev => ({ ...prev, ...updated }));
      setSaveState("saved");
      onRefresh();
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("idle");
    }
  }

  function handleBlur(field) {
    saveFields({ [field]: draft[field] });
  }

  async function handleSaveAll() {
    await saveFields(draft);
  }

  async function handleStatusChange(status) {
    setSaveState("saving");
    try {
      const updated = await itemsApi.update(item.id, { status });
      setItem(prev => ({ ...prev, ...updated }));
      setSaveState("saved");
      onRefresh();
      setTimeout(() => setSaveState("idle"), 1500);
    } catch { setSaveState("idle"); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await itemsApi.remove(item.id);
    onRefresh();
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  }

  function afterSubSave() {
    setSubModal(null);
    // Refresh item progress
    if (item.status === "active" || item.status === "paused") {
      itemsApi.progress(item.id).then(setProgress).catch(() => {});
    }
    onRefresh();
  }

  // Sub-modals render over the read modal
  if (subModal === "goal") {
    return <SetGoalModal item={item} onClose={() => setSubModal(null)} onSaved={afterSubSave} />;
  }
  if (subModal === "checkin") {
    return <CheckinModal item={item} onClose={() => setSubModal(null)} onSaved={afterSubSave} />;
  }
  if (subModal === "review") {
    return <ReviewModal item={item} onClose={() => setSubModal(null)} onSaved={afterSubSave} />;
  }

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="read-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="read-modal-header">
          <div className="read-modal-title-row">
            <span style={{ fontSize: 18, marginTop: 3, flexShrink: 0 }}>
              {TYPE_ICON[item.type] ?? "📌"}
            </span>
            <textarea
              className="read-modal-title-input"
              rows={1}
              value={draft.title}
              onChange={e => {
                setDraft(d => ({ ...d, title: e.target.value }));
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onBlur={() => handleBlur("title")}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } }}
            />
            <button className="read-modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Progress bar for active/paused items */}
          {progress && (item.status === "active" || item.status === "paused") && (
            <ProgressBar
              value={progress.days_completed}
              max={progress.days_per_week}
              label={`${progress.days_completed} / ${progress.days_per_week} days this week`}
            />
          )}

          {/* Action buttons */}
          <div className="read-modal-actions">
            {item.status === "unread" && (
              <button className="btn-action" onClick={() => setSubModal("goal")}>Set goal &amp; start</button>
            )}
            {item.status === "active" && (
              <>
                <button className="btn-action btn-action-primary" onClick={() => setSubModal("checkin")}>Check in today</button>
                <button className="btn-action" onClick={() => handleStatusChange("paused")}>Pause</button>
                <button className="btn-action" onClick={() => handleStatusChange("done")}>Mark done</button>
              </>
            )}
            {item.status === "paused" && (
              <>
                <button className="btn-action" onClick={() => handleStatusChange("active")}>Resume</button>
                <button className="btn-action" onClick={() => handleStatusChange("done")}>Mark done</button>
              </>
            )}
            {(item.status === "active" || item.status === "paused" || item.status === "done") && (
              <button className="btn-action" onClick={() => setSubModal("review")}>Write review</button>
            )}
            {item.status === "archived" && (
              <button className="btn-action" onClick={() => handleStatusChange("unread")}>Unarchive</button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="read-modal-body">
          <div className="field">
            <label className="field-label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What is this about? (optional)"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              onBlur={() => handleBlur("description")}
            />
          </div>

          <div className="add-pile-row">
            <div className="field">
              <label className="field-label">Type</label>
              <select
                className="input"
                value={draft.type}
                onChange={e => {
                  const v = e.target.value;
                  setDraft(d => ({ ...d, type: v }));
                  saveFields({ type: v });
                }}
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Link</label>
              {draft.link ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://…"
                    value={draft.link}
                    onChange={e => setDraft(d => ({ ...d, link: e.target.value }))}
                    onBlur={() => handleBlur("link")}
                    style={{ flex: 1 }}
                  />
                  <a
                    href={draft.link}
                    target="_blank"
                    rel="noreferrer"
                    title="Open link"
                    style={{ color: "var(--text-muted)", fontSize: 14 }}
                  >↗</a>
                </div>
              ) : (
                <input
                  className="input"
                  type="url"
                  placeholder="https://…"
                  value={draft.link}
                  onChange={e => setDraft(d => ({ ...d, link: e.target.value }))}
                  onBlur={() => handleBlur("link")}
                />
              )}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Source note</label>
            <input
              className="input"
              type="text"
              placeholder="Where did you find this? (optional)"
              value={draft.source_note}
              onChange={e => setDraft(d => ({ ...d, source_note: e.target.value }))}
              onBlur={() => handleBlur("source_note")}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="read-modal-footer">
          <div className="read-modal-footer-left">
            <button
              className="btn btn-danger"
              style={{ fontSize: 13, padding: "6px 14px" }}
              onClick={handleDelete}
            >
              Delete
            </button>
            {item.status !== "archived" && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: "6px 14px" }}
                onClick={() => handleStatusChange("archived")}
              >
                Archive
              </button>
            )}
          </div>
          <div className="read-modal-footer-right">
            <span className={`autosave-hint ${saveState !== "idle" ? saveState : ""}`}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
            </span>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "6px 16px" }}
              onClick={handleSaveAll}
              disabled={saveState === "saving"}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
