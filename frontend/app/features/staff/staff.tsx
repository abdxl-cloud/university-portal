/* Staff / lecturer portal: dashboard, schedule, profile + grade helpers.

   Note: the prototype's StaffPortal/StaffNavList/StaffTopbar shell was dead code
   (never referenced — the lecturer role runs through RolePortal), so it is not
   ported. The screens and helpers below are what the role registry dispatches. */
import React from "react";
import { Icon } from "../../components/icons";
import { Avatar, Card, Empty, PageHead, Tag } from "../../components/ui";
import {
  ENROLLED, RESULT_STATUS, STAFF, STAFF_COURSES, STAFF_TIMETABLE,
  STAFF_SUBMISSIONS, staffContentFor,
} from "../../data/staff-data";
import type { ResultStatus } from "../../data/staff-data";
import { HOD_RESULTS } from "../../data/roles-data";
import { GRADE_POINT, GRADE_TONE } from "../../data/student-data";
import type { Grade } from "../../data/student-data";
import { EventChip, eventsAt, portalEvents } from "../shared/events";
import type { Store } from "../../store/types";
import type { NavGroup, TagVariant, Tone } from "../../types";

export const STAFF_NAV: NavGroup[] = [
  { section: "Overview", items: [["s-dashboard", "Dashboard", "dashboard"]] },
  { section: "Teaching", items: [["s-courses", "My Courses", "book"], ["s-supervision", "Supervision", "cap"], ["s-schedule", "Schedule", "calendar"]] },
  { section: "Account", items: [["s-profile", "Profile", "user"]] },
];

/* grade helpers (CA /30 + exam /70 = /100) */
export function gradeOf(total: number | null | undefined): Grade | "Not available" {
  if (total == null || isNaN(total)) return "Not available";
  return total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 45 ? "D" : total >= 40 ? "E" : "F";
}
/** Grade point per letter grade. Re-exported under the staff-side name. */
export const GP = GRADE_POINT;
/** Tag colour per grade. Re-exported under the staff-side name. */
export const SGRADE_TONE = GRADE_TONE;

export interface Score {
  ca: number | null;
  exam: number | null;
}

export function effScore(store: Store, code: string, matric: string, base: Score): Score {
  const k = code + ":" + matric;
  const edit = store.staff && store.staff.scores && store.staff.scores[k];
  return {
    ca: edit && edit.ca != null ? edit.ca : base.ca,
    exam: edit && edit.exam != null ? edit.exam : base.exam,
  };
}

export function resultStatus(store: Store, code: string): string {
  const localStatus = (): string => (store.staff && store.staff.results && store.staff.results[code]) || RESULT_STATUS[code];
  // once Exams & Records has actually approved or queried this sheet, that
  // decision is what the lecturer sees: not the disconnected local seed
  const seed = HOD_RESULTS.find((r) => r.code === code);
  if (seed) {
    const eoStatus = (store.roles && store.roles.eo && store.roles.eo.result && store.roles.eo.result[code]) || seed.baseStatus;
    if (eoStatus === "query" || eoStatus === "approved") return eoStatus;
  }
  return localStatus();
}

export function resultNote(store: Store, code: string): string {
  return (store.roles && store.roles.eo && store.roles.eo.note && store.roles.eo.note[code]) || "";
}

/* submissions awaiting grading across all courses */
export function gradingQueue(store: Store): number {
  let pending = 0;
  STAFF_COURSES.forEach((c) => {
    const subs = STAFF_SUBMISSIONS[c.code] || {};
    staffContentFor(c.code).assignments.forEach((a) => {
      (subs[a.id] || []).forEach((s) => {
        const graded = store.staff && store.staff.grades && store.staff.grades[a.id + ":" + s.matric] != null;
        if (s.status === "submitted" && !graded) pending++;
      });
    });
  });
  return pending;
}

export interface StaffScreenProps {
  store: Store;
  go: (route: string) => void;
}

/* ---------------- dashboard ---------------- */
export function StaffDashboard({ store, go }: StaffScreenProps) {
  const totalStudents = STAFF_COURSES.reduce((s, c) => s + (ENROLLED[c.code] || 0), 0);
  const queue = gradingQueue(store);
  const pendingResults = STAFF_COURSES.filter((c) => resultStatus(store, c.code) === "draft").length;
  const today = "Tuesday";
  const todays = STAFF_TIMETABLE.lectures.filter((l) => l.day === today)
    .sort((a, b) => STAFF_TIMETABLE.periods.indexOf(a.start) - STAFF_TIMETABLE.periods.indexOf(b.start));

  const cards: { icon: import("../../types").IconName; k: string; v: React.ReactNode; sub: string; tone?: Tone; to: string }[] = [
    { icon: "book", k: "Courses", v: STAFF_COURSES.length, sub: "This semester", to: "s-courses" },
    { icon: "user", k: "Students taught", v: totalStudents, sub: "Across all courses", to: "s-courses" },
    { icon: "doc", k: "To grade", v: queue, sub: "Submissions pending", tone: queue > 0 ? "warning" : "success", to: "s-courses" },
    { icon: "chart", k: "Results pending", v: pendingResults, sub: "Awaiting submission", tone: pendingResults > 0 ? "warning" : "success", to: "s-courses" },
  ];

  const quickActions: [import("../../types").IconName, string, string][] = [
    ["doc", "Grade work", "s-courses"], ["chart", "Submit results", "s-courses"], ["calendar", "Schedule", "s-schedule"], ["user", "Profile", "s-profile"],
  ];

  const evs = portalEvents(store, "staff").filter((e) => e.day === today);

  return (
    <div className="u-content">
      <div style={{ marginBottom: 22 }}>
        <div className="u-h1">Welcome, {STAFF.title.split(" ")[0]} {STAFF.first}</div>
        <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{STAFF.session} · {STAFF.semester} · {STAFF.department}</div>
      </div>

      <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
        {cards.map((c) => (
          <Card key={c.k} className="u-pad" style={{ cursor: "pointer" }} onClick={() => go(c.to)}>
            <div className="u-stat__sub">{c.k}</div>
            <div className="u-row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <div className="u-stat__v u-num">{c.v}</div>
              {c.tone && <Tag variant={c.tone === "neutral" ? undefined : (c.tone as TagVariant)} dot>{c.tone === "warning" ? "Action" : "Done"}</Tag>}
            </div>
            {c.sub && <div className="u-meta" style={{ marginTop: 6 }}>{c.sub}</div>}
          </Card>
        ))}
      </div>

      <div className="u-cols u-cols--main">
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div className="u-h3">Your courses</div>
              <a className="fb-link" onClick={() => go("s-courses")}>Manage all</a>
            </div>
            <div className="u-stack" style={{ gap: 8 }}>
              {STAFF_COURSES.map((c) => {
                const st = resultStatus(store, c.code);
                const tone: TagVariant = st === "approved" ? "success" : st === "submitted" ? "accent" : "warning";
                return (
                  <button key={c.code} className="u-row" onClick={() => { localStorage.setItem("futech.scourse", c.code); go("s-courses"); }}
                    style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <div className="u-grow" style={{ minWidth: 0 }}>
                      <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</span><Tag>{c.level}</Tag></div>
                      <div style={{ fontSize: 13.5, marginTop: 2 }}>{c.title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="u-meta">{ENROLLED[c.code]} students</div>
                      <Tag variant={tone} dot>{st === "draft" ? "Results due" : st === "submitted" ? "Submitted" : "Approved"}</Tag>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Today · {today}</div>
            {todays.length === 0 && evs.length === 0 ? <Empty icon="calendar" title="No classes today" /> : (
              <div className="u-stack" style={{ gap: 8 }}>
                {todays.map((l, i) => (
                  <div key={i} className="u-row" style={{ gap: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                    <div className="u-meta fb-mono" style={{ width: 42 }}>{l.start}</div>
                    <div className="u-grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.code}</div>
                      <div className="u-meta">{l.room}</div>
                    </div>
                    <Icon name="pin" size={14} style={{ color: "var(--fg-subtle)" }} />
                  </div>
                ))}
                {evs.map((e) => (
                  <div key={e.id} className="u-row" style={{ gap: 12, padding: "10px 12px", border: "1.5px dashed var(--accent)", borderRadius: "var(--r-md)", background: "var(--accent-soft)" }}>
                    <div className="u-meta fb-mono" style={{ width: 42 }}>{e.start}</div>
                    <div className="u-grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--accent-soft-fg)" }}>{e.title}</div>
                      <div className="u-meta">{e.venue} · scheduled by {e.by}</div>
                    </div>
                    {e.type && <Tag variant="accent">{e.type}</Tag>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Quick actions</div>
            <div className="u-qa">
              {quickActions.map(([ic, lb, to]) => (
                <button key={lb} className="fb-btn fb-btn--secondary" style={{ justifyContent: "flex-start", height: 38 }} onClick={() => go(to)}>
                  <Icon name={ic} size={15} /> <span>{lb}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="u-pad" style={{ marginTop: 16 }}>
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <div className="u-h3">Exams & Records</div>
          <a className="fb-link" onClick={() => go("exm-level")}>Open records</a>
        </div>
        <div className="u-meta">You also hold the Exams & Records duty this semester: publish results and process transcripts from there.</div>
      </Card>
    </div>
  );
}

/* ---------------- teaching schedule ---------------- */
export function StaffSchedule({ store }: { store: Store }) {
  const TT = STAFF_TIMETABLE;
  return (
    <div className="u-content">
      <PageHead title="Schedule" sub="Your lectures and scheduled meetings this semester" />
      <Card className="u-pad" style={{ overflowX: "auto" }}>
        <div className="u-tt" style={{ minWidth: 620 }}>
          <div />
          {TT.days.map((d) => <div key={d} className="u-tt__h">{d.slice(0, 3)}</div>)}
          {TT.periods.map((p, pi) => (
            <React.Fragment key={p}>
              <div className="u-tt__time">{p}</div>
              {TT.days.map((d) => {
                const ev = TT.lectures.find((l) => l.day === d && l.start === p);
                const covered = TT.lectures.find((l) => l.day === d && l.span === 2 && TT.periods.indexOf(l.start) === pi - 1);
                if (covered) return null;
                const evs = eventsAt(store, "staff", d, p);
                if (ev && ev.span === 2) evs.push(...eventsAt(store, "staff", d, TT.periods[pi + 1]));
                return (
                  <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined, display: "flex", flexDirection: "column" }}>
                    {ev && (
                      <div className="u-tt__ev" style={{ flex: 1 }}>
                        <span className="c">{ev.code}</span>
                        <span className="r">{ev.room}</span>
                      </div>
                    )}
                    {evs.map((e) => <EventChip key={e.id} ev={e} />)}
                    {!ev && evs.length === 0 && <div className="u-tt__cell" />}
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

/* ---------------- profile ---------------- */
export function StaffProfile() {
  const bio: [string, string][] = [
    ["Full name", STAFF.name], ["Staff ID", STAFF.staffId], ["Designation", STAFF.title],
    ["Role", STAFF.role], ["Department", STAFF.department], ["Faculty", STAFF.faculty],
    ["Research area", STAFF.area], ["Office", STAFF.office], ["Email", STAFF.email], ["Phone", STAFF.phone],
  ];
  return (
    <div className="u-content u-content--narrow">
      <PageHead title="My Profile" sub="Your staff record" />
      <Card className="u-pad">
        <div className="u-row" style={{ gap: 16, marginBottom: 20 }}>
          <Avatar initials={STAFF.initials} size={64} />
          <div className="u-grow">
            <div className="u-h2">{STAFF.name}</div>
            <div className="u-muted" style={{ fontSize: 13.5 }}>{STAFF.title} · {STAFF.department}</div>
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
