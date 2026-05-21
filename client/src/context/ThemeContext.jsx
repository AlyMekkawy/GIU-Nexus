import { createContext, useContext, useState, useLayoutEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  /* Read from localStorage on first render so we know the saved preference
     before painting — prevents flash of wrong theme.                        */
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("giu-theme") || "dark"; }
    catch { return "dark"; }
  });

  /* useLayoutEffect fires synchronously before the browser paints,
     so the correct [data-theme] attribute is set on <html> before
     any CSS is applied — no flash.                                           */
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("giu-theme", theme); }
    catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
