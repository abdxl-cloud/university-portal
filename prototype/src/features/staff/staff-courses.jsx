import React from "react";
const { Avatar, Btn, Card, Empty, Field, Icon, IconBtn, Modal, ModalHead, PageHead, Seg, Tag, effScore, gradeOf, resultStatus, SGRADE_TONE } = window;
/* Staff portal — course management & results approval */

function StaffCourses({ store, actions, go }) {
  const { STAFF_COURSES } = window.STAFF_DATA;
  const [open, setOpen] = React.useState(() => {
    const pre = localStorage.getItem("futech.scourse");
    if (pre) { localStorage.removeItem("futech.scourse"); return pre; }
    return null;
  });

  if (open) return <CourseManage code={open} store={store} actions={actions} onBack={() => setOpen(null)} />;

  return (
    <div className="u-content">
      <PageHead title="My Courses" sub={STAFF_COURSES.length + " courses · 2025/2026 First Semester"} />
      <div className="u-grid u-grid--3">
        {STAFF_COURSES.map((c) => {
          const { ENROLLED } = window.STAFF_DATA;
          const st = resultStatus(store, c.code);
          const tone = st === "approved" ? "success" : st === "submitted" ? "accent" : "warning";
          const q = courseQueue(store, c.code);
          return (
            <Card key={c.code} className="u-pad" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }} onClick={() => setOpen(c.code)}>
              <div className="u-row" style={{ justifyContent: "space-between" }}>
                <span className="u-icon"><Icon name="book" size={16} /></span>
                {q > 0 ? <Tag variant="warning" dot>{q} to grade</Tag> : <Tag variant={tone} dot>{st === "draft" ? "Results due" : st === "submitted" ? "Submitted" : "Approved"}</Tag>}
              </div>
              <div>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 700, fontSize: 13 }}>{c.code}</span><Tag>{c.level}</Tag></div>
                <div style={{ fontWeight: 600, marginTop: 3, lineHeight: 1.25 }}>{c.title}</div>
              </div>
              <div className="fb-divider" />
              <div className="u-row" style={{ gap: 14 }}>
                <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="user" size={13} /> {ENROLLED[c.code]} students</span>
                <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="pin" size={13} /> {c.venue}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function courseQueue(store, code) {
  const { STAFF_SUBMISSIONS, staffContentFor } = window.STAFF_DATA;
  const subs = STAFF_SUBMISSIONS[code] || {};
  let n = 0;
  staffContentFor(code).assignments.forEach((a) => {
    (subs[a.id] || []).forEach((s) => {
      const graded = store.staff && store.staff.grades && store.staff.grades[a.id + ":" + s.matric] != null;
      if (s.status === "submitted" && !graded) n++;
    });
  });
  return n;
}

function CourseManage({ code, store, actions, onBack }) {
  const { STAFF_COURSES, ENROLLED, COURSE_META } = window.STAFF_DATA;
  const course = STAFF_COURSES.find((c) => c.code === code) || (COURSE_META && COURSE_META[code]) || { code, title: code, units: 0, level: "", venue: "", day: "" };
  const [tab, setTab] = React.useState("roster");
  const q = courseQueue(store, code);
  const tabs = [
    { value: "roster", label: "Roster & Scores" },
    { value: "assignments", label: "Assignments" + (q ? " · " + q : "") },
    { value: "materials", label: "Materials" },
    { value: "stream", label: "Announcements" },
  ];

  return (
    <div className="u-content">
      <button className="fb-link u-row" style={{ gap: 6, marginBottom: 14, background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={onBack}>
        <Icon name="arrowLeft" size={15} /> All courses
      </button>
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 14, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 14, minWidth: 0 }}>
            <span className="u-icon" style={{ width: 44, height: 44 }}><Icon name="book" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 700 }}>{course.code}</span><Tag>{course.units} units</Tag><Tag>{course.level}</Tag></div>
              <div className="u-h2" style={{ marginTop: 2 }}>{course.title}</div>
              <div className="u-meta" style={{ marginTop: 2 }}>{ENROLLED[code]} students · {course.day} · {course.venue}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="u-row" style={{ marginBottom: 16, overflowX: "auto" }}>
        <Seg value={tab} onChange={setTab} options={tabs} />
      </div>

      {tab === "roster" && <RosterScores code={code} store={store} actions={actions} />}
      {tab === "assignments" && <StaffAssignments code={code} store={store} actions={actions} />}
      {tab === "materials" && <StaffMaterials code={code} store={store} actions={actions} />}
      {tab === "stream" && <StaffStream code={code} store={store} actions={actions} />}
    </div>
  );
}

/* ---- roster + score entry ---- */
function RosterScores({ code, store, actions }) {
  const { ROSTERS } = window.STAFF_DATA;
  const roster = ROSTERS[code];
  const status = resultStatus(store, code);
  const locked = status !== "draft";
  const [savedAt, setSavedAt] = React.useState(null);

  const setScore = (matric, field, raw) => {
    const max = field === "ca" ? 30 : 70;
    let v = raw === "" ? null : Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    actions.setScore(code, matric, field, v);
    setSavedAt(Date.now());
  };

  const rows = roster.map((stu) => {
    const sc = effScore(store, code, stu.matric, stu);
    const total = (sc.ca == null || sc.exam == null) ? null : sc.ca + sc.exam;
    return { ...stu, ...sc, total, grade: gradeOf(total) };
  });
  const complete = rows.filter((r) => r.total != null).length;
  const allDone = complete === rows.length;
  const pass = rows.filter((r) => r.total != null && r.total >= 40).length;

  return (
    <div className="u-stack" style={{ gap: 14 }}>
      <Card className="u-pad">
        <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 12 }}>
          <div className="u-row" style={{ gap: 22 }}>
            <div><div className="u-meta">Scores entered</div><div className="u-h3 u-num">{complete} / {rows.length}</div></div>
            <div><div className="u-meta">Passing</div><div className="u-h3 u-num">{pass} / {rows.length}</div></div>
            <div><div className="u-meta">Status</div><Tag variant={locked ? (status === "approved" ? "success" : "accent") : "warning"} dot>{locked ? (status === "approved" ? "Approved" : "Submitted") : "Draft"}</Tag></div>
          </div>
          <div className="u-row" style={{ gap: 8 }}>
            {savedAt && !locked && <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="check" size={13} style={{ color: "var(--success)" }} /> Saved</span>}
            {!locked && (
              <Btn variant="accent" icon="chart" disabled={!allDone}
                onClick={() => actions.submitResults(code)}>
                {allDone ? "Submit results for approval" : "Enter all scores to submit"}
              </Btn>
            )}
          </div>
        </div>
        {locked && <div className="u-meta" style={{ marginTop: 10 }}>{status === "submitted" ? "Results submitted to the HOD — scores are locked pending approval." : "Results approved and released to students — scores are locked."}</div>}
      </Card>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead>
              <tr><th>Matric</th><th>Student</th><th className="u-right">CA / 30</th><th className="u-right">Exam / 70</th><th className="u-right">Total</th><th className="u-right">Grade</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.matric}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{r.matric}</td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td className="u-right">
                    <input className="fb-input u-score" type="number" min="0" max="30" value={r.ca == null ? "" : r.ca}
                      disabled={locked} onChange={(e) => setScore(r.matric, "ca", e.target.value)} />
                  </td>
                  <td className="u-right">
                    <input className="fb-input u-score" type="number" min="0" max="70" value={r.exam == null ? "" : r.exam}
                      disabled={locked} onChange={(e) => setScore(r.matric, "exam", e.target.value)}
                      placeholder="—" />
                  </td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{r.total == null ? "—" : r.total}</td>
                  <td className="u-right">{r.total == null ? <span className="u-muted">—</span> : <Tag variant={SGRADE_TONE[r.grade]}>{r.grade}</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---- assignments + grading ---- */
function StaffAssignments({ code, store, actions }) {
  const { staffContentFor, STAFF_SUBMISSIONS } = window.STAFF_DATA;
  const base = staffContentFor(code);
  const extra = (store.staff && store.staff.assignments && store.staff.assignments[code]) || [];
  const assignments = [...base.assignments, ...extra];
  const subs = STAFF_SUBMISSIONS[code] || {};
  const [openA, setOpenA] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(null);

  return (
    <div className="u-stack" style={{ gap: 14, maxWidth: 820 }}>
      <div className="u-row" style={{ justifyContent: "space-between" }}>
        <div className="u-meta">{assignments.length} assignments</div>
        <Btn variant="secondary" size="sm" icon="plus" onClick={() => setCreating(true)}>Create assignment</Btn>
      </div>

      {assignments.map((a) => {
        const list = subs[a.id] || [];
        const submitted = list.filter((s) => s.status === "submitted").length;
        const graded = list.filter((s) => store.staff && store.staff.grades && store.staff.grades[a.id + ":" + s.matric] != null).length;
        const toGrade = submitted - graded;
        const isOpen = openA === a.id;
        return (
          <Card key={a.id} className="u-pad">
            <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10 }}>
              <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                <span className="u-icon u-icon--plain"><Icon name="doc" size={15} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className="u-meta">Due {a.due} · {a.points} marks · {submitted} submitted</div>
                </div>
              </div>
              <div className="u-row" style={{ gap: 8 }}>
                {toGrade > 0 ? <Tag variant="warning" dot>{toGrade} to grade</Tag> : <Tag variant="success" dot>All graded</Tag>}
                <Btn variant="ghost" size="sm" iconRight={isOpen ? "chevronDown" : "chevron"} onClick={() => setOpenA(isOpen ? null : a.id)}>{isOpen ? "Hide" : "Submissions"}</Btn>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)" }}>
                {list.length === 0 ? <div className="u-meta" style={{ padding: "14px 0" }}>No submissions yet.</div> : list.map((s) => {
                  const g = store.staff && store.staff.grades && store.staff.grades[a.id + ":" + s.matric];
                  return (
                    <div key={s.matric} className="u-row u-wrap" style={{ gap: 10, padding: "12px 0", borderTop: "1px solid var(--border)", justifyContent: "space-between" }}>
                      <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                        <Avatar initials={s.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.name}</div>
                          {s.status === "missing"
                            ? <div className="u-meta">No submission</div>
                            : <button className="u-filelink" onClick={() => setReviewing({ a, s })} title="Open submission">
                                <span className="fb-mono">{s.fileName}</span>
                                <Icon name="arrowRight" size={13} />
                                <span className="u-meta" style={{ marginLeft: 2 }}>· {s.at}</span>
                              </button>}
                        </div>
                      </div>
                      {s.status === "missing" ? <Tag variant="danger">Missing</Tag> : (
                        <div className="u-row" style={{ gap: 8 }}>
                          <input className="fb-input u-score" type="number" min="0" max={a.points} placeholder={"/" + a.points}
                            defaultValue={g == null ? "" : g}
                            onBlur={(e) => { const v = e.target.value === "" ? null : Math.max(0, Math.min(a.points, parseInt(e.target.value, 10) || 0)); actions.gradeSubmission(a.id, s.matric, v); }} />
                          {g != null ? <Tag variant="success" dot>Graded</Tag> : <Tag variant="accent" dot>Submitted</Tag>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {creating && <CreateAssignmentModal code={code} actions={actions} onClose={() => setCreating(false)} />}
      {reviewing && <SubmissionReview assignment={reviewing.a} sub={reviewing.s} store={store} actions={actions} onClose={() => setReviewing(null)} />}
    </div>
  );
}

function CreateAssignmentModal({ code, actions, onClose }) {
  const [title, setTitle] = React.useState("");
  const [due, setDue] = React.useState("");
  const [points, setPoints] = React.useState(20);
  const valid = title.trim() && due.trim();
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Create assignment" sub={code} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Title"><input className="fb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assignment 3 — Indexing" /></Field>
        <div className="u-row" style={{ gap: 10 }}>
          <Field label="Due date"><input className="fb-input" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Nov 22, 2025" /></Field>
          <Field label="Marks"><input className="fb-input" type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)} /></Field>
        </div>
        <Btn variant="accent" size="lg" disabled={!valid} style={{ width: "100%" }}
          onClick={() => { actions.addAssignment(code, { id: "x" + Date.now(), title, due, points }); onClose(); }}>
          Post assignment
        </Btn>
        <div className="u-meta" style={{ textAlign: "center" }}>Students see this instantly in their class space.</div>
      </div>
    </Modal>
  );
}

/* ---- submission review: mini document viewer + grade + comments ---- */
function genDocPages(sub, assignment) {
  // deterministic mock content from the matric, so each student's doc looks distinct
  let seed = 0; for (const ch of sub.matric) seed += ch.charCodeAt(0);
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const SENT = [
    "This report examines the problem domain and outlines the approach taken to arrive at a working solution.",
    "The methodology follows the standard design process, beginning with requirements and moving through to implementation.",
    "Figure 1 illustrates the relationships between the core entities identified during analysis.",
    "Each component was tested independently before integration to ensure correctness and isolate defects.",
    "The results indicate that the proposed method performs within the expected bounds for the given inputs.",
    "Normalisation was applied up to the third normal form to eliminate redundancy and update anomalies.",
    "A comparison against the baseline shows a measurable improvement in both clarity and efficiency.",
    "In conclusion, the objectives stated at the outset were met, and avenues for further work are noted below.",
  ];
  const pages = [];
  const nPages = 2 + Math.floor(rnd() * 2); // 2-3 pages
  for (let p = 0; p < nPages; p++) {
    const paras = [];
    const nPara = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < nPara; i++) {
      const n = 2 + Math.floor(rnd() * 3);
      let para = "";
      for (let j = 0; j < n; j++) para += SENT[Math.floor(rnd() * SENT.length)] + " ";
      paras.push(para.trim());
    }
    pages.push(paras);
  }
  return pages;
}

function SubmissionReview({ assignment, sub, store, actions, onClose }) {
  const ext = (sub.fileName.split(".").pop() || "pdf").toUpperCase();
  const pages = React.useMemo(() => genDocPages(sub, assignment), [sub.matric, assignment.id]);
  const k = assignment.id + ":" + sub.matric;
  const grade = store.staff && store.staff.grades && store.staff.grades[k];
  const comments = (store.staff && store.staff.feedback && store.staff.feedback[k]) || [];
  const [gradeVal, setGradeVal] = React.useState(grade == null ? "" : String(grade));
  const [comment, setComment] = React.useState("");
  const [page, setPage] = React.useState(1);

  const saveGrade = () => {
    const v = gradeVal === "" ? null : Math.max(0, Math.min(assignment.points, parseInt(gradeVal, 10) || 0));
    actions.gradeSubmission(assignment.id, sub.matric, v);
  };
  const postComment = () => { if (!comment.trim()) return; actions.addFeedback(assignment.id, sub.matric, comment.trim(), page); setComment(""); };

  return (
    <div className="u-cmd-bg" onClick={onClose}>
      <div className="u-review" onClick={(e) => e.stopPropagation()}>
        <div className="u-row" style={{ justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
            <Avatar initials={sub.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</div>
              <div className="u-meta">{assignment.title}</div>
            </div>
          </div>
          <IconBtn name="x" onClick={onClose} />
        </div>

        <div className="u-review__body">
          {/* viewer */}
          <div className="u-review__viewer">
            <div className="u-review__bar">
              <span className="u-row" style={{ gap: 7 }}><Icon name="doc" size={14} /> <span className="fb-mono" style={{ fontSize: 12 }}>{sub.fileName}</span></span>
              <Tag>{ext}</Tag>
              <span className="u-grow" />
              <span className="u-meta">Submitted {sub.at}</span>
            </div>
            <div className="u-review__pages">
              {pages.map((paras, pi) => (
                <div key={pi} className="u-doc-page">
                  {pi === 0 && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{assignment.title}</div>
                      <div className="u-meta" style={{ marginBottom: 14 }}>{sub.name} · {sub.matric}</div>
                    </>
                  )}
                  {paras.map((p, i) => <p key={i} style={{ margin: "0 0 11px", fontSize: 12.5, lineHeight: 1.7, color: "var(--fg-muted)" }}>{p}</p>)}
                  <div className="u-meta" style={{ textAlign: "center", marginTop: 12 }}>— {pi + 1} —</div>
                </div>
              ))}
            </div>
          </div>

          {/* side panel: grade + comments */}
          <div className="u-review__panel">
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)" }}>
              <div className="u-meta" style={{ fontWeight: 600, marginBottom: 8 }}>GRADE</div>
              <div className="u-row" style={{ gap: 8 }}>
                <input className="fb-input" type="number" min="0" max={assignment.points} value={gradeVal}
                  onChange={(e) => setGradeVal(e.target.value)} onBlur={saveGrade}
                  style={{ width: 80, textAlign: "center" }} placeholder="0" />
                <span className="u-muted">/ {assignment.points}</span>
                <span className="u-grow" />
                <Btn variant="accent" size="sm" icon="check" onClick={saveGrade}>Save</Btn>
              </div>
            </div>

            <div className="u-review__comments">
              <div className="u-meta" style={{ fontWeight: 600, marginBottom: 10 }}>COMMENTS · {comments.length}</div>
              {comments.length === 0 ? (
                <div className="u-meta" style={{ padding: "8px 0 14px" }}>No comments yet. Leave feedback for the student below.</div>
              ) : (
                <div className="u-stack" style={{ gap: 10, marginBottom: 12 }}>
                  {comments.map((c) => (
                    <div key={c.id} className="u-cmt">
                      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                        <span className="u-meta" style={{ fontWeight: 600 }}>{c.page ? "Page " + c.page : "General"}</span>
                        <button className="u-cmt__x" onClick={() => actions.removeFeedback(assignment.id, sub.matric, c.id)} aria-label="Delete"><Icon name="x" size={12} /></button>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45 }}>{c.text}</div>
                      <div className="u-meta" style={{ marginTop: 4, fontSize: 11 }}>{c.at}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
              <div className="u-row" style={{ gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span className="u-meta">Pin to:</span>
                <button className="fb-btn fb-btn--secondary fb-btn--sm" style={{ borderColor: page === 0 ? "var(--accent)" : undefined }} onClick={() => setPage(0)}>General</button>
                {pages.map((_, i) => (
                  <button key={i} className="fb-btn fb-btn--secondary fb-btn--sm" style={{ borderColor: page === i + 1 ? "var(--accent)" : undefined }} onClick={() => setPage(i + 1)}>p{i + 1}</button>
                ))}
              </div>
              <textarea className="fb-textarea" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" />
              <Btn variant="accent" size="sm" icon="bell" disabled={!comment.trim()} style={{ width: "100%", marginTop: 8 }} onClick={postComment}>Post comment</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function StaffMaterials({ code, store, actions }) {
  const { staffContentFor } = window.STAFF_DATA;
  const base = staffContentFor(code).materials;
  const extra = (store.staff && store.staff.materials && store.staff.materials[code]) || [];
  const all = [...extra, ...base];
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef(null);

  return (
    <div className="u-stack" style={{ gap: 14, maxWidth: 760 }}>
      <div className="u-row" style={{ justifyContent: "space-between" }}>
        <div className="u-meta">{all.length} files shared with students</div>
        <Btn variant="secondary" size="sm" icon="plus" onClick={() => setUploading(true)}>Upload material</Btn>
      </div>
      <Card>
        <div className="u-list" style={{ padding: "4px 0" }}>
          {all.map((m, i) => (
            <div key={i} className="u-row" style={{ gap: 13, padding: "13px 18px", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <span className="u-icon u-icon--plain"><Icon name="doc" size={15} /></span>
              <div className="u-grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div className="u-meta">{m.type} · {m.size} · posted {m.date}</div>
              </div>
              {i < extra.length && <Tag variant="success">New</Tag>}
            </div>
          ))}
        </div>
      </Card>
      {uploading && (
        <Modal onClose={() => setUploading(false)}>
          <ModalHead title="Upload material" sub={code} onClose={() => setUploading(false)} />
          <div className="u-pad u-stack" style={{ gap: 14 }}>
            <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => {
              const f = e.target.files[0]; if (!f) return;
              const ext = (f.name.split(".").pop() || "").toUpperCase();
              actions.addMaterial(code, { name: f.name, type: ext || "DOC", size: (f.size / 1048576).toFixed(1) + " MB", date: "just now" });
              setUploading(false);
            }} />
            <button className="u-row" onClick={() => inputRef.current?.click()}
              style={{ width: "100%", gap: 12, padding: "20px 16px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-sunken)", cursor: "pointer", color: "inherit", textAlign: "left" }}>
              <span className="u-icon"><Icon name="download" size={16} /></span>
              <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>Choose a file to share</div><div className="u-meta">PDF, PPTX, ZIP, DOCX — up to 50 MB</div></div>
            </button>
            <div className="u-meta" style={{ textAlign: "center" }}>Demo only — your file is not uploaded anywhere.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---- announcements ---- */
function StaffStream({ code, store, actions }) {
  const { staffContentFor, STAFF } = window.STAFF_DATA;
  const base = staffContentFor(code).posts;
  const extra = (store.staff && store.staff.posts && store.staff.posts[code]) || [];
  const all = [...extra, ...base];
  const [body, setBody] = React.useState("");

  return (
    <div className="u-stack" style={{ gap: 14, maxWidth: 720 }}>
      <Card className="u-pad">
        <Field label="Post an announcement to the class">
          <textarea className="fb-textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share an update, reminder or resource with all enrolled students…" />
        </Field>
        <div className="u-row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
          <Btn variant="accent" icon="bell" disabled={!body.trim()} onClick={() => { actions.postAnnouncement(code, body.trim()); setBody(""); }}>Post to class</Btn>
        </div>
      </Card>
      {all.length === 0 ? <Empty icon="bell" title="No announcements yet" sub="Posts you share appear here and in every student's class stream." /> : all.map((p, i) => {
        const initials = (window.STAFF_DATA.STAFF.initials);
        return (
          <Card key={i} className="u-pad">
            <div className="u-row" style={{ gap: 11, marginBottom: 10 }}>
              <Avatar initials={initials} size={36} />
              <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.who || STAFF.name}</div><div className="u-meta">{p.time}</div></div>
              {i < extra.length && <Tag variant="success">Posted</Tag>}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg-muted)" }}>{p.body}</div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------- results & approvals ---------------- */
function StaffResults({ store, actions, go }) {
  const { STAFF_COURSES, ROSTERS, ENROLLED } = window.STAFF_DATA;

  return (
    <div className="u-content">
      <PageHead title="Results & Approvals" sub="Submit course results through the approval workflow" />

      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Approval flow:</span>
          {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}
              <Tag>{s}</Tag>
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="u-stack" style={{ gap: 14 }}>
        {STAFF_COURSES.map((c) => {
          const status = resultStatus(store, c.code);
          const roster = ROSTERS[c.code];
          const rows = roster.map((stu) => {
            const sc = effScore(store, c.code, stu.matric, stu);
            return (sc.ca == null || sc.exam == null) ? null : sc.ca + sc.exam;
          });
          const entered = rows.filter((t) => t != null);
          const complete = entered.length === roster.length;
          const pass = entered.filter((t) => t >= 40).length;
          const passRate = entered.length ? Math.round((pass / entered.length) * 100) : 0;
          const stepIndex = status === "approved" ? 4 : status === "submitted" ? 1 : 0;

          return (
            <Card key={c.code} className="u-pad">
              <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 14 }}>
                <div className="u-row" style={{ gap: 14, minWidth: 0 }}>
                  <span className="u-icon" style={{ width: 40, height: 40 }}><Icon name="chart" size={18} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 700 }}>{c.code}</span><Tag>{c.level}</Tag></div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div className="u-meta" style={{ marginTop: 2 }}>{ENROLLED[c.code]} students · {complete ? "all scores entered" : entered.length + "/" + roster.length + " scores entered"}{entered.length ? " · " + passRate + "% pass" : ""}</div>
                  </div>
                </div>
                <div className="u-stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  <Tag variant={status === "approved" ? "success" : status === "submitted" ? "accent" : "warning"} dot>
                    {status === "approved" ? "Approved & released" : status === "submitted" ? "Awaiting HOD" : "Draft"}
                  </Tag>
                  {status === "draft" && (
                    <Btn variant="accent" size="sm" icon="chart" disabled={!complete} onClick={() => actions.submitResults(c.code)}>
                      {complete ? "Submit for approval" : "Scores incomplete"}
                    </Btn>
                  )}
                  {status === "submitted" && (
                    <Btn variant="secondary" size="sm" onClick={() => actions.approveResults(c.code)}>▶ Simulate HOD approval</Btn>
                  )}
                </div>
              </div>

              <div className="u-steps u-wrap" style={{ marginTop: 16 }}>
                {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => {
                  const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
                  return (
                    <React.Fragment key={s}>
                      {i > 0 && <div className="u-step__line" />}
                      <div className="u-step" data-state={state}>
                        <span className="u-step__n">{state === "done" ? <Icon name="check" size={12} /> : i + 1}</span>
                        <span className="fb-hide-mobile">{s}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { StaffCourses, CourseManage, StaffResults, courseQueue });
