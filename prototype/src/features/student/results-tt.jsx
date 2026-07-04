import React from "react";
const { Btn, Card, Empty, Field, Icon, PageHead, Ref, Seg, Tag } = window;
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
        l.code + " — Lecture", "Room " + l.room, "FREQ=WEEKLY;COUNT=13");
    });
  } else {
    TIMETABLE.exams.forEach((e, i) => {
      const dm = e.date.match(/([A-Za-z]+)\s(\d+)/); // "Dec 8"
      const day = parseInt(dm[2], 10);
      const [s, en] = e.time.split("–").map((t) => parseInt(t.trim(), 10));
      ev("exam" + i, icsDate(2025, 12, day, s, 0), icsDate(2025, 12, day, en, 0),
        e.code + " Exam — " + e.title, e.venue + " · Seat " + e.seat);
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
    action: "TEMPLATE", text: e.code + " Exam — " + e.title, dates,
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

function Results({ store }) {
  const { RESULTS, STUDENT } = window.DATA;
  const options = [
    { value: "current", label: "Current · 300L" },
    ...RESULTS.map((r, i) => ({ value: String(i), label: r.session.slice(2) + " · " + r.semester.split(" ")[0] })),
  ];
  const [view, setView] = React.useState("current");

  return (
    <div className="u-content">
      <PageHead title="Results" sub="Academic performance & grades" />

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
        <Card className="u-pad">
          <Empty icon="clock" title="Results not yet released"
            sub="Your 300 Level first semester results will appear here once they have been approved by your lecturers, HOD and the exams & records office." />
        </Card>
      ) : (
        <ResultTable r={RESULTS[Number(view)]} />
      )}
    </div>
  );
}

function ResultTable({ r }) {
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
              <div className="u-meta">Semester GPA</div>
              <div className="u-h2 u-num">{r.gpa.toFixed(2)}</div>
            </div>
            <Tag variant="success" dot>Released</Tag>
          </div>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="u-table">
          <thead>
            <tr><th>Code</th><th>Course</th><th className="u-right">Units</th><th className="u-right">Score</th><th className="u-right">Grade</th></tr>
          </thead>
          <tbody>
            {r.courses.map((c) => (
              <tr key={c.code}>
                <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                <td>{c.title}</td>
                <td className="u-right u-num">{c.units}</td>
                <td className="u-right u-num">{c.score}</td>
                <td className="u-right"><Tag variant={GRADE_TONE[c.grade]}>{c.grade}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============ TIMETABLE ============ */
function Timetable() {
  const { TIMETABLE } = window.DATA;
  const [view, setView] = React.useState("lectures");

  return (
    <div className="u-content">
      <PageHead title="Timetable" sub="Personalised to your registered courses">
        <Seg value={view} onChange={setView} options={[{ value: "lectures", label: "Lectures" }, { value: "exams", label: "Exams" }]} />
        <Btn variant="secondary" icon="download" onClick={() => downloadICS(view)}>Export .ics</Btn>
      </PageHead>
      <div className="u-meta" style={{ marginTop: -12, marginBottom: 16 }}>
        Add to Apple/Google Calendar — downloads your {view === "lectures" ? "weekly lectures" : "exam schedule"} as a calendar file.
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
                  return (
                    <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined }}>
                      {ev ? (
                        <div className="u-tt__ev" style={{ height: "100%" }}>
                          <span className="c"><Ref type="course" k={ev.code} mono strong>{ev.code}</Ref></span>
                          <span className="r"><Ref type="venue" k={ev.room}>{ev.room}</Ref></span>
                        </div>
                      ) : <div className="u-tt__cell" />}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
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
function Profile() {
  const { STUDENT } = window.DATA;
  const bio = [
    ["Full name", STUDENT.name], ["Matriculation no.", STUDENT.matric], ["JAMB reg. no.", STUDENT.jamb],
    ["Programme", STUDENT.programme], ["Department", STUDENT.department], ["Faculty", (window.ORG && window.ORG.facultyNameOf(STUDENT.department)) || STUDENT.faculty],
    ["Level", STUDENT.level], ["Mode of entry", STUDENT.entryMode], ["Gender", STUDENT.gender],
    ["Email", STUDENT.email], ["Phone", STUDENT.phone], ["Academic standing", STUDENT.standing],
  ];
  return (
    <div className="u-content u-content--narrow">
      <PageHead title="My Profile" sub="Your official student record">
        <Btn variant="secondary" icon="doc">Request transcript</Btn>
      </PageHead>
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
      <PageHead title="Support" sub="Submit a complaint and track it — no office queues" />
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
        <div style={{ overflowX: "auto" }}>
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

Object.assign(window, { Results, Timetable, Profile, Support });
