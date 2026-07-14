import React from "react";
const { Avatar, Btn, Card, Empty, Icon, Modal, ModalHead, SPill, Seg, Tag } = window;
/* Admissions: STAFF screening review, document decisions, queries, eligibility, quota, audit */

/* ============ SCREENING REVIEW ============ */
function AdmReview({ store, actions, go }) {
  const A = window.ADM;
  const ORG = window.ORG;
  const list = window.admPoolList(store).filter((c) => !["enrolled"].includes(c._state));
  const [openId, setOpenId] = React.useState(null);
  const [filter, setFilter] = React.useState("queue");
  const [fac, setFac] = React.useState("all");
  const [q, setQ] = React.useState("");

  const facOfProg = (progId) => { const p = A.progById(progId); return p ? ORG.facultyOf(p.faculty) : null; };

  const filtered = list.filter((c) => {
    if (filter === "queue") return ["submitted", "under_review", "queried"].includes(c._state);
    if (filter === "decided") return ["recommended", "admitted", "accepted", "clearance_pending", "ineligible"].includes(c._state);
    return true;
  }).filter((c) => {
    if (fac === "all") return true;
    const f = facOfProg(c.prog); return f && f.id === fac;
  }).filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.jamb.toLowerCase().includes(q.toLowerCase()));

  const pager = usePaged(filtered, 12);
  const active = openId && list.find((c) => c.id === openId);

  if (active) return <AdmCandidateDetail store={store} actions={actions} c={active} onBack={() => setOpenId(null)} />;

  return (
    <div className="u-content">
      {window.admPHead ? window.admPHead("Screening Review", filtered.length + " candidates · assess and decide") : null}
      <div className="u-row u-wrap" style={{ marginBottom: 14, gap: 10, justifyContent: "space-between" }}>
        <Seg value={filter} onChange={setFilter} options={[{ value: "queue", label: "Queue" }, { value: "decided", label: "Decided" }, { value: "all", label: "All" }]} />
        <select className="fb-input" style={{ width: "auto" }} value={fac} onChange={(e) => setFac(e.target.value)}>
          <option value="all">All faculties</option>
          {ORG.FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.short}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or JAMB no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        {filtered.length === 0 ? <Empty icon="check" title="Nothing here" sub="No candidates match this view." /> : (
          <>
            <div className="u-table-scroll">
              <table className="u-table">
                <thead><tr><th>Candidate</th><th>Programme</th><th>Faculty</th><th className="u-right">UTME</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {pager.slice.map((c) => {
                    const f = facOfProg(c.prog);
                    return (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                        <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={c.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} /><div><div style={{ fontWeight: 500 }}>{c.name}{c._live && <Tag variant="accent" style={{ marginLeft: 6 }}>You</Tag>}</div><div className="u-meta fb-mono">{c.jamb}</div></div></div></td>
                        <td className="u-muted">{A.progById(c.prog).name}</td>
                        <td className="u-meta">{f ? f.short : "Not available"}</td>
                        <td className="u-right u-num">{c.score}{c.score < A.progById(c.prog).cutoff && <Tag variant="warning" style={{ marginLeft: 6 }}>low</Tag>}</td>
                        <td><SPill tone={A.STATES[c._state].tone}>{A.STATES[c._state].label}</SPill></td>
                        <td className="u-right"><Icon name="chevron" size={15} style={{ color: "var(--fg-subtle)" }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} label="candidates" sizes={[12, 25, 50]} />
          </>
        )}
      </Card>
    </div>
  );
}

/* candidate detail: documents, decisions, queries */
function AdmCandidateDetail({ store, actions, c, onBack }) {
  const A = window.ADM;
  const prog = A.progById(c.prog);
  const eligible = c.score >= prog.cutoff;
  const [decisions, setDecisions] = React.useState({});
  const [queryOpen, setQueryOpen] = React.useState(false);
  const [queryText, setQueryText] = React.useState("");
  const isLive = c._live;

  const setDoc = (id, val) => setDecisions((d) => ({ ...d, [id]: val }));

  const act = (state, note) => {
    if (isLive) actions.admStaffSet(state, note);
    else actions.admPoolSet(c.id, state, c.name + ": " + (note || state));
    onBack();
  };
  const query = () => {
    if (isLive) actions.admStaffQuery(queryText);
    else actions.admPoolSet(c.id, "queried", c.name + " queried: " + queryText);
    setQueryOpen(false); onBack();
  };

  return (
    <div className="u-content u-content--narrow">
      <button className="u-filelink" style={{ marginBottom: 14 }} onClick={onBack}><Icon name="arrowLeft" size={14} /> Back to review</button>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 12 }}>
            <Avatar initials={c.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={44} />
            <div><div className="u-h2">{c.name}</div><div className="u-meta fb-mono">{c.jamb} · {c.origin} · {c.gender}</div></div>
          </div>
          <SPill tone={A.STATES[c._state].tone}>{A.STATES[c._state].label}</SPill>
        </div>
        <div className="u-grid u-grid--2" style={{ gap: 0, marginTop: 14 }}>
          {[["Programme", prog.name], ["Faculty", "Faculty of " + prog.faculty], ["UTME score", c.score + " (cutoff " + prog.cutoff + ")"], ["Eligibility", eligible ? "Meets cutoff" : "Below cutoff"]].map(([k, v]) => (
            <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
        </div>
      </Card>

      {/* documents with per-doc decisions */}
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 12 }}>Document review</div>
        <div className="u-stack" style={{ gap: 8 }}>
          {A.DOC_TYPES.map((d, i) => {
            const missing = c.flags && c.flags.includes("doc_missing") && i === A.DOC_TYPES.length - 1;
            const dec = decisions[d.id];
            return (
              <div key={d.id} className="u-row u-wrap" style={{ gap: 10, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                  <Icon name="doc" size={15} style={{ color: "var(--fg-subtle)" }} />
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.name}</div><div className="u-meta">{missing ? "Not uploaded" : "uploaded.pdf · 1.2 MB"}</div></div>
                </div>
                {missing ? <Tag variant="danger" dot>Missing</Tag> : (
                  <div className="u-row" style={{ gap: 6 }}>
                    <button className="u-doc-dec" data-on={dec === "ok"} data-kind="ok" onClick={() => setDoc(d.id, "ok")}><Icon name="check" size={13} /> Accept</button>
                    <button className="u-doc-dec" data-on={dec === "rej"} data-kind="rej" onClick={() => setDoc(d.id, "rej")}><Icon name="x" size={13} /> Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* decision actions */}
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>Decision</div>
        <div className="u-row u-wrap" style={{ gap: 8 }}>
          {["submitted"].includes(c._state) && <Btn variant="secondary" icon="shield" onClick={() => act("under_review", "Review started")}>Begin review</Btn>}
          {["submitted", "under_review", "queried"].includes(c._state) && <Btn variant="secondary" icon="info" onClick={() => setQueryOpen(true)}>Raise query</Btn>}
          {["submitted", "under_review", "queried"].includes(c._state) && <Btn variant="secondary" icon="check" onClick={() => act("screened", "Screening completed")}>Mark screened</Btn>}
          {["screened", "under_review"].includes(c._state) && eligible && <Btn variant="accent" icon="cap" onClick={() => act("admitted", "Recommended & admitted")}>Recommend & admit</Btn>}
          {["screened", "under_review"].includes(c._state) && !eligible && <Btn variant="secondary" icon="x" onClick={() => act("ineligible", "Marked ineligible: below cutoff")}>Mark ineligible</Btn>}
          {c._state === "admitted" && <Tag variant="success" dot>Admitted: awaiting candidate acceptance</Tag>}
        </div>
        {!eligible && <div className="u-formerr" style={{ marginTop: 12 }}><Icon name="info" size={14} /> Score below the {prog.name} cutoff. Recommend change of course or mark ineligible.</div>}
      </Card>

      {queryOpen && (
        <Modal onClose={() => setQueryOpen(false)}>
          <ModalHead title="Raise a query" sub={"To " + c.name} onClose={() => setQueryOpen(false)} />
          <div className="u-pad u-stack" style={{ gap: 12 }}>
            <div className="u-row u-wrap" style={{ gap: 6 }}>
              {["O'Level result is unclear: re-upload a clearer copy.", "Passport photograph does not meet requirements.", "Date of birth mismatch with birth certificate."].map((q) => (
                <button key={q} className="u-chipbtn" onClick={() => setQueryText(q)} style={{ textAlign: "left" }}>{q}</button>
              ))}
            </div>
            <textarea className="fb-textarea" rows={3} value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Describe what the candidate must fix…" />
            <Btn variant="accent" size="lg" icon="info" disabled={!queryText.trim()} onClick={query} style={{ width: "100%" }}>Send query</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============ ELIGIBILITY LISTS ============ */
function AdmEligibility({ store, actions, go }) {
  const A = window.ADM;
  const ORG = window.ORG;
  const list = window.admPoolList(store);
  const [prog, setProg] = React.useState("csc");
  const rows = list.filter((c) => c.prog === prog).sort((a, b) => b.score - a.score);
  const p = A.progById(prog);
  const pager = usePaged(rows, 12);

  // group the programme chips by faculty
  const byFac = {};
  A.PROGRAMMES.forEach((pp) => { const f = ORG.facultyOf(pp.faculty); const key = f ? f.short : pp.faculty; (byFac[key] = byFac[key] || []).push(pp); });

  return (
    <div className="u-content">
      {window.admPHead("Programme Eligibility", "Ranked candidates against programme cutoff & quota")}
      <div className="u-stack" style={{ gap: 8, marginBottom: 14 }}>
        {Object.entries(byFac).map(([facName, progs]) => (
          <div key={facName}>
            <div className="u-meta" style={{ fontWeight: 600, marginBottom: 6 }}>{facName}</div>
            <div className="u-row u-wrap" style={{ gap: 8 }}>
              {progs.map((pp) => (
                <button key={pp.id} className="u-chipbtn" data-on={prog === pp.id} onClick={() => setProg(pp.id)} style={{ borderColor: prog === pp.id ? "var(--accent)" : undefined, color: prog === pp.id ? "var(--accent-soft-fg)" : undefined }}>{pp.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card className="u-pad" style={{ marginBottom: 14 }}>
        <div className="u-grid u-grid--3">
          <div><div className="u-meta">Cutoff</div><div className="u-h2 u-num">{p.cutoff}</div></div>
          <div><div className="u-meta">Quota</div><div className="u-h2 u-num">{p.quota}</div></div>
          <div><div className="u-meta">Applicants</div><div className="u-h2 u-num">{p.applied}</div></div>
        </div>
      </Card>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th className="u-right" style={{ width: 50 }}>#</th><th>Candidate</th><th className="u-right">UTME</th><th>Eligible</th><th>Status</th></tr></thead>
            <tbody>
              {pager.slice.map((c, i) => {
                const ok = c.score >= p.cutoff;
                return (
                  <tr key={c.id}>
                    <td className="u-right u-num u-muted">{pager.start + i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{c.name}{c._live && <Tag variant="accent" style={{ marginLeft: 6 }}>You</Tag>}</td>
                    <td className="u-right u-num">{c.score}</td>
                    <td>{ok ? <Tag variant="success" dot>Yes</Tag> : <Tag variant="danger" dot>Below cutoff</Tag>}</td>
                    <td><SPill tone={A.STATES[c._state].tone}>{A.STATES[c._state].label}</SPill></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5}><Empty icon="user" title="No candidates" sub="No applicants for this programme yet." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="applicants" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

/* ============ QUOTA TRACKING ============ */
function AdmQuota({ store }) {
  const A = window.ADM;
  const ORG = window.ORG;
  const list = window.admPoolList(store);
  const admittedFor = (pid) => list.filter((c) => c.prog === pid && ["admitted", "accepted", "clearance_pending", "enrolled"].includes(c._state)).length;
  // group programmes by faculty
  const groups = ORG.FACULTIES.map((f) => ({
    faculty: f,
    progs: A.PROGRAMMES.filter((p) => { const pf = ORG.facultyOf(p.faculty); return pf && pf.id === f.id; }),
  })).filter((g) => g.progs.length);

  return (
    <div className="u-content">
      {window.admPHead("Quota Tracking", "Admissions against approved quota: grouped by faculty")}
      <div className="u-stack" style={{ gap: 22 }}>
        {groups.map(({ faculty, progs }) => {
          const facQuota = progs.reduce((s, p) => s + p.quota, 0);
          const facAdmitted = progs.reduce((s, p) => s + admittedFor(p.id), 0);
          const facPct = Math.min(100, Math.round((facAdmitted / facQuota) * 100));
          return (
            <div key={faculty.id}>
              <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                <div className="u-row" style={{ gap: 9 }}>
                  <span className="u-icon" style={{ width: 28, height: 28 }}><Icon name="building" size={14} /></span>
                  <div><div className="u-h3">{faculty.name}</div><div className="u-meta">{progs.length} programmes · {facAdmitted}/{facQuota} admitted ({facPct}%)</div></div>
                </div>
              </div>
              <div className="u-grid u-grid--2">
                {progs.map((p) => {
                  const admitted = admittedFor(p.id);
                  const pct = Math.min(100, Math.round((admitted / p.quota) * 100));
                  const over = admitted > p.quota;
                  return (
                    <Card key={p.id} className="u-pad">
                      <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                        <div><div className="u-h3">{p.name}</div><div className="u-meta">cutoff {p.cutoff}</div></div>
                        <Tag variant={over ? "danger" : pct >= 100 ? "warning" : "success"} dot>{admitted}/{p.quota}</Tag>
                      </div>
                      <div className="u-bar"><div className="u-bar__fill" style={{ width: pct + "%", background: over ? "var(--danger)" : "var(--accent)" }} /></div>
                      <div className="u-row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                        <span className="u-meta">{p.applied} applied</span>
                        <span className="u-meta u-num">{p.quota - admitted > 0 ? (p.quota - admitted) + " places left" : "Full"}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ AUDIT TIMELINE ============ */
function AdmAudit({ store }) {
  const A = window.ADM;
  const events = (store.admissions && store.admissions.audit) || [];
  return (
    <div className="u-content u-content--narrow">
      {window.admPHead("Audit Timeline", "Every admission action is recorded")}
      <Card className="u-pad">
        {events.length === 0 ? <Empty icon="shield" title="No activity yet" sub="Admission decisions and imports will be logged here." /> : (
          <div className="u-adm-timeline">
            {events.map((e) => (
              <div key={e.id} className="u-adm-tl" data-done="true">
                <span className="u-adm-tl__dot"><Icon name="check" size={11} /></span>
                <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>{e.text}</div><div className="u-meta">{e.at}</div></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

Object.assign(window, { AdmReview, AdmCandidateDetail, AdmEligibility, AdmQuota, AdmAudit });
