import React from "react";
const { Avatar, Card, Empty, Icon, IconBtn, NotificationsPanel, PageHead, Tag } = window;
/* Staff / lecturer portal: shell, dashboard, schedule, profile */

const STAFF_NAV = [
{ section: "Overview", items: [["s-dashboard", "Dashboard", "dashboard"]] },
{ section: "Teaching", items: [["s-courses", "My Courses", "book"], ["s-supervision", "Supervision", "cap"], ["s-schedule", "Schedule", "calendar"]] },
{ section: "Account", items: [["s-profile", "Profile", "user"]] }];


const STAFF_SCREENS = {
  "s-dashboard": { c: "StaffDashboard", title: "Dashboard" },
  "s-courses": { c: "StaffCourses", title: "My Courses" },
  "s-supervision": { c: "StaffSupervision", title: "Supervision" },
  "s-schedule": { c: "StaffSchedule", title: "Schedule" },
  "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" },
  "s-profile": { c: "StaffProfile", title: "Profile" }
};

/* grade helpers (CA /30 + exam /70 = /100) */
function gradeOf(total) {
  if (total == null || isNaN(total)) return "Not available";
  return total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 45 ? "D" : total >= 40 ? "E" : "F";
}
const GP = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const SGRADE_TONE = { A: "success", B: "accent", C: "accent", D: "warning", E: "warning", F: "danger" };

function effScore(store, code, matric, base) {
  const k = code + ":" + matric;
  const edit = store.staff && store.staff.scores && store.staff.scores[k];
  return {
    ca: edit && edit.ca != null ? edit.ca : base.ca,
    exam: edit && edit.exam != null ? edit.exam : base.exam
  };
}
function resultStatus(store, code) {
  const { RESULT_STATUS } = window.STAFF_DATA;
  const localStatus = () => (store.staff && store.staff.results && store.staff.results[code]) || RESULT_STATUS[code];
  // once Exams & Records has actually approved or queried this sheet, that
  // decision is what the lecturer sees: not the disconnected local seed
  const seed = window.ROLE_DATA.HOD_RESULTS.find((r) => r.code === code);
  if (seed) {
    const eoStatus = (store.roles && store.roles.eo && store.roles.eo.result && store.roles.eo.result[code]) || seed.baseStatus;
    if (eoStatus === "query" || eoStatus === "approved") return eoStatus;
  }
  return localStatus();
}
function resultNote(store, code) {
  return (store.roles && store.roles.eo && store.roles.eo.note && store.roles.eo.note[code]) || "";
}

/* submissions awaiting grading across all courses */
function gradingQueue(store) {
  const { STAFF_COURSES, STAFF_SUBMISSIONS, staffContentFor } = window.STAFF_DATA;
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

/* ---------------- shell ---------------- */
function StaffNavList({ route, go, onNavigate }) {
  const queue = gradingQueue(window.__store || {});
  return (
    <>
      {STAFF_NAV.map((grp) =>
      <div key={grp.section}>
          <div className="fb-section-title">{grp.section}</div>
          {grp.items.map(([key, label, icon]) =>
        <div key={key} className="fb-nav-item" data-active={route === key}
        onClick={() => {go(key);onNavigate && onNavigate();}}>
              <Icon name={icon} size={16} />
              <span className="u-grow">{label}</span>
            </div>
        )}
        </div>
      )}
    </>);

}

function StaffTopbar({ title, dark, setDark, openDrawer, go }) {
  const { STAFF, STAFF_NOTIFICATIONS } = window.STAFF_DATA;
  const [notifs, setNotifs] = React.useState(STAFF_NOTIFICATIONS);
  const [open, setOpen] = React.useState(false);
  const unread = notifs.filter((n) => n.unread).length;
  return (
    <header className="u-topbar">
      <button className="fb-icon-btn u-menu-btn" onClick={openDrawer} aria-label="Open navigation"><Icon name="menu" size={18} /></button>
      <div className="u-h3 u-grow">{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconBtn className="u-theme-btn" name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} aria-label={dark ? "Use light mode" : "Use dark mode"} />
        <button className="fb-icon-btn u-notif-btn" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label={unread > 0 ? "Notifications, " + unread + " unread" : "Notifications"}>
          <Icon name="bell" size={18} />
          {unread > 0 && <span style={{ position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 9.5, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid var(--bg-elev)" }}>{unread}</span>}
        </button>
        {open && <NotificationsPanel items={notifs} onClose={() => setOpen(false)} onReadAll={() => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))} />}
        <div className="u-row u-topbar-profile" style={{ gap: 8, cursor: "pointer", paddingLeft: 4 }} onClick={() => go("s-profile")}>
          <Avatar initials={STAFF.initials} size={30} />
          <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{STAFF.first}</div>
            <div className="u-meta" style={{ fontSize: 11 }}>{STAFF.title}</div>
          </div>
        </div>
      </div>
    </header>);

}

function StaffPortal({ store, actions, dark, setDark, onLogout }) {
  const { STAFF } = window.STAFF_DATA;
  const [route, setRoute] = React.useState(() => localStorage.getItem("futech.sroute") || "s-dashboard");
  const [drawer, setDrawer] = React.useState(false);
  window.__store = store; // for nav badge
  const go = (r) => {
    if (r === "__logout") {onLogout();return;}
    setRoute(r);localStorage.setItem("futech.sroute", r);
    document.querySelector(".u-main")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };
  const Cmp = window[STAFF_SCREENS[route].c];

  const Brand =
  <div className="u-brand">
      <div className="u-logo">FT</div>
      <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Staff Portal</div></div>
    </div>;


  return (
    <div className="u-shell">
      <aside className="u-sidebar">
        {Brand}
        <nav className="u-nav u-grow"><StaffNavList route={route} go={go} /></nav>
        <div className="fb-divider" style={{ margin: "8px 0" }} />
        <div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div>
      </aside>

      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}>
          <div className="u-logo">FT</div>
          <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Staff Portal</div></div>
          <span className="u-grow" /><IconBtn name="x" onClick={() => setDrawer(false)} aria-label="Close navigation" />
        </div>
        <div className="u-drawer-nav u-grow"><StaffNavList route={route} go={go} onNavigate={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div></div>
      </div>

      <div className="u-main">
        <StaffTopbar title={STAFF_SCREENS[route].title} dark={dark} setDark={setDark} openDrawer={() => setDrawer(true)} go={go} />
        <div style={{ flex: 1 }}>
          <Cmp store={store} actions={actions} go={go} />
        </div>
      </div>
    </div>);

}

/* ---------------- dashboard ---------------- */
function StaffDashboard({ store, go }) {
  const { STAFF, STAFF_COURSES, ENROLLED, STAFF_TIMETABLE } = window.STAFF_DATA;
  const totalStudents = STAFF_COURSES.reduce((s, c) => s + (ENROLLED[c.code] || 0), 0);
  const queue = gradingQueue(store);
  const pendingResults = STAFF_COURSES.filter((c) => resultStatus(store, c.code) === "draft").length;
  const today = "Tuesday";
  const todays = STAFF_TIMETABLE.lectures.filter((l) => l.day === today).
  sort((a, b) => STAFF_TIMETABLE.periods.indexOf(a.start) - STAFF_TIMETABLE.periods.indexOf(b.start));

  const cards = [
  { icon: "book", k: "Courses", v: STAFF_COURSES.length, sub: "This semester", to: "s-courses" },
  { icon: "user", k: "Students taught", v: totalStudents, sub: "Across all courses", to: "s-courses" },
  { icon: "doc", k: "To grade", v: queue, sub: "Submissions pending", tone: queue > 0 ? "warning" : "success", to: "s-courses" },
  { icon: "chart", k: "Results pending", v: pendingResults, sub: "Awaiting submission", tone: pendingResults > 0 ? "warning" : "success", to: "s-courses" }];


  return (
    <div className="u-content">
      <div style={{ marginBottom: 22 }}>
        <div className="u-h1">Welcome, {STAFF.title.split(" ")[0]} {STAFF.first}</div>
        <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{STAFF.session} · {STAFF.semester} · {STAFF.department}</div>
      </div>

      <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
        {cards.map((c) =>
        <Card key={c.k} className="u-pad" style={{ cursor: "pointer" }} onClick={() => go(c.to)}>
            <div className="u-stat__sub">{c.k}</div>
            <div className="u-row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <div className="u-stat__v u-num">{c.v}</div>
              {c.tone && <Tag variant={c.tone} dot>{c.tone === "warning" ? "Action" : "Done"}</Tag>}
            </div>
            {c.sub && <div className="u-meta" style={{ marginTop: 6 }}>{c.sub}</div>}
          </Card>
        )}
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
                const tone = st === "approved" ? "success" : st === "submitted" ? "accent" : "warning";
                return (
                  <button key={c.code} className="u-row" onClick={() => {localStorage.setItem("futech.scourse", c.code);go("s-courses");}}
                  style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left", width: "100%" }}>
                                        <div className="u-grow" style={{ minWidth: 0 }}>
                      <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</span><Tag>{c.level}</Tag></div>
                      <div style={{ fontSize: 13.5, marginTop: 2 }}>{c.title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="u-meta">{ENROLLED[c.code]} students</div>
                      <Tag variant={tone} dot>{st === "draft" ? "Results due" : st === "submitted" ? "Submitted" : "Approved"}</Tag>
                    </div>
                  </button>);

              })}
            </div>
          </Card>
        </div>

        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Today · {today}</div>
            {(() => {
            const evs = window.portalEvents(store, "staff").filter((e) => e.day === today);
            if (todays.length === 0 && evs.length === 0) return <Empty icon="calendar" title="No classes today" />;
            return (
              <div className="u-stack" style={{ gap: 8 }}>
                {todays.map((l, i) =>
              <div key={i} className="u-row" style={{ gap: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                    <div className="u-meta fb-mono" style={{ width: 42 }}>{l.start}</div>
                    <div className="u-grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.code}</div>
                      <div className="u-meta">{l.room}</div>
                    </div>
                    <Icon name="pin" size={14} style={{ color: "var(--fg-subtle)" }} />
                  </div>
              )}
                {evs.map((e) =>
              <div key={e.id} className="u-row" style={{ gap: 12, padding: "10px 12px", border: "1.5px dashed var(--accent)", borderRadius: "var(--r-md)", background: "var(--accent-soft)" }}>
                    <div className="u-meta fb-mono" style={{ width: 42 }}>{e.start}</div>
                    <div className="u-grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--accent-soft-fg)" }}>{e.title}</div>
                      <div className="u-meta">{e.venue} · scheduled by {e.by}</div>
                    </div>
                    <Tag variant="accent">{e.type}</Tag>
                  </div>
              )}
              </div>);
            })()}
          </Card>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Quick actions</div>
            <div className="u-qa">
              {[["doc", "Grade work", "s-courses"], ["chart", "Submit results", "s-courses"], ["calendar", "Schedule", "s-schedule"], ["user", "Profile", "s-profile"]].map(([ic, lb, to]) =>
              <button key={lb} className="fb-btn fb-btn--secondary" style={{ justifyContent: "flex-start", height: 38 }} onClick={() => go(to)}>
                  <Icon name={ic} size={15} /> <span>{lb}</span>
                </button>
              )}
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
    </div>);

}

/* ---------------- teaching schedule ---------------- */
function StaffSchedule({ store }) {
  const TT = window.STAFF_DATA.STAFF_TIMETABLE;
  return (
    <div className="u-content">
      <PageHead title="Schedule" sub="Your lectures and scheduled meetings this semester" />
      <Card className="u-pad" style={{ overflowX: "auto" }}>
        <div className="u-tt" style={{ minWidth: 620 }}>
          <div />
          {TT.days.map((d) => <div key={d} className="u-tt__h">{d.slice(0, 3)}</div>)}
          {TT.periods.map((p, pi) =>
          <React.Fragment key={p}>
              <div className="u-tt__time">{p}</div>
              {TT.days.map((d) => {
              const ev = TT.lectures.find((l) => l.day === d && l.start === p);
              const covered = TT.lectures.find((l) => l.day === d && l.span === 2 && TT.periods.indexOf(l.start) === pi - 1);
              if (covered) return null;
              const evs = window.eventsAt(store || {}, "staff", d, p);
              if (ev && ev.span === 2) evs.push(...window.eventsAt(store || {}, "staff", d, TT.periods[pi + 1]));
              return (
                <div key={d} style={{ gridRow: ev && ev.span === 2 ? "span 2" : undefined, display: "flex", flexDirection: "column" }}>
                    {ev &&
                  <div className="u-tt__ev" style={{ flex: 1 }}>
                        <span className="c">{ev.code}</span>
                        <span className="r">{ev.room}</span>
                      </div>}
                    {evs.map((e) => <window.EventChip key={e.id} ev={e} />)}
                    {!ev && evs.length === 0 && <div className="u-tt__cell" />}
                  </div>);

            })}
            </React.Fragment>
          )}
        </div>
      </Card>
    </div>);

}

/* ---------------- profile ---------------- */
function StaffProfile() {
  const { STAFF } = window.STAFF_DATA;
  const bio = [
  ["Full name", STAFF.name], ["Staff ID", STAFF.staffId], ["Designation", STAFF.title],
  ["Role", STAFF.role], ["Department", STAFF.department], ["Faculty", STAFF.faculty],
  ["Research area", STAFF.area], ["Office", STAFF.office], ["Email", STAFF.email], ["Phone", STAFF.phone]];

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
          {bio.map(([k, v]) =>
          <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="k">{k}</span><span className="v">{v}</span>
            </div>
          )}
        </div>
      </Card>
    </div>);

}

Object.assign(window, {
  StaffPortal, StaffDashboard, StaffSchedule, StaffProfile,
  gradeOf, GP, SGRADE_TONE, effScore, resultStatus, resultNote, gradingQueue,
  STAFF_NAV, STAFF_SCREENS
});
