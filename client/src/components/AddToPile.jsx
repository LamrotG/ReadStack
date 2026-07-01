import { useEffect, useRef, useState } from "react";
import { items as itemsApi } from "../api";

const TYPES = ["article", "book", "post", "other"];

function isUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function guessType(url) {
  const u = url.toLowerCase();
  if (/amazon\.com|goodreads\.com/.test(u)) return "book";
  if (/reddit\.com|twitter\.com|x\.com/.test(u)) return "post";
  return "article";
}

export default function AddToPile({ onAdded }) {
  const [title,    setTitle]    = useState("");
  const [expanded, setExpanded] = useState(false);
  const [desc,     setDesc]     = useState("");
  const [type,     setType]     = useState("article");
  const [link,     setLink]     = useState("");
  const [fetching, setFetching] = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [addError, setAddError] = useState("");
  const wrapRef = useRef(null);

  // Collapse on outside click when title is empty
  useEffect(() => {
    if (!expanded) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && !title.trim()) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expanded, title]);

  async function handleLinkChange(val) {
    setLink(val);
    if (isUrl(val)) {
      setType(guessType(val));
      if (!title.trim()) {
        setFetching(true);
        try {
          const data = await itemsApi.linkMetadata(val);
          if (data?.title && !title.trim()) setTitle(data.title);
        } catch { /* non-blocking */ }
        setFetching(false);
      }
    }
  }

  async function handleAdd() {
    const t = title.trim();
    const l = link.trim();
    if (!t && !l) return;
    setAdding(true);
    setAddError("");
    try {
      await itemsApi.create({
        title:       t || undefined,
        description: desc.trim() || undefined,
        type,
        link:        l || undefined,
      });
      setTitle(""); setDesc(""); setType("article"); setLink("");
      setExpanded(false);
      onAdded();
    } catch (err) {
      console.error(err);
      setAddError("Couldn't add item — please try again.");
    } finally {
      setAdding(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
  }

  const canAdd = !!(title.trim() || link.trim());

  return (
    <div className="add-pile" ref={wrapRef}>
      <div className="add-pile-top">
        <input
          className="add-pile-input"
          type="text"
          placeholder="Add to pile — paste a link or type a title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="add-pile-btn"
          onClick={canAdd ? handleAdd : () => setExpanded(true)}
          disabled={adding}
        >
          {adding ? "Adding…" : "Add to Pile"}
        </button>
      </div>

      {addError && (
        <p style={{ fontSize: 12, color: "var(--danger)", padding: "0 12px 8px", margin: 0 }}>{addError}</p>
      )}

      {expanded && (
        <div className="add-pile-expanded">
          <div className="add-pile-field">
            <label className="add-pile-label">Description</label>
            <textarea
              className="input"
              rows={2}
              placeholder="What is this? (optional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="add-pile-row">
            <div className="add-pile-field">
              <label className="add-pile-label">Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                {TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="add-pile-field">
              <label className="add-pile-label">
                Link{fetching && <span className="add-pile-fetching"> (fetching…)</span>}
              </label>
              <input
                className="input"
                type="url"
                placeholder="https://…"
                value={link}
                onChange={e => handleLinkChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
