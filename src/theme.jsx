import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { getCurrentAgency } from "./lib/db";

const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({ primary: "#1E63F0", ink: "#0B1535" });

  useEffect(() => {
    (async () => {
      const a = await getCurrentAgency();
      if (a?.theme) setTheme(a.theme);
    })();
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
