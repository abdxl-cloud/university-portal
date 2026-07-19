import React from "react";
const { Btn, Card, Empty, Field, Icon, PageHead, Ref, Seg, SkeletonBlock, Tag, useSkeleton } = window;
/* Portal screens: Results, Timetable, Profile, Support */

const GRADE_TONE = { A: "success", B: "accent", C: "accent", D: "warning", E: "warning", F: "danger" };

/* ---------- calendar export helpers ---------- */
function pad2(n) { return String(n).padStart(2, "0"); }
// Monday-of-semester-week anchor (Oct 2025) so weekly lectures get real dates
const TT_WEEK = { Monday: 6, Tuesday: 7, Wednesday: 8, Thursday: 9, Friday: 10 };
function icsDate(y, mo, d, h, mi) { return y + pad2(mo) + pad2(d) + "T" + pad2(h) + pad2(mi) + "00"; }

function buildICS(view) {
  const { TIMETABLE, STUDENT } = window.DATA;
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FUTECH//Student Portal//EN", "CALSCALE:GREGORIAN"];
  const ev = (uid, start, end, summary, loc, rrule) => {
    L.push("BEGIN:VEVENT", "UID:" + uid + "@futech.edu.ng", "DTSTART:" + start, "DTEND:" + end,
      "SUMMARY:" + summary, "LOCATION:" + loc);
    if (rrule) L.push("RRULE:" + rrule);
    L.push("END:VEVENT");
  };
  if (view === "lectures") {
    TIMETABLE.lectures.forEach((l, i) => {
      const h = parseInt(l.start, 10);
      const day = TT_WEEK[l.day];
      ev("lec" + i, icsDate(2025, 10, day, h, 0), icsDate(2025, 10, day, h + l.span, 0),
        l.code + ": Lecture", "Room " + l.room, "FREQ=WEEKLY;COUNT=13");
    });
  } else {
    TIMETABLE.exams.forEach((e, i) => {
      const dm = e.date.match(/([A-Za-z]+)\s(\d+)/); // "Dec 8"
      const day = parseInt(dm[2], 10);
      const [s, en] = e.time.split("–").map((t) => parseInt(t.trim(), 10));
      ev("exam" + i, icsDate(2025, 12, day, s, 0), icsDate(2025, 12, day, en, 0),
        e.code + " Exam: " + e.title, e.venue + " · Seat " + e.seat);
    });
  }
  L.push("END:VCALENDAR");
  return L.join("\r\n");
}
function downloadICS(view) {
  const blob = new Blob([buildICS(view)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "futech-" + view + ".ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function gcalLink(e) {
  const dm = e.date.match(/([A-Za-z]+)\s(\d+)/);
  const day = parseInt(dm[2], 10);
  const [s, en] = e.time.split("–").map((t) => parseInt(t.trim(), 10));
  const dates = icsDate(2025, 12, day, s, 0) + "/" + icsDate(2025, 12, day, en, 0);
  const p = new URLSearchParams({
    action: "TEMPLATE", text: e.code + " Exam: " + e.title, dates,
    location: e.venue + " · Seat " + e.seat, details: "FUTECH first-semester examination.",
  });
  return "https://calendar.google.com/calendar/render?" + p.toString();
}

/* ---------- GPA trend chart ---------- */
function GpaChart() {
  const { GPA_HISTORY, STUDENT } = window.DATA;
  const max = 5;
  const peak = Math.max(...GPA_HISTORY.map((g) => g.gpa));
  return (
    <Card className="u-pad">
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div className="u-h3">GPA trend</div>
          <div className="u-meta">Per semester · 5.00 scale</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="u-meta">Cumulative</div>
          <div className="u-h2 u-num" style={{ color: "var(--accent)" }}>{STUDENT.cgpa.toFixed(2)}</div>
        </div>
      </div>
      <div className="u-row" style={{ alignItems: "flex-end", gap: 14, height: 150, paddingTop: 6 }}>
        {GPA_HISTORY.map((g) => (
          <div key={g.term} className="u-grow u-stack" style={{ alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
            <div className="u-num" style={{ fontSize: 12, fontWeight: 600 }}>{g.gpa.toFixed(2)}</div>
            <div style={{ width: "100%", maxWidth: 46, height: (g.gpa / max) * 100 + "%", borderRadius: "6px 6px 0 0",
              background: g.gpa === peak ? "var(--accent)" : "var(--accent-soft)",
              border: "1px solid " + (g.gpa === peak ? "var(--accent)" : "var(--accent-border)"), borderBottom: 0,
              transition: "height .5s cubic-bezier(.4,.1,.2,1)" }} />
            <div className="u-meta" style={{ fontSize: 11, textAlign: "center", whiteSpace: "nowrap" }}>{g.term}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* current-semester results, generated deterministically from the student's
   registered courses once the exams office releases them */
function currentResults(store) {
  const { COURSES } = window.DATA;
  const GP = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
  const codes = store.registration.status === "approved" && store.registration.courses.length
    ? store.registration.courses
    : COURSES.filter((c) => c.carryover || c.type === "Core").map((c) => c.code);
  const courses = codes.map((code) => {
    const c = COURSES.find((x) => x.code === code) || { code, title: code, units: 2 };
    let h = 0;
    for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
    const score = 48 + (h % 42);
    const grade = score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : "E";
    return { code, title: c.title, units: c.units, score, grade, gp: GP[grade] };
  });
  const units = courses.reduce((s, c) => s + c.units, 0);
  const gpa = courses.reduce((s, c) => s + c.gp * c.units, 0) / (units || 1);
  return { session: "2025/2026", semester: "First Semester", level: "300 Level", gpa, released: true, courses };
}

function Results({ store, actions }) {
  const { RESULTS, STUDENT } = window.DATA;
  const options = [
    { value: "current", label: "Current · 300L" },
    ...RESULTS.map((r, i) => ({ value: String(i), label: r.session.slice(2) + " · " + r.semester.split(" ")[0] })),
  ];
  const [view, setView] = React.useState("current");
  const [issueFor, setIssueFor] = React.useState(null);
  // release policy: batch (whole level at once) or per-course drip, set by ICT
  const relMode = (store.session && store.session.releaseMode) || "batch";
  const lvlStage = window.rstate(store, "levels", "stage", "CSC-300L", "compiling");
  const pubc = (store.roles && store.roles.exams && store.roles.exams.pubc) || {};
  const full = lvlStage === "published" || !!(store.session && store.session.results);
  const cur = currentResults(store);
  const releasedCourses = full ? cur.courses : (relMode === "course" ? cur.courses.filter((c) => pubc[c.code]) : []);
  const released = releasedCourses.length > 0;
  const curView = (() => {
    if (!released) return null;
    if (full) return cur;
    const units = releasedCourses.reduce((a, c) => a + c.units, 0);
    const gpa = releasedCourses.reduce((a, c) => a + c.gp * c.units, 0) / (units || 1);
    return { ...cur, courses: releasedCourses, gpa, provisional: true, releasedCount: releasedCourses.length, totalCount: cur.courses.length };
  })();

  return (
    <div className="u-content">
      <PageHead title="Results" sub="Academic performance & grades">
        <Btn variant="secondary" icon="chart" onClick={() => window.showDetail("student", { name: STUDENT.name, matric: STUDENT.matric, level: "300L" })}>Full academic record</Btn>
      </PageHead>

      <div className="u-grid u-grid--3" style={{ marginBottom: 16 }}>
        <Card className="u-pad"><Stat icon="chart" k="Cumulative GPA" v={STUDENT.cgpa.toFixed(2)} sub="On a 5.00 scale" accent /></Card>
        <Card className="u-pad"><Stat icon="cap" k="Class of degree" v="Second Class · Upper" sub="Projected" /></Card>
        <Card className="u-pad"><Stat icon="shield" k="Academic standing" v={STUDENT.standing} sub="No probation" /></Card>
      </div>

      <div style={{ marginBottom: 16 }}><GpaChart /></div>

      <div style={{ marginBottom: 14, display: "flex" }}>
        <Seg value={view} onChange={setView} options={options} />
      </div>

      {view === "current" ? (
        released ? (
          <ResultTable r={curView} store={store} onIssue={setIssueFor} />
        ) : (
          <Card className="u-pad">
            <Empty icon="clock" title="Results not yet released"
              sub="Your 300 Level first semester results will appear here once they have passed departmental scrutiny, the School Board and Senate, and Exams & Records releases them." />
          </Card>
        )
      ) : (
        <ResultTable r={RESULTS[Number(view)]} store={store} onIssue={setIssueFor} />
      )}
      {issueFor && <RaiseIssueModal course={issueFor} actions={actions} onClose={() => setIssueFor(null)} />}
    </div>
  );
}

function ResultTable({ r, store, onIssue }) {
  const [q, setQ] = React.useState("");
  const loading = useSkeleton();
  const issueOf = (code) => ((store && store.resultIssues) || []).find((i) => i.code === code);
  const ISSUE_TONE = { open: "warning", investigating: "accent", resolved: "success" };
  const query = q.trim().toLowerCase();
  const courses = r.courses.filter((c) => !query || c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query));
  return (
    <Card>
      <div className="u-pad" style={{ paddingBottom: 12 }}>
        <div className="u-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="u-h3">{r.session} · {r.semester}</div>
            <div className="u-meta">{r.level}</div>
          </div>
          <div className="u-row" style={{ gap: 18 }}>
            <div style={{ textAlign: "right" }}>
              <div className="u-meta">Semester GPA{r.provisional ? " (provisional)" : ""}</div>
              <div className="u-h2 u-num">{r.gpa.toFixed(2)}</div>
            </div>
            {r.provisional
              ? <Tag variant="warning" dot>Provisional · {r.releasedCount} of {r.totalCount} courses</Tag>
              : <Tag variant="success" dot>Released</Tag>}
          </div>
        </div>
      </div>
      <div className="u-table-toolbar">
        <label className="u-stack u-table-search" style={{ gap: 5 }}>
          <span className="u-meta">Search results</span>
          <input className="fb-input" placeholder="Course code or title" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <span className="u-meta">{courses.length} of {r.courses.length} courses</span>
      </div>
      <div className="u-table-scroll">
        <table className="u-table">
          <thead>
            <tr><th>Code</th><th>Course</th><th className="u-right">Units</th><th className="u-right">Score</th><th className="u-right">Grade</th>{onIssue && <th className="u-right">Issue?</th>}</tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={"sk" + i}>
                <td><SkeletonBlock w={56} /></td>
                <td><SkeletonBlock w="70%" /></td>
                <td className="u-right"><SkeletonBlock w={24} /></td>
                <td className="u-right"><SkeletonBlock w={24} /></td>
                <td className="u-right"><SkeletonBlock w={30} /></td>
                {onIssue && <td className="u-right"><SkeletonBlock w={70} /></td>}
              </tr>
            ))}
            {!loading && courses.map((c) => {
              const issue = issueOf(c.code);
              return (
                <tr key={c.code} style={{ cursor: "pointer" }} onClick={() => window.showDetail("student", { name: window.DATA.STUDENT.name, matric: window.DATA.STUDENT.matric, level: "300L", fromCourse: c.code, score: c.score, grade: c.grade })}>
                  <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                  <td>{c.title}</td>
                  <td className="u-right u-num">{c.units}</td>
                  <td className="u-right u-num">{c.score}</td>
                  <td className="u-right"><Tag variant={GRADE_TONE[c.grade]}>{c.grade}</Tag></td>
                  {onIssue && (
                    <td className="u-right">
                      {issue
                        ? <Tag variant={ISSUE_TONE[issue.status]} dot>{issue.status === "resolved" ? "Resolved" : issue.status === "investigating" ? "Investigating" : "Issue raised"}</Tag>
                        : <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onIssue(c); }}>Report issue</Btn>}
                    </td>
                  )}
                </tr>
              );
            })}
            {courses.length === 0 && <tr><td colSpan={onIssue ? 6 : 5}><Empty title="No matching results" sub="Search by course code or title." /></td></tr>}
          </tbody>
        </table>
      </div>
      {r.provisional && <div className="u-meta" style={{ padding: "0 22px 14px" }}>Remaining courses are still being released by Exams &amp; Records. GPA and CGPA finalise when the full level is out.</div>}
    </Card>
  );
}

/* dispute a released result: lands in the Exams & Records issues queue */
function RaiseIssueModal({ course, actions, onClose }) {
  const [category, setCategory] = React.useState("Missing CA");
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState(false);
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Report a result issue" sub={course.code + " · " + course.title} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        {sent ? (
          <div className="u-row" style={{ gap: 10, padding: "8px 0" }}>
            <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="check" size={16} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Issue submitted</div>
              <div className="u-meta">Exams &amp; Records will investigate and you'll be notified of the resolution. Track it on this page.</div>
            </div>
          </div>
        ) : (
          <>
            <Field label="What kind of issue?">
              <Seg value={category} onChange={setCategory} options={["Missing CA", "Wrong score", "Missing result", "Other"].map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Describe the problem">
              <textarea className="fb-textarea" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I submitted all three assignments but my CA reads 8/30…" />
            </Field>
            <Btn variant="accent" size="lg" disabled={!text.trim()} onClick={() => { actions.raiseResultIssue({ code: course.code, category, text: text.trim() }); setSent(true); }} style={{ width: "100%" }}>Submit to Exams &amp; Records</Btn>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ============ TIMETABLE ============ */
function Timetable({ store }) {
  const { TIMETABLE } = window.DATA;
  const [view, setView] = React.useState("lectures");

  return (
    <div className="u-content">
      <PageHead title="Timetable" sub="Personalised to your registered courses">
        <Seg value={view} onChange={setView} options={[{ value: "lectures", label: "Lectures" }, { value: "exams", label: "Exams" }]} />
        <Btn variant="secondary" icon="download" onClick={() => downloadICS(view)}>Export .ics</Btn>
      </PageHead>
      <div className="u-meta" style={{ marginTop: -12, marginBottom: 16 }}>
        Add to Apple/Google Calendar: downloads your {view === "lectures" ? "weekly lectures" : "exam schedule"} as a calendar file.
      </div>

      {view === "lectures" ? (
        <Card className="u-pad" style={{ overflowX: "auto" }}>
          <div className="u-tt" style={{ minWidth: 620 }}>
            <div />
            {TIMETABLE.days.map((d) => <div key={d} className="u-tt__h">{d.slice(0, 3)}</div>)}
            {TIMETABLE.periods.map((p, pi) => (
              <React.Fragment key={p}>
                <div className="u-tt__time">{p}</div>
                {TIMETABLE.days.map((d) => {
                  const ev = TIMETABLE.lectures.find((l) => l.day === d && l.start === p);
                  const covered = TIMETABLE.lectures.find((l) => l.day === d && l.span === 2 && TIMETABLE.periods.indexOf(l.start) === pi - 1);
                  if (covered) return null;
                  // dean/hod events in this slot (a span-2 lecture also absorbs the next period's events)
                  const evs = window.eventsAt(store, "students", d, p);
                  if (ev && ev.span === 2) evs.push(...window.eventsAt(store, "students", d, TIMETABLE.periods[pi + 1]));
                  return (
                    <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined, display: "flex", flexDirection: "column" }}>
                      {ev && (
                        <div className="u-tt__ev" style={{ flex: 1 }}>
                          <span className="c"><Ref type="course" k={ev.code} mono strong>{ev.code}</Ref></span>
                          <span className="r"><Ref type="venue" k={ev.room}>{ev.room}</Ref></span>
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
      ) : (
        <Card>
          <div className="u-table-scroll">
            <table className="u-table">
              <thead>
                <tr><th>Date</th><th>Course</th><th>Time</th><th>Venue</th><th className="u-right">Seat</th><th className="u-right">Calendar</th></tr>
              </thead>
              <tbody>
                {TIMETABLE.exams.map((e) => (
                  <tr key={e.code}>
                    <td style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{e.date}</td>
                    <td><div className="fb-mono" style={{ fontWeight: 600, fontSize: 12.5 }}><Ref type="course" k={e.code} mono strong>{e.code}</Ref></div><div className="u-meta">{e.title}</div></td>
                    <td className="u-num" style={{ whiteSpace: "nowrap" }}>{e.time}</td>
                    <td><Ref type="venue" k={e.venue}>{e.venue}</Ref></td>
                    <td className="u-right fb-mono">{e.seat}</td>
                    <td className="u-right"><a className="fb-link" href={gcalLink(e)} target="_blank" rel="noopener" style={{ whiteSpace: "nowrap" }}>+ Google</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============ PROFILE ============ */
/* official transcript request: destination + copies, paid via the charges flow */
function TranscriptModal({ store, actions, onClose }) {
  const { fmt } = window.DATA;
  const PRICE = 7500;
  const [destination, setDestination] = React.useState("");
  const [copies, setCopies] = React.useState(1);
  const [processing, setProcessing] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const total = PRICE * copies;
  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      actions.payCharge({ label: "Official Transcript: " + destination.trim(), amount: total, category: "Documents", method: "Debit card" });
      setProcessing(false); setDone(true);
    }, 1100);
  };
  return (
    <Modal onClose={() => !processing && onClose()}>
      <ModalHead title="Request official transcript" sub={fmt(PRICE) + " per copy · processed by Exams & Records"} onClose={() => !processing && onClose()} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        {done ? (
          <div className="u-row" style={{ gap: 10, padding: "8px 0" }}>
            <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="check" size={16} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Request submitted</div>
              <div className="u-meta">Paid {fmt(total)} · {copies} {copies === 1 ? "copy" : "copies"} to {destination}. Exams & Records will process and dispatch it: the receipt is under Finance.</div>
            </div>
          </div>
        ) : (
          <>
            <Field label="Destination (institution / employer)">
              <input className="fb-input" autoFocus value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. University of Toronto: Graduate Admissions" />
            </Field>
            <Field label="Copies">
              <Seg value={String(copies)} onChange={(v) => setCopies(Number(v))} options={[1, 2, 3].map((n) => ({ value: String(n), label: n + (n === 1 ? " copy" : " copies") }))} />
            </Field>
            <div className="u-slip__row" style={{ borderTop: "1px solid var(--border-strong)" }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700 }} className="u-num">{fmt(total)}</span>
            </div>
            <Btn variant="accent" size="lg" disabled={!destination.trim() || processing} onClick={pay} style={{ width: "100%" }}>
              {processing ? "Processing…" : "Pay " + fmt(total) + " & request"}
            </Btn>
            <div className="u-meta" style={{ textAlign: "center" }}>Demo only: no real payment is made.</div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* deferment: the one student case type that genuinely starts with the
   student (Absconded/Suspended/DEX/Teaching Practice stay department-raised).
   Reviewed by the level adviser; see App.jsx decideDeferment for what an
   approval actually does downstream. */
const DEFERMENT_REASONS = ["Medical", "Financial", "Personal", "Other"];
function defermentErrors(details) {
  return { details: details.trim().length < 20 ? "Please explain your situation in at least 20 characters." : "" };
}
function DefermentModal({ actions, onClose }) {
  const [reason, setReason] = React.useState(DEFERMENT_REASONS[0]);
  const [details, setDetails] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [touched, setTouched] = React.useState(false);
  const inputRef = React.useRef(null);
  const errs = defermentErrors(details);
  const submit = () => {
    setTouched(true);
    if (errs.details) return;
    actions.requestDeferment(reason, details.trim(), file);
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Request a deferment" sub="Reviewed by your level adviser" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Reason">
          <Seg value={reason} onChange={setReason} options={DEFERMENT_REASONS.map((r) => ({ value: r, label: r }))} />
        </Field>
        <Field label="Details" error={touched ? errs.details : ""} hint={touched && errs.details ? undefined : "Your adviser needs this to decide."}>
          <textarea className="fb-input" rows={4} data-invalid={touched && !!errs.details}
            value={details} onChange={(e) => setDetails(e.target.value)} onBlur={() => setTouched(true)}
            placeholder="e.g. I have been hospitalised since…" />
        </Field>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Supporting document (optional)</div>
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0]?.name || null)} />
          <button type="button" className="u-row" onClick={() => inputRef.current?.click()}
            style={{ width: "100%", gap: 12, padding: "14px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-sunken)", cursor: "pointer", color: "inherit", textAlign: "left" }}>
            <span className="u-icon"><Icon name="doc" size={16} /></span>
            <div className="u-grow">
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{file || "Attach a medical letter, admission note, etc."}</div>
              <div className="u-meta">PDF, JPG, PNG: up to 10 MB</div>
            </div>
            {file && <Icon name="check" size={16} style={{ color: "var(--success)" }} />}
          </button>
        </div>
        <div className="u-meta">Approving excludes this semester from your GPA. You'll be notified either way. Demo only: your file is not uploaded anywhere.</div>
        <Btn variant="accent" size="lg" onClick={submit} style={{ width: "100%" }}>Submit request</Btn>
      </div>
    </Modal>
  );
}

function AcademicStatusCard({ store, onRequest }) {
  const d = store.deferment || { status: "none" };
  return (
    <Card className="u-pad" style={{ marginTop: 16 }}>
      <div className="u-row u-wrap" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div className="u-h3" style={{ marginBottom: 2 }}>Academic status</div>
          <div className="u-meta">
            {d.status === "none" && "In good standing this semester."}
            {d.status === "pending" && "Deferment request pending your level adviser's review."}
            {d.status === "approved" && "Deferment approved: this semester is excluded from your GPA."}
            {d.status === "declined" && "Your last deferment request was declined" + (d.note ? ": " + d.note : ".")}
          </div>
        </div>
        {d.status === "pending" && <Tag variant="warning" dot>Pending</Tag>}
        {d.status === "approved" && <Tag variant="accent" dot>Approved</Tag>}
        {(d.status === "none" || d.status === "declined") && (
          <Btn variant="secondary" size="sm" onClick={onRequest}>Request deferment</Btn>
        )}
      </div>
    </Card>
  );
}

function Profile({ store, actions }) {
  const { STUDENT } = window.DATA;
  const [transcriptOpen, setTranscriptOpen] = React.useState(false);
  const [defermentOpen, setDefermentOpen] = React.useState(false);
  const bio = [
    ["Full name", STUDENT.name], ["Matriculation no.", STUDENT.matric], ["JAMB reg. no.", STUDENT.jamb],
    ["Programme", STUDENT.programme], ["Department", STUDENT.department], ["Faculty", (window.ORG && window.ORG.facultyNameOf(STUDENT.department)) || STUDENT.faculty],
    ["Level", STUDENT.level], ["Mode of entry", STUDENT.entryMode], ["Gender", STUDENT.gender],
    ["Email", STUDENT.email], ["Phone", STUDENT.phone], ["Academic standing", STUDENT.standing],
  ];
  return (
    <div className="u-content u-content--narrow">
      <PageHead title="My Profile" sub="Your official student record">
        <Btn variant="secondary" icon="doc" onClick={() => setTranscriptOpen(true)}>Request transcript</Btn>
      </PageHead>
      {transcriptOpen && <TranscriptModal store={store} actions={actions} onClose={() => setTranscriptOpen(false)} />}
      {defermentOpen && <DefermentModal actions={actions} onClose={() => setDefermentOpen(false)} />}
      <Card className="u-pad">
        <div className="u-row" style={{ gap: 16, marginBottom: 20 }}>
          <Avatar initials={STUDENT.initials} size={64} />
          <div className="u-grow">
            <div className="u-h2">{STUDENT.name}</div>
            <div className="u-muted" style={{ fontSize: 13.5 }}>{STUDENT.programme} · {STUDENT.level}</div>
          </div>
          <Tag variant="success" dot>Active</Tag>
        </div>
        <div className="u-grid u-grid--2" style={{ rowGap: 0, columnGap: 36 }}>
          {bio.map(([k, v]) => (
            <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="k">{k}</span><span className="v">{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <AcademicStatusCard store={store} onRequest={() => setDefermentOpen(true)} />
    </div>
  );
}

/* ============ SUPPORT ============ */
function Support() {
  const cats = [
    ["wallet", "Payment issue", "Fees not reflecting, double charge, refunds"],
    ["chart", "Result issue", "Missing result, wrong score, computation"],
    ["bed", "Hostel issue", "Allocation, payment, room change"],
    ["book", "Registration issue", "Course errors, adviser approval"],
    ["user", "Portal access", "Login, password reset, profile"],
    ["doc", "Documents", "Transcript, admission letter, ID card"],
  ];
  const tickets = [
    { id: "TKT-4821", subj: "School fees payment not reflecting", cat: "Payment", status: "Resolved", tone: "success", date: "2 weeks ago" },
    { id: "TKT-4977", subj: "Request to change hostel room", cat: "Hostel", status: "In progress", tone: "warning", date: "3 days ago" },
  ];
  return (
    <div className="u-content">
      <PageHead title="Support" sub="Submit a complaint and track it: no office queues" />
      <div className="u-grid u-grid--3" style={{ marginBottom: 22 }}>
        {cats.map(([ic, t, d]) => (
          <button key={t} className="u-tile" onClick={() => {}}>
            <span className="u-icon"><Icon name={ic} size={16} /></span>
            <div><div className="u-tile__t">{t}</div><div className="u-tile__d">{d}</div></div>
          </button>
        ))}
      </div>
      <div className="u-h3" style={{ marginBottom: 12 }}>Your tickets</div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Status</th><th className="u-right">Updated</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="fb-mono" style={{ fontWeight: 600 }}>{t.id}</td>
                  <td>{t.subj}</td>
                  <td className="u-muted">{t.cat}</td>
                  <td><Tag variant={t.tone} dot>{t.status}</Tag></td>
                  <td className="u-right u-meta">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Results, Timetable, Profile, Support, currentResults });
