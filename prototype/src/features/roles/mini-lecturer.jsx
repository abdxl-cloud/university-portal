import React from "react";
const { Btn, Card, CourseManage, Icon, PageHead, RoleHero, StatCards, Switch, Tag } = window;
/* Mini lecturer hat — used when a Level Adviser or HOD also teaches a course.
   Deliberately lightweight: reuses the existing 300L CSC advisee roster rather
   than a full standalone teaching dataset, since this is a secondary "hat". */

function miniRoster(courseCode) {
  const { ADVISEES } = window.ROLE_DATA;
  return ADVISEES.filter((a) => a.submitted && a.reg.some((c) => c.code === courseCode));
}
function miniCourseMeta(courseCode) {
  const { ADVISEES } = window.ROLE_DATA;
  for (const a of ADVISEES) {
    const hit = a.reg.find((c) => c.code === courseCode);
    if (hit) return hit;
  }
  return { code: courseCode, title: courseCode, units: 0 };
}

function MiniLecturerDashboard({ store, actions, go, roleCfg, hat }) {
  const code = hat.courseCode;
  const roster = miniRoster(code);
  const meta = miniCourseMeta(code);
  const notes = (store.roles && store.roles.mini && store.roles.mini.notes && store.roles.mini.notes[code]) || [];

  return (
    <div className="u-content">
      <RoleHero person={roleCfg.person} sub={hat.roleTitle} />
      <div className="u-adm-jamb-card" style={{ marginBottom: 16 }}>
        <Icon name="info" size={15} style={{ color: "var(--accent-soft-fg)" }} />
        <div className="u-grow" style={{ fontSize: 13 }}>
          You're viewing your <strong>Lecturer</strong> workload — one course this semester, alongside your main duties. Switch "Acting as" in the sidebar to go back.
        </div>
      </div>
      <StatCards items={[
        { k: "Course", v: meta.code },
        { k: "Enrolled students", v: roster.length, tag: "300L CSC", tone: "accent" },
        { k: "Credit units", v: meta.units },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <div className="u-h3">{meta.title}</div>
          <a className="fb-link" onClick={() => go("ml-course")}>Open course</a>
        </div>
        <div className="u-meta">{meta.units} units · {roster.length} students registered · {notes.length} class note{notes.length === 1 ? "" : "s"} posted</div>
      </Card>
    </div>
  );
}

function MiniLecturerCourse({ store, actions, go, hat }) {
  return <CourseManage code={hat.courseCode} store={store} actions={actions} onBack={() => go(hat.backTo || "dashboard")} />;
}

/* single-course teaching schedule — same weekly grid as the full Teaching Schedule page */
function MiniLecturerSchedule({ hat }) {
  const meta = window.STAFF_DATA.COURSE_META[hat.courseCode] || {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = ["8:00", "10:00", "12:00", "14:00", "16:00"];
  const lectures = (meta.day || "").split(" & ").map((d) => ({ day: d.trim(), start: meta.start, span: 1, code: meta.code, room: meta.venue }));

  return (
    <div className="u-content">
      <PageHead title="Teaching Schedule" sub={"Your lecture commitment this semester · " + meta.code} />
      <Card className="u-pad" style={{ overflowX: "auto" }}>
        <div className="u-tt" style={{ minWidth: 620 }}>
          <div />
          {days.map((d) => <div key={d} className="u-tt__h">{d.slice(0, 3)}</div>)}
          {periods.map((p, pi) => (
            <React.Fragment key={p}>
              <div className="u-tt__time">{p}</div>
              {days.map((d) => {
                const ev = lectures.find((l) => l.day === d && l.start === p);
                const covered = lectures.find((l) => l.day === d && l.span === 2 && periods.indexOf(l.start) === pi - 1);
                if (covered) return null;
                return (
                  <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined }}>
                    {ev ? (
                      <div className="u-tt__ev" style={{ height: "100%" }}>
                        <span className="c">{ev.code}</span>
                        <span className="r">{ev.room}</span>
                      </div>
                    ) : <div className="u-tt__cell" />}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* richer teaching quick-info card for the Adviser/HOD combined dashboard —
   today's class, submissions to grade, and quick actions (mirrors the lecturer dashboard) */
function TeachingQuickInfo({ store, go, hat }) {
  const code = hat.teachCode;
  const meta = window.STAFF_DATA.COURSE_META[code] || {};
  const roster = miniRoster(code);
  const queue = (window.courseQueue ? window.courseQueue(store, code) : 0);
  const today = "Wednesday"; // matches the demo "today" used elsewhere for this course pair
  const hasClassToday = (meta.day || "").includes(today);

  return (
    <Card className="u-pad" style={{ marginTop: 16 }}>
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div className="u-h3">Your teaching · {meta.title}</div>
        <a className="fb-link" onClick={() => go("ml-course")}>Open course</a>
      </div>
      <div className="u-grid u-grid--3" style={{ gap: 12, marginBottom: 14 }}>
        <div>
          <div className="u-meta">Today</div>
          {hasClassToday
            ? <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 3 }}>{meta.start} · {meta.venue}</div>
            : <div className="u-meta" style={{ marginTop: 3 }}>No class today</div>}
        </div>
        <div>
          <div className="u-meta">To grade</div>
          <div className="u-row" style={{ gap: 6, marginTop: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{queue}</span>
            {queue > 0 && <Tag variant="warning" dot>Action</Tag>}
          </div>
        </div>
        <div>
          <div className="u-meta">Students</div>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 3 }}>{roster.length} registered</div>
        </div>
      </div>
      <div className="u-row u-wrap" style={{ gap: 8 }}>
        <Btn variant="secondary" size="sm" icon="doc" onClick={() => go("ml-course")}>Grade work</Btn>
        <Btn variant="secondary" size="sm" icon="calendar" onClick={() => go("ml-schedule")}>Schedule</Btn>
      </div>
    </Card>
  );
}

Object.assign(window, { MiniLecturerDashboard, MiniLecturerCourse, MiniLecturerSchedule, TeachingQuickInfo, miniRoster, miniCourseMeta });
