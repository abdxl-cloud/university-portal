import React from "react";
const { Btn, Card, Empty, Icon, SPill, Tag } = window;
/* Admissions — CANDIDATE status & onboarding screens */

/* ================= STATUS & DECISION ================= */
function CandidateStatus({ store, actions, go }) {
  const A = window.ADM;
  const a = store.admissions;
  const st = A.STATES[a.state];
  const prog = A.progById((a.form && a.form.programme) || A.ME.programme);
  const queryText = a.staffQuery;
  const [resp, setResp] = React.useState("");

  // pre-submit: nudge to finish
  if (["jamb_imported", "draft", "awaiting_payment"].includes(a.state)) {
    return (
      <div className="u-content u-content--narrow">
        {window.admPHead("Status & Decision")}
        <Card className="u-pad"><Empty icon="shield" title="No decision yet" sub="Submit your screening form first. Your application status and admission decision will appear here." /></Card>
        <div className="u-row" style={{ justifyContent: "center", marginTop: 16 }}><Btn variant="accent" icon="edit" onClick={() => go("form")}>Go to application form</Btn></div>
      </div>
    );
  }

  const timeline = [
    { state: "submitted", label: "Application submitted", done: A.STATES[a.state].step >= 3 },
    { state: "under_review", label: "Under review by admissions", done: A.STATES[a.state].step >= 4 },
    { state: "screened", label: "Screening completed", done: A.STATES[a.state].step >= 5 },
    { state: "recommended", label: "Recommended for admission", done: A.STATES[a.state].step >= 6 && a.state !== "ineligible" },
    { state: "admitted", label: "Admission offered", done: A.STATES[a.state].step >= 8 },
  ];

  return (
    <div className="u-content u-content--narrow">
      {window.admPHead("Status & Decision", "Live status of your application")}

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 10, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 10 }}><span className="u-h3">Current status</span><SPill tone={st.tone}>{st.label}</SPill></div>
          <span className="u-meta">{prog.name}</span>
        </div>
        <div className="u-muted" style={{ fontSize: 13.5, marginTop: 10 }}>{st.blurb}</div>
      </Card>

      {/* queried — actionable */}
      {a.state === "queried" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--warning)", background: "var(--warning-soft)" }}>
          <div className="u-row" style={{ gap: 10, marginBottom: 10 }}>
            <Icon name="info" size={17} style={{ color: "oklch(from var(--warning) calc(l - 0.2) c h)" }} />
            <div className="u-h3" style={{ color: "oklch(from var(--warning) calc(l - 0.3) c h)" }}>Action required: query from admissions</div>
          </div>
          <div style={{ fontSize: 13.5, color: "oklch(from var(--warning) calc(l - 0.25) c h)", marginBottom: 12 }}>{queryText || "Please review and correct your submission."}</div>
          <textarea className="fb-textarea" rows={3} value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Type your response to the officer…" />
          <Btn variant="accent" size="sm" icon="check" disabled={!resp.trim()} style={{ marginTop: 10 }} onClick={() => actions.admRespondQuery(resp)}>Submit response</Btn>
        </Card>
      )}

      {/* ineligible */}
      {a.state === "ineligible" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--danger)" }}>
          <div className="u-h3" style={{ color: "var(--danger)" }}>Not eligible for {prog.name}</div>
          <div className="u-muted" style={{ fontSize: 13.5, marginTop: 6 }}>Your UTME score ({A.ME.score}) is below this programme's cutoff ({prog.cutoff}). You may be eligible for a change of course via JAMB CAPS.</div>
          <Btn variant="secondary" icon="arrowRight" style={{ marginTop: 12 }} onClick={() => go("onboarding")}>See CAPS guidance</Btn>
        </Card>
      )}

      {/* admitted — accept offer */}
      {a.state === "admitted" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--success)", background: "var(--success-soft)" }}>
          <div className="u-row" style={{ gap: 10, marginBottom: 8 }}><span className="u-icon" style={{ background: "transparent", color: "var(--success)" }}><Icon name="cap" size={18} /></span><div className="u-h2" style={{ color: "oklch(from var(--success) calc(l - 0.12) c h)" }}>Congratulations — you've been admitted!</div></div>
          <div style={{ fontSize: 13.5, color: "oklch(from var(--success) calc(l - 0.2) c h)", marginBottom: 14 }}>You have been offered provisional admission to study <strong>{prog.name}</strong>. Accept your offer to begin onboarding.</div>
          <div className="u-row u-wrap" style={{ gap: 8 }}>
            <Btn variant="accent" icon="check" onClick={actions.admAccept}>Accept offer</Btn>
            <Btn variant="secondary" onClick={() => go("onboarding")}>View admission letter</Btn>
          </div>
        </Card>
      )}

      {(a.state === "accepted" || a.state === "clearance_pending" || a.state === "enrolled") && (
        <Card className="u-pad" style={{ marginBottom: 16, background: "var(--success-soft)", borderColor: "transparent" }}>
          <div className="u-row" style={{ gap: 10 }}><Icon name="check" size={16} style={{ color: "var(--success)" }} /><div className="u-grow"><div className="u-h3" style={{ color: "oklch(from var(--success) calc(l - 0.12) c h)" }}>Offer accepted</div><div className="u-meta">Continue to onboarding to complete clearance.</div></div><Btn variant="accent" size="sm" onClick={() => go("onboarding")}>Onboarding</Btn></div>
        </Card>
      )}

      {/* timeline */}
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 14 }}>Application timeline</div>
        <div className="u-adm-timeline">
          {timeline.map((t, i) => (
            <div key={i} className="u-adm-tl" data-done={t.done}>
              <span className="u-adm-tl__dot">{t.done && <Icon name="check" size={11} />}</span>
              <div><div style={{ fontWeight: 500, fontSize: 13.5, color: t.done ? "var(--fg)" : "var(--fg-subtle)" }}>{t.label}</div></div>
            </div>
          ))}
        </div>
      </Card>

      {/* demo helper */}
      <div className="u-adm-sim">
        <Icon name="spark" size={13} /> Demo: simulate the admissions office moving your application forward.
        <div className="u-row u-wrap" style={{ gap: 6, marginTop: 8 }}>
          {a.state === "submitted" && <Btn variant="secondary" size="sm" onClick={() => actions.admStaffSet("under_review", "Officer began review")}>Begin review</Btn>}
          {a.state === "under_review" && <><Btn variant="secondary" size="sm" onClick={() => actions.admStaffSet("screened", "Screening completed")}>Mark screened</Btn><Btn variant="secondary" size="sm" onClick={() => actions.admStaffQuery("Your uploaded O'Level result is unclear. Please re-upload a clearer copy.")}>Raise a query</Btn></>}
          {a.state === "screened" && <Btn variant="secondary" size="sm" onClick={() => actions.admStaffSet("admitted", "Recommended & admitted")}>Offer admission</Btn>}
        </div>
      </div>
    </div>
  );
}

/* ================= ONBOARDING (offer letter, CAPS, acceptance, clearance) ================= */
function CandidateOnboarding({ store, actions, go }) {
  const A = window.ADM;
  const a = store.admissions;
  const prog = A.progById((a.form && a.form.programme) || A.ME.programme);
  const admittedYet = ["admitted", "accepted", "clearance_pending", "enrolled"].includes(a.state);

  if (!admittedYet) {
    return (
      <div className="u-content u-content--narrow">
        {window.admPHead("Onboarding", "Available once you're admitted")}
        <Card className="u-pad" style={{ marginBottom: 16 }}>
          <div className="u-h3" style={{ marginBottom: 10 }}>JAMB CAPS guidance</div>
          <div className="u-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>Admission to Nigerian universities is finalised on the JAMB Central Admissions Processing System (CAPS). When FUTECH recommends you, you must log in to CAPS to <strong>accept or reject</strong> the offer. Keep checking your status here and on CAPS.</div>
          <ol className="u-adm-caps">
            <li>Log in to the JAMB CAPS portal with your profile.</li>
            <li>Open "Admission Status".</li>
            <li>If recommended, choose <strong>Accept</strong> to confirm your place.</li>
            <li>Return here to pay your acceptance fee and start clearance.</li>
          </ol>
        </Card>
        <Card className="u-pad"><Empty icon="cap" title="No offer yet" sub="Your admission letter and clearance checklist will unlock once you're admitted." /></Card>
      </div>
    );
  }

  return (
    <div className="u-content u-content--narrow">
      {window.admPHead("Onboarding", "Complete these steps to become a student")}

      {/* admission letter */}
      <Card style={{ marginBottom: 16 }}>
        <div className="u-slip__head">
          <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="cap" size={18} /></span>
          <div className="u-grow"><div className="u-h3">Provisional admission letter</div><div className="u-meta">{new Date().getFullYear()}/{new Date().getFullYear() + 1} session</div></div>
          <span className="u-stamp fb-hide-mobile">Admitted</span>
        </div>
        <div className="u-pad">
          {[["Candidate", A.ME.name], ["JAMB no.", A.ME.jamb], ["Programme", prog.name], ["Faculty", "Faculty of " + prog.faculty], ["Entry mode", "UTME"], ["UTME score", A.ME.score]].map(([k, v]) => (
            <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
          <Btn variant="secondary" icon="print" style={{ marginTop: 14 }}>Print admission letter</Btn>
        </div>
      </Card>

      {/* acceptance fee */}
      <AcceptanceCard store={store} actions={actions} />

      {/* clearance checklist */}
      {(a.state === "clearance_pending" || a.state === "enrolled") && <ClearanceCard store={store} actions={actions} go={go} />}
    </div>
  );
}

function AcceptanceCard({ store, actions }) {
  const A = window.ADM;
  const a = store.admissions;
  const [proc, setProc] = React.useState(false);
  if (a.acceptancePaid) {
    return (
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--success-soft)", borderColor: "transparent" }}>
        <div className="u-row" style={{ gap: 10 }}><Icon name="check" size={16} style={{ color: "var(--success)" }} /><div className="u-grow"><div className="u-h3" style={{ color: "oklch(from var(--success) calc(l - 0.12) c h)" }}>Acceptance fee paid</div><div className="u-meta">{A.fmt(A.ACCEPTANCE_FEE)} confirmed</div></div></div>
      </Card>
    );
  }
  if (a.state === "admitted") {
    return <Card className="u-pad" style={{ marginBottom: 16 }}><div className="u-muted" style={{ fontSize: 13.5 }}><Icon name="info" size={14} /> Accept your offer on the Status page to unlock the acceptance fee.</div></Card>;
  }
  const pay = () => { setProc(true); setTimeout(() => { setProc(false); actions.admPayAcceptance(); }, 1200); };
  return (
    <Card className="u-pad" style={{ marginBottom: 16 }}>
      <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10, marginBottom: 10 }}><div className="u-h3">Acceptance fee</div><Tag variant="warning" dot>Required</Tag></div>
      <div className="u-h2 u-num">{A.fmt(A.ACCEPTANCE_FEE)}</div>
      <div className="u-meta" style={{ marginBottom: 14 }}>Confirms your place and unlocks fresh-student clearance.</div>
      <Btn variant="accent" size="lg" icon="wallet" disabled={proc} onClick={pay}>{proc ? "Processing…" : "Pay acceptance fee"}</Btn>
    </Card>
  );
}

function ClearanceCard({ store, actions, go }) {
  const A = window.ADM;
  const a = store.admissions;
  const done = (item) => item.auto ? !!a[item.auto] : !!a.clearance[item.id];
  const completed = A.CLEARANCE.filter(done).length;
  const all = completed === A.CLEARANCE.length;
  return (
    <Card className="u-pad">
      <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
        <div className="u-h3">Fresh-student clearance</div>
        <Tag variant={all ? "success" : "accent"} dot>{completed}/{A.CLEARANCE.length} done</Tag>
      </div>
      <div className="u-bar" style={{ margin: "10px 0 16px" }}><div className="u-bar__fill" style={{ width: (completed / A.CLEARANCE.length * 100) + "%" }} /></div>
      <div className="u-stack" style={{ gap: 8 }}>
        {A.CLEARANCE.map((item) => {
          const d = done(item);
          return (
            <div key={item.id} className="u-row" style={{ gap: 11, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
              <button className="fb-check" data-on={d} disabled={item.auto} onClick={() => !item.auto && actions.admClearItem(item.id)} style={{ cursor: item.auto ? "default" : "pointer" }} />
              <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>{item.label}</div><div className="u-meta">{item.unit} · {item.note}</div></div>
              {d ? <Tag variant="success">Cleared</Tag> : <Tag>Pending</Tag>}
            </div>
          );
        })}
      </div>
      {a.state === "enrolled" ? (
        <div className="u-adm-jamb-card" style={{ background: "var(--success-soft)", marginTop: 16 }}>
          <Icon name="check" size={16} style={{ color: "var(--success)" }} />
          <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>You're enrolled!</div><div className="u-meta">Matric number issued. You can now sign in to the Student Portal.</div></div>
        </div>
      ) : (
        <Btn variant="accent" size="lg" icon="check" disabled={!all} style={{ width: "100%", marginTop: 16 }} onClick={actions.admEnrol}>{all ? "Complete enrolment" : "Complete all items to enrol"}</Btn>
      )}
    </Card>
  );
}

window.CandidateStatus = CandidateStatus;
window.CandidateOnboarding = CandidateOnboarding;
