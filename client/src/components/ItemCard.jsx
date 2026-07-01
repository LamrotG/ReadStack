import { useEffect, useState } from "react";
import { items as itemsApi } from "../api";
import ProgressBar from "./ProgressBar";

const TYPE_ICON   = { book: "📖", article: "📄", post: "🔗", other: "📌" };
const STATUS_LABEL = { unread: "Unread", active: "Active", paused: "Paused", done: "Done", archived: "Archived" };

export default function ItemCard({ item, onClick }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (item.status === "active" || item.status === "paused") {
      itemsApi.progress(item.id).then(setProgress).catch(() => {});
    }
  }, [item.id, item.status]);

  return (
    <div className={`item-card status-${item.status}`} onClick={onClick}>
      <div className="item-card-header">
        <span className="type-icon">{TYPE_ICON[item.type] ?? "📌"}</span>
        <div className="item-card-title">
          {item.link
            ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
              >
                {item.title}
              </a>
            )
            : <span>{item.title}</span>}
        </div>
        <span className={`status-badge status-badge-${item.status}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {item.description && (
        <p className="item-card-desc">{item.description}</p>
      )}

      {(item.status === "active" || item.status === "paused") && progress && (
        <div className="item-card-progress">
          <ProgressBar
            value={progress.days_completed}
            max={progress.days_per_week}
            label={`${progress.days_completed} / ${progress.days_per_week} days this week`}
          />
          {progress.goal && (
            <span className="goal-summary">
              {progress.goal.goal_value} {progress.goal.goal_unit}/day
            </span>
          )}
        </div>
      )}
    </div>
  );
}
