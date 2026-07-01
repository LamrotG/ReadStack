import { useState } from "react";
import { items as itemsApi } from "../api";

const TYPE_OPTIONS = ["book", "article", "post", "other"];

function guessType(value) {
  if (/^https?:\/\//i.test(value)) {
    if (/amazon|goodreads|book/i.test(value)) return "book";
    return "article";
  }
  return "other";
}

export default function DumpBar({ onAdded }) {
  const [value, setValue]   = useState("");
  const [type, setType]     = useState("other");
  const [adding, setAdding] = useState(false);
  const [error, setError]   = useState("");

  function handleChange(e) {
    const v = e.target.value;
    setValue(v);
    setType(guessType(v));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setError("");
    setAdding(true);
    try {
      const isUrl = /^https?:\/\//i.test(value.trim());
      await itemsApi.create({
        ...(isUrl ? { link: value.trim() } : { title: value.trim() }),
        type,
      });
      setValue("");
      setType("other");
      onAdded();
    } catch (err) {
      setError(err.data?.error ?? "Failed to add item.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <form className="dump-bar" onSubmit={handleSubmit}>
      <input
        className="input dump-input"
        type="text"
        placeholder="Paste a link or type a title to add…"
        value={value}
        onChange={handleChange}
        disabled={adding}
      />
      <select className="input dump-type" value={type} onChange={e => setType(e.target.value)}>
        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button className="btn-primary" type="submit" disabled={adding || !value.trim()}>
        {adding ? "Adding…" : "Add"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
