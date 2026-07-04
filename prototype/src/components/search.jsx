import React from "react";
import { createPortal } from "react-dom";
const { Icon, Tag } = window;
/* Global command-palette search for the student portal */

function buildSearchIndex() {
  const D = window.DATA || {};
  const C = window.CAMPUS_DATA || {};
  const items = [];
  [
    ["dashboard", "Dashboard", "dashboard", "home overview"],
    ["finance", "Finance", "wallet", "fees payments money receipts history"],
    ["fees", "School Fees", "wallet", "tuition invoice pay"],
    ["registration", "Course Registration", "book", "register courses adviser units"],
    ["classes", "Classes", "book", "lms materials assignments submissions"],
    ["timetable", "Timetable", "calendar", "lectures exams schedule venue"],
    ["results", "Results", "chart", "grades gpa cgpa transcript"],
    ["hostel", "Hostel", "bed", "accommodation room allocation bed space"],
    ["library", "Library", "bookOpen", "books catalogue loans reservations e-library"],
    ["clinic", "Health Centre", "heart", "clinic medical appointment doctor prescription"],
    ["profile", "Profile", "user", "bio record matric"],
    ["support", "Support", "help", "complaint ticket help"],
  ].forEach(([route, label, icon, kw]) => items.push({ type: "route", route, label, icon, kw, group: "Go to" }));

  (D.COURSES || []).forEach((c) => items.push({ type: "course", key: c.code, label: c.code + " · " + c.title, icon: "book", kw: c.lecturer + " " + c.venue, group: "Courses" }));
  Object.keys(D.LECTURERS || {}).forEach((n) => items.push({ type: "lecturer", key: n, label: n, icon: "user", kw: (D.LECTURERS[n].area || "") + " lecturer", group: "Lecturers" }));
  (C.BOOKS || []).forEach((b) => items.push({ type: "book", key: b.id, label: b.title, icon: "bookOpen", kw: b.author + " " + b.cat + " book", group: "Library" }));
  return items;
}

function CommandPalette({ open, onClose, go }) {
  const INDEX = React.useMemo(buildSearchIndex, []);
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  React.useEffect(() => {
    if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); }
  }, [open]);

  const ql = q.trim().toLowerCase();
  let results = ql
    ? INDEX.filter((it) => (it.label + " " + (it.kw || "")).toLowerCase().includes(ql))
    : INDEX.filter((it) => it.group === "Go to");
  results = results.slice(0, 12);

  React.useEffect(() => { setSel(0); }, [q]);

  const act = (it) => {
    if (!it) return;
    onClose();
    if (it.type === "route") go(it.route);
    else if (it.type === "book") go("library");
    else if (window.showDetail) window.showDetail(it.type, it.key);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); act(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // keep selected row in view without scrollIntoView
  React.useEffect(() => {
    const list = listRef.current; if (!list) return;
    const row = list.querySelector('[data-sel="true"]');
    if (!row) return;
    const rt = row.offsetTop, rb = rt + row.offsetHeight;
    if (rt < list.scrollTop) list.scrollTop = rt - 4;
    else if (rb > list.scrollTop + list.clientHeight) list.scrollTop = rb - list.clientHeight + 4;
  }, [sel, q]);

  if (!open) return null;

  // group results preserving order
  const groups = [];
  results.forEach((it, i) => {
    let g = groups.find((x) => x.name === it.group);
    if (!g) { g = { name: it.group, rows: [] }; groups.push(g); }
    g.rows.push({ it, i });
  });

  const typeTag = { course: "Course", lecturer: "Lecturer", book: "Book" };

  return createPortal(
    <div className="u-cmd-bg" onClick={onClose}>
      <div className="u-cmd" onClick={(e) => e.stopPropagation()}>
        <div className="u-cmd__input">
          <Icon name="search" size={17} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search courses, lecturers, books, pages…" />
          <span className="fb-kbd">esc</span>
        </div>
        <div className="u-cmd__list" ref={listRef}>
          {results.length === 0 ? (
            <div className="u-cmd__empty">No results for "{q}"</div>
          ) : groups.map((g) => (
            <div key={g.name} className="u-cmd__group">
              <div className="u-cmd__glabel">{g.name}</div>
              {g.rows.map(({ it, i }) => (
                <button key={it.type + it.key + it.route + i} className="u-cmd__row" data-sel={sel === i}
                  onMouseEnter={() => setSel(i)} onClick={() => act(it)}>
                  <span className="u-icon u-icon--plain" style={{ width: 28, height: 28 }}><Icon name={it.icon} size={15} /></span>
                  <span className="u-cmd__label">{it.label}</span>
                  {typeTag[it.type] && <Tag>{typeTag[it.type]}</Tag>}
                  <Icon name="arrowRight" size={14} style={{ color: "var(--fg-faint)" }} />
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="u-cmd__foot">
          <span><span className="fb-kbd">↑</span><span className="fb-kbd">↓</span> navigate</span>
          <span><span className="fb-kbd">↵</span> open</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { CommandPalette });
