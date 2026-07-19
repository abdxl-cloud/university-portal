/* Theme + design tweaks, shared by every screen.

   The portal drives dark mode off `data-theme` on `.fb-app` (see shell.tsx),
   not `prefers-color-scheme`, so the toggle state lives here rather than in CSS. */
import React from "react";
import { useTweaks, type SetTweak } from "./components/tweaks-panel";

export const ACCENT_MAP: Record<string, string> = {
  "#5a1a8a": "crest", "#2c7a57": "green", "#3a5fb0": "blue", "#9a6a1a": "amber",
};

export const FONT_STACKS: Record<string, string> = {
  "Geist": '"Geist","Geist Fallback","Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  "IBM Plex Sans": '"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif',
  "Source Sans 3": '"Source Sans 3",ui-sans-serif,system-ui,sans-serif',
  "Source Serif 4": '"Source Serif 4",Georgia,"Times New Roman",serif',
};

export interface Tweaks {
  accent: string;
  font: string;
  density: string;
  studentLevel: string;
}

export const TWEAK_DEFAULTS: Tweaks = /*EDITMODE-BEGIN*/{
  "accent": "#5a1a8a",
  "font": "IBM Plex Sans",
  "density": "comfortable",
  "studentLevel": "300"
}/*EDITMODE-END*/;

const DARK_KEY = "futech.dark";

function initialDark(): boolean {
  // no localStorage during the build-time prerender of index.html
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DARK_KEY) === "1";
}

export interface ThemeValue {
  dark: boolean;
  setDark: (v: boolean) => void;
  t: Tweaks;
  setTweak: SetTweak<Tweaks>;
}

const ThemeContext = React.createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [dark, setDark] = React.useState(initialDark);

  React.useEffect(() => { localStorage.setItem(DARK_KEY, dark ? "1" : "0"); }, [dark]);

  const value = React.useMemo<ThemeValue>(() => ({ dark, setDark, t, setTweak }), [dark, t, setTweak]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
