import React from "react";
const { Avatar, Btn, Card, Confirm, ConfirmButton, Empty, Icon, PageHead, RoleHero, SPill, Seg, StatCards, Tag, TeachingQuickInfo, rstate } = window;
/* Role screens: academic cluster: Adviser, HOD, Dean, Exams & Records */

/* small reusable: action buttons for a decision row. Reject/decline is the
   destructive branch, so it asks for confirmation first; approve fires
   straight away. */
function Decide({ onApprove, onReject, approveLabel = "Approve", rejectLabel = "Query", size = "sm", confirmReject = true, confirmTitle, confirmBody }) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <div className="u-row" style={{ gap: 6 }}>
      <Btn variant="secondary" size={size} onClick={() => (confirmReject ? setConfirming(true) : onReject())}>{rejectLabel}</Btn>
      <Btn variant="accent" size={size} icon="check" onClick={onApprove}>{approveLabel}</Btn>
      {confirming && (
        <Confirm
          title={confirmTitle || (rejectLabel + " this?")}
          body={confirmBody || ("Are you sure you want to “" + rejectLabel + "” this? This can't be undone from here.")}
          confirmLabel={rejectLabel}
          onConfirm={() => { setConfirming(false); onReject(); }}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

/* reusable: a "return"/"query"/"decline" action that requires a reason first :
   click reveals a textarea, so whoever's on the other end always gets a comment
   explaining why their submission was sent back */
function ReturnWithNote({ onConfirm, label = "Return", placeholder = "Explain what needs to change…", variant = "secondary", icon = "arrowLeft" }) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  if (!open) return <Btn variant={variant} icon={icon} onClick={() => setOpen(true)}>{label}</Btn>;
  return (
    <div className="u-stack" style={{ gap: 8, width: "100%" }}>
      <textarea className="fb-textarea" rows={2} autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} />
      <div className="u-row" style={{ gap: 6 }}>
        <Btn variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Btn>
        <Btn variant={variant} size="sm" icon={icon} disabled={!note.trim()} onClick={() => onConfirm(note.trim())}>Confirm: {label.toLowerCase()}</Btn>
      </div>
    </div>
  );
}

/* reusable: a row-level assignment dropdown that never saves on change alone
   — pick a value, then a "Save" button appears (same dirty-check convention
   as AdviserUnitsCard's unit-limit fields), so a stray click never reassigns
   someone by accident. */
function SavableSelect({ value, options, onSave, invalid, width = 180, small }) {
  const [draft, setDraft] = React.useState(value);
  const dirty = draft !== value;
  return (
    <div className="u-row" style={{ gap: 6, alignItems: "center" }}>
      <select className="fb-input" style={small ? { padding: "3px 7px", fontSize: 12 } : { minWidth: width, padding: "7px 10px", borderColor: invalid && invalid(draft) ? "var(--danger)" : undefined }}
        value={draft} onChange={(e) => setDraft(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {dirty && <Btn variant="accent" size="sm" icon="check" onClick={() => onSave(draft)}>Save</Btn>}
    </div>
  );
}

/* deferment: appears only while one is actually pending, rather than a
   permanent empty-state card — it's rare, so it shouldn't take up space
   when there's nothing to review. */
function DefermentRequestCard({ store, actions }) {
  const d = store.deferment;
  if (!d || d.status !== "pending") return null;
  const { STUDENT } = window.DATA;
  return (
    <Card className="u-pad" style={{ marginBottom: 16 }}>
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="u-h3">Deferment request</div>
        <Tag variant="warning" dot>Pending</Tag>
      </div>
      <div className="u-row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="u-row" style={{ gap: 10, cursor: "pointer" }} onClick={() => window.showDetail("student", { name: STUDENT.name, matric: STUDENT.matric, level: "300L" })}>
          <Avatar initials={STUDENT.initials} size={36} />
        </div>
        <div className="u-grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer" }} onClick={() => window.showDetail("student", { name: STUDENT.name, matric: STUDENT.matric, level: "300L" })}>
            {STUDENT.name} <span className="u-meta fb-mono" style={{ fontWeight: 400 }}>{STUDENT.matric}</span>
          </div>
          <div style={{ marginTop: 4 }}><Tag variant="accent">{d.reason}</Tag></div>
          <div style={{ fontSize: 13, marginTop: 8 }}>{d.details}</div>
          {d.fileName && (
            <div className="u-row" style={{ gap: 7, marginTop: 8, color: "var(--fg-muted)" }}>
              <Icon name="doc" size={13} /> <span className="fb-mono" style={{ fontSize: 12 }}>{d.fileName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="u-row u-wrap" style={{ gap: 8, marginTop: 14 }}>
        <Btn variant="secondary" size="sm" icon="chart" onClick={() => window.showDetail("student", { name: STUDENT.name, matric: STUDENT.matric, level: "300L" })}>Academic record</Btn>
        <ReturnWithNote label="Decline" variant="secondary" icon="x" placeholder="Why are you declining this request?" onConfirm={(note) => actions.decideDeferment(false, note)} />
        <Btn variant="accent" size="sm" onClick={() => actions.decideDeferment(true)}>Approve deferment</Btn>
      </div>
    </Card>
  );
}

/* ============ LEVEL ADVISER ============ */
function AdviserDashboard({ store, actions, go, roleCfg, hat }) {
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
      <DefermentRequestCard store={store} actions={actions} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Registrations awaiting your approval</div>
          <a className="fb-link" onClick={() => go("adv-reg")}>Open queue</a>
        </div>
        <AdviseeRows store={store} go={go} limit={4} only="pending" />
      </Card>
      <div className="u-cols u-cols--main" style={{ marginTop: 16 }}>
        <RepReportsCard store={store} actions={actions} />
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Class representative</div>
          {(() => {
            const rep = classRepOf(store);
            return rep ? (
              <div className="u-row" style={{ gap: 12 }}>
                <Avatar initials={rep.initials} size={40} />
                <div className="u-grow">
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{rep.name} <Tag variant="accent">Class Rep</Tag></div>
                  <div className="u-meta fb-mono">{rep.matric}</div>
                </div>
              </div>
            ) : (
              <div className="u-stack" style={{ gap: 10 }}>
                <div className="u-meta">No class rep appointed for 300L CSC yet. The rep can post class notices, send deadline reminders and report issues to you.</div>
                <Btn variant="secondary" size="sm" onClick={() => go("adv-list")}>Appoint from My Advisees</Btn>
              </div>
            );
          })()}
        </Card>
      </div>
      <div style={{ marginTop: 16 }}><AdviserUnitsCard store={store} actions={actions} /></div>
      <TeachingQuickInfo store={store} go={go} hat={{ teachCode: "CSC 313" }} />
    </div>
  );
}

/* the adviser sets the semester's registration unit load (EO requirement) */
function AdviserUnitsCard({ store, actions }) {
  const cur = (store.roles && store.roles.adviser && store.roles.adviser.units) || { min: 15, max: 24 };
  const [min, setMin] = React.useState(cur.min);
  const [max, setMax] = React.useState(cur.max);
  const dirty = Number(min) !== cur.min || Number(max) !== cur.max;
  const valid = Number(min) >= 6 && Number(max) <= 30 && Number(min) < Number(max);
  return (
    <Card className="u-pad">
      <div className="u-h3" style={{ marginBottom: 4 }}>Registration unit limits</div>
      <div className="u-meta" style={{ marginBottom: 12 }}>Students must register within these limits. The course form validates against them live.</div>
      <div className="u-row" style={{ gap: 10, alignItems: "flex-end" }}>
        <label className="u-stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Minimum</span>
          <input className="fb-input" type="number" min={6} max={30} value={min} onChange={(e) => setMin(e.target.value)} style={{ width: 90 }} />
        </label>
        <label className="u-stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Maximum</span>
          <input className="fb-input" type="number" min={6} max={30} value={max} onChange={(e) => setMax(e.target.value)} style={{ width: 90 }} />
        </label>
        <Btn variant={dirty ? "accent" : "secondary"} disabled={!dirty || !valid} icon="check"
          onClick={() => actions.adviserSetUnits(Number(min), Number(max))}>Save</Btn>
      </div>
      {!valid && <div className="u-meta" style={{ marginTop: 8, color: "var(--danger)" }}>Minimum must be below maximum, within 6-30 units.</div>}
      {!dirty && valid && <div className="u-meta" style={{ marginTop: 8 }}>Current: {cur.min}-{cur.max} units per semester.</div>}
    </Card>
  );
}

/* issues filed by the class rep, with resolve action */
function RepReportsCard({ store, actions }) {
  const issues = (store.roles && store.roles.rep && store.roles.rep.issues) || [];
  const openCount = issues.filter((i) => i.status === "open").length;
  return (
    <Card className="u-pad">
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div className="u-h3">Reports from your class rep</div>
        {openCount > 0 && <Tag variant="warning" dot>{openCount} open</Tag>}
      </div>
      {issues.length === 0
        ? <div className="u-meta">Nothing reported. Issues your class rep raises (venue problems, missed lectures…) land here.</div>
        : (
          <div className="u-stack" style={{ gap: 8 }}>
            {issues.map((i) => (
              <div key={i.id} className="u-row" style={{ gap: 11, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", alignItems: "flex-start" }}>
                <span className="u-icon u-icon--plain" style={{ width: 28, height: 28, flexShrink: 0 }}><Icon name="info" size={13} /></span>
                <div className="u-grow" style={{ minWidth: 0 }}>
                  <div className="u-row u-wrap" style={{ gap: 6 }}>
                    <span className="fb-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{i.code}</span>
                    <Tag>{i.category}</Tag>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 3 }}>{i.text}</div>
                  <div className="u-meta" style={{ marginTop: 3 }}>{i.at}</div>
                </div>
                {i.status === "open"
                  ? <Btn variant="secondary" size="sm" onClick={() => actions.resolveRepIssue(i.id)}>Resolve</Btn>
                  : <Tag variant="success" dot>Resolved</Tag>}
              </div>
            ))}
          </div>
        )}
    </Card>
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
                  ? <Decide onApprove={() => actions.roleAct("adviser", "reg", a.id, "approved")} onReject={() => actions.roleAct("adviser", "reg", a.id, "query")}
                      confirmTitle={"Query " + a.name + "'s course form?"} confirmBody={"This sends " + a.name + "'s course registration back for changes without a written reason. Consider using a note if they'll need specifics."} />
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
  const isMe = a.matric === window.DATA.STUDENT.matric;
  const returnNote = (store.roles && store.roles.adviser && store.roles.adviser.regNote && store.roles.adviser.regNote[a.id]) || "";
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
          <div className="u-row" style={{ gap: 8 }}>
            <Btn variant="secondary" size="sm" icon="chart" onClick={() => window.showDetail("student", { name: a.name, matric: a.matric, level: "300L", cgpa: a.cgpa, carryover: a.carryover })}>Academic record</Btn>
            <SPill s={st} />
          </div>
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
                    {!decided && <button className="fb-btn fb-btn--ghost fb-btn--sm" onClick={() => actions.adviserComment(a.id, c.code, "")}>Remove</button>}
                  </div>
                )}

                {editing && (
                  <div style={{ marginTop: 10 }}>
                    <textarea className="fb-textarea" rows={2} autoFocus value={drafts[c.code] || ""} onChange={(e) => setDraft(c.code, e.target.value)} placeholder={"Advice on " + c.code + ": e.g. drop this elective, prioritise your carryover…"} />
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
          <div className="u-meta" style={{ marginBottom: 14 }}>Approve the form, or send it back with a comment for the student to revise.{next ? " You'll move to the next student automatically." : ""}</div>
          <div className="u-row u-wrap" style={{ gap: 8, alignItems: "flex-start" }}>
            <Btn variant="accent" icon="check" onClick={() => { actions.roleAct("adviser", "reg", a.id, "approved"); if (isMe) actions.approveRegistration(); afterDecision(); }}>Approve course form</Btn>
            <ReturnWithNote label="Return with query" placeholder="What should the student change before resubmitting?"
              onConfirm={(note) => {
                actions.roleAct("adviser", "reg", a.id, "query");
                actions.roleAct("adviser", "regNote", a.id, note);
                if (isMe) actions.queryRegistration(note);
                afterDecision();
              }} />
          </div>
        </Card>
      ) : (
        <Card className="u-pad">
          <div className="u-row" style={{ gap: 10 }}>
            <span className="u-icon" style={{ background: st === "approved" ? "var(--success-soft)" : "var(--warning-soft)", color: st === "approved" ? "var(--success)" : "oklch(from var(--warning) calc(l - 0.2) c h)" }}><Icon name={st === "approved" ? "check" : "info"} size={16} /></span>
            <div className="u-grow">
              <div className="u-h3">{st === "approved" ? "Course form approved" : "Returned to student"}</div>
              <div className="u-meta">{st === "approved" ? "The student can now print their course form." : "The student will revise and resubmit based on your comment."}</div>
              {st === "query" && returnNote && <div className="u-meta" style={{ marginTop: 6, fontStyle: "italic" }}>“{returnNote}”</div>}
            </div>
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
  const [sort, setSort] = React.useState("name");
  const [selected, setSelected] = React.useState([]);
  const [openId, setOpenId] = React.useState(null);
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const counts = { pending: 0, approved: 0, query: 0 };
  ADVISEES.filter((a) => a.submitted).forEach((a) => { const s = dec(a); counts[s] = (counts[s] || 0) + 1; });

  const filtered = ADVISEES.filter((a) => a.submitted && dec(a) === filter)
    .filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.matric.toLowerCase().includes(q.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "units") return b.units - a.units;
    if (sort === "flags") return b.flags.length - a.flags.length || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
  const pager = usePaged(sorted, 12);
  const eligibleOnPage = pager.slice.filter((a) => dec(a) === "pending").map((a) => a.id);
  const allPageSelected = eligibleOnPage.length > 0 && eligibleOnPage.every((id) => selected.includes(id));
  const toggle = (id) => setSelected((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const togglePage = () => setSelected((ids) => allPageSelected
    ? ids.filter((id) => !eligibleOnPage.includes(id))
    : Array.from(new Set([...ids, ...eligibleOnPage])));
  const approveSelected = () => {
    selected.forEach((id) => actions.roleAct("adviser", "reg", id, "approved"));
    setSelected([]);
  };
  React.useEffect(() => { setSelected([]); }, [filter]);

  if (openId) return <AdviseeDetail store={store} actions={actions} id={openId} onBack={() => setOpenId(null)} list={sorted} onOpen={setOpenId} />;

  return (
    <div className="u-content">
      <PageHead title="Course Approvals" sub={(counts.pending || 0) + " of " + ADVISEES.filter((a) => a.submitted).length + " submitted forms awaiting review"}>
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "approved", label: "Approved · " + (counts.approved || 0) }, { value: "query", label: "Queried · " + (counts.query || 0) },
        ]} />
      </PageHead>
      <Card>
        <div className="u-table-toolbar">
          <label className="u-stack u-table-search" style={{ gap: 5 }}>
            <span className="u-meta">Search students</span>
            <input className="fb-input" placeholder="Name or matric number" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="u-table-tools">
            <label className="u-stack u-table-select" style={{ gap: 5 }}>
              <span className="u-meta">Sort by</span>
              <select className="fb-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">Student name</option>
                <option value="units">Unit load</option>
                <option value="flags">Issues first</option>
              </select>
            </label>
          </div>
        </div>
        {selected.length > 0 && (
          <div className="u-bulkbar">
            <strong>{selected.length} selected</strong>
            <span className="u-grow">Only pending forms can be approved in bulk.</span>
            <Btn variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Btn>
            <Btn variant="accent" size="sm" onClick={approveSelected}>Approve selected</Btn>
          </div>
        )}
        {pager.slice.length === 0 ? (
          <Empty title="No matching forms" sub="Change the status filter or search terms." />
        ) : (
          <div className="u-table-scroll">
            <table className="u-table">
              <thead><tr>
                <th><input className="u-check" type="checkbox" aria-label="Select pending forms on this page" checked={allPageSelected} onChange={togglePage} disabled={eligibleOnPage.length === 0} /></th>
                <th>Student</th><th>Matric number</th><th className="u-right">Courses</th><th className="u-right">Units</th><th>Issues</th><th>Submitted</th><th className="u-right">Action</th>
              </tr></thead>
              <tbody>{pager.slice.map((a) => {
                const status = dec(a);
                const canSelect = status === "pending";
                return <tr key={a.id}>
                  <td><input className="u-check" type="checkbox" aria-label={"Select " + a.name} checked={selected.includes(a.id)} disabled={!canSelect} onChange={() => toggle(a.id)} /></td>
                  <td style={{ fontWeight: 600 }}>{a.name}<div className="u-meta">{status === "pending" ? "Awaiting your review" : status === "approved" ? "Review completed" : "Waiting for student revision"}</div></td>
                  <td className="fb-mono">{a.matric}</td>
                  <td className="u-right u-num">{a.courses}</td>
                  <td className="u-right u-num">{a.units}</td>
                  <td>{a.flags.length ? a.flags.join(", ") : "None"}</td>
                  <td>{a.submittedAt || "Not available"}</td>
                  <td className="u-right"><Btn variant="secondary" size="sm" onClick={() => setOpenId(a.id)}>{status === "pending" ? "Review" : "View"}</Btn></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
        <Pagination pager={pager} label="students" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

function AdviserAdvisees({ store, actions }) {
  const { ADVISEES } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const filtered = ADVISEES.filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 15);
  const repId = classRepId(store);
  const rep = classRepOf(store);
  return (
    <div className="u-content">
      <PageHead title="My Advisees" sub={ADVISEES.length + " students · 300 Level Computer Science"} />
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 10 }}>
          <span className="u-icon u-icon--plain" style={{ width: 30, height: 30 }}><Icon name="spark" size={15} /></span>
          <div className="u-grow" style={{ fontSize: 13 }}>
            {rep
              ? <><strong>{rep.name}</strong> is the class representative. Appoint someone else below to replace them.</>
              : <>No class representative yet. Appoint one below: the rep can post class notices, send deadline reminders and report issues to you.</>}
          </div>
        </div>
      </Card>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th className="u-right">Units</th><th>Fees</th><th>Carryover</th><th>Registration</th><th className="u-right">Class rep</th></tr></thead>
            <tbody>
              {pager.slice.map((a) => (
                <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => window.showDetail("student", { name: a.name, matric: a.matric, level: "300L", cgpa: a.cgpa, carryover: a.carryover })}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{a.matric}</td>
                  <td style={{ fontWeight: 500 }}>{a.name} {a.id === repId && <Tag variant="accent">Class Rep</Tag>}</td>
                  <td className="u-right u-num">{a.submitted ? a.units : "Not available"}</td>
                  <td>{a.feesPaid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>}</td>
                  <td>{a.carryover ? <Tag variant="warning">Yes</Tag> : <span className="u-muted">None</span>}</td>
                  <td><SPill s={rstate(store, "adviser", "reg", a.id, a.baseStatus)} /></td>
                  <td className="u-right">
                    {a.id === repId
                      ? <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); actions.roleAct("adviser", "rep", REP_KEY, null); }}>Remove</Btn>
                      : <Btn variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); actions.roleAct("adviser", "rep", REP_KEY, a.id); }}>{rep ? "Make rep" : "Appoint rep"}</Btn>}
                  </td>
                </tr>
              ))}
              {pager.slice.length === 0 && <tr><td colSpan={7}><Empty icon="search" title="No matches" sub="No students match your search." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[15, 30, 60]} />
      </Card>
    </div>
  );
}

/* ============ RESULT SHEET DETAIL (shared: HOD / Dean / Exams) ============ */
/* deterministic mock rows seeded from the course code, so the same sheet
   always shows the same students and scores across screens and reloads */
function sheetRows(code, count) {
  const { genName } = window.ROLE_DATA;
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const dept = code.split(" ")[0];
  const base = Math.floor(rnd() * 300);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const ca = Math.round(8 + rnd() * 22);
    const exam = Math.round(10 + rnd() * 60);
    const total = ca + exam;
    const grade = total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 45 ? "D" : total >= 40 ? "E" : "F";
    rows.push({ sn: i + 1, name: genName(base + i), matric: "FUT/2022/" + dept + "/" + (10100 + base * 3 + i * 7), ca, exam, total, grade });
  }
  return rows;
}

const GRADE_TONE = { A: "success", B: "success", C: "accent", D: "warning", E: "warning", F: "danger" };

function ResultSheetDetail({ meta, status, note, onBack, backLabel, onApprove, onReject, onReopen, onPublish, approveLabel, rejectLabel, decisionNote }) {
  const rows = React.useMemo(() => sheetRows(meta.code, meta.students), [meta.code, meta.students]);
  const [q, setQ] = React.useState("");
  const query = q.trim().toLowerCase();
  const filteredRows = rows.filter((r) => !query || r.name.toLowerCase().includes(query) || r.matric.toLowerCase().includes(query));
  const pager = usePaged(filteredRows, 15);
  const dist = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  rows.forEach((r) => { dist[r.grade]++; });
  const passed = rows.length - dist.F;
  const avg = Math.round(rows.reduce((s, r) => s + r.total, 0) / (rows.length || 1));
  const maxDist = Math.max(1, ...Object.values(dist));
  const pending = status === "pending";

  return (
    <div className="u-content u-content--narrow">
      <div style={{ marginBottom: 14 }}>
        <button className="u-filelink" onClick={onBack}><Icon name="arrowLeft" size={14} /> {backLabel || "Back to approvals"}</button>
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
          <div>
            <div className="u-row" style={{ gap: 8 }}>
              <span className="fb-mono u-h2">{meta.code}</span>
              <Tag>{meta.level}</Tag>
            </div>
            {meta.title && <div style={{ fontWeight: 500, marginTop: 3 }}>{meta.title}</div>}
            <div className="u-meta" style={{ marginTop: 4 }}>{meta.sub}</div>
          </div>
          <SPill s={status} />
        </div>
      </Card>

      <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
        <Card className="u-pad"><div className="u-stat__k">Students</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{rows.length}</div></Card>
        <Card className="u-pad"><div className="u-stat__k">Pass rate</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{Math.round((passed / (rows.length || 1)) * 100)}%</div></Card>
        <Card className="u-pad"><div className="u-stat__k">Class average</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{avg}<span className="u-meta" style={{ fontWeight: 400 }}> / 100</span></div></Card>
        <Card className="u-pad"><div className="u-stat__k">A grades</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{dist.A}</div></Card>
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 12 }}>Grade distribution</div>
        <div className="u-stack" style={{ gap: 8 }}>
          {Object.entries(dist).map(([g, n]) => (
            <div key={g} className="u-row" style={{ gap: 10 }}>
              <span className="fb-mono" style={{ fontWeight: 600, width: 14 }}>{g}</span>
              <div className="u-bar u-grow"><div className="u-bar__fill" style={{ width: (n / maxDist) * 100 + "%", background: g === "F" ? "var(--danger)" : "var(--accent)" }} /></div>
              <span className="u-meta u-num" style={{ width: 60, textAlign: "right" }}>{n} · {Math.round((n / (rows.length || 1)) * 100)}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div className="u-pad" style={{ paddingBottom: 0 }}><div className="u-h3">Score sheet</div><div className="u-meta" style={{ marginTop: 2 }}>CA is out of 30, exam out of 70. Click a student to see their full academic record and history.</div></div>
        <div className="u-table-toolbar">
          <label className="u-stack u-table-search" style={{ gap: 5 }}>
            <span className="u-meta">Search score sheet</span>
            <input className="fb-input" placeholder="Student name or matric number" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <span className="u-meta">{filteredRows.length} of {rows.length} students</span>
        </div>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>#</th><th>Matric</th><th>Student</th><th className="u-right">CA</th><th className="u-right">Exam</th><th className="u-right">Total</th><th>Grade</th></tr></thead>
            <tbody>
              {pager.slice.map((r) => (
                <tr key={r.sn} style={{ cursor: "pointer" }} onClick={() => window.showDetail("student", { name: r.name, matric: r.matric, level: meta.level, fromCourse: meta.code, score: r.total, grade: r.grade })}>
                  <td className="u-meta u-num">{r.sn}</td>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{r.matric}</td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td className="u-right u-num">{r.ca}</td>
                  <td className="u-right u-num">{r.exam}</td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{r.total}</td>
                  <td><Tag variant={GRADE_TONE[r.grade]}>{r.grade}</Tag></td>
                </tr>
              ))}
              {pager.slice.length === 0 && <tr><td colSpan={7}><Empty title="No matching students" sub="Search by student name or matric number." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[15, 30, 60]} />
      </Card>

      {pending && onApprove ? (
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 4 }}>Decision</div>
          {decisionNote && <div className="u-meta" style={{ marginBottom: 14 }}>{decisionNote}</div>}
          <div className="u-row u-wrap" style={{ gap: 8, alignItems: "flex-start" }}>
            <Btn variant="accent" icon="check" onClick={onApprove}>{approveLabel || "Approve"}</Btn>
            {onReject && <ReturnWithNote label={rejectLabel || "Return"} placeholder="What needs to be corrected before this is resubmitted?" onConfirm={onReject} />}
          </div>
        </Card>
      ) : status === "ready" && onPublish ? (
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 4 }}>Release</div>
          <div className="u-meta" style={{ marginBottom: 14 }}>Publishing makes this sheet visible on every registered student's Results screen.</div>
          <Btn variant="accent" icon="check" onClick={onPublish}>Publish to students</Btn>
        </Card>
      ) : (
        <Card className="u-pad">
          <div className="u-row" style={{ gap: 10 }}>
            <span className="u-icon" style={{ background: status === "query" ? "var(--warning-soft)" : "var(--success-soft)", color: status === "query" ? "oklch(from var(--warning) calc(l - 0.2) c h)" : "var(--success)" }}><Icon name={status === "query" ? "info" : "check"} size={16} /></span>
            <div className="u-grow">
              <div className="u-h3">{status === "query" ? "Returned for correction" : status === "published" ? "Published to students" : "Results approved"}</div>
              <div className="u-meta">{status === "query" ? "The sheet was sent back with a query." : status === "published" ? "Students can see their grades on the Results screen." : "This sheet has moved to the next approval stage."}</div>
              {status === "query" && note && <div className="u-meta" style={{ marginTop: 6, fontStyle: "italic" }}>“{note}”</div>}
            </div>
            {onReopen && <Btn variant="ghost" size="sm" onClick={onReopen}>Reopen</Btn>}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============ HOD ============ */
/* full department curriculum: every course at every level, with its live
   assignment (falling back to the seed lecturer where one exists, else
   Unassigned). Shared by the dashboard, the assignment screen and the staff
   workload overview so they never disagree with each other. */
function hodAllCourses(store) {
  const { HOD_COURSES } = window.ROLE_DATA;
  return LEVELS.flatMap((lvl) => levelCourses("CSC", lvl).map((c) => {
    const seed = HOD_COURSES.find((h) => h.code === c.code);
    return { ...c, level: lvl, title: (seed && seed.title) || c.title || c.code, lecturer: rstate(store, "hod", "assign", c.code, (seed && seed.lecturer) || "Unassigned") };
  }));
}

function HodDashboard({ store, go, roleCfg, hat }) {
  const allCourses = hodAllCourses(store);
  const unassignedCourses = allCourses.filter((c) => c.lecturer === "Unassigned");
  const { entries } = reviewScope(store, "hod", roleCfg);
  const myQueue = entries.filter((e) => myReviewTurn(e.pipe, "hod"));
  const trend = semesterTrend(store, LEVELS.map((lvl) => ({ dept: { code: "CSC" }, level: lvl })));
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.hod} sub={hat && hat.roleTitle} />
      <TrendLine trend={trend} />
      <StatCards items={[
        { icon: "book", k: "Department courses", v: allCourses.length, plain: true },
        { icon: "user", k: "Unassigned courses", v: unassignedCourses.length, tag: unassignedCourses.length ? "Assign" : "Done", tone: unassignedCourses.length ? "warning" : "success", onClick: () => go("hod-assign") },
        { icon: "chart", k: "Levels awaiting your review", v: myQueue.length, tag: myQueue.length ? "Review" : "Clear", tone: myQueue.length ? "warning" : "success", onClick: () => go("hod-results") },
        { icon: "user", k: "Department students", v: "1,240", plain: true },
      ]} />
      <div className="u-cols u-cols--main">
        <Card className="u-pad">
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="u-h3">Levels awaiting your review</div><a className="fb-link" onClick={() => go("hod-results")}>All</a>
          </div>
          {myQueue.length === 0 ? <Empty icon="check" title="Nothing pending" sub="Levels compiled by Exams & Records land here when it's your turn to review." /> : (
            <div className="u-stack" style={{ gap: 8 }}>
              {myQueue.slice(0, 3).map((e) => (
                <div key={e.pipe.key} className="u-row" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                  <div><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{e.dept.name}</span> <Tag>{e.level}</Tag></div>
                  <Btn variant="secondary" size="sm" iconRight="chevron" onClick={() => go("hod-results")}>Review</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Unassigned courses</div>
          {unassignedCourses.length === 0
            ? <div className="u-meta">Every course has a lecturer assigned.</div>
            : unassignedCourses.slice(0, 6).map((c) => (
              <div key={c.code} className="u-row" style={{ gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <span className="u-icon u-icon--plain"><Icon name="book" size={15} /></span>
                <div className="u-grow"><div className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</div><div className="u-meta">{c.title} · {c.level}</div></div>
                <Btn variant="secondary" size="sm" onClick={() => go("hod-assign")}>Assign</Btn>
              </div>
            ))}
        </Card>
      </div>
      <TeachingQuickInfo store={store} go={go} hat={{ teachCode: "CSC 303" }} />
    </div>
  );
}

/* ---- department course catalogue: every course, every level (100L-500L) ---- */
function HodAssignments({ store, actions }) {
  const { STAFF_POOL } = window.ROLE_DATA;
  const [level, setLevel] = React.useState("300L");
  const allCourses = hodAllCourses(store);
  const courses = allCourses.filter((c) => c.level === level);
  const committed = Object.fromEntries(allCourses.map((c) => [c.code, c.lecturer]));
  const [draft, setDraft] = React.useState(committed);
  const dirty = JSON.stringify(draft) !== JSON.stringify(committed);
  return (
    <div className="u-content">
      <PageHead title="Course Assignments" sub={"Computer Science · " + level + " · assign a lecturer to every course"}>
        <Seg value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l }))} />
      </PageHead>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Code</th><th>Course</th><th className="u-right">Units</th><th>Lecturer</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.code}>
                  <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                  <td className="u-muted">{c.title}</td>
                  <td className="u-right u-num">{c.units}</td>
                  <td>
                    <select className="fb-input" style={{ minWidth: 180, padding: "7px 10px", borderColor: draft[c.code] === "Unassigned" ? "var(--danger)" : undefined }}
                      value={draft[c.code]} onChange={(e) => setDraft({ ...draft, [c.code]: e.target.value })}>
                      {STAFF_POOL.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-row u-wrap" style={{ gap: 10, marginTop: 12, alignItems: "center" }}>
        {dirty ? (
          <>
            <Btn variant="accent" icon="check" onClick={() => actions.roleActBulk("hod", "assign", draft)}>Save changes</Btn>
            <Btn variant="ghost" onClick={() => setDraft(committed)}>Discard</Btn>
            <span className="u-meta">Unsaved. Newly assigned lecturers gain access to that course's roster and class space once saved.</span>
          </>
        ) : (
          <span className="u-meta"><Icon name="info" size={13} /> Nothing to save.</span>
        )}
      </div>
    </div>
  );
}

/* ---- staff overview: every duty's workload rolled up per lecturer, in one
   glance. Assignment itself happens on each duty's own page. ---- */
function staffInitials(s) { return s.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/g, "").split(" ").map((x) => x[0]).slice(0, 2).join(""); }

function HodStaff({ store }) {
  const { STAFF_POOL, SIWES_STUDENTS } = window.ROLE_DATA;
  const { FINALISTS } = window.PROJECT_DATA;
  const staff = STAFF_POOL.filter((s) => s !== "Unassigned");
  const allCourses = hodAllCourses(store);

  const levelAdviser = (lvl) => rstate(store, "hod", "levelAdviser", lvl, lvl === "300L" ? "Dr. C. Madu" : "Unassigned");
  const projectSupervisorOf = (f) => rstate(store, "hod", "supv", f.id, f.baseSupervisor);
  const itSupervisorOf = (s) => rstate(store, "hod", "itSupv", s.id, s.baseSupervisor);

  const loadOf = (s) => ({
    courses: allCourses.filter((c) => c.lecturer === s).length,
    advising: LEVELS.filter((l) => levelAdviser(l) === s).length,
    supervising: FINALISTS.filter((f) => projectSupervisorOf(f) === s).length + SIWES_STUDENTS.filter((st) => itSupervisorOf(st) === s).length,
  });

  return (
    <div className="u-content">
      <PageHead title="Department Staff" sub={staff.length + " academic staff · Computer Science · workload across courses, advising and supervision"} />
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Lecturer</th><th className="u-right">Courses</th><th className="u-right">Advising</th><th className="u-right">Supervising</th><th>Workload</th></tr></thead>
            <tbody>
              {staff.map((s) => {
                const l = loadOf(s);
                const total = l.courses + l.advising + l.supervising;
                return (
                  <tr key={s}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={staffInitials(s)} size={30} /><span style={{ fontWeight: 500 }}>{s}</span></div></td>
                    <td className="u-right u-num">{l.courses}</td>
                    <td className="u-right u-num">{l.advising}</td>
                    <td className="u-right u-num">{l.supervising}</td>
                    <td><div className="u-bar" style={{ width: 120 }}><div className="u-bar__fill" style={{ width: Math.min(100, total * 10) + "%" }} /></div></td>
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

/* ---- level advisers: one per level, its own page ---- */
function HodAdvisers({ store, actions }) {
  const { STAFF_POOL } = window.ROLE_DATA;
  const levelAdviser = (lvl) => rstate(store, "hod", "levelAdviser", lvl, lvl === "300L" ? "Dr. C. Madu" : "Unassigned");
  const committed = Object.fromEntries(LEVELS.map((lvl) => [lvl, levelAdviser(lvl)]));
  const [draft, setDraft] = React.useState(committed);
  const dirty = JSON.stringify(draft) !== JSON.stringify(committed);
  return (
    <div className="u-content">
      <PageHead title="Level Advisers" sub="Computer Science · one adviser per level: approves course registrations and oversees that class" />
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Level</th><th>Adviser</th></tr></thead>
            <tbody>
              {LEVELS.map((lvl) => (
                <tr key={lvl}>
                  <td><Tag>{lvl}</Tag></td>
                  <td>
                    <select className="fb-input" style={{ minWidth: 220, padding: "7px 10px", borderColor: draft[lvl] === "Unassigned" ? "var(--danger)" : undefined }}
                      value={draft[lvl]} onChange={(e) => setDraft({ ...draft, [lvl]: e.target.value })}>
                      {STAFF_POOL.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-row u-wrap" style={{ gap: 10, marginTop: 12, alignItems: "center" }}>
        {dirty ? (
          <>
            <Btn variant="accent" icon="check" onClick={() => actions.roleActBulk("hod", "levelAdviser", draft)}>Save changes</Btn>
            <Btn variant="ghost" onClick={() => setDraft(committed)}>Discard</Btn>
            <span className="u-meta">Unsaved.</span>
          </>
        ) : (
          <span className="u-meta"><Icon name="info" size={13} /> Nothing to save.</span>
        )}
      </div>
    </div>
  );
}

/* ============ DEAN ============ */
/* every dept × level of the faculty, with its pipeline state */
function facultyLevels(store, facultyId) {
  const ORG = window.ORG;
  const fac = ORG.facultyById(facultyId) || ORG.FACULTIES[0];
  return fac.departments.flatMap((d) =>
    LEVELS.map((lvl) => ({ dept: { code: d.code, name: d.name }, level: lvl, pipe: levelPipeline(store, d.code, lvl) })));
}

/* every level of a single department, with its pipeline state: the EO's
   scope. Exams & Records is a departmental role in this system, same as
   HOD: one officer per department, not a university-wide registry. */
function deptLevels(store, deptCode, deptName) {
  return LEVELS.map((lvl) => ({ dept: { code: deptCode, name: deptName }, level: lvl, pipe: levelPipeline(store, deptCode, lvl) }));
}

function DeanDashboard({ store, go, roleCfg }) {
  const ORG = window.ORG;
  const fid = (roleCfg && roleCfg.facultyId) || "computing";
  const fac = ORG.facultyById(fid);
  const pending = facultyLevels(store, fid).filter((e) => myReviewTurn(e.pipe, "dean")).length;
  const totalStudents = fac.departments.reduce((s, d) => s + d.students, 0);
  const totalStaff = fac.departments.reduce((s, d) => s + d.staff, 0);
  const grad = Math.round(totalStudents * 0.16);
  const trend = semesterTrend(store, facultyLevels(store, fid));
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.dean} />
      <TrendLine trend={trend} />
      <StatCards items={[
        { icon: "building", k: "Departments", v: fac.departments.length, plain: true, onClick: () => go("dean-depts") },
        { icon: "user", k: "Faculty students", v: totalStudents.toLocaleString(), plain: true },
        { icon: "chart", k: "Levels to sign off", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("dean-results") },
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
  // derive a department's results status from its four level pipelines
  const deptStatus = (code) => {
    const pipes = LEVELS.map((lvl) => levelPipeline(store, code, lvl));
    if (pipes.some((p) => myReviewTurn(p, "dean"))) return { label: "Awaiting sign-off", tone: "warning" };
    if (pipes.every((p) => p.stage === "published")) return { label: "Released", tone: "success" };
    if (pipes.some((p) => p.stage === "ready" || p.stage === "published" || p.stage === "reviewing")) return { label: "Partly through", tone: "accent" };
    return { label: "Compiling", tone: undefined };
  };
  return (
    <div className="u-table-scroll">
      <table className="u-table">
        <thead><tr><th>Department</th><th>HOD</th><th className="u-right">Students</th><th className="u-right">Staff</th><th>Results</th></tr></thead>
        <tbody>
          {fac.departments.map((d) => {
            const st = deptStatus(d.code);
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
      <PageHead title="Departments" sub={fac.name + ": " + fac.departments.length + " departments"} />
      <Card className="u-pad"><DeanDeptRows facultyId={fid} store={store} /></Card>
    </div>
  );
}

/* reviewer-relevant stat chips: "presented to them in different ways on
   information important to them": same broadsheet, tailored headline numbers */
function reviewFocus(actorRole, rows) {
  const graded = rows.filter((r) => r.sgpa != null);
  const avg = graded.reduce((a, r) => a + r.sgpa, 0) / (graded.length || 1);
  const def = rows.filter((r) => !r.missedSemester && r.def).length;
  const cases = rows.filter((r) => r.missedSemester).length;
  if (actorRole === "hod") return [{ k: "Pass rate", v: Math.round((1 - def / (rows.length || 1)) * 100) + "%" }, { k: "Average GPA", v: avg.toFixed(2) }, { k: "Cases raised", v: cases }];
  if (actorRole === "dean") return [{ k: "Deficient students", v: def }, { k: "Open cases", v: cases }, { k: "Average GPA", v: avg.toFixed(2) }];
  return [{ k: "Students", v: rows.length }, { k: "Deficient", v: def }, { k: "Cases", v: cases }];
}

/* one quiet line for a dashboard header: this semester's pass rate + GPA
   against last semester, reusing the same session param levelCohort already
   supports. Deliberately not a stat card: it's a single glance, not a section. */
function passRateAndGpa(rows) {
  const graded = rows.filter((r) => r.sgpa != null);
  const avg = graded.reduce((a, r) => a + r.sgpa, 0) / (graded.length || 1);
  const def = rows.filter((r) => !r.missedSemester && r.def).length;
  return { passRate: rows.length ? Math.round((1 - def / rows.length) * 100) : 0, avg };
}
function semesterTrend(store, levelEntries) {
  const of = (session) => passRateAndGpa(levelEntries.flatMap(({ dept, level }) => levelCohort(dept, level, store, session).rows));
  const cur = of("cur"), prev = of("24b");
  return { cur, passDelta: cur.passRate - prev.passRate, gpaDelta: cur.avg - prev.avg };
}
function TrendLine({ trend }) {
  const arrow = (d) => d > 0 ? "▲" : d < 0 ? "▼" : "•";
  const tone = (d) => d > 0 ? "var(--success)" : d < 0 ? "var(--danger)" : "var(--fg-subtle)";
  return (
    <div className="u-row" style={{ gap: 6, marginBottom: 16, fontSize: 13 }}>
      <Icon name="chart" size={13} style={{ color: "var(--fg-subtle)" }} />
      <span className="u-meta">
        Pass rate {trend.cur.passRate}% <span style={{ color: tone(trend.passDelta) }}>{arrow(trend.passDelta)} {Math.abs(trend.passDelta)}pt</span>
        {" · "}Avg GPA {trend.cur.avg.toFixed(2)} <span style={{ color: tone(trend.gpaDelta) }}>{arrow(trend.gpaDelta)} {Math.abs(trend.gpaDelta).toFixed(2)}</span>
        {" "}vs last semester
      </span>
    </div>
  );
}

/* ============ STUDENT CASES: a standalone page, not tucked inside the
   broadsheot ============
   Deferment/absconded/suspended/DEX/teaching-practice are known at the start
   of a semester, not at result time — waiting for Exams & Records to compile
   a level before anyone can even see a case exists was the bug. This reuses
   the same rstate("levels","case",...) slot the broadsheet's condonement
   panel still reads, so nothing about disposition itself changes: only where
   it's visible and actionable. */
function deptCases(store, levelEntries) {
  return levelEntries.flatMap(({ dept, level }) =>
    levelCohort(dept, level, store, "cur").rows
      .filter((r) => r.missedSemester)
      .map((r) => ({ ...r, level, deptCode: dept.code, deptName: dept.name || dept.code })));
}
function caseInitials(name) { return name.split(" ").map((x) => x[0]).slice(0, 2).join(""); }

/* the type dropdown is local until Decline/Approve is actually clicked —
   changing it alone never writes anything */
function CaseRow({ r, store, canDecide, multiDept, decide }) {
  const rec = r.caseRec || { type: "Deferment", status: "flagged" };
  const [type, setType] = React.useState(rec.type);
  const { STUDENT } = window.DATA;
  // only the real demo student's Deferment case traces back to an actual
  // request with details/an attachment: synthetic cases are department-raised
  // with no origination form, so there's nothing to show for them
  const request = r.matric === STUDENT.matric && rec.type === "Deferment" ? store.deferment : null;
  const openRecord = () => window.showDetail("student", { name: r.name, matric: r.matric, level: r.level });
  return (
    <div className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
      <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
        <div style={{ cursor: "pointer" }} onClick={openRecord}><Avatar initials={caseInitials(r.name)} size={32} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="u-row u-wrap" style={{ gap: 6, alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer" }} onClick={openRecord}>{r.name}</span>
            <Tag>{r.level}</Tag>
            {multiDept && <Tag variant="accent">{r.deptName}</Tag>}
            <button type="button" className="fb-link" style={{ fontSize: 12 }} onClick={openRecord}>Academic record</button>
          </div>
          <div className="u-meta fb-mono">{r.matric}</div>
          {request && request.details && <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--fg-muted)", maxWidth: 420 }}>{request.details}</div>}
          {request && request.fileName && (
            <div className="u-row" style={{ gap: 6, marginTop: 4, color: "var(--fg-muted)" }}>
              <Icon name="doc" size={12} /> <span className="fb-mono" style={{ fontSize: 11.5 }}>{request.fileName}</span>
            </div>
          )}
        </div>
      </div>
      {!canDecide ? (
        rec.status === "approved" ? <Tag variant="accent" dot>Approved · {rec.type}</Tag>
          : rec.status === "declined" ? <Tag variant="danger" dot>Declined</Tag>
            : <Tag variant="warning" dot>Pending ({rec.type})</Tag>
      ) : rec.status === "flagged" ? (
        <div className="u-row" style={{ gap: 8, alignItems: "center" }}>
          <select className="fb-input" style={{ padding: "5px 8px", fontSize: 12.5 }} value={type} onChange={(e) => setType(e.target.value)}>
            {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Btn variant="secondary" size="sm" onClick={() => decide(r, type, "declined")}>Decline</Btn>
          <Btn variant="accent" size="sm" onClick={() => decide(r, type, "approved")}>Approve case</Btn>
        </div>
      ) : rec.status === "approved" ? (
        <Tag variant="accent" dot>Approved · {rec.type}</Tag>
      ) : (
        <Tag variant="danger" dot>Declined</Tag>
      )}
    </div>
  );
}

function StudentCasesScreen({ store, actions, title, scopeLabel, levelEntries, canDecide, multiDept }) {
  const allCases = React.useMemo(() => deptCases(store, levelEntries), [store, levelEntries]);
  const depts = multiDept ? [...new Set(allCases.map((r) => r.deptName))].sort() : [];
  const [deptFilter, setDeptFilter] = React.useState("all");
  const cases = deptFilter === "all" ? allCases : allCases.filter((r) => r.deptName === deptFilter);
  const open = cases.filter((r) => (r.caseRec || {}).status === "flagged");
  const pager = usePaged(cases, 15);
  const decide = (r, type, status) => actions.roleAct("levels", "case", levelKey(r.deptCode, r.level) + "|" + r.matric, { type, status });
  return (
    <div className="u-content">
      <PageHead title={title} sub={scopeLabel + " · " + cases.length + " case" + (cases.length === 1 ? "" : "s") + " this semester" + (open.length ? " · " + open.length + " awaiting disposition" : "")}>
        {multiDept && depts.length > 1 && (
          <select className="fb-input" style={{ maxWidth: 220, padding: "8px 10px" }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </PageHead>
      {cases.length === 0 ? (
        <Empty icon="check" title="No cases" sub="Deferment, absence, suspension and similar cases land here as soon as they're raised — no need to wait for results." />
      ) : (
        <Card className="u-pad">
          <div className="u-stack" style={{ gap: 8 }}>
            {pager.slice.map((r) => (
              <CaseRow key={r.deptCode + r.level + "|" + r.matric} r={r} store={store} canDecide={canDecide} multiDept={multiDept} decide={decide} />
            ))}
          </div>
          <Pagination pager={pager} label="cases" sizes={[15, 30, 60]} />
        </Card>
      )}
    </div>
  );
}

function HodStudentCases({ store, actions }) {
  return <StudentCasesScreen store={store} actions={actions} title="Student Cases" scopeLabel="Computer Science" canDecide
    levelEntries={LEVELS.map((lvl) => ({ dept: { code: "CSC", name: "Computer Science" }, level: lvl }))} />;
}
function DeanStudentCases({ store, roleCfg }) {
  const fac = window.ORG.facultyById((roleCfg && roleCfg.facultyId) || "computing");
  return <StudentCasesScreen store={store} title="Student Cases" scopeLabel={fac.name} multiDept
    levelEntries={facultyLevels(store, (roleCfg && roleCfg.facultyId) || "computing")} />;
}

/* which dept×level entries this role can act on right now, and at what scope.
   hod → their one department; dean → their faculty; anything else a custom
   workflow stage might name → the whole university (they don't own a
   faculty/department in this data model). */
function reviewScope(store, role, roleCfg) {
  if (role === "hod") {
    return { scopeLabel: "Computer Science", entries: LEVELS.map((lvl) => ({ dept: { code: "CSC", name: "Computer Science" }, level: lvl, pipe: levelPipeline(store, "CSC", lvl) })) };
  }
  if (role === "dean") {
    const fid = (roleCfg && roleCfg.facultyId) || "computing";
    const fac = window.ORG.facultyById(fid);
    return { scopeLabel: fac.name, entries: facultyLevels(store, fid) };
  }
  const departments = window.ORG.FACULTIES.flatMap((f) => f.departments.map((d) => ({ code: d.code, name: d.name + " · " + f.short })));
  return { scopeLabel: "University-wide", entries: departments.flatMap((d) => LEVELS.map((lvl) => ({ dept: d, level: lvl, pipe: levelPipeline(store, d.code, lvl) }))) };
}
function myReviewTurn(pipe, role) {
  return pipe.stage === "reviewing" && pipe.stages[pipe.reviewIndex] && pipe.stages[pipe.reviewIndex].actorRole === role;
}

/* shared review-queue screen, reused by every role a workflow stage can name:
   HOD and Dean by default, or anyone ICT assigns a custom stage to. */
function LevelReviewQueue({ store, actions, role, roleCfg }) {
  const { scopeLabel, entries } = reviewScope(store, role, roleCfg);
  const myTurn = entries.filter((e) => myReviewTurn(e.pipe, role));
  // one screen: everything in scope, sorted so what's actually awaiting this
  // role floats to the top: no separate "browse" page needed alongside it
  const all = [...myTurn, ...entries.filter((e) => !myReviewTurn(e.pipe, role))];
  const [open, setOpen] = React.useState(null);
  const pageTitle = role === "dean" ? "School Board Approvals" : role === "hod" ? "Result Review" : "Result Reviews";

  if (open) {
    const stageNow = (p) => (p.stages[p.reviewIndex] || {}).label || "review";
    return <LevelBroadsheet store={store} actions={actions} viewerRole={role}
      departments={[open.dept]} initialLevel={open.level} lockLevel showCases
      subtitle={scopeLabel + " · " + stageNow(levelPipeline(store, open.dept.code, open.level))}
      onBack={() => setOpen(null)} backLabel="Back to level results"
      pipelineAction={(pipe, dept, level, rows) => {
        if (myReviewTurn(pipe, role)) {
          const chips = reviewFocus(role, rows);
          return (
            <div className="u-stack" style={{ gap: 10 }}>
              <div className="u-row u-wrap" style={{ gap: 8 }}>
                {chips.map((c) => <Tag key={c.k} variant="accent">{c.k}: {c.v}</Tag>)}
              </div>
              <div className="u-meta">Approving moves this level to the next stage in the configured workflow (or Senate, if this is the last one). Returning sends it back to Exams &amp; Records for correction. Resolve any student cases below first.</div>
              <div className="u-row u-wrap" style={{ gap: 8, alignItems: "flex-start" }}>
                <Btn variant="accent" icon="check" onClick={() => { actions.reviewStageDecide(pipe.key, dept.name + " " + level, true); setOpen(null); }}>Approve · {stageNow(pipe)}</Btn>
                <ReturnWithNote label="Return to Exams & Records" placeholder="What does Exams & Records need to correct before this comes back?"
                  onConfirm={(note) => { actions.reviewStageDecide(pipe.key, dept.name + " " + level, false, note); setOpen(null); }} />
              </div>
            </div>
          );
        }
        return pipe.stage === "ready"
          ? <div className="u-meta"><Icon name="check" size={13} /> Cleared every review stage: ratified by Senate, now with Exams &amp; Records for release.</div>
          : pipe.stage === "reviewing"
            ? <div className="u-meta"><Icon name="info" size={13} /> Currently with {stageNow(pipe)}: not your stage.</div>
            : null;
      }} />;
  }

  return (
    <div className="u-content">
      <PageHead title={pageTitle} sub={scopeLabel + " · " + all.length + " level" + (all.length === 1 ? "" : "s") + " · " + myTurn.length + " awaiting your review"} />
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Department</th><th>Level</th><th>Stage</th><th className="u-right">Action</th></tr></thead>
            <tbody>
              {all.length === 0
                ? <tr><td colSpan={4}><Empty icon="check" title="Nothing here yet" sub="Levels compiled and pushed for scrutiny by Exams & Records will appear here." /></td></tr>
                : all.map((e) => {
                  const mine = myReviewTurn(e.pipe, role);
                  const meta = LEVEL_STAGE_META[e.pipe.stage] || LEVEL_STAGE_META.compiling;
                  const stageLabel = e.pipe.stage === "reviewing" ? e.pipe.stages[e.pipe.reviewIndex].label : meta.label;
                  return (
                    <tr key={e.pipe.key}>
                      <td style={{ fontWeight: 600 }}>{e.dept.name}</td>
                      <td><Tag>{e.level}</Tag></td>
                      <td><Tag variant={mine ? "accent" : meta.tone} dot>{stageLabel}</Tag></td>
                      <td className="u-right">
                        {mine
                          ? <Btn variant="accent" size="sm" iconRight="chevron" onClick={() => setOpen({ dept: e.dept, level: e.level })}>Review broadsheet</Btn>
                          : <Btn variant="secondary" size="sm" iconRight="chevron" onClick={() => setOpen({ dept: e.dept, level: e.level })}>View</Btn>}
                      </td>
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
            <div className="u-table-scroll">
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

/* ============ LEVEL BROADSHEET (shared: HOD / Dean / Exams) ============ */
/* the master sheet: every student in a level, every course grade, TNU/TCP/GPA/CGPA/remarks */
const GP_MAP = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
function bsHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
const gradeOfScore = (t) => (t >= 70 ? "A" : t >= 60 ? "B" : t >= 50 ? "C" : t >= 45 ? "D" : t >= 40 ? "E" : "F");

function levelCourses(deptCode, level) {
  // the demo department/level uses the real course list so it matches everything else
  if (deptCode === "CSC" && level === "300L") {
    return window.DATA.COURSES.map((c) => ({ code: c.code, units: c.units, core: c.type === "Core" || c.type === "Carryover" }));
  }
  const lvl = parseInt(level);
  const h = bsHash(deptCode + level);
  return Array.from({ length: 7 }, (_, i) => ({
    code: deptCode + " " + (lvl + 1 + i * 2),
    units: 2 + ((h + i) % 2),
    core: i < 5,
  }));
}

/* one broadsheet row in the manual-sheet format:
   P* = previous (before this semester), S* = this semester, T/C* = cumulative.
   xCT credits total · xCP credits passed · xGP grade points · GPA = GP/CT. */
function bsRow(base, semCourses, prev) {
  const sct = semCourses.reduce((a, g) => a + (g.grade ? g.units : 0), 0);
  const scp = semCourses.reduce((a, g) => a + (g.grade && g.grade !== "F" ? g.units : 0), 0);
  const sgp = semCourses.reduce((a, g) => a + (g.grade ? GP_MAP[g.grade] * g.units : 0), 0);
  const failed = semCourses.filter((g) => g.grade === "F").map((g) => g.code + "(" + g.units + ")");
  // a case (missed the whole semester) is excluded from this semester's GPA entirely :
  // their cumulative figures simply carry forward unchanged
  const excluded = !!base.missedSemester;
  const tct = prev.pct + (excluded ? 0 : sct), tcp = prev.pcp + (excluded ? 0 : scp), cgp = prev.pgp + (excluded ? 0 : sgp);
  const missingCodes = base.missingCodes || [];
  return {
    ...base, grades: semCourses,
    ...prev,
    sct, scp, sgp, sgpa: excluded ? null : sgp / (sct || 1),
    tct, tcp, cgp, cgpa: cgp / (tct || 1),
    failed, missingCodes,
    def: !excluded && (failed.length > 0 || prev.outstanding.length > 0),
    defList: [...failed, ...prev.outstanding],
  };
}

function generatedRecord({ matric, level, cgpa }) {
  const completedTerms = Math.max(0, (parseInt(level, 10) / 100 - 1) * 2);
  const target = Number(cgpa) || 3;
  const rows = Array.from({ length: completedTerms }, (_, i) => {
    const variance = ((bsHash(matric + "gpa" + i) % 81) - 40) / 100;
    return {
      tnu: 16 + (bsHash(matric + "units" + i) % 8),
      gpa: Math.min(5, Math.max(0.6, target + variance)),
    };
  });
  const carryovers = bsHash(matric + "carry") % 7 === 0
    ? [{ code: "GST " + (100 + (bsHash(matric) % 4) * 100 + 2), status: "outstanding" }]
    : [];
  return { rows, carryovers };
}

function demoStudentRecord() {
  const results = window.DATA.RESULTS || [];
  return {
    rows: results.map((result) => ({
      tnu: result.courses.reduce((sum, course) => sum + course.units, 0),
      gpa: result.gpa,
    })),
    carryovers: results.flatMap((result) => result.courses)
      .filter((course) => course.grade === "F")
      .map((course) => ({ code: course.code, status: "outstanding" })),
  };
}

function levelCohort(dept, level, store, session) {
  session = session || "cur";
  const { genName, HOD_RESULTS } = window.ROLE_DATA;
  const courses = levelCourses(dept.code, level);
  // courses whose lecturer-submitted sheet hasn't cleared Exams & Records yet :
  // no student sees a grade for these until the sheet is approved, even though
  // the level itself is still "provisional" as a whole
  const unapprovedCodes = (dept.code === "CSC" && level === "300L" && session === "cur")
    ? courses.filter((c) => {
        const seed = HOD_RESULTS.find((r) => r.code === c.code);
        return seed && rstate(store, "eo", "result", c.code, seed.baseStatus) !== "approved";
      }).map((c) => c.code)
    : [];
  const h0 = bsHash(dept.code + level + (session === "cur" ? "" : session));
  const count = 26 + (h0 % 30);
  const entryYear = 2026 - parseInt(level) / 100;
  const rows = [];
  for (let i = 0; i < count; i++) {
    const name = genName((h0 % 200) + i);
    const matric = "FUT/" + entryYear + "/" + dept.code + "/" + (10000 + (h0 % 700) + i * 3);
    const ability = 35 + (bsHash(matric) % 50);
    const key = levelKey(dept.code, level);
    // a few students miss the whole semester (deferment / absence / suspension / DE-exempt / TP)
    const missedSemester = bsHash(matric + "miss") % 19 === 0;
    const suggestedCase = CASE_TYPES[bsHash(matric + "case") % CASE_TYPES.length];
    const caseRec = missedSemester ? (rstate(store, "levels", "case", key + "|" + matric, null) || { type: suggestedCase, status: "flagged" }) : null;
    // and a few have one score never submitted by the lecturer (incomplete record)
    const missingCourseIdx = !missedSemester && bsHash(matric + "inc") % 23 === 0 ? bsHash(matric + "which") % courses.length : -1;
    let semCourses = courses.map((c, ci) => {
      if (unapprovedCodes.includes(c.code)) return { code: c.code, units: c.units, grade: null, pending: true };
      if (missedSemester) return { code: c.code, units: c.units, grade: null };
      if (ci === missingCourseIdx) return { code: c.code, units: c.units, grade: null, missing: true };
      if (!c.core && bsHash(matric + c.code + "on") % 5 === 0) return { code: c.code, units: c.units, grade: null };
      const score = Math.max(18, Math.min(95, ability - 15 + (bsHash(matric + c.code) % 31)));
      let grade = gradeOfScore(score);
      // condonement: a borderline failure (38-39) can be condoned to a pass during review
      const condoned = grade === "F" && score >= 38 && rstate(store, "levels", "condone", key + "|" + matric + "|" + c.code, false);
      if (condoned) grade = "E";
      return { code: c.code, units: c.units, grade, score, condoned };
    });
    // EO correction: a result entry can be struck from a student's record entirely
    // (e.g. uploaded against a student who never registered for that course)
    semCourses = semCourses.map((g) => rstate(store, "levels", "removed", key + "|" + matric + "|" + g.code, false)
      ? { code: g.code, units: g.units, grade: null, removed: true } : g);
    // previous record from the same generator the record popup uses, so the numbers agree
    const drift = ((bsHash(matric + "cg") % 100) / 100 - 0.5) * 0.8;
    const sgpaGuess = semCourses.reduce((a, g) => a + (g.grade ? GP_MAP[g.grade] * g.units : 0), 0) / (semCourses.reduce((a, g) => a + (g.grade ? g.units : 0), 0) || 1);
    const target = Math.min(5, Math.max(0.6, sgpaGuess + drift));
    const hist = generatedRecord({ matric, level, cgpa: target.toFixed(2) });
    const pct = hist.rows.reduce((a, r) => a + r.tnu, 0);
    const pgp = hist.rows.reduce((a, r) => a + Math.round(r.gpa * r.tnu), 0);
    const outstanding = hist.carryovers.filter((c) => c.status !== "cleared").map((c) => c.code + "(3)");
    rows.push(bsRow({
      name, matric, pcgpaTarget: target, missedSemester, caseRec,
      missingCodes: semCourses.filter((g) => g.missing).map((g) => g.code),
    }, semCourses, {
      pct, pcp: pct - outstanding.length * 3, pgp, pcgpa: pct ? pgp / pct : 0, outstanding,
    }));
  }
  // the demo student joins her real cohort with her actual current-semester scores
  if (session === "cur" && dept.code === "CSC" && level === "300L" && window.currentResults) {
    const cur = window.currentResults(store);
    const { STUDENT } = window.DATA;
    const real = demoStudentRecord();
    const pct = real.rows.reduce((a, r) => a + r.tnu, 0);
    const pgp = real.rows.reduce((a, r) => a + Math.round(r.gpa * r.tnu), 0);
    const outstanding = real.carryovers
      .filter((c) => !cur.courses.some((x) => x.code === c.code && x.grade !== "F"))
      .map((c) => c.code + "(3)");
    const meKey = levelKey(dept.code, level);
    const semCourses = courses.map((c) => {
      if (rstate(store, "levels", "removed", meKey + "|" + STUDENT.matric + "|" + c.code, false)) return { code: c.code, units: c.units, grade: null, removed: true };
      if (unapprovedCodes.includes(c.code)) return { code: c.code, units: c.units, grade: null, pending: true };
      const g = cur.courses.find((x) => x.code === c.code);
      return g ? { code: c.code, units: c.units, grade: g.grade, score: g.score } : { code: c.code, units: c.units, grade: null };
    });
    // a real deferment request the adviser approved writes into this same slot :
    // the demo student only shows as a "case" once that's actually happened
    const meCaseRec = rstate(store, "levels", "case", meKey + "|" + STUDENT.matric, null);
    rows.unshift(bsRow({ name: STUDENT.name, matric: STUDENT.matric, me: true, missedSemester: !!meCaseRec, caseRec: meCaseRec }, semCourses, {
      pct, pcp: pct - real.carryovers.length * 3, pgp, pcgpa: pct ? pgp / pct : 0, outstanding,
    }));
  }
  return { courses, rows };
}

const LEVELS = ["100L", "200L", "300L", "400L", "500L"];
const BS_SESSIONS = [
  { id: "cur", label: "2025/2026 · First Semester" },
  { id: "24b", label: "2024/2025 · Second Semester" },
  { id: "24a", label: "2024/2025 · First Semester" },
];
const BS_GRADE_COLOR = { A: "var(--success)", F: "var(--danger)" };

/* ---- level result pipeline: Exams & Records approves each lecturer-submitted
   course sheet and compiles the level, which then walks a review chain that
   ICT configures (zero or more stages, any role, any order: schools differ) :
   ratified by Senate: then Exams & Records releases it to students. */
const LEVEL_STAGE_META = {
  compiling: { label: "With Exams & Records", tone: "warning" },
  reviewing: { label: "In review", tone: "accent" },
  ready: { label: "Senate-approved", tone: "accent" },
  published: { label: "Released", tone: "success" },
};
const DEFAULT_WORKFLOW = [{ id: "st-hod", actorRole: "hod", label: "HOD Review" }, { id: "st-dean", actorRole: "dean", label: "School Board (Dean)" }];

/* student cases: a student can be absent from a semester's computation entirely
   (not failed courses: never sat them), for one of these reasons. Raised at
   department level, disposed during review before condonement can proceed on
   anything else in that record. */
const CASE_TYPES = ["Deferment", "Absconded", "Suspended", "Direct Entry Exemption", "Teaching Practice"];
const CASE_LABEL = { Deferment: "DEFR", Absconded: "ABSC", Suspended: "SUSP", "Direct Entry Exemption": "DEX", "Teaching Practice": "TP" };

/* the flow strip is built from whatever stages are currently configured, so it
   never assumes a fixed hierarchy */
function flowLabels(pipe) {
  return ["EO compile", ...pipe.stages.map((s) => s.label), "Senate", "Released"];
}
function levelFlowIndex(pipe) {
  const n = pipe.stages.length;
  if (pipe.stage === "published") return n + 3;
  if (pipe.stage === "ready") return n + 2;
  if (pipe.stage === "reviewing") return 1 + pipe.reviewIndex;
  return 0;
}
function levelKey(deptCode, level) { return deptCode + "-" + level; }

function levelPipeline(store, deptCode, level, session) {
  session = session || "cur";
  const key = levelKey(deptCode, level) + (session === "cur" ? "" : "|" + session);
  const courses = levelCourses(deptCode, level);
  const stages = (store.workflow && store.workflow.stages) || DEFAULT_WORKFLOW;
  if (session !== "cur") {
    // archived sessions: already fully released, read-only
    const sheets = courses.map((c) => ({ code: c.code, status: "approved" }));
    return { key, sheets, complete: true, stage: "published", reviewIndex: 0, stages, pendingCodes: [], archived: true };
  }
  let sheets, baseStage, baseReviewIndex = 0;
  if (deptCode === "CSC" && level === "300L") {
    // the live demo level: sheet states come from the real EO queue
    sheets = courses.map((c) => {
      const seed = window.ROLE_DATA.HOD_RESULTS.find((r) => r.code === c.code);
      return { code: c.code, status: seed ? rstate(store, "eo", "result", c.code, seed.baseStatus) : "approved" };
    });
    baseStage = "compiling";
  } else {
    const h = bsHash(key + "stage");
    baseStage = ["compiling", "compiling", "reviewing", "ready", "published"][h % 5];
    if (baseStage === "reviewing") baseReviewIndex = stages.length ? h % stages.length : 0;
    sheets = courses.map((c, i) => ({
      code: c.code,
      status: baseStage === "compiling" && i % 3 === 2 ? "pending" : "approved",
    }));
  }
  const complete = sheets.every((s) => s.status === "approved");
  const stage = rstate(store, "levels", "stage", key, baseStage);
  const reviewIndex = rstate(store, "levels", "reviewIndex", key, baseReviewIndex);
  return { key, sheets, complete, stage, reviewIndex, stages, pendingCodes: sheets.filter((s) => s.status !== "approved").map((s) => s.code) };
}

/* compliance & condonement: automatic checks on the compiled level, with
   borderline failures (38-39) condonable during School Board review */
/* the RMKS cell: case (missed the whole semester) takes priority, then
   incomplete (a score never submitted), then the ordinary IGS/DEF split */
function RemarkCell({ r }) {
  if (r.missedSemester) {
    const rec = r.caseRec || { type: "Deferment", status: "flagged" };
    if (rec.status === "approved") return <Tag variant="accent" dot>{CASE_LABEL[rec.type]}</Tag>;
    if (rec.status === "declined") return <Tag variant="danger" dot>Case declined · DEF</Tag>;
    return <Tag variant="warning" dot>Case pending ({rec.type})</Tag>;
  }
  if (r.missingCodes && r.missingCodes.length > 0) {
    return <span className="u-row" style={{ gap: 6, flexWrap: "wrap" }}><Tag variant="warning" dot>INC</Tag><span className="fb-mono u-meta" style={{ fontSize: 11 }}>{r.missingCodes.join(", ")}</span>{r.def && <Tag variant="danger" dot>DEF</Tag>}</span>;
  }
  return r.def
    ? <span className="u-row" style={{ gap: 6 }}><Tag variant="danger" dot>DEF</Tag><span className="fb-mono u-meta" style={{ fontSize: 11 }}>{r.defList.join(", ")}</span></span>
    : <Tag variant="success" dot>IGS</Tag>;
}

/* condonement stays here: it needs computed scores, which only exist once
   Exams & Records has compiled the level. Case disposition itself now lives
   on the standalone Student Cases page (deptCases/StudentCasesScreen above)
   — this card only references it, so a reviewer isn't left wondering where
   a case with no F's on this page went. */
function CondonementCard({ store, actions, pipe, rows }) {
  const cases = rows.filter((r) => r.missedSemester);
  const openCases = cases.filter((r) => (r.caseRec || {}).status === "flagged");
  const borderline = [];
  rows.forEach((r) => r.grades.forEach((g) => {
    if (g.grade === "F" && g.score >= 38) borderline.push({ matric: r.matric, name: r.name, code: g.code, score: g.score });
    if (g.condoned) borderline.push({ matric: r.matric, name: r.name, code: g.code, score: g.score, condoned: true });
  }));
  if (cases.length === 0 && borderline.length === 0) return null;
  return (
    <Card className="u-pad" style={{ marginBottom: 16 }}>
      {cases.length > 0 && (
        <div className="u-row" style={{ gap: 9, marginBottom: borderline.length ? 14 : 0, paddingBottom: borderline.length ? 14 : 0, borderBottom: borderline.length ? "1px solid var(--border)" : "none" }}>
          <Icon name="info" size={14} style={{ color: openCases.length ? "var(--warning)" : "var(--fg-subtle)" }} />
          <span style={{ fontSize: 13 }}>
            {cases.length} student case{cases.length === 1 ? "" : "s"} on this level
            {openCases.length ? " · " + openCases.length + " still awaiting disposition" : " · all resolved"}
            {" — decided from the Student Cases page, not here."}
          </span>
        </div>
      )}
      {borderline.length > 0 && (
        <div className="u-stack" style={{ gap: 6 }}>
          <div className="u-meta" style={{ fontWeight: 600 }}>Borderline failures (38-39) eligible for condonement</div>
          {borderline.map((b, i) => (
            <div key={i} className="u-row u-wrap" style={{ gap: 10, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
              <div className="u-row" style={{ gap: 8, minWidth: 0 }}>
                <span className="fb-mono" style={{ fontSize: 12, fontWeight: 600 }}>{b.code}</span>
                <span style={{ fontSize: 13 }}>{b.name}</span>
                <span className="u-meta fb-mono">{b.matric}</span>
                <Tag variant="danger">{b.score}/100</Tag>
              </div>
              {b.condoned
                ? <Tag variant="success" dot>Condoned to E</Tag>
                : openCases.length > 0
                  ? <Tag variant="warning" dot>Blocked on open cases</Tag>
                  : <Btn variant="secondary" size="sm" onClick={() => actions.roleAct("levels", "condone", pipe.key + "|" + b.matric + "|" + b.code, true)}>Condone to pass</Btn>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LevelBroadsheet({ store, actions, departments, subtitle, initialLevel, lockLevel, onBack, backLabel, pipelineAction, showCases, viewerRole }) {
  const [deptCode, setDeptCode] = React.useState(departments[0].code);
  const [level, setLevel] = React.useState(initialLevel || "300L");
  const [session, setSession] = React.useState("cur");
  const [q, setQ] = React.useState("");
  const dept = departments.find((d) => d.code === deptCode) || departments[0];
  const { courses, rows } = React.useMemo(() => levelCohort(dept, level, store, session), [dept.code, level, store, session]);
  const pipe = levelPipeline(store, dept.code, level, session);
  // nobody outside Exams & Records sees grades for a level still compiling :
  // they only learn it exists and how far along it is, via the pipeline card
  const restricted = viewerRole && viewerRole !== "exams" && pipe.stage === "compiling" && !pipe.archived;
  const flowIdx = levelFlowIndex(pipe);
  const stageMeta = LEVEL_STAGE_META[pipe.stage] || LEVEL_STAGE_META.compiling;
  const query = q.trim().toLowerCase();
  const filteredRows = rows.filter((r) => !query || r.name.toLowerCase().includes(query) || r.matric.toLowerCase().includes(query));
  const pager = usePaged(filteredRows, 15);
  const graded = rows.filter((r) => r.sgpa != null);
  const avgGpa = graded.reduce((a, r) => a + r.sgpa, 0) / (graded.length || 1);
  const cases = rows.filter((r) => r.missedSemester).length;
  const igs = rows.filter((r) => !r.missedSemester && !r.def).length;
  const def = rows.filter((r) => !r.missedSemester && r.def).length;
  const sessionLabel = (BS_SESSIONS.find((s) => s.id === session) || BS_SESSIONS[0]).label;

  return (
    <div className="u-content">
      {onBack && (
        <div style={{ marginBottom: 14 }}>
          <button className="u-filelink" onClick={onBack}><Icon name="arrowLeft" size={14} /> {backLabel || "Back"}</button>
        </div>
      )}
      <PageHead title="Level Results" sub={subtitle + " · " + dept.name + " · " + level + " · " + sessionLabel}>
        <select className="fb-input" style={{ maxWidth: 240, padding: "8px 10px" }} value={session} onChange={(e) => setSession(e.target.value)}>
          {BS_SESSIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {departments.length > 1 && (
          <select className="fb-input" style={{ maxWidth: 230, padding: "8px 10px" }} value={deptCode} onChange={(e) => setDeptCode(e.target.value)}>
            {departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        )}
        {!lockLevel && <Seg value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l }))} />}
        <Btn variant="secondary" icon="print" onClick={() => window.printRegion()}>Print broadsheet</Btn>
      </PageHead>

      {pipe.archived ? (
        <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
          <div className="u-row" style={{ gap: 9 }}>
            <Icon name="check" size={14} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: 13 }}>Archived session: released and read-only.</span>
          </div>
        </Card>
      ) : (
        <>
          {/* pipeline: where this level's results sit in the approval flow */}
          <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
            <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center", justifyContent: "space-between" }}>
              <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
                <span className="u-meta" style={{ fontWeight: 600 }}>Result flow:</span>
                {flowLabels(pipe).map((s, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}
                    <Tag variant={i < flowIdx ? "success" : i === flowIdx ? "accent" : undefined}>{s}</Tag>
                  </React.Fragment>
                ))}
              </div>
              <Tag variant={stageMeta.tone} dot>{stageMeta.label}</Tag>
            </div>
            {pipe.stage === "compiling" && (
              <>
                <div className="u-row u-wrap" style={{ gap: 6, marginTop: 12 }}>
                  {pipe.sheets.map((sh) => (
                    <Tag key={sh.code} variant={sh.status === "approved" ? "success" : "warning"} dot>{sh.code}</Tag>
                  ))}
                </div>
                <div className="u-meta" style={{ marginTop: 8 }}>
                  {pipe.complete
                    ? "All " + pipe.sheets.length + " course sheets are HOD-approved. The broadsheet is complete."
                    : (pipe.sheets.length - pipe.pendingCodes.length) + " of " + pipe.sheets.length + " course sheets approved · awaiting " + pipe.pendingCodes.join(", ") + ". GPA and remarks below are provisional until every sheet is in."}
                </div>
              </>
            )}
            {cases > 0 && <div className="u-meta" style={{ marginTop: 8 }}><Icon name="info" size={12} /> {cases} student case{cases > 1 ? "s" : ""} on this level{showCases ? "" : ": reviewed at School Board"}.</div>}
            {pipelineAction && <div style={{ marginTop: 12 }}>{pipelineAction(pipe, dept, level, rows)}</div>}
          </Card>

          {showCases && !restricted && <CondonementCard store={store} actions={actions} pipe={pipe} rows={rows} />}
        </>
      )}

      {restricted ? (
        <Card className="u-pad">
          <Empty icon="clock" title="Not compiled yet" sub="Exams & Records hasn't pushed this level for scrutiny yet: it isn't visible outside Exams & Records until every course sheet is approved and pushed." />
        </Card>
      ) : (
      <>
      <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
        <Card className="u-pad"><div className="u-stat__k">Students</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{rows.length}</div></Card>
        <Card className="u-pad"><div className="u-stat__k">Average GPA</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{avgGpa.toFixed(2)}</div></Card>
        <Card className="u-pad"><div className="u-stat__k">In good standing</div><div className="u-h2 u-num" style={{ marginTop: 6 }}>{igs}<span className="u-meta" style={{ fontWeight: 400 }}> / {rows.length}</span></div></Card>
        <Card className="u-pad"><div className="u-stat__k">Deficient / cases</div><div className="u-h2 u-num" style={{ marginTop: 6, color: (def + cases) ? "var(--danger)" : undefined }}>{def}<span className="u-meta" style={{ fontWeight: 400 }}> + {cases} case{cases === 1 ? "" : "s"}</span></div></Card>
      </div>

      <Card className="u-print-area">
        <div className="u-pad" style={{ paddingBottom: 0 }}>
          <div className="u-h3">Broadsheet</div>
          <div className="u-meta" style={{ marginTop: 2 }}>One row per student, one column per course. Click a row for that student's full academic record. Hover a grade for the score.</div>
        </div>
        <div className="u-table-toolbar u-no-print">
          <label className="u-stack u-table-search" style={{ gap: 5 }}>
            <span className="u-meta">Search broadsheet</span>
            <input className="fb-input" placeholder="Student name or matric number" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <span className="u-meta">{filteredRows.length} of {rows.length} students</span>
        </div>
        <div className="u-table-scroll">
          <table className="u-table" style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th>Matric</th><th>Student</th>
                {courses.map((c) => <th key={c.code} className="u-right" title={c.units + " units"}><span className="fb-mono" style={{ fontSize: 11 }}>{c.code}({c.units})</span></th>)}
                <th className="u-right" title="Previous credits total">PCT</th>
                <th className="u-right" title="Previous credits passed">PCP</th>
                <th className="u-right" title="Previous grade points">PGP</th>
                <th className="u-right" title="Previous CGPA">PCGPA</th>
                <th className="u-right" title="Semester credits total">SCT</th>
                <th className="u-right" title="Semester credits passed">SCP</th>
                <th className="u-right" title="Semester grade points">SGP</th>
                <th className="u-right" title="Semester GPA">SGPA</th>
                <th className="u-right" title="Total credits total">TCT</th>
                <th className="u-right" title="Total credits passed">TCP</th>
                <th className="u-right" title="Cumulative grade points">CGP</th>
                <th className="u-right" title="Cumulative GPA">CGPA</th>
                <th>RMKS</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((r) => (
                <tr key={r.matric} style={{ cursor: "pointer" }} onClick={() => {
                  const cg = r.me ? window.DATA.STUDENT.cgpa : (r.pct > 0 ? r.pcgpa : (r.sgpa != null ? r.sgpa : 0));
                  window.showDetail("student", { name: r.name, matric: r.matric, level, cgpa: cg.toFixed(2) });
                }}>
                  <td className="fb-mono" style={{ fontSize: 11.5 }}>{r.matric}</td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  {r.grades.map((g) => (
                    <td key={g.code} className="u-right">
                      {g.grade
                        ? <span className="fb-mono" title={g.score + "/100" + (g.condoned ? " · condoned" : "")} style={{ fontWeight: 600, color: g.condoned ? "var(--warning)" : BS_GRADE_COLOR[g.grade] || "inherit" }}>{g.grade}{g.condoned ? "*" : ""}</span>
                        : <span className="u-muted" title={g.removed ? "removed by Exams & Records" : g.pending ? "sheet awaiting Exams & Records approval" : g.missing ? "not yet submitted" : ""}>{g.removed ? "×" : g.pending ? "…" : "–"}</span>}
                    </td>
                  ))}
                  {r.pct > 0
                    ? <>
                        <td className="u-right u-num">{r.pct}</td>
                        <td className="u-right u-num">{r.pcp}</td>
                        <td className="u-right u-num">{r.pgp}</td>
                        <td className="u-right u-num">{r.pcgpa.toFixed(2)}</td>
                      </>
                    : <><td className="u-right u-muted">–</td><td className="u-right u-muted">–</td><td className="u-right u-muted">–</td><td className="u-right u-muted">–</td></>}
                  <td className="u-right u-num">{r.sct}</td>
                  <td className="u-right u-num">{r.scp}</td>
                  <td className="u-right u-num">{r.sgp}</td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{r.sgpa != null ? r.sgpa.toFixed(2) : "Not available"}</td>
                  <td className="u-right u-num">{r.tct}</td>
                  <td className="u-right u-num">{r.tcp}</td>
                  <td className="u-right u-num">{r.cgp}</td>
                  <td className="u-right u-num" style={{ fontWeight: 700 }}>{r.cgpa.toFixed(2)}</td>
                  <td><RemarkCell r={r} /></td>
                </tr>
              ))}
              {pager.slice.length === 0 && <tr><td colSpan={courses.length + 15}><Empty title="No matching students" sub="Search by student name or matric number." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[15, 30, 60]} />
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>
        P/S/T: previous · this semester · total (cumulative) &nbsp;·&nbsp; CT credits total · CP credits passed · GP grade points · GPA = GP ÷ CT on a 5.00 scale &nbsp;·&nbsp; RMKS: <strong>IGS</strong> in good standing · <strong>DEF</strong> deficient, with outstanding courses and their units listed · <strong>INC</strong> incomplete, a score not yet submitted · <strong>DEFR/ABSC/SUSP/DEX/TP</strong> student case (deferment, absconded, suspended, direct-entry exemption, teaching practice) · <strong>*</strong> condoned.
      </div>
      </>
      )}
    </div>
  );
}

function ExamsLevelResults({ store, actions }) {
  const mode = (store.session && store.session.releaseMode) || "batch";
  const pubc = (store.roles && store.roles.exams && store.roles.exams.pubc) || {};
  return <LevelBroadsheet store={store} actions={actions} subtitle="Department records"
    departments={[{ code: "CSC", name: "Computer Science" }]}
    pipelineAction={(pipe, dept, level) => {
      // nobody outside Exams & Records sees this level until it's pushed :
      // that push is a deliberate choice here, not automatic
      if (pipe.stage === "compiling") {
        if (level !== "300L") return null;
        const reviewNote = (store.roles && store.roles.levels && store.roles.levels.reviewNote && store.roles.levels.reviewNote[pipe.key]) || "";
        return (
          <div className="u-stack" style={{ gap: 6 }}>
            {pipe.complete ? (
              <div className="u-row u-wrap" style={{ gap: 10, alignItems: "center" }}>
                <Btn variant="accent" icon="check" onClick={() => actions.eoPresentLevel(pipe.key, dept.name + " " + level)}>Push for scrutiny</Btn>
                <span className="u-meta">Every course sheet is approved. HOD{(store.workflow && store.workflow.stages && store.workflow.stages.length) ? " and the rest of the configured workflow" : ""} won't see this level until you push it.</span>
              </div>
            ) : (
              <div className="u-meta">
                <Icon name="info" size={13} /> Waiting on course sheets under Courses before this can be pushed for scrutiny.
              </div>
            )}
            {reviewNote && (
              <div className="u-formerr">
                <Icon name="info" size={14} />
                <span>Returned by a reviewer: “{reviewNote}”</span>
              </div>
            )}
          </div>
        );
      }
      if (pipe.stage === "reviewing") {
        return (
          <div className="u-meta">
            <Icon name="info" size={13} /> Currently with {pipe.stages[pipe.reviewIndex] ? pipe.stages[pipe.reviewIndex].label : "a reviewer"}.
          </div>
        );
      }
      if (pipe.stage === "published") {
        return (
          <div className="u-meta">
            <Icon name="check" size={13} /> Released: students of this level can see their results.
          </div>
        );
      }
      // stage === "ready": Senate-approved: the EO releases it here
      if (mode === "batch") {
        return (
          <div className="u-row u-wrap" style={{ gap: 10, alignItems: "center" }}>
            <Btn variant="accent" icon="check" onClick={() => actions.examsPublishLevel(pipe.key, dept.name + " " + level)}>Release level to students</Btn>
            <span className="u-meta">Release policy: batch by level (set by ICT).</span>
          </div>
        );
      }
      const codes = pipe.sheets.map((sh) => sh.code);
      const left = codes.filter((c) => !pubc[c]);
      return (
        <div className="u-stack" style={{ gap: 8 }}>
          <div className="u-meta">Release policy: per course (set by ICT). Publish course by course; students see each result as it lands, with a provisional GPA until the level completes.</div>
          <div className="u-row u-wrap" style={{ gap: 6 }}>
            {codes.map((c) => pubc[c]
              ? <Tag key={c} variant="success" dot>{c}</Tag>
              : <Btn key={c} variant="secondary" size="sm" onClick={() => {
                  actions.examsPublishCourse(c, pipe.key === "CSC-300L");
                  if (left.length === 1) actions.examsPublishLevel(pipe.key, dept.name + " " + level);
                }}>{c}: publish</Btn>)}
          </div>
        </div>
      );
    }} />;
}

/* ============ MEETINGS & EVENTS (shared: HOD / Dean) ============ */
/* find lectures occupying a slot, for either the 300L student timetable
   or the demo lecturer's teaching timetable */
function slotClashes(audience, day, start) {
  const out = [];
  const hit = (tt, kind) => {
    const P = tt.periods;
    tt.lectures.forEach((l) => {
      if (l.day === day && (l.start === start || (l.span === 2 && P.indexOf(l.start) === P.indexOf(start) - 1))) {
        if (!out.some((c) => c.code === l.code && c.kind === kind)) out.push({ code: l.code, kind });
      }
    });
  };
  if (audience !== "staff") hit(window.DATA.TIMETABLE, "student lecture");
  if (audience !== "students") hit(window.STAFF_DATA.STAFF_TIMETABLE, "staff teaching slot");
  return out;
}

const EVENT_TYPES = ["Meeting", "Seminar", "Town hall"];
const EXAM_TYPE = "Exam";

/* courses/invigilators are only passed by roles that own an exam timetable
   (HOD, for their department's staff): without them, "Exam" isn't offered as
   a type at all, rather than showing empty selects. */
function EventFormModal({ actions, roleCfg, scopeLabel, audienceOptions, onClose, courses, invigilators }) {
  const { TIMETABLE, VENUES } = window.DATA;
  const canExam = !!(courses && courses.length && invigilators && invigilators.length);
  const typeOptions = canExam ? [...EVENT_TYPES, EXAM_TYPE] : EVENT_TYPES;
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("Meeting");
  const [audience, setAudience] = React.useState("both");
  const [day, setDay] = React.useState("Monday");
  const [start, setStart] = React.useState("10:00");
  const [venue, setVenue] = React.useState("Audit.");
  const [courseCode, setCourseCode] = React.useState(canExam ? courses[0].code : "");
  const [invigilator, setInvigilator] = React.useState(canExam ? invigilators[0] : "");
  const isExam = type === EXAM_TYPE;
  const clashes = React.useMemo(() => slotClashes(audience, day, start), [audience, day, start]);

  const pickCourse = (code) => {
    setCourseCode(code);
    const c = courses.find((x) => x.code === code);
    setTitle(c ? c.code + " — Final Exam" : "");
  };
  const pickType = (t) => {
    setType(t);
    if (t === EXAM_TYPE && !title.trim()) pickCourse(courseCode);
  };

  const schedule = () => {
    actions.scheduleEvent({
      title: title.trim(), type, audience, day, start, venue, by: roleCfg.person.name, scope: scopeLabel, clashes,
      ...(isExam ? { courseCode, invigilator } : {}),
    });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <ModalHead title={isExam ? "Schedule an exam" : "Schedule an event"} sub={scopeLabel} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Title">
          <input className="fb-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isExam ? "e.g. CSC 301 — Final Exam" : "e.g. Departmental board meeting"} />
        </Field>
        <Field label="Type">
          <Seg value={type} onChange={pickType} options={typeOptions.map((t) => ({ value: t, label: t }))} />
        </Field>
        {isExam ? (
          <div className="u-grid u-grid--2" style={{ gap: 10 }}>
            <Field label="Course">
              <select className="fb-input" value={courseCode} onChange={(e) => pickCourse(e.target.value)}>
                {courses.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.title}</option>)}
              </select>
            </Field>
            <Field label="Invigilator">
              <select className="fb-input" value={invigilator} onChange={(e) => setInvigilator(e.target.value)}>
                {invigilators.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <Field label="Who does it affect?">
            <Seg value={audience} onChange={setAudience} options={audienceOptions} />
          </Field>
        )}
        <div className="u-grid u-grid--3" style={{ gap: 10 }}>
          <Field label="Day">
            <select className="fb-input" value={day} onChange={(e) => setDay(e.target.value)}>
              {TIMETABLE.days.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Time">
            <select className="fb-input" value={start} onChange={(e) => setStart(e.target.value)}>
              {TIMETABLE.periods.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Venue">
            <select className="fb-input" value={venue} onChange={(e) => setVenue(e.target.value)}>
              {Object.keys(VENUES).map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        {clashes.length > 0 && (
          <div className="u-formerr">
            <Icon name="info" size={14} />
            <span>This slot clashes with {clashes.map((c) => c.code + " (" + c.kind + ")").join(", ")}. You can schedule anyway: the clash will be flagged on affected timetables.</span>
          </div>
        )}
        <Btn variant="accent" size="lg" disabled={!title.trim() || (isExam && !courseCode)} onClick={schedule} style={{ width: "100%" }}>
          {clashes.length > 0 ? "Schedule anyway" : (isExam ? "Schedule exam" : "Schedule event")}
        </Btn>
      </div>
    </Modal>
  );
}

/* one Schedule page per senior role: their own weekly grid (teaching slots +
   events that touch them), with event scheduling built in for HOD/Dean */
function RoleScheduleScreen({ store, actions, roleCfg, teaching, scopeLabel, audienceOptions, courses, invigilators }) {
  const { TIMETABLE } = window.DATA;
  const [formOpen, setFormOpen] = React.useState(false);
  const events = store.events || [];
  const audienceLabel = (v) => (audienceOptions.find((o) => o.value === v) || {}).label || v;

  // on my own grid: everything that affects staff, plus anything I scheduled myself
  const slotEvents = (d, p) => events.filter((e) =>
    e.day === d && e.start === p && (e.audience !== "students" || e.by === roleCfg.person.name));

  return (
    <div className="u-content">
      <PageHead title="Schedule" sub={scopeLabel + " · your week: meetings you schedule land here and on every affected timetable"}>
        <Btn variant="accent" icon="plus" onClick={() => setFormOpen(true)}>Schedule event</Btn>
      </PageHead>

      <Card className="u-pad" style={{ overflowX: "auto", marginBottom: 16 }}>
        <div className="u-tt" style={{ minWidth: 620 }}>
          <div />
          {TIMETABLE.days.map((d) => <div key={d} className="u-tt__h">{d.slice(0, 3)}</div>)}
          {TIMETABLE.periods.map((p, pi) => (
            <React.Fragment key={p}>
              <div className="u-tt__time">{p}</div>
              {TIMETABLE.days.map((d) => {
                const ev = teaching.find((l) => l.day === d && l.start === p);
                const covered = teaching.find((l) => l.day === d && l.span === 2 && TIMETABLE.periods.indexOf(l.start) === pi - 1);
                if (covered) return null;
                const evs = slotEvents(d, p);
                if (ev && ev.span === 2) evs.push(...slotEvents(d, TIMETABLE.periods[pi + 1]));
                return (
                  <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined, display: "flex", flexDirection: "column" }}>
                    {ev && (
                      <div className="u-tt__ev" style={{ flex: 1 }}>
                        <span className="c">{ev.code}</span>
                        <span className="r">{ev.room}</span>
                      </div>
                    )}
                    {evs.map((e) => <window.EventChip key={e.id} ev={e} />)}
                    {!ev && evs.length === 0 && <div className="u-tt__cell" />}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>Scheduled meetings & events</div>
        {events.length === 0
          ? <div className="u-meta">Nothing scheduled yet. Use “Schedule event”: it appears on your grid above and on the timetables of the staff and students it affects.</div>
          : (
            <div className="u-stack" style={{ gap: 8 }}>
              {events.map((e) => (
                <div key={e.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                  <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                    <span className="u-icon u-icon--plain"><Icon name="calendar" size={15} /></span>
                    <div style={{ minWidth: 0 }}>
                      <div className="u-row u-wrap" style={{ gap: 7 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{e.title}</span>
                        <Tag variant="accent">{e.type}</Tag>
                        {e.clashes && e.clashes.length > 0 && <Tag variant="danger" dot>Clashes with {e.clashes.map((c) => c.code).join(", ")}</Tag>}
                      </div>
                      <div className="u-meta" style={{ marginTop: 2 }}>{e.day} {e.start} · {e.venue} · {audienceLabel(e.audience)} · by {e.by}</div>
                      {e.type === EXAM_TYPE && (
                        <div className="u-row" style={{ gap: 6, marginTop: 6, alignItems: "center" }}>
                          <span className="u-meta">Invigilator:</span>
                          {invigilators && invigilators.length ? (
                            <SavableSelect small value={e.invigilator || invigilators[0]} options={invigilators}
                              onSave={(v) => actions.assignInvigilator(e.id, v)} />
                          ) : <span className="u-meta fb-mono">{e.invigilator || "Unassigned"}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <ConfirmButton size="sm" title="Cancel this event?" body={"“" + e.title + "” on " + e.day + " " + e.start + " will be cancelled and removed from every attendee's schedule."} onConfirm={() => actions.cancelEvent(e.id)}>Cancel event</ConfirmButton>
                </div>
              ))}
            </div>
          )}
      </Card>

      {formOpen && (
        <EventFormModal actions={actions} roleCfg={roleCfg} scopeLabel={scopeLabel} audienceOptions={audienceOptions} courses={courses} invigilators={invigilators} onClose={() => setFormOpen(false)} />
      )}
    </div>
  );
}

/* HOD teaches CSC 303: their grid shows that slot plus events */
function HodSchedule({ store, actions, roleCfg }) {
  const meta = window.STAFF_DATA.COURSE_META["CSC 303"] || {};
  const teaching = (meta.day || "").split(" & ").filter(Boolean).map((d) => ({ day: d.trim(), start: meta.start, span: 1, code: meta.code, room: meta.venue }));
  const { STAFF_POOL } = window.ROLE_DATA;
  return <RoleScheduleScreen store={store} actions={actions} roleCfg={roleCfg} teaching={teaching}
    scopeLabel="Department of Computer Science"
    courses={hodAllCourses(store)} invigilators={STAFF_POOL.filter((s) => s !== "Unassigned")}
    audienceOptions={[
      { value: "staff", label: "Dept. staff" },
      { value: "students", label: "Students" },
      { value: "both", label: "Staff & students" },
    ]} />;
}

function DeanSchedule({ store, actions, roleCfg }) {
  const fac = window.ORG.facultyById((roleCfg && roleCfg.facultyId) || "computing");
  return <RoleScheduleScreen store={store} actions={actions} roleCfg={roleCfg} teaching={[]}
    scopeLabel={fac.name}
    audienceOptions={[
      { value: "staff", label: "Faculty staff" },
      { value: "students", label: "Students" },
      { value: "both", label: "Staff & students" },
    ]} />;
}

/* ============ HOD: PROJECT SUPERVISION (allocation + defence) ============ */
function HodProjects({ store, actions }) {
  const { FINALISTS } = window.PROJECT_DATA;
  const { STAFF_POOL } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const [defFor, setDefFor] = React.useState(null);
  const supOf = (f) => rstate(store, "hod", "supv", f.id, f.baseSupervisor);
  const committed = Object.fromEntries(FINALISTS.map((f) => [f.id, supOf(f)]));
  const [draft, setDraft] = React.useState(committed);
  const dirty = JSON.stringify(draft) !== JSON.stringify(committed);
  const filtered = FINALISTS.filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);
  const unassigned = FINALISTS.filter((f) => draft[f.id] === "Unassigned").length;

  // workload per supervisor, reflecting unsaved picks too so the admin can see
  // the effect of a change before committing it
  const load = {};
  FINALISTS.forEach((f) => { const sv = draft[f.id]; if (sv !== "Unassigned") load[sv] = (load[sv] || 0) + 1; });

  // students cleared for defence: the live demo student plus seeded ones the supervisor cleared
  const p = store.project || {};
  const clearedLive = p.cleared ? [{ id: "prj-me", name: window.DATA.STUDENT.name, matric: window.DATA.STUDENT.matric, live: true, defence: p.defence }] : [];
  const clearedSeeded = (window.PROJECT_DATA.SUPERVISEES || [])
    .filter((s) => rstate(store, "sup", "cleared", s.id, false))
    .map((s) => ({ ...s, defence: rstate(store, "hod", "defence", s.id, null) }));
  const cleared = [...clearedLive, ...clearedSeeded];

  return (
    <div className="u-content">
      <PageHead title="Project Supervision" sub={FINALISTS.length + " final-year (500L) students · " + unassigned + " without a supervisor"} />

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 10 }}>Supervisor workload</div>
        <div className="u-row u-wrap" style={{ gap: 8 }}>
          {STAFF_POOL.filter((sv) => sv !== "Unassigned").map((sv) => (
            <Tag key={sv} variant={(load[sv] || 0) > 7 ? "warning" : undefined}>{sv} · {load[sv] || 0}</Tag>
          ))}
          {unassigned > 0 && <Tag variant="danger" dot>{unassigned} unassigned</Tag>}
        </div>
      </Card>

      {cleared.length > 0 && (
        <Card className="u-pad" style={{ marginBottom: 16 }}>
          <div className="u-h3" style={{ marginBottom: 4 }}>Ready for defence</div>
          <div className="u-meta" style={{ marginBottom: 12 }}>Supervisors have cleared these projects. Schedule each defence: the student and panel are notified.</div>
          <div className="u-stack" style={{ gap: 8 }}>
            {cleared.map((c) => (
              <div key={c.id} className="u-row u-wrap" style={{ gap: 12, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                  <div className="u-meta fb-mono">{c.matric}</div>
                </div>
                {c.defence
                  ? <Tag variant="success" dot>{c.defence.day} {c.defence.start} · {c.defence.venue}</Tag>
                  : <Btn variant="accent" size="sm" icon="calendar" onClick={() => setDefFor(c)}>Schedule defence</Btn>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th className="u-right">CGPA</th><th>Supervisor</th></tr></thead>
            <tbody>
              {pager.slice.map((f) => (
                <tr key={f.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{f.matric}</td>
                  <td style={{ fontWeight: 500 }}>{f.name}</td>
                  <td className="u-right u-num">{f.cgpa}</td>
                  <td>
                    <select className="fb-input" style={{ minWidth: 190, padding: "7px 10px", borderColor: draft[f.id] === "Unassigned" ? "var(--danger)" : undefined }}
                      value={draft[f.id]} onChange={(e) => setDraft({ ...draft, [f.id]: e.target.value })}>
                      {STAFF_POOL.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[12, 25, 50]} />
      </Card>
      <div className="u-row u-wrap" style={{ gap: 10, marginTop: 12, alignItems: "center" }}>
        {dirty ? (
          <>
            <Btn variant="accent" icon="check" onClick={() => actions.roleActBulk("hod", "supv", draft)}>Save changes</Btn>
            <Btn variant="ghost" onClick={() => setDraft(committed)}>Discard</Btn>
            <span className="u-meta">Unsaved. A supervisor sees their students under Supervision in the staff portal once saved.</span>
          </>
        ) : (
          <span className="u-meta"><Icon name="info" size={13} /> Nothing to save.</span>
        )}
      </div>

      {defFor && <DefenceModal c={defFor} actions={actions} onClose={() => setDefFor(null)} />}
    </div>
  );
}

/* ---- SIWES/IT: one academic supervisor per 400L student, same shape as
   project supervision: company is the student's own placement, for context ---- */
function HodSiwes({ store, actions }) {
  const { SIWES_STUDENTS, STAFF_POOL } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const supOf = (s) => rstate(store, "hod", "itSupv", s.id, s.baseSupervisor);
  const committed = Object.fromEntries(SIWES_STUDENTS.map((s) => [s.id, supOf(s)]));
  const [draft, setDraft] = React.useState(committed);
  const dirty = JSON.stringify(draft) !== JSON.stringify(committed);
  const filtered = SIWES_STUDENTS.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);
  const unassigned = SIWES_STUDENTS.filter((s) => draft[s.id] === "Unassigned").length;

  const load = {};
  SIWES_STUDENTS.forEach((s) => { const sv = draft[s.id]; if (sv !== "Unassigned") load[sv] = (load[sv] || 0) + 1; });

  return (
    <div className="u-content">
      <PageHead title="SIWES / IT Supervision" sub={SIWES_STUDENTS.length + " 400L students on industrial training · " + unassigned + " without a supervisor"} />

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 10 }}>Supervisor workload</div>
        <div className="u-row u-wrap" style={{ gap: 8 }}>
          {STAFF_POOL.filter((sv) => sv !== "Unassigned").map((sv) => (
            <Tag key={sv} variant={(load[sv] || 0) > 5 ? "warning" : undefined}>{sv} · {load[sv] || 0}</Tag>
          ))}
          {unassigned > 0 && <Tag variant="danger" dot>{unassigned} unassigned</Tag>}
        </div>
      </Card>

      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th>Placement company</th><th>Supervisor</th></tr></thead>
            <tbody>
              {pager.slice.map((s) => (
                <tr key={s.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{s.matric}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td className="u-muted">{s.company}</td>
                  <td>
                    <select className="fb-input" style={{ minWidth: 190, padding: "7px 10px", borderColor: draft[s.id] === "Unassigned" ? "var(--danger)" : undefined }}
                      value={draft[s.id]} onChange={(e) => setDraft({ ...draft, [s.id]: e.target.value })}>
                      {STAFF_POOL.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="students" sizes={[12, 25, 50]} />
      </Card>
      <div className="u-row u-wrap" style={{ gap: 10, marginTop: 12, alignItems: "center" }}>
        {dirty ? (
          <>
            <Btn variant="accent" icon="check" onClick={() => actions.roleActBulk("hod", "itSupv", draft)}>Save changes</Btn>
            <Btn variant="ghost" onClick={() => setDraft(committed)}>Discard</Btn>
            <span className="u-meta">Unsaved. Supervisors visit and sign off on their students' logbooks during the IT period once saved.</span>
          </>
        ) : (
          <span className="u-meta"><Icon name="info" size={13} /> Nothing to save.</span>
        )}
      </div>
    </div>
  );
}

function DefenceModal({ c, actions, onClose }) {
  const { TIMETABLE, VENUES } = window.DATA;
  const [day, setDay] = React.useState("Friday");
  const [start, setStart] = React.useState("10:00");
  const [venue, setVenue] = React.useState("LH 2");
  const [panel, setPanel] = React.useState("Prof. K. Adewale (chair), Dr. F. Okonkwo, Dr. M. Sani");
  const schedule = () => {
    const d = { day, start, venue, panel };
    if (c.live) actions.projScheduleDefence(d);
    else actions.roleAct("hod", "defence", c.id, d);
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Schedule project defence" sub={c.name} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <div className="u-grid u-grid--3" style={{ gap: 10 }}>
          <Field label="Day">
            <select className="fb-input" value={day} onChange={(e) => setDay(e.target.value)}>
              {TIMETABLE.days.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Time">
            <select className="fb-input" value={start} onChange={(e) => setStart(e.target.value)}>
              {TIMETABLE.periods.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Venue">
            <select className="fb-input" value={venue} onChange={(e) => setVenue(e.target.value)}>
              {Object.keys(VENUES).map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Panel">
          <input className="fb-input" value={panel} onChange={(e) => setPanel(e.target.value)} />
        </Field>
        <Btn variant="accent" size="lg" icon="calendar" onClick={schedule} style={{ width: "100%" }}>Schedule defence</Btn>
      </div>
    </Modal>
  );
}

/* ============ EXAMS & RECORDS ============
   Exams Officer is a departmental role, same as HOD: one officer per
   department, scoped to their own students and levels. */
function ExamsDashboard({ store, go, roleCfg, hat }) {
  const { TRANSCRIPTS, HOD_RESULTS } = window.ROLE_DATA;
  const entries = deptLevels(store, "CSC", "Computer Science");
  const ready = entries.filter((e) => e.pipe.stage === "ready");
  const sheetsPending = HOD_RESULTS.filter((r) => rstate(store, "eo", "result", r.code, r.baseStatus) === "pending").length;
  const tpending = TRANSCRIPTS.filter((t) => rstate(store, "exams", "tr", t.id, t.baseStatus) !== "done").length;
  const issues = (store.resultIssues || []).filter((i) => i.status !== "resolved").length;
  return (
    <div className="u-content">
      <RoleHero person={roleCfg ? roleCfg.person : window.ROLE_DATA.PEOPLE.exams} sub={hat && hat.roleTitle} />
      <StatCards items={[
        { icon: "doc", k: "Course sheets to approve", v: sheetsPending, tag: sheetsPending ? "Review" : "Clear", tone: sheetsPending ? "warning" : "success", onClick: () => go("exm-course-results") },
        { icon: "chart", k: "Levels ready to release", v: ready.length, tag: ready.length ? "Release" : "Clear", tone: ready.length ? "warning" : "success", onClick: () => go("exm-level") },
        { icon: "info", k: "Open result issues", v: issues, tag: issues ? "Resolve" : "Clear", tone: issues ? "warning" : "success", onClick: () => go("exm-issues") },
        { icon: "doc", k: "Transcript requests", v: tpending, tag: tpending ? "Process" : "Clear", tone: tpending ? "warning" : "success", onClick: () => go("exm-trans") },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Senate-approved levels awaiting release</div><a className="fb-link" onClick={() => go("exm-level")}>All</a>
        </div>
        {ready.length === 0 ? <div className="u-meta">Nothing waiting. Levels signed off by their School Board and ratified by Senate appear here.</div> : (
          <div className="u-stack" style={{ gap: 8 }}>
            {ready.slice(0, 3).map((e) => (
              <div key={e.pipe.key} className="u-row u-wrap" style={{ gap: 12, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div><span style={{ fontWeight: 600, fontSize: 13.5 }}>{e.dept.name}</span> <Tag>{e.level}</Tag></div>
                <Tag variant="accent" dot>Senate-approved</Tag>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---- per-course results view (EO "Course Rate"): browse a course's roster,
   export it, and correct a result wrongly uploaded against a student ---- */
function courseRoster(rows, code) {
  return rows
    .map((r) => ({ r, g: r.grades.find((x) => x.code === code) }))
    .filter(({ g }) => g && (g.grade != null || g.missing || g.removed || g.pending))
    .map(({ r, g }) => ({ matric: r.matric, name: r.name, score: g.score, grade: g.grade, missing: g.missing, removed: g.removed, pending: g.pending }));
}
function downloadCSV(filename, headers, rows) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => String(c ?? "").replace(/,/g, " ")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExamsCourseResults({ store, actions }) {
  const dept = { code: "CSC", name: "Computer Science" };
  const [level, setLevel] = React.useState("300L");
  const [openCode, setOpenCode] = React.useState(null);
  const { HOD_RESULTS } = window.ROLE_DATA;
  const { rows } = React.useMemo(() => levelCohort(dept, level, store), [level, store]);
  const courses = levelCourses(dept.code, level);
  const key = levelKey(dept.code, level);
  const seedFor = (code) => HOD_RESULTS.find((r) => r.code === code);
  const statusFor = (code) => { const seed = seedFor(code); return seed ? rstate(store, "eo", "result", code, seed.baseStatus) : "approved"; };

  const openSeed = openCode ? seedFor(openCode) : null;
  if (openCode && openSeed) {
    // this course has a lecturer-submitted sheet: approve/return/reopen it
    const s = statusFor(openCode);
    const sheetNote = (store.roles && store.roles.eo && store.roles.eo.note && store.roles.eo.note[openCode]) || "";
    return <ResultSheetDetail
      meta={{ code: openSeed.code, title: openSeed.title, level: openSeed.level, students: openSeed.students, sub: openSeed.lecturer + " · submitted " + openSeed.submittedAt }}
      status={s} note={sheetNote}
      onBack={() => setOpenCode(null)} backLabel="Back to courses"
      onApprove={() => { actions.eoDecideSheet(openSeed.code, openSeed.level, "approved"); setOpenCode(null); }}
      onReject={(note) => { actions.eoDecideSheet(openSeed.code, openSeed.level, "query", note); setOpenCode(null); }}
      onReopen={() => actions.eoDecideSheet(openSeed.code, openSeed.level, "pending")}
      approveLabel="Approve results" rejectLabel="Return to lecturer"
      decisionNote="Approving clears this course sheet. Once every sheet for a level is approved, the level result compiles automatically and moves into review." />;
  }
  if (openCode) {
    const roster = courseRoster(rows, openCode);
    return (
      <div className="u-content">
        <div style={{ marginBottom: 14 }}>
          <button className="u-filelink" onClick={() => setOpenCode(null)}><Icon name="arrowLeft" size={14} /> Back to courses</button>
        </div>
        <PageHead title={openCode} sub={dept.name + " · " + level + " · " + roster.length + " enrolled"}>
          <Btn variant="secondary" icon="download" onClick={() => downloadCSV(openCode.replace(/\s+/g, "") + "-roster.csv", ["matric", "name", "score", "grade"], roster.map((r) => [r.matric, r.name, r.score ?? "", r.grade ?? (r.missing ? "MISSING" : "")]))}>Download roster</Btn>
        </PageHead>
        <Card>
          <div className="u-table-scroll">
            <table className="u-table">
              <thead><tr><th>Matric</th><th>Student</th><th className="u-right">Score</th><th>Grade</th></tr></thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.matric}>
                    <td className="fb-mono" style={{ fontSize: 12 }}>{r.matric}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="u-right u-num">{r.score ?? "Not available"}</td>
                    <td>{r.removed ? <Tag variant="danger">Removed</Tag> : r.missing ? <Tag variant="warning">Missing</Tag> : r.pending ? <Tag variant="warning">Pending</Tag> : <Tag variant={GRADE_TONE[r.grade]}>{r.grade}</Tag>}</td>
                  </tr>
                ))}
                {roster.length === 0 && <tr><td colSpan={4}><Empty icon="user" title="No students" sub="Nobody in this cohort is enrolled in this course." /></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  const pendingInLevel = courses.filter((c) => statusFor(c.code) === "pending").length;

  return (
    <div className="u-content">
      <PageHead title="Courses" sub={"Computer Science · " + level + " · " + pendingInLevel + " course sheet" + (pendingInLevel === 1 ? "" : "s") + " awaiting your approval"}>
        <Seg value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l }))} />
      </PageHead>

      <CorrectResultCard rows={rows} courses={courses} levelKey={key} actions={actions} />

      <Card style={{ marginTop: 16 }}>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Code</th><th>Title</th><th className="u-right">Units</th><th className="u-right">Enrolled</th><th>Sheet</th><th className="u-right">Action</th></tr></thead>
            <tbody>
              {courses.map((c) => {
                const seed = seedFor(c.code);
                const s = statusFor(c.code);
                return (
                  <tr key={c.code}>
                    <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                    <td className="u-muted">{(seed && seed.title) || c.title || c.code}</td>
                    <td className="u-right u-num">{c.units}</td>
                    <td className="u-right u-num">{courseRoster(rows, c.code).length}</td>
                    <td>{seed ? <SPill s={s} /> : <span className="u-muted">No sheet</span>}</td>
                    <td className="u-right">
                      {s === "pending"
                        ? <Btn variant="accent" size="sm" iconRight="chevron" onClick={() => setOpenCode(c.code)}>Review</Btn>
                        : seed
                          ? <Btn variant="secondary" size="sm" iconRight="chevron" onClick={() => setOpenCode(c.code)}>Open sheet</Btn>
                          : <Btn variant="secondary" size="sm" iconRight="chevron" onClick={() => setOpenCode(c.code)}>View roster</Btn>}
                    </td>
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

/* find & strike an erroneous result entry: e.g. uploaded against a student
   who never registered for that course */
function CorrectResultCard({ rows, courses, levelKey, actions }) {
  const [matric, setMatric] = React.useState("");
  const [code, setCode] = React.useState(courses[0] ? courses[0].code : "");
  const student = rows.find((r) => r.matric.trim().toLowerCase() === matric.trim().toLowerCase());
  const grade = student ? student.grades.find((g) => g.code === code) : null;
  const removedKey = levelKey + "|" + matric.trim() + "|" + code;

  return (
    <Card className="u-pad">
      <div className="u-h3" style={{ marginBottom: 4 }}>Correct a result</div>
      <div className="u-meta" style={{ marginBottom: 12 }}>Find a student's entry for a specific course and strike it if it was uploaded in error: e.g. against someone who never registered.</div>
      <div className="u-row u-wrap" style={{ gap: 10, alignItems: "flex-end" }}>
        <Field label="Matric number"><input className="fb-input fb-input--mono" value={matric} onChange={(e) => setMatric(e.target.value)} placeholder="FUT/2022/CSC/10428" style={{ minWidth: 220 }} /></Field>
        <Field label="Course">
          <select className="fb-input" value={code} onChange={(e) => setCode(e.target.value)} style={{ minWidth: 160 }}>
            {courses.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </Field>
      </div>
      {matric.trim() && (
        student ? (
          <div className="u-row u-wrap" style={{ gap: 12, marginTop: 14, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{student.name}</div>
              <div className="u-meta">{code} · {grade && grade.removed ? "entry removed" : grade && grade.pending ? "sheet awaiting approval" : grade && grade.grade != null ? "score " + grade.score + " · grade " + grade.grade : "no result on file"}</div>
            </div>
            {grade && grade.grade != null && !grade.removed && (
              <Btn variant="secondary" size="sm" onClick={() => actions.roleAct("levels", "removed", removedKey, true)}>Remove this entry</Btn>
            )}
            {grade && grade.removed && (
              <Btn variant="ghost" size="sm" onClick={() => actions.roleAct("levels", "removed", removedKey, false)}>Restore entry</Btn>
            )}
          </div>
        ) : (
          <div className="u-meta" style={{ marginTop: 12 }}>No student with that matric number in this cohort.</div>
        )
      )}
    </Card>
  );
}

/* ---- course catalogue management (EO creates courses) ---- */
function ExamsCourses({ store, actions }) {
  const [creating, setCreating] = React.useState(false);
  const created = (store.roles && store.roles.exams && store.roles.exams.courses) || [];
  const base = window.DATA.COURSES.map((c) => ({ code: c.code, title: c.title, units: c.units, level: "300L", dept: "CSC", semester: "First" }));
  const all = [...created, ...base];
  const [q, setQ] = React.useState("");
  const filtered = all.filter((c) => !q || c.code.toLowerCase().includes(q.toLowerCase()) || c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="u-content">
      <PageHead title="Course Management" sub={"Computer Science · " + all.length + " courses in the department catalogue · 2025/2026"}>
        <Btn variant="accent" icon="plus" onClick={() => setCreating(true)}>Create course</Btn>
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by code or title…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Code</th><th>Title</th><th>Department</th><th>Level</th><th>Semester</th><th className="u-right">Units</th></tr></thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.code + i}>
                  <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}{i < created.length && <Tag variant="success" style={{ marginLeft: 6 }}>New</Tag>}</td>
                  <td>{c.title}</td>
                  <td className="u-muted">{c.dept}</td>
                  <td><Tag>{c.level}</Tag></td>
                  <td className="u-muted">{c.semester}</td>
                  <td className="u-right u-num">{c.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>New courses become available to HODs for lecturer assignment and to students at registration.</div>
      {creating && <CreateCourseModal actions={actions} onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateCourseModal({ actions, onClose }) {
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [units, setUnits] = React.useState(3);
  const [level, setLevel] = React.useState("300L");
  const [semester, setSemester] = React.useState("First");
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Create course" sub="Add a course to the Computer Science catalogue" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <div className="u-grid u-grid--2" style={{ gap: 10 }}>
          <Field label="Course code"><input className="fb-input fb-input--mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CSC 315" /></Field>
          <Field label="Units"><input className="fb-input" type="number" min={1} max={6} value={units} onChange={(e) => setUnits(parseInt(e.target.value, 10) || 1)} /></Field>
        </div>
        <Field label="Title"><input className="fb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mobile Application Development" /></Field>
        <div className="u-grid u-grid--2" style={{ gap: 10 }}>
          <Field label="Level">
            <select className="fb-input" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </Field>
          <Field label="Semester">
            <select className="fb-input" value={semester} onChange={(e) => setSemester(e.target.value)}><option>First</option><option>Second</option></select>
          </Field>
        </div>
        <Btn variant="accent" size="lg" disabled={!code.trim() || !title.trim()} style={{ width: "100%" }}
          onClick={() => { actions.examsCreateCourse({ code: code.trim(), title: title.trim(), units, level, dept: "CSC", semester }); onClose(); }}>
          Add to catalogue
        </Btn>
      </div>
    </Modal>
  );
}

/* ---- result issue resolution (student complaints on released results) ---- */
function ExamsIssues({ store, actions }) {
  const issues = store.resultIssues || [];
  const [resolving, setResolving] = React.useState(null);
  const open = issues.filter((i) => i.status !== "resolved").length;
  return (
    <div className="u-content">
      <PageHead title="Result Issues" sub={"Computer Science · " + open + " open issue" + (open === 1 ? "" : "s") + " · complaints raised by students on released results"} />
      {issues.length === 0 ? (
        <Card className="u-pad"><Empty icon="info" title="No issues raised" sub="When a student disputes a released result (missing CA, wrong score…), it lands here for investigation and resolution." /></Card>
      ) : (
        <Card className="u-pad">
          <div className="u-stack" style={{ gap: 8 }}>
            {issues.map((i) => (
              <div key={i.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="u-row u-wrap" style={{ gap: 7 }}>
                    <span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{i.code}</span>
                    <Tag>{i.category}</Tag>
                    <span className="u-meta">{i.student} · {i.matric}</span>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{i.text}</div>
                  <div className="u-meta" style={{ marginTop: 3 }}>{i.at}{i.resolution ? " · Resolution: " + i.resolution : ""}</div>
                </div>
                {i.status === "resolved"
                  ? <Tag variant="success" dot>Resolved</Tag>
                  : i.status === "investigating"
                    ? <div className="u-row" style={{ gap: 6 }}><Tag variant="accent" dot>Investigating</Tag><Btn variant="accent" size="sm" onClick={() => setResolving(i)}>Resolve</Btn></div>
                    : <div className="u-row" style={{ gap: 6 }}><Btn variant="secondary" size="sm" onClick={() => actions.resultIssueStatus(i.id, "investigating")}>Start investigation</Btn><Btn variant="accent" size="sm" onClick={() => setResolving(i)}>Resolve</Btn></div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      {resolving && <ResolveIssueModal issue={resolving} actions={actions} onClose={() => setResolving(null)} />}
    </div>
  );
}

function ResolveIssueModal({ issue, actions, onClose }) {
  const [note, setNote] = React.useState("");
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Resolve result issue" sub={issue.code + " · " + issue.student} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <div className="u-pad-sm" style={{ borderRadius: "var(--r-md)", background: "var(--bg-sunken)", fontSize: 13 }}>{issue.text}</div>
        <Field label="Resolution (the student sees this)">
          <textarea className="fb-textarea" rows={3} autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. CA record traced and merged: score corrected from 12 to 24. Updated result reflects on your portal." />
        </Field>
        <Btn variant="accent" size="lg" disabled={!note.trim()} onClick={() => { actions.resultIssueStatus(issue.id, "resolved", note.trim()); onClose(); }} style={{ width: "100%" }}>Mark resolved &amp; notify student</Btn>
      </div>
    </Modal>
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
      <PageHead title="Transcript Requests" sub={"Computer Science · " + TRANSCRIPTS.length + " requests · process and dispatch official transcripts"} />
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
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
  HodDashboard, HodAssignments, HodStaff, HodAdvisers, HodSiwes, HodSchedule, HodProjects, HodStudentCases,
  DeanDashboard, DeanDepts, DeanAdmissions, DeanSchedule, DeanStudentCases,
  ExamsLevelResults, ResultSheetDetail, RoleScheduleScreen, LevelBroadsheet, LevelReviewQueue,
  ExamsDashboard, ExamsTranscripts, ExamsCourses, ExamsCourseResults, ExamsIssues,
});
