// src/theme.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentAgency } from "./lib/db";

/* ---- Theme v2 defaults ---- */
const defaultThemeV2 = {
  mode: "light",                 // "light" | "dark"
  primary: "#1e63f0",
  primaryContrast: "#ffffff",
  accent: "#22c55e",
  accentContrast: "#0b1220",

  ink: "#0b1220",                // headline color
  muted: "#6b7280",

  bg: "#ffffff",                 // page background
  surface: "#ffffff",            // header/sections
  card: "#ffffff",               // cards
  border: "#e5e7eb",             // separators

  heroPattern: "grid",           // "none" | "grid" | "dots" | "gradient"
  heroTint: 0.20,                // 0–0.6

  radius: 12,                    // px
  elev: "soft"                   // "none" | "soft" | "lifted"
};

/* ---- helpers ---- */
function luminance(hex) {
  const h = (hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
const idealContrastOn = (color) => (luminance(color) > 0.54 ? "#0b1220" : "#ffffff");
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** Merge old theme shape ({primary, ink}) or partial v2 into full v2 */
export function normalizeTheme(input) {
  const t = input || {};
  const merged = { ...defaultThemeV2, ...t };

  // Back-compat: if only primary/ink exist, fill the rest
  merged.primary = t.primary || defaultThemeV2.primary;
  merged.ink = t.ink || defaultThemeV2.ink;

  // Auto-derive contrasts if not provided
  merged.primaryContrast = t.primaryContrast || idealContrastOn(merged.primary);
  merged.accent = t.accent || defaultThemeV2.accent;
  merged.accentContrast = t.accentContrast || idealContrastOn(merged.accent);

  // Guard rails
  merged.heroTint = clamp(Number(merged.heroTint ?? defaultThemeV2.heroTint), 0, 0.6);
  merged.radius = clamp(parseInt(merged.radius ?? defaultThemeV2.radius, 10) || 12, 6, 24);

  // Normalize enums
  if (!["light", "dark"].includes(merged.mode)) merged.mode = "light";
  if (!["none", "soft", "lifted"].includes(merged.elev)) merged.elev = "soft";
  if (!["none", "grid", "dots", "gradient"].includes(merged.heroPattern)) merged.heroPattern = "grid";

  return merged;
}

/** Write CSS vars to :root so any component/page can consume them */
function applyThemeVars(theme) {
  const root = document.documentElement;
  const t = normalizeTheme(theme);
  const vars = {
    "--bg": t.bg,
    "--surface": t.surface,
    "--card": t.card,
    "--border": t.border,
    "--ink": t.ink,
    "--muted": t.muted,
    "--primary": t.primary,
    "--primary-contrast": t.primaryContrast,
    "--accent": t.accent,
    "--accent-contrast": t.accentContrast,
    "--radius": `${t.radius}px`,
    "--elev-shadow":
      t.elev === "none" ? "none" : t.elev === "lifted" ? "0 12px 24px rgba(0,0,0,0.15)" : "0 6px 16px rgba(0,0,0,0.08)",
    "--mode": t.mode
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

/* ---- Context ---- */
const ThemeCtx = createContext({ theme: defaultThemeV2, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, _setTheme] = useState(defaultThemeV2);

  useEffect(() => {
    (async () => {
      const a = await getCurrentAgency();
      const initial = a?.theme ? normalizeTheme(a.theme) : defaultThemeV2;
      _setTheme(initial);
    })();
  }, []);

  useEffect(() => { applyThemeVars(theme); }, [theme]);

  const api = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        const merged = normalizeTheme(typeof next === "function" ? next(theme) : next);
        _setTheme(merged);
      }
    }),
    [theme]
  );

  return <ThemeCtx.Provider value={api}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
