import React, { createContext, useContext, useMemo, useState } from "react";
import { loadAgency } from "./lib/storage";

const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const initial = loadAgency();
  const [theme, setTheme] = useState(
    initial?.theme || { primary: "#1E63F0", ink: "#0B1535" }
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeCtx.Provider value={value}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
