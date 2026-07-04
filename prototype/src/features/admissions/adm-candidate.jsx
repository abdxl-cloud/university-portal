import React from "react";
const { Avatar, Btn, Card, Field, Icon, IconBtn, SPill } = window;
/* Admissions — CANDIDATE experience (self-contained view) */

function admProgress(state) {
  const A = window.ADM;
  const s = A.STATES[state] || A.STATES.draft;
  return Math.round((s.step / 11) * 100);
}

/* ---- shell ---- */
function CandidateShell({ store, actions, dark, setDark, onExit, children, route, go }) {
  const A = window.ADM;
  const a = store.admissions || {};
  const st = A.STATES[a.state] || A.STATES.draft;
  const [drawer, setDrawer] = React.useState(false);
  const nav = [
    ["overview", "My Application", "doc"],
    ["form", "Application Form", "edit"],
    ["status", "Status & Decision", "shield"],
    ["onboarding", "Onboarding", "cap"],
  ];
  const NavInner = ({ onPick }) => (
    <nav className="u-nav u-grow">
      {nav.map(([k, label, icon]) => (
        <div key={k} className="fb-nav-item" data-active={route === k} onClick={() => { go(k); onPick && onPick(); }}>
          <Icon name={icon} size={16} /><span className="u-grow">{label}</span>
        </div>
      ))}
    </nav>
  );
  return (
    <div className="u-shell">
      <aside className="u-sidebar">
        <div className="u-brand"><div className="u-logo">FT</div><div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Admissions Portal</div></div></div>
        <NavInner />
        <div className="fb-divider" style={{ margin: "8px 0" }} />
        <div className="fb-nav-item" onClick={onExit}><Icon name="logout" size={16} /> Exit application</div>
      </aside>

      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}><div className="u-logo">FT</div><div className="u-grow"><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Admissions</div></div><IconBtn name="x" onClick={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav u-grow"><NavInner onPick={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onExit}><Icon name="logout" size={16} /> Exit</div></div>
      </div>

      <div className="u-main">
        <header className="u-topbar">
          <button className="fb-icon-btn u-menu-btn" onClick={() => setDrawer(true)}><Icon name="menu" size={18} /></button>
          <div className="u-grow u-row" style={{ gap: 10, minWidth: 0 }}>
            <span className="u-h3" style={{ whiteSpace: "nowrap" }}>Application {new Date().getFullYear()}/{new Date().getFullYear() + 1}</span>
            <SPill tone={st.tone}>{st.label}</SPill>
          </div>
          <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} />
          <div className="u-row" style={{ gap: 8, paddingLeft: 4 }}>
            <Avatar initials={A.ME.initials} size={30} />
            <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}><div style={{ fontWeight: 500, fontSize: 13 }}>{A.ME.first}</div><div className="u-meta" style={{ fontSize: 11 }}>Applicant</div></div>
          </div>
        </header>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ================= GATE: landing → JAMB verify → OTP ================= */
function CandidateGate({ store, actions, dark, setDark, onExit, onReady }) {
  const A = window.ADM;
  const a = store.admissions || {};
  const [phase, setPhase] = React.useState(a.verified ? (a.activated ? "done" : "otp") : "landing");
  const [jamb, setJamb] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [resent, setResent] = React.useState(false);
  const otpRefs = React.useRef([]);

  React.useEffect(() => { if (a.verified && a.activated) onReady(); }, []);

  const verify = (e) => {
    e && e.preventDefault();
    setErr("");
    const clean = jamb.trim().toUpperCase();
    if (clean.length < 8) { setErr("Enter your full JAMB registration number (e.g. 20419283AF)."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (clean !== A.ME.jamb) { setErr("No matching JAMB record found. For this demo, use " + A.ME.jamb + "."); return; }
      actions.admVerify();
      setPhase("otp");
    }, 1100);
  };

  const setOtpAt = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1] && otpRefs.current[i + 1].focus();
  };
  const activate = () => {
    if (otp.join("").length < 6) { setErr("Enter the 6-digit code. (Demo: any 6 digits work.)"); return; }
    setErr(""); setLoading(true);
    setTimeout(() => { setLoading(false); actions.admActivate(); onReady(); }, 1000);
  };

  return (
    <div className="u-adm-gate fb-app" data-theme={dark ? "dark" : "light"}>
      <div className="u-adm-gate__bar">
        <div className="u-row" style={{ gap: 10, cursor: "pointer" }} onClick={onExit}><div className="u-logo" style={{ width: 30, height: 30 }}>FT</div><div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Admissions {new Date().getFullYear()}/{new Date().getFullYear() + 1}</div></div></div>
        <span className="u-grow" />
        <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} />
        <Btn variant="ghost" onClick={onExit}>Back to site</Btn>
      </div>

      {phase === "landing" && (
        <div className="u-adm-land">
          <div className="u-adm-land__hero">
            <span className="u-hero__eyebrow"><Icon name="spark" size={13} /> UTME admissions are now open</span>
            <h1>Begin your FUTECH application.</h1>
            <p>Verify your JAMB number to import your details, complete screening, and track your admission — all in one place.</p>
            <div className="u-adm-steps-preview">
              {[["barcode", "Verify JAMB"], ["shield", "Screening"], ["wallet", "Pay & submit"], ["cap", "Get admitted"]].map(([ic, l], i) => (
                <div key={l} className="u-adm-step-chip"><span className="u-icon"><Icon name={ic} size={15} /></span><span>{l}</span>{i < 3 && <Icon name="chevron" size={13} className="u-adm-step-arrow" />}</div>
              ))}
            </div>
          </div>
          <Card className="u-pad u-adm-verify">
            <div className="u-h2">Verify your JAMB number</div>
            <div className="u-muted" style={{ fontSize: 13.5, margin: "6px 0 18px" }}>We'll securely import your bio-data and UTME score from JAMB.</div>
            <form onSubmit={verify} className="u-stack" style={{ gap: 14 }}>
              <Field label="JAMB registration number" hint={err ? undefined : "Demo number: " + A.ME.jamb}>
                <input className="fb-input fb-input--mono" value={jamb} onChange={(e) => setJamb(e.target.value)} placeholder="20XXXXXXXX" autoFocus />
              </Field>
              {err && <div className="u-formerr"><Icon name="info" size={14} /> {err}</div>}
              <Btn variant="accent" size="lg" type="submit" disabled={loading} iconRight={loading ? undefined : "arrowRight"} style={{ width: "100%" }}>
                {loading ? "Verifying with JAMB…" : "Verify & continue"}
              </Btn>
            </form>
            <div className="u-meta" style={{ textAlign: "center", marginTop: 14 }}>Already started? Verifying again resumes your application.</div>
          </Card>
        </div>
      )}

      {phase === "otp" && (
        <div className="u-adm-center">
          <Card className="u-pad" style={{ maxWidth: 440, width: "100%" }}>
            <div className="u-row" style={{ gap: 12, marginBottom: 6 }}>
              <span className="u-icon" style={{ width: 40, height: 40 }}><Icon name="mail" size={19} /></span>
              <div><div className="u-h2">Activate your account</div><div className="u-meta">Enter the 6-digit code we sent</div></div>
            </div>
            <div className="u-adm-jamb-card">
              <Icon name="check" size={15} style={{ color: "var(--success)" }} />
              <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{A.ME.name}</div><div className="u-meta">JAMB {A.ME.jamb} · UTME {A.ME.score} · {A.progById(A.ME.programme).name}</div></div>
            </div>
            <div className="u-muted" style={{ fontSize: 13, margin: "16px 0 10px" }}>Code sent to {A.ME.email.replace(/(.{2}).*(@.*)/, "$1•••$2")} and {A.ME.phone.slice(0, 8)}•••</div>
            <div className="u-otp">
              {otp.map((d, i) => (
                <input key={i} ref={(el) => (otpRefs.current[i] = el)} className="u-otp__box" inputMode="numeric" maxLength={1} value={d}
                  onChange={(e) => setOtpAt(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1].focus(); }} />
              ))}
            </div>
            {err && <div className="u-formerr" style={{ marginTop: 12 }}><Icon name="info" size={14} /> {err}</div>}
            <Btn variant="accent" size="lg" disabled={loading} style={{ width: "100%", marginTop: 16 }} onClick={activate}>{loading ? "Activating…" : "Activate account"}</Btn>
            <div className="u-meta" style={{ textAlign: "center", marginTop: 12 }}>
              {resent ? "A new code has been sent." : <>Didn't get it? <a className="fb-link" onClick={() => setResent(true)}>Resend code</a></>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

window.CandidateShell = CandidateShell;
window.CandidateGate = CandidateGate;
window.admProgress = admProgress;
