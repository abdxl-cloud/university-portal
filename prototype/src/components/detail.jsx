import React from "react";
const { Avatar, Icon, Modal, ModalHead, Tag } = window;
/* Global detail popups (course / lecturer / venue) + notifications panel */

// fire from anywhere: showDetail("course", "CSC 301")
function showDetail(type, key) {
  window.dispatchEvent(new CustomEvent("futech:detail", { detail: { type, key } }));
}

// clickable inline reference
function Ref({ type, k, children, mono, strong }) {
  return (
    <span className="u-ref" role="button" tabIndex={0} data-mono={!!mono} data-strong={!!strong}
      onClick={(e) => { e.stopPropagation(); showDetail(type, k); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); showDetail(type, k); } }}>
      {children || k}
    </span>
  );
}

function Row({ k, v }) {
  return (
    <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
      <span className="k">{k}</span><span className="v">{v}</span>
    </div>
  );
}

function CourseDetail({ code }) {
  const { COURSES } = window.DATA;
  const c = COURSES.find((x) => x.code === code);
  if (!c) return null;
  const tone = { Core: "accent", Elective: undefined, GST: undefined, Carryover: "danger" }[c.type];
  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
        <span className="u-icon"><Icon name="book" size={16} /></span>
        <div className="u-grow">
          <div className="u-row" style={{ gap: 8 }}>
            <span className="fb-mono" style={{ fontWeight: 700, fontSize: 15 }}>{c.code}</span>
            <Tag variant={tone}>{c.type}</Tag>
          </div>
          <div style={{ fontWeight: 500, marginTop: 2 }}>{c.title}</div>
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.55, margin: "0 0 12px" }}>{c.desc}</p>
      <Row k="Credit units" v={c.units} />
      <Row k="Lecturer" v={<Ref type="lecturer" k={c.lecturer} />} />
      <Row k="Venue" v={<Ref type="venue" k={c.venue} />} />
      <Row k="Category" v={c.type} />
      <Row k="Prerequisites" v={
        c.prereq && c.prereq.length
          ? c.prereq.map((p) => (window.DATA.courseName ? p + " · " + window.DATA.courseName(p) : p)).join("  •  ")
          : "None"
      } />
    </>
  );
}

function LecturerDetail({ name }) {
  const { LECTURERS, COURSES } = window.DATA;
  const l = LECTURERS[name];
  if (!l) return null;
  const teaches = COURSES.filter((c) => c.lecturer === name);
  const initials = name.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/g, "").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("");
  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 16 }}>
        <Avatar initials={initials} size={46} />
        <div className="u-grow">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          <div className="u-meta">{l.title}</div>
        </div>
      </div>
      <Row k="Research area" v={l.area} />
      <Row k="Office" v={l.office} />
      <Row k="Office hours" v={l.hours} />
      <Row k="Email" v={<a className="fb-link" href={"mailto:" + l.email}>{l.email}</a>} />
      {teaches.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="u-meta" style={{ marginBottom: 8 }}>Teaches this semester</div>
          <div className="u-row u-wrap" style={{ gap: 6 }}>
            {teaches.map((c) => <Ref key={c.code} type="course" k={c.code} mono strong />)}
          </div>
        </div>
      )}
    </>
  );
}

function VenueDetail({ code }) {
  const { VENUES, COURSES, TIMETABLE } = window.DATA;
  const v = VENUES[code];
  if (!v) return null;
  const here = COURSES.filter((c) => c.venue === code);
  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 16 }}>
        <span className="u-icon"><Icon name="pin" size={16} /></span>
        <div className="u-grow">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{v.name}</div>
          <div className="u-meta">{v.building}</div>
        </div>
      </div>
      <Row k="Capacity" v={v.capacity + " seats"} />
      <Row k="Facilities" v={v.facilities} />
      <Row k="Building" v={v.building} />
      {here.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="u-meta" style={{ marginBottom: 8 }}>Classes held here</div>
          <div className="u-row u-wrap" style={{ gap: 6 }}>
            {here.map((c) => <Ref key={c.code} type="course" k={c.code} mono strong />)}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- student academic record (TNU / TCP / GPA / CGPA history) ---------- */
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

const SEM_NAMES = ["First Semester", "Second Semester"];
const REMARK = (gpa) => (gpa < 1.5 ? "Probation" : "Good Standing");

/* semesters a student of this level has already completed (current: 2025/2026 First) */
function pastSemesters(level) {
  const n = ({ "100L": 0, "200L": 2, "300L": 4, "400L": 6, "500L": 8 })[level] ?? 4;
  const out = [];
  const startYear = 2025 - n / 2;
  for (let i = 0; i < n; i++) {
    const yr = startYear + Math.floor(i / 2);
    out.push({ session: yr + "/" + (yr + 1), semester: SEM_NAMES[i % 2], level: (100 + Math.floor(i / 2) * 100) + "L" });
  }
  return out;
}

/* deterministic history for generated students, calibrated to a target CGPA when known */
function generatedRecord(key) {
  const sems = pastSemesters(key.level || "300L");
  let h = hashStr(key.matric || key.name || "x");
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  let rows = sems.map((s) => ({ ...s, tnu: 18 + Math.round(rnd() * 6), gpa: 1.2 + rnd() * 3.6 }));
  const target = key.cgpa ? parseFloat(key.cgpa) : 1.8 + rnd() * 2.9;
  if (rows.length) {
    const cgpa = rows.reduce((a, r) => a + r.gpa * r.tnu, 0) / rows.reduce((a, r) => a + r.tnu, 0);
    const shift = target - cgpa;
    rows = rows.map((r) => ({ ...r, gpa: Math.min(5, Math.max(0.4, r.gpa + shift)) }));
  }
  // carryovers: seeded from the same hash so the record is stable
  const POOL = [
    { code: "CSC 299", title: "Discrete Mathematics" }, { code: "MTH 201", title: "Calculus I" },
    { code: "CSC 201", title: "Computer Programming I" }, { code: "PHY 102", title: "General Physics II" },
  ];
  const nCarry = key.carryover ? Math.max(1, h % 2 + 1) : (target < 3 ? h % 3 : h % 4 === 0 ? 1 : 0);
  const carryovers = [];
  for (let i = 0; i < Math.min(nCarry, sems.length ? 2 : 0); i++) {
    const c = POOL[(h + i * 7) % POOL.length];
    if (carryovers.some((x) => x.code === c.code)) continue;
    const failedIn = sems[(h + i * 3) % sems.length];
    const cleared = (h + i) % 2 === 0 && failedIn !== sems[sems.length - 1];
    carryovers.push({
      ...c,
      failedIn: failedIn.session + " · " + failedIn.semester,
      failScore: 25 + ((h + i * 11) % 14),
      status: cleared ? "cleared" : "retaking",
      clearedGrade: cleared ? ["C", "D"][(h + i) % 2] : null,
      attempts: cleared ? 2 : 2,
    });
  }
  return { rows, carryovers, cgpa: target, standing: rows.length && rows[rows.length - 1].gpa < 1.5 ? "Probation" : "Good Standing" };
}

/* the demo student's record comes from her real seeded transcripts */
function demoStudentRecord() {
  const { RESULTS, STUDENT } = window.DATA;
  const rows = RESULTS.slice().reverse().map((r) => ({
    session: r.session, semester: r.semester, level: r.level.replace(" Level", "L"),
    tnu: r.courses.reduce((a, c) => a + c.units, 0), gpa: r.gpa,
  }));
  const fails = [];
  RESULTS.forEach((r) => r.courses.forEach((c) => {
    if (c.grade === "F") fails.push({
      code: c.code, title: c.title, failedIn: r.session + " · " + r.semester, failScore: c.score,
      status: "retaking", clearedGrade: null, attempts: 2,
    });
  }));
  return { rows, carryovers: fails, cgpa: STUDENT.cgpa, standing: STUDENT.standing };
}

function StudentRecord({ k }) {
  const { STUDENT } = window.DATA;
  const isMe = k.matric === STUDENT.matric;
  const rec = isMe ? demoStudentRecord() : generatedRecord(k);
  const name = isMe ? STUDENT.name : k.name;
  const initials = (name || "S").split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  let runTnu = 0, runTcp = 0;
  const history = rec.rows.map((r) => {
    const tcp = Math.round(r.gpa * r.tnu);
    runTnu += r.tnu; runTcp += tcp;
    return { ...r, tcp, cgpa: runTcp / runTnu, remarks: REMARK(r.gpa) };
  });
  const GRADE_TONE = { A: "success", B: "success", C: "accent", D: "warning", E: "warning", F: "danger" };

  return (
    <>
      <div className="u-row u-wrap" style={{ gap: 14, marginBottom: 14, justifyContent: "space-between" }}>
        <div className="u-row" style={{ gap: 12 }}>
          <Avatar initials={initials} size={46} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
            <div className="u-meta fb-mono">{k.matric}{k.level ? " · " + k.level : ""}{isMe ? " · " + STUDENT.programme : ""}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="u-meta">CGPA</div>
          <div className="u-row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <span className="u-h2 u-num">{Number(rec.cgpa).toFixed(2)}</span>
            <Tag variant={rec.standing === "Probation" ? "danger" : "success"} dot>{rec.standing}</Tag>
          </div>
        </div>
      </div>

      {k.fromCourse && (
        <div className="u-pad-sm" style={{ borderRadius: "var(--r-md)", background: "var(--bg-sunken)", marginBottom: 14, fontSize: 13 }}>
          <span className="u-meta">On this sheet · </span>
          <span className="fb-mono" style={{ fontWeight: 600 }}>{k.fromCourse}</span>
          {k.score != null && <> · <span className="u-num" style={{ fontWeight: 600 }}>{k.score}/100</span></>}
          {k.grade && <> · <Tag variant={GRADE_TONE[k.grade]}>{k.grade}</Tag></>}
        </div>
      )}

      <div className="u-meta" style={{ fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}>Academic history</div>
      {history.length === 0 ? (
        <div className="u-meta" style={{ marginBottom: 14 }}>Fresh student: this is their first semester, so there is no prior record yet.</div>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table className="u-table">
            <thead><tr><th>Session</th><th>Semester</th><th>Level</th><th className="u-right">TNU</th><th className="u-right">TCP</th><th className="u-right">GPA</th><th className="u-right">CGPA</th><th>Remarks</th></tr></thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={i}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{r.session}</td>
                  <td>{r.semester.replace(" Semester", "")}</td>
                  <td><Tag>{r.level}</Tag></td>
                  <td className="u-right u-num">{r.tnu}</td>
                  <td className="u-right u-num">{r.tcp}</td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{r.gpa.toFixed(2)}</td>
                  <td className="u-right u-num">{r.cgpa.toFixed(2)}</td>
                  <td><Tag variant={r.remarks === "Probation" ? "danger" : "success"} dot>{r.remarks}</Tag></td>
                </tr>
              ))}
              <tr>
                <td className="fb-mono" style={{ fontSize: 12 }}>2025/2026</td>
                <td>First</td>
                <td><Tag>{k.level || "300L"}</Tag></td>
                <td className="u-right u-num">{isMe && window.__store && window.__store.registration ? (window.__store.registration.units ?? "Not available") : "Not available"}</td>
                <td className="u-right u-meta" colSpan={3}>in progress</td>
                <td><Tag variant="accent" dot>Current</Tag></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="u-meta" style={{ fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}>Carryovers &amp; attempts</div>
      {rec.carryovers.length === 0 ? (
        <div className="u-row" style={{ gap: 8 }}>
          <Icon name="check" size={14} style={{ color: "var(--success)" }} />
          <span className="u-meta">No carryovers. Every registered course has been passed at first attempt.</span>
        </div>
      ) : (
        <div className="u-stack" style={{ gap: 8 }}>
          {rec.carryovers.map((c) => (
            <div key={c.code} className="u-row u-wrap" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{c.code}</span><span style={{ fontSize: 13 }}>{c.title}</span></div>
                <div className="u-meta" style={{ marginTop: 2 }}>1st attempt: <Tag variant="danger">F</Tag> {c.failScore}/100 · {c.failedIn}</div>
              </div>
              {c.status === "cleared"
                ? <Tag variant="success" dot>Cleared · {c.clearedGrade} at 2nd attempt</Tag>
                : <Tag variant="warning" dot>Retaking this semester · attempt {c.attempts}</Tag>}
            </div>
          ))}
        </div>
      )}

      <div className="u-meta" style={{ marginTop: 16, fontSize: 11.5 }}>TNU: total number of units registered · TCP: total credit points earned · GPA on a 5.00 scale · Probation when semester GPA falls below 1.50.</div>
    </>
  );
}

const DETAIL_TITLES = { course: "Course details", lecturer: "Lecturer", venue: "Venue", student: "Student academic record" };

function DetailLayer() {
  const [d, setD] = React.useState(null);
  React.useEffect(() => {
    const h = (e) => setD(e.detail);
    window.addEventListener("futech:detail", h);
    return () => window.removeEventListener("futech:detail", h);
  }, []);
  if (!d) return null;
  return (
    <Modal onClose={() => setD(null)} lg={d.type === "student"}>
      <ModalHead title={DETAIL_TITLES[d.type]} onClose={() => setD(null)} />
      <div className="u-pad">
        {d.type === "course" && <CourseDetail code={d.key} />}
        {d.type === "lecturer" && <LecturerDetail name={d.key} />}
        {d.type === "venue" && <VenueDetail code={d.key} />}
        {d.type === "student" && <StudentRecord k={d.key} />}
      </div>
    </Modal>
  );
}

/* ---------- notifications dropdown ---------- */
function NotificationsPanel({ items, onClose, onReadAll }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <>
      <div className="u-pop-backdrop" onClick={onClose} />
      <div className="u-pop" role="dialog">
        <div className="u-row" style={{ justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="u-h3">Notifications</div>
          <button className="fb-link" style={{ fontSize: 12.5 }} onClick={onReadAll}>Mark all read</button>
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {items.map((n) => (
            <div key={n.id} className="u-notif" data-unread={n.unread}>
              <span className={"u-icon" + (n.tone === "neutral" ? " u-icon--plain" : "")}
                style={n.tone && n.tone !== "neutral" && n.tone !== "accent" ? { background: "var(--" + n.tone + "-soft)", color: "var(--" + n.tone + ")" } : undefined}>
                <Icon name={n.icon} size={15} />
              </span>
              <div className="u-grow">
                <div className="u-row" style={{ gap: 6, alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5, lineHeight: 1.3 }} className="u-grow">{n.title}</div>
                  {n.unread && <span className="u-unread-dot" />}
                </div>
                <div className="u-meta" style={{ marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                <div className="u-meta" style={{ marginTop: 4, fontSize: 11 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- print helper: print just the marked region ---------- */
function printRegion() { window.print(); }

Object.assign(window, { showDetail, Ref, DetailLayer, NotificationsPanel, printRegion, generatedRecord, demoStudentRecord });
