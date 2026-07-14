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

const GRADE_TONE = { A: "success", B: "accent", C: undefined, D: "warning", E: "warning", F: "danger" };

function studentInitials(name) {
  return String(name || "Student").trim().split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function studentHash(value) {
  let hash = 2166136261;
  for (const char of String(value || "student")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resultSummary(result, totals) {
  const units = result.courses.reduce((sum, course) => sum + course.units, 0);
  const points = result.courses.reduce((sum, course) => sum + course.units * course.gp, 0);
  totals.units += units;
  totals.points += points;
  return {
    session: result.session,
    semester: result.semester.replace(" Semester", ""),
    level: result.level.replace(" Level", "L"),
    units,
    points,
    gpa: units ? points / units : result.gpa,
    cgpa: totals.units ? totals.points / totals.units : result.gpa,
  };
}

function localAcademicRecord(student) {
  const demoStudent = window.DATA && window.DATA.STUDENT;
  const isDemoStudent = demoStudent && student.matric === demoStudent.matric;

  if (isDemoStudent && Array.isArray(window.DATA.RESULTS)) {
    const totals = { units: 0, points: 0 };
    const semesters = [...window.DATA.RESULTS].reverse().map((result) => resultSummary(result, totals));
    const failed = window.DATA.RESULTS.flatMap((result) => result.courses)
      .filter((course) => course.grade === "F")
      .map((course) => ({ code: course.code, title: course.title }));
    return { semesters, failed, units: totals.units, cgpa: Number(demoStudent.cgpa || (totals.points / totals.units)) };
  }

  // Other prototype students are generated locally from their matric number so
  // their record stays stable across refreshes without calling the API.
  const seed = studentHash(student.matric);
  const currentLevel = Math.max(200, parseInt(student.level, 10) || 300);
  const semesterCount = Math.max(2, Math.min(8, (currentLevel / 100 - 1) * 2));
  const target = Math.max(1.25, Math.min(4.92, Number(student.cgpa) || 2.55 + (seed % 220) / 100));
  const firstYear = 2025 - Math.ceil(semesterCount / 2);
  let totalUnits = 0;
  let totalPoints = 0;
  const semesters = Array.from({ length: semesterCount }, (_, index) => {
    const units = 18 + ((seed >>> (index % 16)) % 5);
    const adjustment = ((seed + index * 17) % 31 - 15) / 100;
    const gpa = Math.max(1, Math.min(5, target + adjustment));
    const points = Math.round(gpa * units);
    totalUnits += units;
    totalPoints += points;
    const year = firstYear + Math.floor(index / 2);
    return {
      session: year + "/" + (year + 1),
      semester: index % 2 === 0 ? "First" : "Second",
      level: (100 + Math.floor(index / 2) * 100) + "L",
      units,
      points,
      gpa: points / units,
      cgpa: totalPoints / totalUnits,
    };
  });
  const failed = student.carryover || student.grade === "F"
    ? [{ code: student.fromCourse || "CSC 299", title: student.fromCourse ? "Outstanding course" : "Discrete Mathematics" }]
    : [];
  return { semesters, failed, units: totalUnits, cgpa: Number(student.cgpa) || totalPoints / totalUnits };
}

function StudentDetail({ student }) {
  const record = localAcademicRecord(student);
  const standing = record.cgpa < 1.5 ? "Probation" : record.failed.length ? "Good standing · carryover" : "Good standing";
  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 18, alignItems: "flex-start" }}>
        <Avatar initials={studentInitials(student.name)} size={46} />
        <div className="u-grow">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{student.name || "Student"}</div>
          <div className="u-meta fb-mono" style={{ marginTop: 2 }}>{student.matric || "—"}</div>
          <div className="u-row u-wrap" style={{ gap: 6, marginTop: 7 }}>
            <Tag>{student.level || "300L"}</Tag>
            <Tag variant={record.cgpa < 1.5 ? "danger" : record.failed.length ? "warning" : "success"} dot>{standing}</Tag>
          </div>
        </div>
      </div>

      <div className="u-grid u-grid--3" style={{ gap: 12, marginBottom: 18 }}>
        <div className="u-stat"><div className="u-stat__k">CGPA</div><div className="u-stat__v u-num">{record.cgpa.toFixed(2)}</div><div className="u-stat__sub">5.00 scale</div></div>
        <div className="u-stat"><div className="u-stat__k">Units earned</div><div className="u-stat__v u-num">{record.units}</div><div className="u-stat__sub">Released results</div></div>
        <div className="u-stat"><div className="u-stat__k">Carryovers</div><div className="u-stat__v u-num" style={{ color: record.failed.length ? "var(--danger)" : undefined }}>{record.failed.length}</div><div className="u-stat__sub">Outstanding</div></div>
      </div>

      {student.fromCourse && (
        <div style={{ marginBottom: 18 }}>
          <div className="u-meta" style={{ marginBottom: 7 }}>Selected result</div>
          <Row k={student.fromCourse} v={
            <span className="u-row" style={{ gap: 8 }}>
              {student.score !== undefined && <span className="u-num">{student.score}%</span>}
              {student.grade && <Tag variant={GRADE_TONE[student.grade]}>{student.grade}</Tag>}
            </span>
          } />
        </div>
      )}

      <div className="u-meta" style={{ marginBottom: 9 }}>Semester history</div>
      <div className="u-table-scroll" style={{ margin: "0 -2px" }}>
        <table className="u-table">
          <thead><tr><th>Session</th><th>Semester</th><th>Level</th><th className="u-right">TNU</th><th className="u-right">TCP</th><th className="u-right">GPA</th><th className="u-right">CGPA</th></tr></thead>
          <tbody>
            {[...record.semesters].reverse().map((semester) => (
              <tr key={semester.session + semester.semester}>
                <td className="fb-mono">{semester.session}</td>
                <td>{semester.semester}</td>
                <td>{semester.level}</td>
                <td className="u-right u-num">{semester.units}</td>
                <td className="u-right u-num">{semester.points}</td>
                <td className="u-right u-num">{semester.gpa.toFixed(2)}</td>
                <td className="u-right u-num" style={{ fontWeight: 600 }}>{semester.cgpa.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {record.failed.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="u-meta" style={{ marginBottom: 6 }}>Outstanding courses</div>
          {record.failed.map((course) => <Row key={course.code} k={course.code} v={<span>{course.title} <Tag variant="danger">Carryover</Tag></span>} />)}
        </div>
      )}
    </>
  );
}

const DETAIL_TITLES = { course: "Course details", lecturer: "Lecturer", venue: "Venue", student: "Academic record" };

function DetailLayer() {
  const [d, setD] = React.useState(null);
  React.useEffect(() => {
    const h = (e) => setD(e.detail);
    window.addEventListener("futech:detail", h);
    return () => window.removeEventListener("futech:detail", h);
  }, []);
  if (!d) return null;
  return (
    <Modal lg={d.type === "student"} onClose={() => setD(null)}>
      <ModalHead title={DETAIL_TITLES[d.type]} onClose={() => setD(null)} />
      <div className="u-pad">
        {d.type === "course" && <CourseDetail code={d.key} />}
        {d.type === "lecturer" && <LecturerDetail name={d.key} />}
        {d.type === "venue" && <VenueDetail code={d.key} />}
        {d.type === "student" && <StudentDetail student={d.key || {}} />}
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

Object.assign(window, { showDetail, Ref, DetailLayer, NotificationsPanel, printRegion });
