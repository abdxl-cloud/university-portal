/* Staff portal: course management & results approval */
import React from "react";
import { Icon } from "../../components/icons";
import { Avatar, Btn, Card, ConfirmButton, Empty, Field, IconBtn, Modal, ModalHead, PageHead, Seg, SkeletonBlock, Tag, useSkeleton } from "../../components/ui";
import {
  COURSE_META, ENROLLED, ROSTERS, STAFF, STAFF_COURSES, STAFF_SUBMISSIONS, staffContentFor,
} from "../../data/staff-data";
import type { Assignment, RosterEntry, StaffCourse, Submission } from "../../data/staff-data";
import { SGRADE_TONE, effScore, gradeOf, resultNote, resultStatus } from "./staff";
import type { Score } from "./staff";
import type { Store } from "../../store/types";
import type { Actions } from "../../store/store";
import type { TagVariant } from "../../types";

export interface StaffCoursesProps {
  store: Store;
  actions: Actions;
  go: (route: string) => void;
}

export function StaffCourses({ store, actions }: StaffCoursesProps) {
  const [open, setOpen] = React.useState<string | null>(() => {
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
          const st = resultStatus(store, c.code);
          const tone: TagVariant = st === "approved" ? "success" : st === "query" ? "danger" : st === "submitted" ? "accent" : "warning";
          const q = courseQueue(store, c.code);
          return (
            <Card key={c.code} className="u-pad" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }} onClick={() => setOpen(c.code)}>
              <div className="u-row" style={{ justifyContent: "space-between" }}>
                <span className="u-icon"><Icon name="book" size={16} /></span>
                {q > 0 ? <Tag variant="warning" dot>{q} to grade</Tag> : <Tag variant={tone} dot>{st === "draft" ? "Results due" : st === "query" ? "Returned" : st === "submitted" ? "Submitted" : "Approved"}</Tag>}
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

export function courseQueue(store: Store, code: string): number {
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

interface CourseManageProps {
  code: string;
  store: Store;
  actions: Actions;
  onBack: () => void;
}

type ManageTab = "roster" | "assignments" | "materials" | "stream";

export function CourseManage({ code, store, actions, onBack }: CourseManageProps) {
  const course: StaffCourse = STAFF_COURSES.find((c) => c.code === code) || COURSE_META[code] || { code, title: code, units: 0, level: "", venue: "", day: "" };
  const [tab, setTab] = React.useState<ManageTab>("roster");
  const q = courseQueue(store, code);
  const tabs: { value: ManageTab; label: string }[] = [
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

interface TabProps {
  code: string;
  store: Store;
  actions: Actions;
}

/* ---- roster + score entry ---- */
function RosterScores({ code, store, actions }: TabProps) {
  const roster = ROSTERS[code];
  const status = resultStatus(store, code);
  const note = resultNote(store, code);
  const locked = status !== "draft" && status !== "query";
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [importMsg, setImportMsg] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const importRef = React.useRef<HTMLInputElement>(null);
  const loading = useSkeleton(450, [code]);

  // EO workflow: lecturers get a fixed template, fill scores offline, import back
  const downloadTemplate = () => {
    const head = "matric,name,ca_30,exam_70";
    const lines = roster.map((stu) => stu.matric + "," + stu.name.replace(/,/g, " ") + ",,");
    const blob = new Blob([head + "\n" + lines.join("\n") + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = code.replace(/\s+/g, "") + "-score-template.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importScores = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      let applied = 0, unknown = 0;
      lines.forEach((line) => {
        if (/matric/i.test(line)) return;
        const [matric, , ca, exam] = line.split(",").map((x) => (x || "").trim());
        const stu = roster.find((r) => r.matric === matric);
        if (!stu) { if (matric) unknown++; return; }
        if (ca !== "") actions.setScore(code, matric, "ca", Math.max(0, Math.min(30, parseInt(ca, 10) || 0)));
        if (exam !== "") actions.setScore(code, matric, "exam", Math.max(0, Math.min(70, parseInt(exam, 10) || 0)));
        if (ca !== "" || exam !== "") applied++;
      });
      setImportMsg("Imported scores for " + applied + " student" + (applied === 1 ? "" : "s") + (unknown ? " · " + unknown + " unmatched matric no(s) skipped" : "") + ". Grades computed automatically.");
    };
    reader.readAsText(file);
  };

  const setScore = (matric: string, field: "ca" | "exam", raw: string) => {
    const max = field === "ca" ? 30 : 70;
    const v = raw === "" ? null : Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    actions.setScore(code, matric, field, v);
    setSavedAt(Date.now());
  };

  const rows = roster.map((stu) => {
    const sc = effScore(store, code, stu.matric, stu as Score);
    const total = (sc.ca == null || sc.exam == null) ? null : sc.ca + sc.exam;
    return { ...stu, ...sc, total, grade: gradeOf(total) };
  });
  const query = q.trim().toLowerCase();
  const visibleRows = rows.filter((r) => !query || r.name.toLowerCase().includes(query) || r.matric.toLowerCase().includes(query));
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
            <div><div className="u-meta">Status</div><Tag variant={status === "approved" ? "success" : status === "query" ? "danger" : locked ? "accent" : "warning"} dot>{status === "approved" ? "Approved" : status === "query" ? "Returned" : locked ? "Submitted" : "Draft"}</Tag></div>
          </div>
          <div className="u-row u-wrap" style={{ gap: 8 }}>
            {savedAt && !locked && <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="check" size={13} style={{ color: "var(--success)" }} /> Saved</span>}
            {!locked && <Btn variant="secondary" size="sm" icon="download" onClick={downloadTemplate}>Download template</Btn>}
            {!locked && (
              <>
                <input ref={importRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importScores(f); e.target.value = ""; }} />
                <Btn variant="secondary" size="sm" icon="doc" onClick={() => importRef.current && importRef.current.click()}>Import scores</Btn>
              </>
            )}
            {!locked && (
              <Btn variant="accent" icon="chart" disabled={!allDone}
                onClick={() => actions.submitResults(code)}>
                {!allDone ? "Enter all scores to submit" : status === "query" ? "Resubmit results" : "Submit results for approval"}
              </Btn>
            )}
          </div>
        </div>
        {status === "query" && note && (
          <div className="u-formerr" style={{ marginTop: 12 }}>
            <Icon name="info" size={14} />
            <span>Exams &amp; Records returned this sheet: “{note}”</span>
          </div>
        )}
        {importMsg && !locked && <div className="u-meta" style={{ marginTop: 10 }}><Icon name="check" size={13} style={{ color: "var(--success)" }} /> {importMsg}</div>}
        {!locked && !importMsg && status !== "query" && <div className="u-meta" style={{ marginTop: 10 }}>Fill scores here, or download the template, complete it offline and import: grades are computed on import.</div>}
        {locked && <div className="u-meta" style={{ marginTop: 10 }}>{status === "submitted" ? "Results submitted for departmental scrutiny: scores are locked pending approval." : "Results approved and released: scores are locked."}</div>}
      </Card>

      <Card>
        <div className="u-table-toolbar">
          <label className="u-stack u-table-search" style={{ gap: 5 }}>
            <span className="u-meta">Search score sheet</span>
            <input className="fb-input" placeholder="Student name or matric number" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <span className="u-meta">{visibleRows.length} of {rows.length} students</span>
        </div>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead>
              <tr><th>Matric</th><th>Student</th><th className="u-right">CA / 30</th><th className="u-right">Exam / 70</th><th className="u-right">Total</th><th className="u-right">Grade</th></tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={"sk" + i}>
                  <td><SkeletonBlock w={80} /></td>
                  <td><SkeletonBlock w="65%" /></td>
                  <td className="u-right"><SkeletonBlock w={30} /></td>
                  <td className="u-right"><SkeletonBlock w={30} /></td>
                  <td className="u-right"><SkeletonBlock w={30} /></td>
                  <td className="u-right"><SkeletonBlock w={24} /></td>
                </tr>
              ))}
              {!loading && visibleRows.map((r) => (
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
                      placeholder="Enter score" />
                  </td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{r.total == null ? "Not available" : r.total}</td>
                  <td className="u-right">{r.total == null ? <span className="u-muted">Not available</span> : <Tag variant={SGRADE_TONE[r.grade as Exclude<ReturnType<typeof gradeOf>, "Not available">]}>{r.grade}</Tag>}</td>
                </tr>
              ))}
              {visibleRows.length === 0 && <tr><td colSpan={6}><Empty icon="user" title="No matching students" sub="Search by student name or matric number." /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---- assignments + grading ---- */
function StaffAssignments({ code, store, actions }: TabProps) {
  const base = staffContentFor(code);
  const extra = (store.staff && store.staff.assignments && store.staff.assignments[code]) || [];
  const assignments: Assignment[] = [...base.assignments, ...extra];
  const subs = STAFF_SUBMISSIONS[code] || {};
  const [openA, setOpenA] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [reviewing, setReviewing] = React.useState<{ a: Assignment; s: Submission } | null>(null);

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

interface CreateAssignmentModalProps {
  code: string;
  actions: Actions;
  onClose: () => void;
}

function CreateAssignmentModal({ code, actions, onClose }: CreateAssignmentModalProps) {
  const [title, setTitle] = React.useState("");
  const [due, setDue] = React.useState("");
  const [points, setPoints] = React.useState(20);
  const valid = title.trim() && due.trim();
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Create assignment" sub={code} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Title"><input className="fb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assignment 3: Indexing" /></Field>
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
function genDocPages(sub: Submission, assignment: Assignment): string[][] {
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
  void assignment;
  const pages: string[][] = [];
  const nPages = 2 + Math.floor(rnd() * 2); // 2-3 pages
  for (let p = 0; p < nPages; p++) {
    const paras: string[] = [];
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

interface SubmissionReviewProps {
  assignment: Assignment;
  sub: Submission;
  store: Store;
  actions: Actions;
  onClose: () => void;
}

function SubmissionReview({ assignment, sub, store, actions, onClose }: SubmissionReviewProps) {
  const ext = (sub.fileName?.split(".").pop() || "pdf").toUpperCase();
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
          <IconBtn name="x" onClick={onClose} aria-label="Close" />
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
                  <div className="u-meta" style={{ textAlign: "center", marginTop: 12 }}>: {pi + 1} :</div>
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
                        <ConfirmButton size="sm" title="Delete this comment?" body="This feedback comment will be permanently removed." onConfirm={() => actions.removeFeedback(assignment.id, sub.matric, c.id)}>Delete</ConfirmButton>
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

function StaffMaterials({ code, store, actions }: TabProps) {
  const base = staffContentFor(code).materials;
  const extra = (store.staff && store.staff.materials && store.staff.materials[code]) || [];
  const all = [...extra, ...base];
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
              const f = e.target.files?.[0]; if (!f) return;
              const ext = (f.name.split(".").pop() || "").toUpperCase();
              actions.addMaterial(code, { name: f.name, type: ext || "DOC", size: (f.size / 1048576).toFixed(1) + " MB", date: "just now" });
              setUploading(false);
            }} />
            <button className="u-row" onClick={() => inputRef.current?.click()}
              style={{ width: "100%", gap: 12, padding: "20px 16px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-sunken)", cursor: "pointer", color: "inherit", textAlign: "left" }}>
              <span className="u-icon"><Icon name="download" size={16} /></span>
              <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>Choose a file to share</div><div className="u-meta">PDF, PPTX, ZIP, DOCX: up to 50 MB</div></div>
            </button>
            <div className="u-meta" style={{ textAlign: "center" }}>Demo only: your file is not uploaded anywhere.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---- announcements ---- */
function StaffStream({ code, store, actions }: TabProps) {
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
      {all.length === 0 ? <Empty icon="bell" title="No announcements yet" sub="Posts you share appear here and in every student's class stream." /> : all.map((p, i) => (
        <Card key={i} className="u-pad">
          <div className="u-row" style={{ gap: 11, marginBottom: 10 }}>
            <Avatar initials={STAFF.initials} size={36} />
            <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.who || STAFF.name}</div><div className="u-meta">{p.time}</div></div>
            {i < extra.length && <Tag variant="success">Posted</Tag>}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg-muted)" }}>{p.body}</div>
        </Card>
      ))}
    </div>
  );
}
