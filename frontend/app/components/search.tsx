/* Global command-palette search for the student portal */
import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";
import { Tag } from "./ui";
import { showDetail, type EntityDetailType } from "./detail";
import { COURSES, LECTURERS } from "../data/student-data";
import { BOOKS } from "../data/campus-data";
import type { IconName, NavGroup } from "../types";

/** What a palette row points at. Route rows carry `route`; entity rows carry `key`. */
export type SearchItemType = "route" | EntityDetailType | "book";

export interface SearchItem {
  type: SearchItemType;
  route?: string;
  key?: string;
  label: string;
  icon: IconName;
  /** Extra text folded into the match, never displayed. */
  kw: string;
  group: string;
}

// Builds the search index from the sidebar nav actually assigned to this
// user (student NAV/NAV_400/NAV_500, or a role's merged-hats nav) so results
// never surface pages the signed-in user/role doesn't have.
function buildSearchIndex(nav: NavGroup[] | undefined, withEntities?: boolean): SearchItem[] {
  const items: SearchItem[] = [];
  (nav || []).forEach((grp) => {
    grp.items.forEach(([route, label, icon]) => {
      items.push({ type: "route", route, label, icon, kw: label, group: grp.section });
    });
  });

  if (withEntities) {
    COURSES.forEach((c) => items.push({ type: "course", key: c.code, label: c.code + " · " + c.title, icon: "book", kw: c.lecturer + " " + c.venue, group: "Courses" }));
    Object.keys(LECTURERS).forEach((n) => items.push({ type: "lecturer", key: n, label: n, icon: "user", kw: (LECTURERS[n].area || "") + " lecturer", group: "Lecturers" }));
    BOOKS.forEach((b) => items.push({ type: "book", key: b.id, label: b.title, icon: "bookOpen", kw: b.author + " " + b.cat + " book", group: "Library" }));
  }
  return items;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  go: (route: string) => void;
  nav?: NavGroup[];
  withEntities?: boolean;
}

export function CommandPalette({ open, onClose, go, nav, withEntities }: CommandPaletteProps) {
  const INDEX = React.useMemo(() => buildSearchIndex(nav, withEntities), [nav, withEntities]);
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const ql = q.trim().toLowerCase();
  let results = ql
    ? INDEX.filter((it) => (it.label + " " + (it.kw || "")).toLowerCase().includes(ql))
    : INDEX.filter((it) => it.type === "route");
  results = results.slice(0, 12);

  React.useEffect(() => { setSel(0); }, [q]);

  const act = (it: SearchItem | undefined) => {
    if (!it) return;
    onClose();
    if (it.type === "route") go(it.route!);
    else if (it.type === "book") go("library");
    else showDetail(it.type, it.key!);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); act(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // keep selected row in view without scrollIntoView
  React.useEffect(() => {
    const list = listRef.current; if (!list) return;
    const row = list.querySelector<HTMLElement>('[data-sel="true"]');
    if (!row) return;
    const rt = row.offsetTop, rb = rt + row.offsetHeight;
    if (rt < list.scrollTop) list.scrollTop = rt - 4;
    else if (rb > list.scrollTop + list.clientHeight) list.scrollTop = rb - list.clientHeight + 4;
  }, [sel, q]);

  if (!open) return null;

  // group results preserving order
  const groups: { name: string; rows: { it: SearchItem; i: number }[] }[] = [];
  results.forEach((it, i) => {
    let g = groups.find((x) => x.name === it.group);
    if (!g) { g = { name: it.group, rows: [] }; groups.push(g); }
    g.rows.push({ it, i });
  });

  const typeTag: Partial<Record<SearchItemType, string>> = { course: "Course", lecturer: "Lecturer", book: "Book" };

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
