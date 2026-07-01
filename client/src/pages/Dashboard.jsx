import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkins as checkinsApi, goals as goalsApi, items as itemsApi } from "../api";
import AddToPile from "../components/AddToPile";
import ItemCard from "../components/ItemCard";
import ProgressBar from "../components/ProgressBar";
import ReadModal from "../components/ReadModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Avatar({ user }) {
  const seed    = user?.avatar_seed || "slate";
  const name    = user?.display_name || user?.username || "?";
  const initial = name[0].toUpperCase();
  return <div className={`avatar avatar-${seed}`}>{initial}</div>;
}

const TABS = [
  { key: "pile",    label: "Pile",    statuses: ["unread"] },
  { key: "active",  label: "Active",  statuses: ["active", "paused"] },
  { key: "done",    label: "Done",    statuses: ["done"] },
  { key: "archive", label: "Archive", statuses: ["archived"] },
];

function weekRange() {
  const now  = new Date();
  const day  = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diff);
  mon.setUTCHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout }        = useAuth();
  const { theme, toggleTheme }  = useTheme();

  const [tab,           setTab]          = useState("pile");
  const [allItems,      setAllItems]     = useState([]);
  const [archivedItems, setArchived]     = useState([]);
  const [overallGoal,   setOverallGoal]  = useState(null);
  const [weekCheckins,  setWeekCheckins] = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [selectedItem,  setSelectedItem] = useState(null);
  const [menuOpen,      setMenuOpen]     = useState(false);
  const avatarWrapRef = useRef(null);

  // Close avatar menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (avatarWrapRef.current && !avatarWrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = weekRange();
      const [itemsResult, archivedResult, goalResult, checkinResult] = await Promise.allSettled([
        itemsApi.list(),
        itemsApi.list("archived"),
        goalsApi.getOverall(),
        checkinsApi.list(from, to),
      ]);
      if (itemsResult.status   === "fulfilled") setAllItems(itemsResult.value);
      if (archivedResult.status === "fulfilled") setArchived(archivedResult.value);
      if (goalResult.status    === "fulfilled") setOverallGoal(goalResult.value?.overall_goal_days_per_week ?? null);
      if (checkinResult.status === "fulfilled") setWeekCheckins(checkinResult.value);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // When selected item changes after a refresh, re-sync it from the latest list
  useEffect(() => {
    if (!selectedItem) return;
    const all = [...allItems, ...archivedItems];
    const fresh = all.find(i => i.id === selectedItem.id);
    if (fresh) setSelectedItem(fresh);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, archivedItems]);

  const activeTab   = TABS.find(t => t.key === tab);
  const tabItems    = tab === "archive" ? archivedItems : allItems.filter(i => activeTab.statuses.includes(i.status));
  const unreadCount = allItems.filter(i => i.status === "unread").length;
  const daysIn      = new Set(weekCheckins.map(c => c.checkin_date)).size;

  // Split active tab into active + paused sections
  const activeItems = allItems.filter(i => i.status === "active");
  const pausedItems = allItems.filter(i => i.status === "paused");

  function openItem(item) { setSelectedItem(item); }
  function closeModal()   { setSelectedItem(null); }

  function handleRefresh() {
    loadData();
  }

  return (
    <div className="dashboard">
      {/* ── Topbar ── */}
      <header className="topbar">
        <span className="topbar-logo">ReadStack</span>
        <div className="topbar-right">
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className="avatar-wrap" ref={avatarWrapRef}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <Avatar user={user} />
            </button>
            {menuOpen && (
              <div className="avatar-menu" role="menu">
                <button
                  className="avatar-menu-item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                >
                  Profile settings
                </button>
                <div className="avatar-menu-divider" />
                <button
                  className="avatar-menu-item danger"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); logout(); }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* ── Summary bar ── */}
        <section className="summary-bar">
          <div className="summary-stat">
            <span className="summary-value">{unreadCount}</span>
            <span className="summary-label">unread in pile</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-stat summary-progress">
            <span className="summary-label">This week</span>
            <ProgressBar
              value={daysIn}
              max={overallGoal ?? 7}
              label={overallGoal
                ? `${daysIn} / ${overallGoal} days`
                : `${daysIn} day${daysIn !== 1 ? "s" : ""} checked in`}
            />
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="tabs">
          {TABS.map(t => {
            const count = t.key === "archive"
              ? archivedItems.length
              : allItems.filter(i => t.statuses.includes(i.status)).length;
            return (
              <button
                key={t.key}
                className={`tab-btn${tab === t.key ? " tab-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Pile tab: add-to-pile entry ── */}
        {tab === "pile" && <AddToPile onAdded={loadData} />}

        {/* ── Content ── */}
        {loading ? (
          <p className="muted loading-msg">Loading…</p>
        ) : tab === "active" ? (
          /* Active tab: separate active and paused sections */
          activeItems.length === 0 && pausedItems.length === 0 ? (
            <p className="muted empty-msg">No active items. Set a goal on something from your Pile.</p>
          ) : (
            <>
              {activeItems.length > 0 && (
                <div className="section-group">
                  <div className="section-group-label">
                    <span title="Currently in progress">Active</span>
                    <span className="tab-count">{activeItems.length}</span>
                  </div>
                  <div className="item-list">
                    {activeItems.map(item => (
                      <ItemCard key={item.id} item={item} onClick={() => openItem(item)} />
                    ))}
                  </div>
                </div>
              )}
              {pausedItems.length > 0 && (
                <div className="section-group">
                  <div className="section-group-label">
                    <span title="Set aside for now">Paused</span>
                    <span className="tab-count">{pausedItems.length}</span>
                  </div>
                  <div className="item-list">
                    {pausedItems.map(item => (
                      <ItemCard key={item.id} item={item} onClick={() => openItem(item)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        ) : tabItems.length === 0 ? (
          <p className="muted empty-msg">
            {tab === "pile"    ? "Nothing saved yet — add something above." :
             tab === "done"    ? "Nothing finished yet. Keep going!" :
             tab === "archive" ? "No archived items." : ""}
          </p>
        ) : (
          <div className="item-list">
            {tabItems.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => openItem(item)} />
            ))}
          </div>
        )}
      </main>

      {/* ── Read modal ── */}
      {selectedItem && (
        <ReadModal
          item={selectedItem}
          onClose={closeModal}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
