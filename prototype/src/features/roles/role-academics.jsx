import React from "react";
const { Avatar, Btn, Card, Empty, Icon, PageHead, RoleHero, SPill, Seg, StatCards, Tag, TeachingQuickInfo, rstate } = window;
/* Role screens — academic cluster: Adviser, HOD, Dean, Exams & Records */

/* small reusable: action buttons for a decision row */
function Decide({ onApprove, onReject, approveLabel = "Approve", rejectLabel = "Query", size = "sm" }) {
  return (
    <div className="u-row" style={{ gap: 6 }}>
      <Btn variant="secondary" size={size} onClick={onReject}>{rejectLabel}</Btn>
      <Btn variant="accent" size={size} icon="check" onClick={onApprove}>{approveLabel}</Btn>
    </div>
  );
}

/* ============ LEVEL ADVISER ============ */
function AdviserDashboard({ store, go, roleCfg, hat }) {
  const { ADVISEES } = window.ROLE_DATA;
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const pending = ADVISEES.filter((a) => dec(a) === "pending").length;
  const approved = ADVISEES.filter((a) => dec(a) === "approved").length;
  const flagged = ADVISEES.filter((a) => a.flags.length && dec(a) === "pending").length;

  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.adviser} sub={hat && hat.roleTitle} />
      <StatCards items={[
        { icon: "user", k: "Advisees", v: ADVISEES.length, plain: true },
        { icon: "book", k: "Awaiting approval", v: pending, tag: pending ? "Action" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("adv-reg") },
        { icon: "check", k: "Approved", v: approved },
        { icon: "info", k: "Flagged issues", v: flagged, tag: flagged ? "Review" : null, tone: flagged ? "danger" : undefined },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Registrations awaiting your approval</div>
          <a className="fb-link" onClick={() => go("adv-reg")}>Open queue</a>
        </div>
        <AdviseeRows store={store} go={go} limit={4} only="pending" />
      </Card>
      <TeachingQuickInfo store={store} go={go} hat={{ teachCode: "CSC 313" }} />
    </div>
  );
}

function TeachingSnapshot({ store, go, code, style }) {
  const roster = window.miniRoster ? window.miniRoster(code) : [];
  const meta = window.miniCourseMeta ? window.miniCourseMeta(code) : { title: code, units: 0 };
  return (
    <Card className="u-pad" style={style}>
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <div className="u-h3">Your teaching · {meta.title}</div>
        <a className="fb-link" onClick={() => go("ml-course")}>Open course</a>
      </div>
      <div className="u-meta">{code} · {meta.units} units · {roster.length} students registered</div>
    </Card>
  );
}

function AdviseeRows({ store, actions, go, limit, only, onOpen, rows: rowsProp }) {
  const { ADVISEES } = window.ROLE_DATA;
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  let rows = rowsProp || ADVISEES.filter((a) => a.submitted);
  if (!rowsProp && only) rows = rows.filter((a) => dec(a) === only);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="Nothing pending" sub="All submitted course forms have been reviewed." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const st = dec(a);
        const adviceCount = Object.keys((store.roles && store.roles.adviser && store.roles.adviser.advice && store.roles.adviser.advice[a.id]) || {}).length;
        return (
          <div key={a.id} className="u-row u-wrap u-adv-row" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: onOpen ? "pointer" : "default" }} onClick={onOpen ? () => onOpen(a.id) : undefined}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <Avatar initials={a.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
                <div className="u-meta fb-mono">{a.matric}</div>
                {a.flags.length > 0 && <div className="u-row u-wrap" style={{ gap: 5, marginTop: 5 }}>{a.flags.map((f) => <Tag key={f} variant="danger">{f}</Tag>)}</div>}
              </div>
            </div>
            <div className="u-row" style={{ gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div className="u-meta">{a.courses} courses{adviceCount > 0 ? " · " + adviceCount + " noted" : ""}</div>
                <div className="u-num" style={{ fontWeight: 600, fontSize: 13.5 }}>{a.units} units</div>
              </div>
              {st === "pending" && onOpen
                ? <Btn variant="secondary" size="sm" iconRight="chevron" onClick={(e) => { e.stopPropagation(); onOpen(a.id); }}>Review</Btn>
                : st === "pending" && actions
                  ? <Decide onApprove={() => actions.roleAct("adviser", "reg", a.id, "approved")} onReject={() => actions.roleAct("adviser", "reg", a.id, "query")} />
                  : <SPill s={st} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* per-student course form review with per-course advice */
function AdviseeDetail({ store, actions, id, onBack, list, onOpen }) {
  const { ADVISEES } = window.ROLE_DATA;
  const a = ADVISEES.find((x) => x.id === id);
  const st = rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const advice = (store.roles && store.roles.adviser && store.roles.adviser.advice && store.roles.adviser.advice[a.id]) || {};
  const [drafts, setDrafts] = React.useState(advice);
  const [openCourse, setOpenCourse] = React.useState(null);

  // position within the current filtered queue, for prev/next navigation
  const queue = list || [a];
  const idx = queue.findIndex((x) => x.id === id);
  const prev = idx > 0 ? queue[idx - 1] : null;
  const next = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
  const goStudent = (s) => { if (s && onOpen) { setOpenCourse(null); setDrafts((store.roles && store.roles.adviser && store.roles.adviser.advice && store.roles.adviser.advice[s.id]) || {}); onOpen(s.id); } };

  React.useEffect(() => {
    const h = (e) => { if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return; if (e.key === "ArrowLeft") goStudent(prev); if (e.key === "ArrowRight") goStudent(next); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [idx, prev, next]);

  const saveNote = (code, text) => { actions.adviserComment(a.id, code, text.trim()); setOpenCourse(null); };
  const setDraft = (code, v) => setDrafts((d) => ({ ...d, [code]: v }));

  const decided = st !== "pending";
  const TYPE_TONE = { Core: undefined, Elective: "accent", GST: "accent", Carryover: "danger" };

  // advance to next pending student after a decision, else back to list
  const afterDecision = () => { if (next) goStudent(next); else onBack(); };

  return (
    <div className="u-content u-content--narrow">
      <div className="u-row u-wrap" style={{ gap: 10, justifyContent: "space-between", marginBottom: 14 }}>
        <button className="u-filelink" onClick={onBack}><Icon name="arrowLeft" size={14} /> Back to approvals</button>
        {queue.length > 1 && (
          <div className="u-row" style={{ gap: 6 }}>
            <span className="u-meta" style={{ marginRight: 4 }}>{idx + 1} of {queue.length}</span>
            <Btn variant="secondary" size="sm" icon="arrowLeft" disabled={!prev} onClick={() => goStudent(prev)}>Prev</Btn>
            <Btn variant="secondary" size="sm" iconRight="chevron" disabled={!next} onClick={() => goStudent(next)}>Next</Btn>
          </div>
        )}
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 12 }}>
            <Avatar initials={a.initials} size={44} />
            <div>
              <div className="u-h2">{a.name}</div>
              <div className="u-meta fb-mono">{a.matric} · 300L CSC · CGPA {a.cgpa}</div>
            </div>
          </div>
          <SPill s={st} />
        </div>
        <div className="u-row u-wrap" style={{ gap: 14, marginTop: 14 }}>
          <div className="u-row" style={{ gap: 7 }}>{a.feesPaid ? <Tag variant="success" dot>Fees paid</Tag> : <Tag variant="danger" dot>Fees unpaid</Tag>}</div>
          <div className="u-meta">Submitted {a.submittedAt}</div>
          <div className="u-meta u-grow" style={{ textAlign: "right" }}><strong className="u-num" style={{ color: "var(--fg)" }}>{a.units}</strong> units · <strong className="u-num" style={{ color: "var(--fg)" }}>{a.courses}</strong> courses</div>
        </div>
        {a.flags.length > 0 && (
          <div className="u-formerr" style={{ marginTop: 12 }}>
            <Icon name="info" size={14} />
            <span>{a.flags.join(" · ")}. Advise the student before approving.</span>
          </div>
        )}
      </Card>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 4 }}>Registered courses</div>
        <div className="u-meta" style={{ marginBottom: 12 }}>Review each course and leave advice where needed. The student sees your notes on their course form.</div>
        <div className="u-stack" style={{ gap: 8 }}>
          {a.reg.map((c) => {
            const note = advice[c.code];
            const editing = openCourse === c.code;
            return (
              <div key={c.code} className="u-adv-course" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
                <div className="u-row u-wrap" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                    <span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</span>
                    {c.type !== "Core" && <Tag variant={TYPE_TONE[c.type]}>{c.type}</Tag>}
                  </div>
                  <div className="u-row" style={{ gap: 10 }}>
                    <span className="u-meta u-num">{c.units} units</span>
                    {!decided && <button className="u-adv-addnote" onClick={() => { setOpenCourse(editing ? null : c.code); setDraft(c.code, note || ""); }}><Icon name={note ? "edit" : "plus"} size={13} /> {note ? "Edit advice" : "Add advice"}</button>}
                  </div>
                </div>
                <div style={{ fontSize: 13.5, marginTop: 3 }}>{c.title}</div>

                {note && !editing && (
                  <div className="u-adv-note">
                    <span className="u-icon" style={{ width: 24, height: 24, flexShrink: 0 }}><Icon name="user" size={13} /></span>
                    <div className="u-grow"><div className="u-meta" style={{ fontWeight: 600, color: "var(--accent-soft-fg)" }}>Your advice</div><div style={{ fontSize: 13 }}>{note}</div></div>
                    {!decided && <button className="u-cmt__x" onClick={() => actions.adviserComment(a.id, c.code, "")} aria-label="Remove"><Icon name="x" size={12} /></button>}
                  </div>
                )}

                {editing && (
                  <div style={{ marginTop: 10 }}>
                    <textarea className="fb-textarea" rows={2} autoFocus value={drafts[c.code] || ""} onChange={(e) => setDraft(c.code, e.target.value)} placeholder={"Advice on " + c.code + " — e.g. drop this elective, prioritise your carryover…"} />
                    <div className="u-row" style={{ gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                      <Btn variant="ghost" size="sm" onClick={() => setOpenCourse(null)}>Cancel</Btn>
                      <Btn variant="accent" size="sm" icon="check" onClick={() => saveNote(c.code, drafts[c.code] || "")}>Save advice</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {!decided ? (
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 4 }}>Decision</div>
          <div className="u-meta" style={{ marginBottom: 14 }}>Approve the form, or send it back with your advice for the student to revise.{next ? " You'll move to the next student automatically." : ""}</div>
          <div className="u-row u-wrap" style={{ gap: 8 }}>
            <Btn variant="accent" icon="check" onClick={() => { actions.roleAct("adviser", "reg", a.id, "approved"); afterDecision(); }}>Approve course form</Btn>
            <Btn variant="secondary" icon="arrowLeft" onClick={() => { actions.roleAct("adviser", "reg", a.id, "query"); afterDecision(); }}>Return with query</Btn>
          </div>
        </Card>
      ) : (
        <Card className="u-pad">
          <div className="u-row" style={{ gap: 10 }}>
            <span className="u-icon" style={{ background: st === "approved" ? "var(--success-soft)" : "var(--warning-soft)", color: st === "approved" ? "var(--success)" : "oklch(from var(--warning) calc(l - 0.2) c h)" }}><Icon name={st === "approved" ? "check" : "info"} size={16} /></span>
            <div className="u-grow"><div className="u-h3">{st === "approved" ? "Course form approved" : "Returned to student"}</div><div className="u-meta">{st === "approved" ? "The student can now print their course form." : "The student will revise and resubmit based on your advice."}</div></div>
            <Btn variant="ghost" size="sm" onClick={() => actions.roleAct("adviser", "reg", a.id, "pending")}>Reopen</Btn>
          </div>
          {next && <Btn variant="accent" iconRight="chevron" style={{ marginTop: 14 }} onClick={() => goStudent(next)}>Next student</Btn>}
        </Card>
      )}
    </div>
  );
}

function AdviserApprovals({ store, actions, go }) {
  const { ADVISEES } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState(null);
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const counts = { pending: 0, approved: 0, query: 0 };
  ADVISEES.filter((a) => a.submitted).forEach((a) => { const s = dec(a); counts[s] = (counts[s] || 0) + 1; });

  const filtered = ADVISEES.filter((a) => a.submitted && dec(a) === filter)
    .filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);

  if (openId) return <AdviseeDetail store={store} actions={actions} id={openId} onBack={() => setOpenId(null)} list={filtered} onOpen={setOpenId} />;

  return (
    <div className="u-content">
      <PageHead title="Course Approvals" sub={(counts.pending || 0) + " of " + ADVISEES.filter((a) => a.submitted).length + " submitted forms awaiting review"}>
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "approved", label: "Approved · " + (counts.approved || 0) }, { value: "query", label: "Queried · " + (counts.query || 0) },
        ]} />
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-pad"><AdviseeRows store={store} actions={actions} go={go} onOpen={setOpenId} rows={pager.slice} /></div>
        <Pagination pager={pager} label="students" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

function AdviserAdvisees({ store }) {
  const { ADVISEES } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const filtered = ADVISEES.filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 15);
  return (
    <div className="u-content">
      <PageHead title="My Advisees" sub={ADVISEES.length + " students · 300 Level Computer Science"} />
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th className="u-right">Units</th><th>Fees</th><th>Carryover</th><th>Registration</th></tr></thead>
            <tbody>
              {pager.slice.map((a) => (
                <tr key={a.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{a.matric}</td>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td className="u-right u-num">{a.submitted ? a.units : "—"}</td>
                  <td>{a.feesPaid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>}</td>
                  <td>{a.carryover ? <Tag variant="warning">Yes</Tag> : <span className="u-muted">None</span>}</td>
                  <td><SPill s={rstate(store, "adviser", "reg", a.id, a.baseStatus)} /></td>
                </tr>
              ))}
              {pager.slice.length === 0 && <tr><td colSpan={6}><Empty icon="search" title="No matches" sub="No students match your search." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[15, 30, 60]} />
      </Card>
    </div>
  );
}

/* ============ HOD ============ */
function HodDashboard({ store, go, roleCfg, hat }) {
  const { HOD_COURSES, HOD_RESULTS } = window.ROLE_DATA;
  const unassigned = HOD_COURSES.filter((c) => (rstate(store, "hod", "assign", c.code, c.lecturer)) === "Unassigned").length;
  const pendingRes = HOD_RESULTS.filter((r) => rstate(store, "hod", "result", r.code, r.baseStatus) === "pending").length;
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.hod} sub={hat && hat.roleTitle} />
      <StatCards items={[
        { icon: "book", k: "Department courses", v: HOD_COURSES.length, plain: true },
        { icon: "user", k: "Unassigned courses", v: unassigned, tag: unassigned ? "Assign" : "Done", tone: unassigned ? "warning" : "success", onClick: () => go("hod-assign") },
        { icon: "chart", k: "Results to approve", v: pendingRes, tag: pendingRes ? "Review" : "Clear", tone: pendingRes ? "warning" : "success", onClick: () => go("hod-results") },
        { icon: "user", k: "Department students", v: "1,240", plain: true },
      ]} />
      <div className="u-cols u-cols--main">
        <Card className="u-pad">
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="u-h3">Results awaiting approval</div><a className="fb-link" onClick={() => go("hod-results")}>All</a>
          </div>
          <HodResultRows store={store} go={go} limit={3} only="pending" />
        </Card>
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Unassigned courses</div>
          {HOD_COURSES.filter((c) => rstate(store, "hod", "assign", c.code, c.lecturer) === "Unassigned").length === 0
            ? <div className="u-meta">Every course has a lecturer assigned.</div>
            : HOD_COURSES.filter((c) => rstate(store, "hod", "assign", c.code, c.lecturer) === "Unassigned").map((c) => (
              <div key={c.code} className="u-row" style={{ gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <span className="u-icon u-icon--plain"><Icon name="book" size={15} /></span>
                <div className="u-grow"><div className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</div><div className="u-meta">{c.title}</div></div>
                <Btn variant="secondary" size="sm" onClick={() => go("hod-assign")}>Assign</Btn>
              </div>
            ))}
        </Card>
      </div>
      <TeachingQuickInfo store={store} go={go} hat={{ teachCode: "CSC 303" }} />
    </div>
  );
}

function HodAssignments({ store, actions }) {
  const { HOD_COURSES, STAFF_POOL } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="Course Assignments" sub="Assign lecturers to department courses this semester" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Code</th><th>Course</th><th>Level</th><th className="u-right">Units</th><th>Assigned lecturer</th></tr></thead>
            <tbody>
              {HOD_COURSES.map((c) => {
                const cur = rstate(store, "hod", "assign", c.code, c.lecturer);
                return (
                  <tr key={c.code}>
                    <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                    <td>{c.title}</td>
                    <td><Tag>{c.level}</Tag></td>
                    <td className="u-right u-num">{c.units}</td>
                    <td>
                      <select className="fb-input" style={{ minWidth: 180, padding: "7px 10px", borderColor: cur === "Unassigned" ? "var(--danger)" : undefined }}
                        value={cur} onChange={(e) => actions.roleAct("hod", "assign", c.code, e.target.value)}>
                        {STAFF_POOL.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Changes save instantly. Newly assigned lecturers gain access to that course's roster and class space.</div>
    </div>
  );
}

function HodResultRows({ store, actions, go, limit, only }) {
  const { HOD_RESULTS } = window.ROLE_DATA;
  const st = (r) => rstate(store, "hod", "result", r.code, r.baseStatus);
  let rows = HOD_RESULTS; if (only) rows = rows.filter((r) => st(r) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No results pending" sub="Submitted results will appear here for your approval." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((r) => {
        const s = st(r);
        return (
          <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                            <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                <div className="u-meta">{r.lecturer} · {r.students} students · {r.passRate}% pass · submitted {r.submittedAt}</div>
              </div>
            </div>
            {s === "pending" && actions
              ? <Decide onApprove={() => actions.roleAct("hod", "result", r.code, "approved")} onReject={() => actions.roleAct("hod", "result", r.code, "query")} approveLabel="Approve" rejectLabel="Return" />
              : <SPill s={s} />}
          </div>
        );
      })}
    </div>
  );
}

function HodApprovals({ store, actions, go }) {
  return (
    <div className="u-content">
      <PageHead title="Result Approvals" sub="Approve lecturer-submitted results before they go to faculty" />
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Approval flow:</span>
          {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => (
            <React.Fragment key={s}>{i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}<Tag variant={s === "HOD" ? "accent" : undefined}>{s}</Tag></React.Fragment>
          ))}
        </div>
      </Card>
      <Card className="u-pad"><HodResultRows store={store} actions={actions} go={go} /></Card>
    </div>
  );
}

function HodStaff() {
  const { STAFF_POOL, HOD_COURSES } = window.ROLE_DATA;
  const staff = STAFF_POOL.filter((s) => s !== "Unassigned");
  return (
    <div className="u-content">
      <PageHead title="Department Staff" sub={staff.length + " academic staff · Computer Science"} />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Lecturer</th><th className="u-right">Courses</th><th>Workload</th></tr></thead>
            <tbody>
              {staff.map((s) => {
                const load = HOD_COURSES.filter((c) => c.lecturer === s).length;
                return (
                  <tr key={s}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={s.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/g, "").split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} /><span style={{ fontWeight: 500 }}>{s}</span></div></td>
                    <td className="u-right u-num">{load}</td>
                    <td><div className="u-bar" style={{ width: 120 }}><div className="u-bar__fill" style={{ width: Math.min(100, load * 33) + "%" }} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============ DEAN ============ */
/* faculty-scoped result sheets, generated from the org model so each Dean
   only sees results from departments in their own faculty */
function facultyResults(facultyId) {
  const ORG = window.ORG;
  const fac = ORG.facultyById(facultyId) || ORG.FACULTIES[0];
  const levels = ["100L", "200L", "300L", "400L"];
  const dates = ["Dec 17", "Dec 16", "Dec 15", "Dec 14", "Dec 13"];
  const base = ["pending", "pending", "approved", "pending", "approved"];
  const out = [];
  fac.departments.forEach((d, di) => {
    // 1–2 result sheets per department
    const n = 1 + (di % 2);
    for (let k = 0; k < n; k++) {
      const lvl = levels[(di + k) % levels.length];
      out.push({
        code: d.code + " " + (300 + k * 100 + di + 1),
        dept: d.name, deptId: d.id, level: lvl,
        students: 24 + ((di * 13 + k * 7) % 48),
        hodAt: dates[(di + k) % dates.length],
        baseStatus: base[(di + k) % base.length],
      });
    }
  });
  return out;
}

function DeanDashboard({ store, go, roleCfg }) {
  const ORG = window.ORG;
  const fid = (roleCfg && roleCfg.facultyId) || "computing";
  const fac = ORG.facultyById(fid);
  const results = React.useMemo(() => facultyResults(fid), [fid]);
  const pending = results.filter((r) => rstate(store, "dean", "result", r.code, r.baseStatus) === "pending").length;
  const totalStudents = fac.departments.reduce((s, d) => s + d.students, 0);
  const totalStaff = fac.departments.reduce((s, d) => s + d.staff, 0);
  const grad = Math.round(totalStudents * 0.16);
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.dean} />
      <StatCards items={[
        { icon: "building", k: "Departments", v: fac.departments.length, plain: true, onClick: () => go("dean-depts") },
        { icon: "user", k: "Faculty students", v: totalStudents.toLocaleString(), plain: true },
        { icon: "chart", k: "Results to sign off", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("dean-results") },
        { icon: "cap", k: "Graduating (proj.)", v: grad.toLocaleString(), plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">{fac.name} · departments</div>
          <span className="u-meta">{totalStaff} academic staff</span>
        </div>
        <DeanDeptRows facultyId={fid} store={store} />
      </Card>
    </div>
  );
}

function DeanDeptRows({ facultyId, store }) {
  const ORG = window.ORG;
  const fac = ORG.facultyById(facultyId) || ORG.FACULTIES[0];
  const results = React.useMemo(() => facultyResults(facultyId), [facultyId]);
  // derive a department's results status from its sheets
  const deptStatus = (deptId) => {
    const sheets = results.filter((r) => r.deptId === deptId);
    if (!sheets.length) return { label: "—", tone: undefined };
    const states = sheets.map((r) => rstate(store, "dean", "result", r.code, r.baseStatus));
    if (states.some((s) => s === "pending")) return { label: "In review", tone: "warning" };
    if (states.every((s) => s === "approved")) return { label: "Approved", tone: "success" };
    return { label: "Submitted", tone: "accent" };
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="u-table">
        <thead><tr><th>Department</th><th>HOD</th><th className="u-right">Students</th><th className="u-right">Staff</th><th>Results</th></tr></thead>
        <tbody>
          {fac.departments.map((d) => {
            const st = deptStatus(d.id);
            return (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name} <span className="u-meta fb-mono">· {d.code}</span></td>
                <td className="u-muted">{d.hod}</td>
                <td className="u-right u-num">{d.students.toLocaleString()}</td>
                <td className="u-right u-num">{d.staff}</td>
                <td><Tag variant={st.tone} dot={!!st.tone}>{st.label}</Tag></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeanDepts({ store, roleCfg }) {
  const ORG = window.ORG;
  const fid = (roleCfg && roleCfg.facultyId) || "computing";
  const fac = ORG.facultyById(fid);
  return (
    <div className="u-content">
      <PageHead title="Departments" sub={fac.name + " — " + fac.departments.length + " departments"} />
      <Card className="u-pad"><DeanDeptRows facultyId={fid} store={store} /></Card>
    </div>
  );
}

function DeanApprovals({ store, actions, roleCfg }) {
  const ORG = window.ORG;
  const fid = (roleCfg && roleCfg.facultyId) || "computing";
  const fac = ORG.facultyById(fid);
  const results = React.useMemo(() => facultyResults(fid), [fid]);
  const st = (r) => rstate(store, "dean", "result", r.code, r.baseStatus);
  const pending = results.filter((r) => st(r) === "pending").length;
  return (
    <div className="u-content">
      <PageHead title="Faculty Result Approvals" sub={fac.name + " · " + pending + " awaiting your sign-off"} />
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Approval flow:</span>
          {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => (
            <React.Fragment key={s}>{i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}<Tag variant={s === "Faculty" ? "accent" : undefined}>{s}</Tag></React.Fragment>
          ))}
        </div>
      </Card>
      <Card className="u-pad">
        <div className="u-stack" style={{ gap: 8 }}>
          {results.map((r) => {
            const s = st(r);
            return (
              <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                                    <div style={{ minWidth: 0 }}>
                    <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                    <div className="u-meta">{r.dept} · {r.students} students · HOD-approved {r.hodAt}</div>
                  </div>
                </div>
                {s === "pending" ? <Decide onApprove={() => actions.roleAct("dean", "result", r.code, "approved")} onReject={() => actions.roleAct("dean", "result", r.code, "query")} approveLabel="Sign off" rejectLabel="Return" /> : <SPill s={s} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* Dean: admissions into their own faculty (quota rollups per programme) */
function DeanAdmissions({ roleCfg }) {
  const ORG = window.ORG;
  const A = window.ADM;
  const fid = (roleCfg && roleCfg.facultyId) || "computing";
  const fac = ORG.facultyById(fid);
  // admissions PROGRAMMES carry a faculty short-name; match to this faculty
  const progs = (A ? A.PROGRAMMES : []).filter((p) => {
    const pf = ORG.facultyOf(p.faculty) || (p.faculty && p.faculty.toLowerCase().includes(fac.short.toLowerCase()) ? fac : null);
    return (pf && pf.id === fid) || (p.faculty && p.faculty.toLowerCase() === fac.short.toLowerCase());
  });
  const totalQuota = progs.reduce((s, p) => s + p.quota, 0);
  const totalApplied = progs.reduce((s, p) => s + p.applied, 0);
  return (
    <div className="u-content">
      <PageHead title="Faculty Admissions" sub={fac.name + " · intake overview"} />
      {progs.length === 0 ? (
        <Card className="u-pad"><Empty icon="doc" title="No programmes in admissions" sub="This faculty has no programmes in the current admission cycle." /></Card>
      ) : (
        <>
          <div className="u-grid u-grid--3" style={{ marginBottom: 16 }}>
            <Card className="u-pad"><div className="u-stat__k">Programmes</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{progs.length}</div></Card>
            <Card className="u-pad"><div className="u-stat__k">Total quota</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{totalQuota}</div></Card>
            <Card className="u-pad"><div className="u-stat__k">Applicants</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{totalApplied.toLocaleString()}</div></Card>
          </div>
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="u-table">
                <thead><tr><th>Programme</th><th className="u-right">Cutoff</th><th className="u-right">Quota</th><th className="u-right">Applied</th><th>Competition</th></tr></thead>
                <tbody>
                  {progs.map((p) => {
                    const ratio = (p.applied / p.quota).toFixed(1);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td className="u-right u-num">{p.cutoff}</td>
                        <td className="u-right u-num">{p.quota}</td>
                        <td className="u-right u-num">{p.applied}</td>
                        <td><Tag variant={ratio >= 2 ? "danger" : ratio >= 1.3 ? "warning" : "success"} dot>{ratio}× per place</Tag></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============ EXAMS & RECORDS ============ */
function ExamsDashboard({ store, go, roleCfg, hat }) {
  const { EXAM_PUBLISH, TRANSCRIPTS } = window.ROLE_DATA;
  const ready = EXAM_PUBLISH.filter((r) => rstate(store, "exams", "pub", r.code, r.baseStatus) === "ready").length;
  const tpending = TRANSCRIPTS.filter((t) => rstate(store, "exams", "tr", t.id, t.baseStatus) !== "done").length;
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.exams} sub={hat && hat.roleTitle} />
      <StatCards items={[
        { icon: "chart", k: "Results to publish", v: ready, tag: ready ? "Release" : "Clear", tone: ready ? "warning" : "success", onClick: () => go("exm-publish") },
        { icon: "doc", k: "Transcript requests", v: tpending, tag: tpending ? "Process" : "Clear", tone: tpending ? "warning" : "success", onClick: () => go("exm-trans") },
        { icon: "cap", k: "Records on file", v: "18,402", plain: true },
        { icon: "check", k: "Published this week", v: EXAM_PUBLISH.filter((r) => rstate(store, "exams", "pub", r.code, r.baseStatus) === "published").length, plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Senate-approved results ready to release</div><a className="fb-link" onClick={() => go("exm-publish")}>All</a>
        </div>
        <ExamPubRows store={store} limit={3} />
      </Card>
    </div>
  );
}

function ExamPubRows({ store, actions, limit }) {
  const { EXAM_PUBLISH } = window.ROLE_DATA;
  let rows = EXAM_PUBLISH; if (limit) rows = rows.slice(0, limit);
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((r) => {
        const s = rstate(store, "exams", "pub", r.code, r.baseStatus);
        return (
          <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                            <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                <div className="u-meta">{r.title} · {r.dept} · {r.students} students · Senate {r.senateAt}</div>
              </div>
            </div>
            {s === "published" ? <SPill s="published" /> : actions
              ? <Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("exams", "pub", r.code, "published")}>Publish to students</Btn>
              : <Tag variant="accent" dot>Ready</Tag>}
          </div>
        );
      })}
    </div>
  );
}

function ExamsPublish({ store, actions }) {
  return (
    <div className="u-content">
      <PageHead title="Publish Results" sub="Release Senate-approved results to students' portals" />
      <Card className="u-pad"><ExamPubRows store={store} actions={actions} /></Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Once published, results become visible on students' Results screen with GPA and grades.</div>
    </div>
  );
}

function ExamsTranscripts({ store, actions }) {
  const { TRANSCRIPTS, fmt } = window.ROLE_DATA;
  const next = { pending: "processing", processing: "done" };
  const label = { pending: "Start processing", processing: "Mark dispatched" };
  const [q, setQ] = React.useState("");
  const filtered = TRANSCRIPTS.filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);
  return (
    <div className="u-content">
      <PageHead title="Transcript Requests" sub={TRANSCRIPTS.length + " requests · process and dispatch official transcripts"} />
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Applicant</th><th>Destination</th><th className="u-right">Copies</th><th>Payment</th><th>Status</th><th className="u-right">Action</th></tr></thead>
            <tbody>
              {pager.slice.map((t) => {
                const s = rstate(store, "exams", "tr", t.id, t.baseStatus);
                return (
                  <tr key={t.id}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={t.initials} size={30} /><div><div style={{ fontWeight: 500 }}>{t.name}</div><div className="u-meta fb-mono">{t.matric}</div></div></div></td>
                    <td>{t.destination}</td>
                    <td className="u-right u-num">{t.copies}</td>
                    <td>{t.paid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>}</td>
                    <td><SPill s={s} /></td>
                    <td className="u-right">
                      {s !== "done" && t.paid && <Btn variant={s === "processing" ? "accent" : "secondary"} size="sm" onClick={() => actions.roleAct("exams", "tr", t.id, next[s])}>{label[s]}</Btn>}
                      {!t.paid && <span className="u-meta">Awaiting payment</span>}
                      {s === "done" && <Tag variant="success" dot>Dispatched</Tag>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="requests" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

Object.assign(window, {
  Decide,
  AdviserDashboard, AdviserApprovals, AdviserAdvisees,
  HodDashboard, HodAssignments, HodApprovals, HodStaff,
  DeanDashboard, DeanDepts, DeanApprovals, DeanAdmissions,
  ExamsDashboard, ExamsPublish, ExamsTranscripts,
});
