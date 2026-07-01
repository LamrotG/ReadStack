import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function PublicLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  function navLink(path) {
    const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
    return isActive ? "pub-nav-link pub-nav-link-active" : "pub-nav-link";
  }

  return (
    <div className="public-layout">
      <header className="pub-nav">
        <Link to="/" className="pub-nav-wordmark">ReadStack</Link>
        <nav className="pub-nav-links">
          <Link to="/"      className={navLink("/")}>Home</Link>
          <Link to="/about" className={navLink("/about")}>About</Link>
          <Link to="/help"  className={navLink("/help")}>Help</Link>
        </nav>
        <div className="pub-nav-end">
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link to="/auth/login" className="btn btn-ghost" style={{ fontSize: 13, padding: "5px 14px" }}>
            Sign In
          </Link>
        </div>
      </header>

      <main className="public-main">
        {children}
      </main>

      <footer className="pub-footer">
        <span>© {new Date().getFullYear()} ReadStack</span>
        <div className="pub-footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/help">Help</Link>
        </div>
      </footer>
    </div>
  );
}
