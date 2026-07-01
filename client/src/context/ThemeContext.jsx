import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("rs-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("rs-theme", next);
  }

  function setThemePreference(pref) {
    if (pref !== "dark" && pref !== "light") return;
    setTheme(pref);
    localStorage.setItem("rs-theme", pref);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
