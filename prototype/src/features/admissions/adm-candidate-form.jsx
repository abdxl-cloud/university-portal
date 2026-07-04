import React from "react";
const { Btn, Card, Field, Icon, Tag } = window;
/* Admissions — CANDIDATE stepped screening form (autosaving) */

function CandidateForm({ store, actions, go }) {
  const A = window.ADM;
  const a = store.admissions;
  const locked = !["draft", "awaiting_payment"].includes(a.state);

  // local working copy, hydrated from store; autosaves on change (debounced)
  const seed = React.useMemo(() => ({
    surname: "Eze", firstName: "Chinonso", middleName: "Daniel",
    dob: A.ME.dob, gender: A.ME.gender, email: A.ME.email, phone: A.ME.phone,
    stateOfOrigin: A.ME.state, lga: A.ME.lga, address: "", programme: A.ME.programme,
    olevelType: "WAEC", olevelYear: "2024", olevel: [
      { subject: "Mathematics", grade: "B2" }, { subject: "English Language", grade: "C4" },
      { subject: "Physics", grade: "B3" }, { subject: "Chemistry", grade: "A1" }, { subject: "Biology", grade: "C5" },
    ],
    docs: {}, ...(a.form || {}),
  }), []);
  const [form, setForm] = React.useState(seed);
  const [step, setStep] = React.useState(a.step || 0);
  const [savedAt, setSavedAt] = React.useState(null);
  const saveTimer = React.useRef(null);

  const set = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (locked) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { actions.admSaveForm(next); setSavedAt(Date.now()); }, 500);
  };
  React.useEffect(() => () => clearTimeout(saveTimer.current), []);
  React.useEffect(() => { if (!locked) actions.admSetStep(step); }, [step]);

  const steps = ["Bio-data", "Programme", "O'Level", "Documents", "Payment", "Review"];

  if (locked) {
    return (
      <div className="u-content u-content--narrow">
        {window.admPHead("Application Form", "Your submitted application")}
        <Card className="u-pad" style={{ textAlign: "center" }}>
          <div className="u-stack" style={{ alignItems: "center", gap: 12, padding: "30px 20px" }}>
            <span className="u-icon" style={{ width: 46, height: 46, background: "var(--success-soft)", color: "var(--success)" }}><Icon name="check" size={22} /></span>
            <div className="u-h2">Application submitted</div>
            <div className="u-muted" style={{ maxWidth: 380, fontSize: 14 }}>Your screening form is locked while under review. Track progress on the Status page.</div>
            <Btn variant="accent" icon="shield" onClick={() => go("status")}>View status</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="u-content u-content--narrow">
      <div className="u-page-head">
        <div><div className="u-h1">Screening Form</div><div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>Step {step + 1} of {steps.length} · {steps[step]}</div></div>
        <span className="u-adm-saved">{savedAt ? <><Icon name="check" size={13} /> Saved</> : <><Icon name="clock" size={13} /> Autosaving on</>}</span>
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-adm-formsteps">
          {steps.map((s, i) => (
            <button key={s} className="u-adm-formstep" data-state={i < step ? "done" : i === step ? "active" : "todo"} onClick={() => setStep(i)}>
              <span className="u-adm-formstep__n">{i < step ? <Icon name="check" size={12} /> : i + 1}</span>
              <span className="u-adm-formstep__l">{s}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="u-pad">
        {step === 0 && <BioStep form={form} set={set} />}
        {step === 1 && <ProgrammeStep form={form} set={set} />}
        {step === 2 && <OlevelStep form={form} set={set} />}
        {step === 3 && <DocsStep form={form} set={set} />}
        {step === 4 && <PayStep store={store} actions={actions} />}
        {step === 5 && <ReviewStep form={form} store={store} actions={actions} go={go} setStep={setStep} />}

        {step < 5 && (
          <div className="u-row" style={{ justifyContent: "space-between", marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <Btn variant="ghost" icon="arrowLeft" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Btn>
            <Btn variant="accent" iconRight="arrowRight" onClick={() => setStep(step + 1)}>Continue</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

function FieldRow({ children }) { return <div className="u-grid u-grid--2" style={{ gap: 14 }}>{children}</div>; }

function BioStep({ form, set }) {
  const A = window.ADM;
  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">Bio-data</div>
      <div className="u-adm-prefill"><Icon name="info" size={14} /> Name, gender and date of birth were imported from JAMB and can't be changed here.</div>
      <FieldRow>
        <Field label="Surname"><input className="fb-input" value={form.surname} disabled /></Field>
        <Field label="First name"><input className="fb-input" value={form.firstName} disabled /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Middle name"><input className="fb-input" value={form.middleName} onChange={(e) => set({ middleName: e.target.value })} /></Field>
        <Field label="Date of birth"><input className="fb-input" type="date" value={form.dob} disabled /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Email address"><input className="fb-input" value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Phone number"><input className="fb-input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="State of origin"><input className="fb-input" value={form.stateOfOrigin} onChange={(e) => set({ stateOfOrigin: e.target.value })} /></Field>
        <Field label="L.G.A."><input className="fb-input" value={form.lga} onChange={(e) => set({ lga: e.target.value })} /></Field>
      </FieldRow>
      <Field label="Contact address"><input className="fb-input" value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="House no., street, town" /></Field>
    </div>
  );
}

function ProgrammeStep({ form, set }) {
  const A = window.ADM;
  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">Programme of choice</div>
      <div className="u-muted" style={{ fontSize: 13.5 }}>Your JAMB first choice is pre-selected. UTME score: <strong>{A.ME.score}</strong>.</div>
      <div className="u-stack" style={{ gap: 10 }}>
        {A.PROGRAMMES.map((p) => {
          const on = form.programme === p.id;
          const eligible = A.ME.score >= p.cutoff;
          return (
            <button key={p.id} className="u-coll-pick" data-on={on} onClick={() => set({ programme: p.id })} style={{ alignItems: "flex-start" }}>
              <span className="fb-check" data-on={on} style={{ marginTop: 2 }} />
              <div className="u-grow" style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8, flexWrap: "wrap" }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</span>{!eligible && <Tag variant="warning">Below cutoff</Tag>}</div>
                <div className="u-meta">Faculty of {p.faculty} · cutoff {p.cutoff} · {p.applied} applicants for {p.quota} places</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OlevelStep({ form, set }) {
  const A = window.ADM;
  const rows = form.olevel || [];
  const setRow = (i, patch) => { const next = rows.map((r, j) => j === i ? { ...r, ...patch } : r); set({ olevel: next }); };
  const addRow = () => set({ olevel: [...rows, { subject: "", grade: "C6" }] });
  const delRow = (i) => set({ olevel: rows.filter((_, j) => j !== i) });
  const credits = rows.filter((r) => A.OLEVEL_GRADES.indexOf(r.grade) <= 5 && r.subject).length;
  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">O'Level results</div>
      <FieldRow>
        <Field label="Examination"><select className="fb-input" value={form.olevelType} onChange={(e) => set({ olevelType: e.target.value })}><option>WAEC</option><option>NECO</option><option>NABTEB</option></select></Field>
        <Field label="Exam year"><input className="fb-input" value={form.olevelYear} onChange={(e) => set({ olevelYear: e.target.value })} /></Field>
      </FieldRow>
      <div className="u-stack" style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} className="u-row" style={{ gap: 8 }}>
            <select className="fb-input u-grow" value={r.subject} onChange={(e) => setRow(i, { subject: e.target.value })}>
              <option value="">Select subject…</option>
              {A.OLEVEL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="fb-input" style={{ width: 90 }} value={r.grade} onChange={(e) => setRow(i, { grade: e.target.value })}>
              {A.OLEVEL_GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
            <button className="u-cmt__x" onClick={() => delRow(i)} aria-label="Remove" style={{ width: 34 }}><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </div>
      <div className="u-row" style={{ justifyContent: "space-between" }}>
        <Btn variant="secondary" size="sm" icon="plus" onClick={addRow}>Add subject</Btn>
        <Tag variant={credits >= 5 ? "success" : "warning"} dot>{credits} credit pass{credits === 1 ? "" : "es"}</Tag>
      </div>
      {credits < 5 && <div className="u-formerr"><Icon name="info" size={14} /> You need at least 5 credit passes (C6 or better), including English and Mathematics.</div>}
    </div>
  );
}

function DocsStep({ form, set }) {
  const A = window.ADM;
  const docs = form.docs || {};
  const upload = (id) => set({ docs: { ...docs, [id]: { name: id + "-upload.pdf", size: (0.4 + Math.random() * 2).toFixed(1) + " MB", at: "just now" } } });
  const remove = (id) => { const next = { ...docs }; delete next[id]; set({ docs: next }); };
  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">Upload documents</div>
      <div className="u-muted" style={{ fontSize: 13.5 }}>PDF, JPG or PNG up to 5 MB each. (Demo: tap to simulate an upload.)</div>
      <div className="u-stack" style={{ gap: 10 }}>
        {A.DOC_TYPES.map((d) => {
          const f = docs[d.id];
          return (
            <div key={d.id} className="u-adm-upload" data-on={!!f}>
              <span className="u-icon" style={{ background: f ? "var(--success-soft)" : "var(--bg-muted)", color: f ? "var(--success)" : "var(--fg-muted)" }}><Icon name={f ? "check" : "doc"} size={15} /></span>
              <div className="u-grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{d.name}</div>
                {f ? <div className="u-meta">{f.name} · {f.size} · {f.at}</div> : <div className="u-meta">{d.note}</div>}
              </div>
              {f ? <Btn variant="ghost" size="sm" onClick={() => remove(d.id)}>Replace</Btn> : <Btn variant="secondary" size="sm" icon="download" onClick={() => upload(d.id)}>Upload</Btn>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PayStep({ store, actions }) {
  const A = window.ADM;
  const a = store.admissions;
  const [proc, setProc] = React.useState(false);
  const pay = () => { setProc(true); setTimeout(() => { setProc(false); actions.admPayScreening(); }, 1200); };
  if (a.screeningPaid) {
    return (
      <div className="u-stack" style={{ gap: 14 }}>
        <div className="u-h3">Screening fee</div>
        <div className="u-adm-jamb-card" style={{ background: "var(--success-soft)" }}>
          <Icon name="check" size={16} style={{ color: "var(--success)" }} />
          <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>Screening fee paid</div><div className="u-meta">{A.fmt(A.SCREENING_FEE)} · receipt available after submission</div></div>
        </div>
        <div className="u-muted" style={{ fontSize: 13.5 }}>Go to the Review step to submit your application.</div>
      </div>
    );
  }
  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">Pay screening fee</div>
      <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">Screening / application fee</span><span className="v u-num">{A.fmt(A.SCREENING_FEE)}</span></div>
      <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">Processing</span><span className="v u-num">{A.fmt(0)}</span></div>
      <div className="u-slip__row" style={{ borderTop: "1px solid var(--border-strong)" }}><span style={{ fontWeight: 600 }}>Total</span><span style={{ fontWeight: 700 }} className="u-num">{A.fmt(A.SCREENING_FEE)}</span></div>
      <input className="fb-input" placeholder="Card number" defaultValue="4084 0000 0000 1234" />
      <Btn variant="accent" size="lg" icon="wallet" disabled={proc} onClick={pay}>{proc ? "Processing…" : "Pay " + A.fmt(A.SCREENING_FEE)}</Btn>
      <div className="u-meta" style={{ textAlign: "center" }}>Secured by FUTECH Pay · demo only, no real charge.</div>
    </div>
  );
}

function ReviewStep({ form, store, actions, go, setStep }) {
  const A = window.ADM;
  const a = store.admissions;
  const prog = A.progById(form.programme);
  const credits = (form.olevel || []).filter((r) => A.OLEVEL_GRADES.indexOf(r.grade) <= 5 && r.subject).length;
  const docCount = Object.keys(form.docs || {}).length;
  const checks = [
    { ok: !!form.email && !!form.phone, label: "Bio-data complete", fix: 0 },
    { ok: A.ME.score >= prog.cutoff, label: "UTME meets programme cutoff", fix: 1, warn: A.ME.score < prog.cutoff },
    { ok: credits >= 5, label: "At least 5 O'Level credits", fix: 2 },
    { ok: docCount >= A.DOC_TYPES.length, label: "All documents uploaded (" + docCount + "/" + A.DOC_TYPES.length + ")", fix: 3 },
    { ok: a.screeningPaid, label: "Screening fee paid", fix: 4 },
  ];
  const ready = checks.every((c) => c.ok);
  const [submitting, setSubmitting] = React.useState(false);
  const submit = () => { setSubmitting(true); setTimeout(() => { setSubmitting(false); actions.admSubmit(); go("status"); }, 1200); };

  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <div className="u-h3">Review & submit</div>
      <div className="u-stack" style={{ gap: 8 }}>
        {checks.map((c, i) => (
          <div key={i} className="u-row" style={{ gap: 11, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
            <span className="u-icon" style={{ width: 26, height: 26, background: c.ok ? "var(--success-soft)" : c.warn ? "var(--warning-soft)" : "var(--danger-soft)", color: c.ok ? "var(--success)" : c.warn ? "oklch(from var(--warning) calc(l - 0.2) c h)" : "var(--danger)" }}>
              <Icon name={c.ok ? "check" : "info"} size={14} />
            </span>
            <span className="u-grow" style={{ fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
            {!c.ok && <Btn variant="ghost" size="sm" onClick={() => setStep(c.fix)}>Fix</Btn>}
          </div>
        ))}
      </div>
      {checks.some((c) => c.warn && c.ok === false) && <div className="u-formerr"><Icon name="info" size={14} /> Your score is below the cutoff for {prog.name}. You may still submit, but admission isn't guaranteed — consider a change of course on CAPS.</div>}
      <Btn variant="accent" size="lg" icon="check" disabled={!ready || submitting} onClick={submit} style={{ width: "100%" }}>{submitting ? "Submitting…" : "Submit application"}</Btn>
      {!ready && <div className="u-meta" style={{ textAlign: "center" }}>Complete all required items above to submit.</div>}
    </div>
  );
}

window.CandidateForm = CandidateForm;
