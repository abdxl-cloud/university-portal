/* Global detail popups (course / lecturer / venue) + notifications panel */
import React from "react";
import { Icon } from "./icons";
import { Avatar, Modal, ModalHead, Tag } from "./ui";
import { COURSES, GRADE_TONE, LECTURERS, VENUES, courseName } from "../data/student-data";
import type { Grade } from "../data/student-data";
import type { TagVariant, Notification } from "../types";

/** Detail popups keyed by a plain identifier. */
export type EntityDetailType = "course" | "lecturer" | "venue";

/** What a detail popup can describe. */
export type DetailType = EntityDetailType | "student";

/** The payload behind a student academic-record popup. `fromCourse`/`score`/
    `grade` are present when opened from a result row; `cgpa`/`carryover` when
    opened from an adviser or HOD list. */
export interface StudentRef {
  name: string;
  matric: string;
  level: string;
  cgpa?: string | number;
  carryover?: boolean;
  fromCourse?: string;
  score?: number;
  grade?: Grade;
}

export type DetailRequest =
  | { type: EntityDetailType; key: string }
  | { type: "student"; key: StudentRef };

const DETAIL_EVENT = "futech:detail";

// fire from anywhere: showDetail("course", "CSC 301")
export function showDetail(type: EntityDetailType, key: string): void;
export function showDetail(type: "student", key: StudentRef): void;
export function showDetail(type: DetailType, key: string | StudentRef): void {
  window.dispatchEvent(new CustomEvent<DetailRequest>(DETAIL_EVENT, { detail: { type, key } as DetailRequest }));
}

export interface RefProps {
  type: EntityDetailType;
  k: string;
  children?: React.ReactNode;
  mono?: boolean;
  strong?: boolean;
}

// clickable inline reference
export function Ref({ type, k, children, mono, strong }: RefProps) {
  return (
    <span className="u-ref" role="button" tabIndex={0} data-mono={!!mono} data-strong={!!strong}
      onClick={(e) => { e.stopPropagation(); showDetail(type, k); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); showDetail(type, k); } }}>
      {children || k}
    </span>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
      <span className="k">{k}</span><span className="v">{v}</span>
    </div>
  );
}

function CourseDetail({ code }: { code: string }) {
  const c = COURSES.find((x) => x.code === code);
  if (!c) return null;
  const tone: Record<string, TagVariant | undefined> = { Core: "accent", Elective: undefined, GST: undefined, Carryover: "danger" };
  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
        <span className="u-icon"><Icon name="book" size={16} /></span>
        <div className="u-grow">
          <div className="u-row" style={{ gap: 8 }}>
            <span className="fb-mono" style={{ fontWeight: 700, fontSize: 15 }}>{c.code}</span>
            <Tag variant={tone[c.type]}>{c.type}</Tag>
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
          ? c.prereq.map((p) => p + " · " + courseName(p)).join("  •  ")
          : "None"
      } />
    </>
  );
}

function LecturerDetail({ name }: { name: string }) {
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

function VenueDetail({ code }: { code: string }) {
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

/* Academic record for one student. Every call site passes the row it was opened
   from, so this renders whatever context is available rather than refetching. */
function StudentDetail({ s }: { s: StudentRef }) {
  const initials = s.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const rows: [string, React.ReactNode][] = [
    ["Matriculation no.", <span className="fb-mono">{s.matric}</span>],
    ["Level", s.level],
  ];
  if (s.cgpa != null) rows.push(["CGPA", <span className="u-num">{s.cgpa}</span>]);
  if (s.fromCourse) rows.push(["Course", <Ref type="course" k={s.fromCourse} mono strong />]);
  if (s.score != null) {
    rows.push(["Score", <span className="u-num">{s.score}</span>]);
  }
  if (s.grade) rows.push(["Grade", <Tag variant={GRADE_TONE[s.grade]}>{s.grade}</Tag>]);
  if (s.carryover) rows.push(["Carryover", <Tag variant="danger">Has carryover</Tag>]);

  return (
    <>
      <div className="u-row" style={{ gap: 12, marginBottom: 16 }}>
        <Avatar initials={initials} size={46} />
        <div className="u-grow">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
          <div className="u-meta">{s.level}</div>
        </div>
        {s.carryover && <Tag variant="warning" dot>Carryover</Tag>}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="k">{k}</span><span className="v">{v}</span>
        </div>
      ))}
    </>
  );
}

const DETAIL_TITLES: Record<DetailType, string> = {
  course: "Course details", lecturer: "Lecturer", venue: "Venue", student: "Academic record",
};

export function DetailLayer() {
  const [d, setD] = React.useState<DetailRequest | null>(null);
  React.useEffect(() => {
    const h = (e: Event) => setD((e as CustomEvent<DetailRequest>).detail);
    window.addEventListener(DETAIL_EVENT, h);
    return () => window.removeEventListener(DETAIL_EVENT, h);
  }, []);
  if (!d) return null;
  return (
    <Modal onClose={() => setD(null)}>
      <ModalHead title={DETAIL_TITLES[d.type]} onClose={() => setD(null)} />
      <div className="u-pad">
        {d.type === "course" && <CourseDetail code={d.key} />}
        {d.type === "lecturer" && <LecturerDetail name={d.key} />}
        {d.type === "venue" && <VenueDetail code={d.key} />}
        {d.type === "student" && <StudentDetail s={d.key} />}
      </div>
    </Modal>
  );
}

/* ---------- notifications dropdown ---------- */
export interface NotificationsPanelProps {
  items: Notification[];
  onClose: () => void;
  onReadAll: () => void;
}

export function NotificationsPanel({ items, onClose, onReadAll }: NotificationsPanelProps) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
export function printRegion(): void { window.print(); }
