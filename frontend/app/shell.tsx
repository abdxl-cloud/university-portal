/* The `.fb-app` shell every route renders inside: theme attributes, the global
   detail popup layer, and the tweaks panel.

   Replaces App.jsx's hand-rolled view switch — React Router decides what goes
   in the <Outlet>, so this file only owns chrome. */
import React from "react";
import { Outlet, useNavigate } from "react-router";
import { DetailLayer } from "./components/detail";
import {
  TweakButton, TweakColor, TweakRadio, TweakSection, TweakSelect, TweakToggle, TweaksPanel,
} from "./components/tweaks-panel";
import { ACCENT_MAP, FONT_STACKS, useTheme } from "./theme";
import { useStore } from "./store/store";

/* catches render crashes so a broken screen shows an error card instead of a blank page */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div className="fb-card u-pad" style={{ maxWidth: 440, textAlign: "center" }}>
          <div className="u-h2" style={{ marginBottom: 8 }}>Something went wrong</div>
          <div className="u-muted" style={{ fontSize: 13.5, marginBottom: 6 }}>This screen hit an error. You can go back to the dashboard: your demo progress is saved.</div>
          <div className="u-meta fb-mono" style={{ marginBottom: 14 }}>{String(this.state.error?.message || this.state.error)}</div>
          <button className="fb-btn fb-btn--accent" onClick={() => { this.setState({ error: null }); this.props.onReset(); }}>Back to home</button>
        </div>
      </div>
    );
  }
}

export default function Shell() {
  const { dark, setDark, t, setTweak } = useTheme();
  const { actions } = useStore();
  const navigate = useNavigate();

  return (
    <div
      className="fb-app"
      data-theme={dark ? "dark" : "light"}
      data-accent={ACCENT_MAP[t.accent] || "crest"}
      data-density={t.density}
      style={{ minHeight: "100vh", "--font-sans": FONT_STACKS[t.font] || FONT_STACKS.Geist } as React.CSSProperties}
    >
      <ErrorBoundary onReset={() => navigate("/")}>
        <Outlet />
      </ErrorBoundary>
      <DetailLayer />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={["#5a1a8a", "#2c7a57", "#3a5fb0", "#9a6a1a"]}
          onChange={(v) => setTweak("accent", v as string)} />
        <TweakSelect label="Font" value={t.font}
          options={["Geist", "IBM Plex Sans", "Source Sans 3", "Source Serif 4"]}
          onChange={(v) => setTweak("font", v)} />
        <TweakToggle label="Dark mode" value={dark} onChange={setDark} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={["compact", "comfortable", "spacious"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Student level (demo)" value={t.studentLevel}
          options={["300", "400", "500"]}
          onChange={(v) => setTweak("studentLevel", v)} />
        <TweakSection label="Demo" />
        <TweakButton label="Reset demo progress" onClick={() => actions.reset()} />
      </TweaksPanel>
    </div>
  );
}
