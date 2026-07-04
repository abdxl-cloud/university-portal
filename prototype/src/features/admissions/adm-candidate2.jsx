import React from "react";
const { Btn, Card, Icon, SPill } = window;
/* Admissions — CANDIDATE screens (overview, stepped form, status, onboarding) */

function admPHead(title, sub, children) {
  return (
    <div className="u-page-head">
      <div><div className="u-h1">{title}</div>{sub && <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{sub}</div>}</div>
      {children && <div className="u-row u-wrap" style={{ gap: 8 }}>{children}</div>}
    </div>
  );
}

/* progress rail shown on overview + status */
function AdmRail({ state }) {
  const A = window.ADM;
  const milestones = [
    ["Activate", ["draft"]], ["Screening form", ["awaiting_payment"]], ["Submit", ["submitted", "under_review", "queried"]],
    ["Decision", ["screened", "recommended", "ineligible", "caps_pending"]], ["Admitted", ["admitted", "accepted"]], ["Enrolled", ["clearance_pending", "enrolled"]],
  ];
  const stepIdx = A.STATES[state] ? A.STATES[state].step : 1;
  return (
    <div className="u-adm-rail">
      {milestones.map(([label, states], i) => {
        const firstStepOfGroup = [1, 2, 3, 5, 8, 10][i];
        const done = stepIdx > firstStepOfGroup + (i === 5 ? 1 : 1);
        const active = states.includes(state);
        const passed = stepIdx > firstStepOfGroup;
        const cls = active ? "active" : passed ? "done" : "todo";
        return (
          <div key={label} className="u-adm-rail__node" data-state={cls}>
            <span className="u-adm-rail__dot">{cls === "done" ? <Icon name="check" size={12} /> : i + 1}</span>
            <span className="u-adm-rail__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================= OVERVIEW ================= */
function CandidateOverview({ store, actions, go }) {
  const A = window.ADM;
  const a = store.admissions;
  const st = A.STATES[a.state];
  const prog = A.progById(A.ME.programme);
  const formDone = a.state !== "draft" && a.state !== "jamb_imported";
  const pct = window.admProgress(a.state);

  const nextAction = (() => {
    if (a.state === "draft") return { label: "Start screening form", to: "form", icon: "edit" };
    if (a.state === "awaiting_payment") return { label: "Pay & submit", to: "form", icon: "wallet" };
    if (a.state === "queried") return { label: "Respond to query", to: "status", icon: "info" };
    if (a.state === "admitted") return { label: "Accept your offer", to: "status", icon: "cap" };
    if (a.state === "accepted" || a.state === "clearance_pending") return { label: "Continue onboarding", to: "onboarding", icon: "shield" };
    if (["submitted", "under_review", "screened", "recommended", "caps_pending"].includes(a.state)) return { label: "Track your status", to: "status", icon: "shield" };
    if (a.state === "enrolled") return { label: "Go to onboarding", to: "onboarding", icon: "cap" };
    return null;
  })();

  return (
    <div className="u-content">
      <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div><div className="u-h1">Hi {A.ME.first}, welcome</div><div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>Track and complete your FUTECH admission here.</div></div>
        {nextAction && <Btn variant="accent" icon={nextAction.icon} onClick={() => go(nextAction.to)}>{nextAction.label}</Btn>}
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
          <div className="u-row" style={{ gap: 10 }}><span className="u-h3">Application progress</span><SPill tone={st.tone}>{st.label}</SPill></div>
          <span className="u-meta u-num">{pct}% complete</span>
        </div>
        <div className="u-bar"><div className="u-bar__fill" style={{ width: pct + "%" }} /></div>
        <div className="u-muted" style={{ fontSize: 13.5, marginTop: 12 }}>{st.blurb}</div>
        <div style={{ marginTop: 18 }}><AdmRail state={a.state} /></div>
      </Card>

      <div className="u-grid u-grid--3">
        <Card className="u-pad">
          <div className="u-stat__k">JAMB / UTME</div>
          <div className="u-h2" style={{ marginTop: 8 }}>{A.ME.score}</div>
          <div className="u-meta">{A.ME.jamb}</div>
        </Card>
        <Card className="u-pad">
          <div className="u-stat__k">Programme of choice</div>
          <div className="u-h3" style={{ marginTop: 8 }}>{prog.name}</div>
          <div className="u-meta">Faculty of {prog.faculty} · cutoff {prog.cutoff}</div>
        </Card>
        <Card className="u-pad">
          <div className="u-stat__k">Screening fee</div>
          <div className="u-h2" style={{ marginTop: 8 }}>{A.fmt(A.SCREENING_FEE)}</div>
          <div className="u-meta">{a.screeningPaid ? "Paid" : "Payable at submission"}</div>
        </Card>
      </div>

      <Card className="u-pad" style={{ marginTop: 16 }}>
        <div className="u-h3" style={{ marginBottom: 12 }}>What you'll need</div>
        <div className="u-grid u-grid--2" style={{ gap: 10 }}>
          {A.DOC_TYPES.map((d) => (
            <div key={d.id} className="u-row" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
              <Icon name="doc" size={15} style={{ color: "var(--fg-subtle)" }} />
              <div className="u-grow"><div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div><div className="u-meta">{d.note}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

window.CandidateOverview = CandidateOverview;
window.AdmRail = AdmRail;
window.admPHead = admPHead;
