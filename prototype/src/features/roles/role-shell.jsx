import React from "react";
const { Avatar, Card, CommandPalette, Icon, IconBtn, NotificationsPanel, PageHead, Tag } = window;
/* Generic role-driven portal shell + registry + shared helpers + dashboards */

/* read a role decision from the store: store.roles[role][key][id] */
function rstate(store, role, key, id, fb) {
  const r = store.roles || {};
  return (((r[role] || {})[key] || {})[id]) !== undefined ? r[role][key][id] : fb;
}

/* ---- class rep (one per class; the demo class is 300L CSC) ---- */
const REP_KEY = "300L-CSC";
function classRepId(store) { return rstate(store, "adviser", "rep", REP_KEY, null); }
function classRepOf(store) {
  const id = classRepId(store);
  return id ? (window.ROLE_DATA.ADVISEES.find((a) => a.id === id) || null) : null;
}
/* is the logged-in demo student the class rep? */
function iAmClassRep(store) { return classRepId(store) === "adv-me"; }

/* ---- dean/hod scheduled events, filtered by who is looking ---- */
function portalEvents(store, who) {
  return (store.events || []).filter((e) => e.audience === "both" || e.audience === who);
}
function eventsAt(store, who, day, start) {
  return portalEvents(store, who).filter((e) => e.day === day && e.start === start);
}

/* small chip for rendering a scheduled event inside a timetable cell */
function EventChip({ ev }) {
  return (
    <div className="u-tt__ev" style={{
      background: "var(--accent-soft)", color: "var(--accent-soft-fg)",
      border: ev.clashes && ev.clashes.length ? "1.5px dashed var(--danger)" : "1.5px dashed var(--accent)",
      marginTop: 4,
    }}>
      <span className="c" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={11} /> {ev.title}</span>
      <span className="r">{ev.venue}{ev.clashes && ev.clashes.length ? " · clash" : ""}</span>
    </div>
  );
}

/* status pill */
function SPill({ s }) {
  const map = {
    pending: ["warning", "Pending"], approved: ["success", "Approved"], rejected: ["danger", "Rejected"],
    query: ["warning", "Queried"], confirmed: ["success", "Confirmed"], flagged: ["danger", "Flagged"],
    allocated: ["success", "Allocated"], admitted: ["success", "Admitted"], published: ["success", "Published"],
    ready: ["accent", "Ready"], processing: ["accent", "Processing"], done: ["success", "Done"],
    active: ["success", "Active"], suspended: ["danger", "Suspended"], "not-submitted": [undefined, "Not submitted"],
  };
  const [tone, label] = map[s] || [undefined, s];
  return <Tag variant={tone} dot={!!tone}>{label}</Tag>;
}

function StatCards({ items }) {
  return (
    <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
      {items.map((c) => (
        <Card key={c.k} className="u-pad" style={c.to ? { cursor: "pointer" } : undefined} onClick={c.onClick}>
          <div className="u-stat__sub">{c.k}</div>
          <div className="u-row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <div className="u-stat__v u-num">{c.v}</div>
            {c.tag && <Tag variant={c.tone} dot={!!c.tone}>{c.tag}</Tag>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoleHero({ person, sub, children }) {
  return (
    <div className="u-row u-wrap" style={{ marginBottom: 22, justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
      <div>
        <div className="u-h1">Welcome, {person.first}</div>
        <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{sub || person.role} · 2025/2026 First Semester</div>
      </div>
      {children && <div className="u-row u-wrap" style={{ gap: 8 }}>{children}</div>}
    </div>
  );
}

/* generic profile for any role */
function RoleProfile({ roleCfg }) {
  const p = roleCfg.person;
  const bio = [
    ["Full name", p.name], ["Staff ID", p.staffId], ["Designation", p.title], ["Role", p.role],
    ["Department", p.department], ["Faculty", (window.ORG && window.ORG.facultyNameOf(p.department)) || p.faculty], ["Area", p.area],
    ["Office", p.office], ["Email", p.email], ["Phone", p.phone],
  ].filter(([, v]) => v);
  return (
    <div className="u-content u-content--narrow">
      <PageHead title="My Profile" sub="Your staff record" />
      <Card className="u-pad">
        <div className="u-row" style={{ gap: 16, marginBottom: 20 }}>
          <Avatar initials={p.initials} size={64} />
          <div className="u-grow">
            <div className="u-h2">{p.name}</div>
            <div className="u-muted" style={{ fontSize: 13.5 }}>{p.title} · {p.department}</div>
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

/* ---------------- registry of all roles ---------------- */
function buildRoleConfig() {
  const RD = window.ROLE_DATA;
  return {
    lecturer: {
      label: "Lecturer", brand: "Staff Portal", person: window.STAFF_DATA.STAFF,
      notifications: window.STAFF_DATA.STAFF_NOTIFICATIONS,
      hats: [
        { key: "lecturer", label: "Lecturer", brand: "Staff Portal", nav: window.STAFF_NAV, screens: window.STAFF_SCREENS },
        {
          key: "exams", label: "Exams & Records", brand: "Exams & Records",
          nav: [
            { section: "Records", items: [["exm-course-results", "Courses", "chart"], ["exm-level", "Level Results", "layers"], ["exm-courses", "Course Management", "book"], ["exm-issues", "Result Issues", "info"], ["exm-trans", "Transcripts", "doc"]] },
          ],
          screens: { "exm-dash": { c: "ExamsDashboard", title: "Dashboard" }, "exm-level": { c: "ExamsLevelResults", title: "Level Results" }, "exm-course-results": { c: "ExamsCourseResults", title: "Courses" }, "exm-courses": { c: "ExamsCourses", title: "Course Management" }, "exm-issues": { c: "ExamsIssues", title: "Result Issues" }, "exm-trans": { c: "ExamsTranscripts", title: "Transcripts" } },
        },
      ],
    },
    adviser: {
      label: "Level Adviser", brand: "Adviser Portal", person: RD.PEOPLE.adviser, notifications: RD.notif("adviser"),
      hats: [
        {
          key: "adviser", label: "Level Adviser", brand: "Adviser Portal",
          nav: [
            { section: "Overview", items: [["adv-dash", "Dashboard", "dashboard"]] },
            { section: "Advising", items: [["adv-reg", "Course Approvals", "book"], ["adv-list", "My Advisees", "user"]] },
            { section: "Account", items: [["adv-profile", "Profile", "user"]] },
          ],
          screens: { "adv-dash": { c: "AdviserDashboard", title: "Dashboard" }, "adv-reg": { c: "AdviserApprovals", title: "Course Approvals" }, "adv-list": { c: "AdviserAdvisees", title: "My Advisees" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "adv-profile": { c: "RoleProfileScreen", title: "Profile" } },
        },
        {
          key: "lecturer", label: "Lecturer", brand: "Staff Portal",
          nav: [
            { section: "Teaching", items: [["ml-course", "My Course", "book"], ["ml-schedule", "Teaching Schedule", "calendar"]] },
          ],
          screens: { "ml-dash": { c: "MiniLecturerDashboard", title: "Teaching Dashboard", courseCode: "CSC 313", roleTitle: "Senior Lecturer · Computer Science" }, "ml-course": { c: "MiniLecturerCourse", title: "My Course", courseCode: "CSC 313", roleTitle: "Senior Lecturer · Computer Science", backTo: "adv-dash" }, "ml-schedule": { c: "MiniLecturerSchedule", title: "Teaching Schedule", courseCode: "CSC 313" } },
        },
      ],
    },
    hod: {
      label: "Head of Department", brand: "HOD Portal", person: RD.PEOPLE.hod, notifications: RD.notif("hod"),
      hats: [
        {
          key: "hod", label: "Head of Department", brand: "HOD Portal",
          nav: [
            { section: "Overview", items: [["hod-dash", "Dashboard", "dashboard"]] },
            { section: "Department", items: [["hod-results", "Result Review", "chart"], ["hod-assign", "Course Assignments", "book"], ["hod-advisers", "Level Advisers", "user"], ["hod-siwes", "SIWES / IT Supervision", "building"], ["hod-projects", "Project Supervision", "cap"], ["hod-schedule", "Schedule", "calendar"], ["hod-staff", "Staff", "user"]] },
            { section: "Account", items: [["hod-profile", "Profile", "user"]] },
          ],
          screens: { "hod-dash": { c: "HodDashboard", title: "Dashboard" }, "hod-results": { c: "LevelReviewQueue", title: "Result Review" }, "hod-assign": { c: "HodAssignments", title: "Course Assignments" }, "hod-advisers": { c: "HodAdvisers", title: "Level Advisers" }, "hod-siwes": { c: "HodSiwes", title: "SIWES / IT Supervision" }, "hod-projects": { c: "HodProjects", title: "Project Supervision" }, "hod-schedule": { c: "HodSchedule", title: "Schedule" }, "hod-staff": { c: "HodStaff", title: "Department Staff" }, "hod-profile": { c: "RoleProfileScreen", title: "Profile" } },
        },
        {
          key: "lecturer", label: "Lecturer", brand: "Staff Portal",
          nav: [
            { section: "Teaching", items: [["ml-course", "My Course", "book"]] },
          ],
          screens: { "ml-dash": { c: "MiniLecturerDashboard", title: "Teaching Dashboard", courseCode: "CSC 303", roleTitle: "Senior Lecturer · Computer Science" }, "ml-course": { c: "MiniLecturerCourse", title: "My Course", courseCode: "CSC 303", roleTitle: "Senior Lecturer · Computer Science", backTo: "hod-dash" }, "ml-schedule": { c: "MiniLecturerSchedule", title: "Teaching Schedule", courseCode: "CSC 303" } },
        },
      ],
    },
    dean: {
      label: "Dean of Faculty", brand: "Dean's Portal", person: RD.PEOPLE.dean, notifications: RD.notif("dean"), facultyId: "computing",
      nav: [
        { section: "Overview", items: [["dean-dash", "Dashboard", "dashboard"]] },
        { section: "Faculty", items: [["dean-depts", "Departments", "building"], ["dean-results", "School Board Approvals", "chart"], ["dean-schedule", "Schedule", "calendar"], ["dean-admissions", "Admissions", "doc"]] },
        { section: "Account", items: [["dean-profile", "Profile", "user"]] },
      ],
      screens: { "dean-dash": { c: "DeanDashboard", title: "Dashboard" }, "dean-depts": { c: "DeanDepts", title: "Departments" }, "dean-results": { c: "LevelReviewQueue", title: "School Board Approvals" }, "dean-schedule": { c: "DeanSchedule", title: "Schedule" }, "dean-admissions": { c: "DeanAdmissions", title: "Admissions" }, "dean-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    exams: {
      label: "Exams & Records", brand: "Exams & Records", person: RD.PEOPLE.exams, notifications: RD.notif("exams"),
      nav: [
        { section: "Overview", items: [["exm-dash", "Dashboard", "dashboard"]] },
        { section: "Records", items: [["exm-course-results", "Courses", "chart"], ["exm-level", "Level Results", "layers"], ["exm-courses", "Course Management", "book"], ["exm-issues", "Result Issues", "info"], ["exm-trans", "Transcripts", "doc"]] },
        { section: "Account", items: [["exm-profile", "Profile", "user"]] },
      ],
      screens: { "exm-dash": { c: "ExamsDashboard", title: "Dashboard" }, "exm-level": { c: "ExamsLevelResults", title: "Level Results" }, "exm-course-results": { c: "ExamsCourseResults", title: "Courses" }, "exm-courses": { c: "ExamsCourses", title: "Course Management" }, "exm-issues": { c: "ExamsIssues", title: "Result Issues" }, "exm-trans": { c: "ExamsTranscripts", title: "Transcripts" }, "exm-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    bursary: {
      label: "Bursary", brand: "Bursary Portal", person: RD.PEOPLE.bursary, notifications: RD.notif("bursary"),
      nav: [
        { section: "Overview", items: [["bur-dash", "Dashboard", "dashboard"]] },
        { section: "Finance", items: [["bur-verify", "Payment Verification", "wallet"], ["bur-debtors", "Debtors", "info"], ["bur-fees", "Fee Structure", "doc"]] },
        { section: "Account", items: [["bur-profile", "Profile", "user"]] },
      ],
      screens: { "bur-dash": { c: "BursaryDashboard", title: "Dashboard" }, "bur-verify": { c: "BursaryVerify", title: "Payment Verification" }, "bur-debtors": { c: "BursaryDebtors", title: "Debtors" }, "bur-fees": { c: "BursaryFees", title: "Fee Structure" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "bur-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    hostel: {
      label: "Hostel Officer", brand: "Accommodation", person: RD.PEOPLE.hostel, notifications: RD.notif("hostel"),
      nav: [
        { section: "Overview", items: [["hos-dash", "Dashboard", "dashboard"]] },
        { section: "Accommodation", items: [["hos-apps", "Applications", "bed"], ["hos-rooms", "Hall Occupancy", "building"]] },
        { section: "Account", items: [["hos-profile", "Profile", "user"]] },
      ],
      screens: { "hos-dash": { c: "HostelDashboard", title: "Dashboard" }, "hos-apps": { c: "HostelApplications", title: "Applications" }, "hos-rooms": { c: "HostelOccupancy", title: "Hall Occupancy" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "hos-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    registry: {
      label: "Registry / Admissions", brand: "Registry Portal", person: RD.PEOPLE.registry, notifications: RD.notif("registry"),
      nav: [
        { section: "Overview", items: [["reg-dash", "Dashboard", "dashboard"]] },
        { section: "Admissions", items: [["reg-apps", "Applications", "doc"], ["reg-records", "Student Records", "user"]] },
        { section: "Account", items: [["reg-profile", "Profile", "user"]] },
      ],
      screens: { "reg-dash": { c: "RegistryDashboard", title: "Dashboard" }, "reg-apps": { c: "RegistryApplications", title: "Applications" }, "reg-records": { c: "RegistryRecords", title: "Student Records" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "reg-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    ict: {
      label: "ICT / Super Admin", brand: "ICT Admin", person: RD.PEOPLE.ict, notifications: RD.notif("ict"),
      nav: [
        { section: "Overview", items: [["ict-dash", "Dashboard", "dashboard"]] },
        { section: "System", items: [["ict-users", "User Management", "user"], ["ict-sessions", "Sessions", "calendar"], ["ict-workflow", "Approval Workflow", "layers"], ["ict-audit", "Audit Log", "shield"]] },
        { section: "Account", items: [["ict-profile", "Profile", "user"]] },
      ],
      screens: { "ict-dash": { c: "IctDashboard", title: "Dashboard" }, "ict-users": { c: "IctUsers", title: "User Management" }, "ict-sessions": { c: "IctSessions", title: "Sessions" }, "ict-workflow": { c: "IctWorkflow", title: "Approval Workflow" }, "ict-audit": { c: "IctAudit", title: "Audit Log" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "ict-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    admissions: {
      label: "Admissions Officer", brand: "Admissions Office", person: RD.PEOPLE.admissions, notifications: RD.notif("admissions"),
      nav: [
        { section: "Overview", items: [["adm-dash", "Dashboard", "dashboard"]] },
        { section: "Admissions", items: [["adm-import", "JAMB Import", "barcode"], ["adm-review", "Screening Review", "doc"], ["adm-eligibility", "Eligibility", "chart"], ["adm-quota", "Quota Tracking", "building"]] },
        { section: "Records", items: [["adm-audit", "Audit Timeline", "shield"]] },
        { section: "Account", items: [["adm-profile", "Profile", "user"]] },
      ],
      screens: { "adm-dash": { c: "AdmDashboard", title: "Dashboard" }, "adm-import": { c: "AdmImport", title: "JAMB Import" }, "adm-review": { c: "AdmReview", title: "Screening Review" }, "adm-eligibility": { c: "AdmEligibility", title: "Eligibility" }, "adm-quota": { c: "AdmQuota", title: "Quota Tracking" }, "adm-audit": { c: "AdmAudit", title: "Audit Timeline" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "adm-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    librarian: {
      label: "Librarian", brand: "Library Services", person: window.CAMPUS_DATA.PEOPLE.librarian, notifications: window.CAMPUS_DATA.NOTIF.librarian,
      nav: [
        { section: "Overview", items: [["lib-dash", "Dashboard", "dashboard"]] },
        { section: "Circulation", items: [["lib-desk", "Circulation Desk", "bookOpen"], ["lib-res", "Reservations", "clock"], ["lib-overdue", "Overdue & Fines", "info"]] },
        { section: "Collection", items: [["lib-cat", "Catalogue", "book"]] },
        { section: "Account", items: [["lib-profile", "Profile", "user"]] },
      ],
      screens: { "lib-dash": { c: "LibrarianDashboard", title: "Dashboard" }, "lib-desk": { c: "LibrarianDesk", title: "Circulation Desk" }, "lib-res": { c: "LibrarianReservations", title: "Reservations" }, "lib-overdue": { c: "LibrarianOverdue", title: "Overdue & Fines" }, "lib-add": { c: "LibrarianAcquisitions", title: "Add to Collection" }, "lib-cat": { c: "LibraryShelf", title: "Catalogue" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "lib-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    clinic: {
      label: "Medical Officer", brand: "Health Services", person: window.CAMPUS_DATA.PEOPLE.clinic, notifications: window.CAMPUS_DATA.NOTIF.clinic,
      nav: [
        { section: "Overview", items: [["cl-dash", "Dashboard", "dashboard"]] },
        { section: "Clinic", items: [["cl-queue", "Appointments", "heart"], ["cl-patients", "Patients", "user"], ["cl-pharmacy", "Pharmacy", "pill"]] },
        { section: "Account", items: [["cl-profile", "Profile", "user"]] },
      ],
      screens: { "cl-dash": { c: "ClinicDashboard", title: "Dashboard" }, "cl-queue": { c: "ClinicQueue", title: "Appointments" }, "cl-patients": { c: "ClinicPatients", title: "Patients" }, "cl-pharmacy": { c: "ClinicPharmacy", title: "Pharmacy" }, "rv-queue": { c: "LevelReviewQueue", title: "Result Reviews" }, "cl-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
  };
}

/* ---------------- generic shell ---------------- */
function RoleNavList({ nav, route, go, onNavigate }) {
  return (
    <>
      {nav.map((grp) => (
        <div key={grp.section}>
          <div className="fb-section-title">{grp.section}</div>
          {grp.items.map(([key, label, icon]) => (
            <div key={key} className="fb-nav-item" data-active={route === key}
              onClick={() => { go(key); onNavigate && onNavigate(); }}>
              <Icon name={icon} size={16} />
              <span className="u-grow">{label}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function RoleTopbar({ cfg, role, store, actions, roleLabel, title, dark, setDark, openDrawer, go, profileKey, nav }) {
  const [seeds, setSeeds] = React.useState(cfg.notifications || []);
  const [open, setOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const live = ((store && store.notifs) || []).filter((n) => n.audience === role);
  const notifs = [...live, ...seeds];
  const readAll = () => { setSeeds((ns) => ns.map((n) => ({ ...n, unread: false }))); actions && actions.markNotifsRead(role); };
  const unread = notifs.filter((n) => n.unread).length;
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setSearchOpen((v) => !v); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <header className="u-topbar">
      <button className="fb-icon-btn u-menu-btn" onClick={openDrawer} aria-label="Open navigation"><Icon name="menu" size={18} /></button>
      <div className="u-h3 u-grow">{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="u-search fb-hide-mobile" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={15} />
          <span className="ph">Search {roleLabel}…</span>
          <span className="fb-kbd">Ctrl K</span>
        </button>
        <button className="fb-icon-btn fb-show-mobile" onClick={() => setSearchOpen(true)} aria-label="Search"><Icon name="search" size={18} /></button>
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} go={go} nav={nav} />
        <IconBtn className="u-theme-btn" name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} aria-label={dark ? "Use light mode" : "Use dark mode"} />
        <button className="fb-icon-btn u-notif-btn" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label={unread > 0 ? "Notifications, " + unread + " unread" : "Notifications"}>
          <Icon name="bell" size={18} />
          {unread > 0 && <span style={{ position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 9.5, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid var(--bg-elev)" }}>{unread}</span>}
        </button>
        {open && <NotificationsPanel items={notifs} onClose={() => setOpen(false)} onReadAll={readAll} />}
        <div className="u-row u-topbar-profile" style={{ gap: 8, cursor: "pointer", paddingLeft: 4 }} onClick={() => go(profileKey)}>
          <Avatar initials={cfg.person.initials} size={30} />
          <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{cfg.person.first}</div>
            <div className="u-meta" style={{ fontSize: 11 }}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function profileRoute(screens) {
  return Object.keys(screens).find((k) => /profile/.test(k)) || Object.keys(screens)[0];
}

/* combine every hat's nav/screens into ONE sidebar (one login, multiple duties) */
function mergeHats(hats) {
  const nav = [];
  const accountSections = [];
  const screens = {};
  hats.forEach((hat, i) => {
    hat.nav.forEach((grp) => {
      if (grp.section === "Account") { if (i === 0) accountSections.push(grp); return; }
      const title = (i > 0 && grp.section === "Overview") ? hat.label : grp.section;
      nav.push({ section: title, items: grp.items });
    });
    Object.assign(screens, hat.screens);
  });
  return { nav: [...nav, ...accountSections], screens };
}

function RolePortal({ role, store, actions, dark, setDark, onLogout, route: routeFromUrl, onRouteChange }) {
  const CFG = React.useMemo(() => buildRoleConfig(), []);
  const cfg = CFG[role] || CFG.lecturer;
  const hats = cfg.hats || [{ key: role, label: cfg.label, nav: cfg.nav, screens: cfg.screens }];
  const merged = React.useMemo(() => mergeHats(hats), [hats]);
  const roleLabel = hats[0].label;

  // "Result Reviews" only appears for roles ICT has actually assigned a
  // workflow stage to right now: HOD and Dean have their own dedicated
  // review screens already, so this is for everyone else, and only when
  // it's live. Computed fresh each render so it appears/disappears the
  // moment ICT edits the workflow, without cluttering every portal by default.
  const hasCustomStage = role !== "hod" && role !== "dean"
    && ((store.workflow && store.workflow.stages) || []).some((s) => s.actorRole === role);
  const navForRender = hasCustomStage
    ? (() => {
        const rest = merged.nav.filter((g) => g.section !== "Account");
        const account = merged.nav.filter((g) => g.section === "Account");
        return [...rest, { section: "Reviews", items: [["rv-queue", "Result Reviews", "chart"]] }, ...account];
      })()
    : merged.nav;

  const first = merged.nav[0].items[0][0];
  const [route, setRoute] = React.useState(() => {
    const saved = routeFromUrl || localStorage.getItem("futech.rt." + role);
    return saved && merged.screens[saved] ? saved : first;
  });
  const [drawer, setDrawer] = React.useState(false);
  window.__store = store;

  React.useEffect(() => {
    if (routeFromUrl && merged.screens[routeFromUrl] && routeFromUrl !== route) setRoute(routeFromUrl);
  }, [routeFromUrl, route, merged.screens]);

  const go = (r) => {
    if (r === "__logout") { onLogout(); return; }
    setRoute(r); localStorage.setItem("futech.rt." + role, r);
    onRouteChange && onRouteChange(r);
    document.querySelector(".u-main")?.scrollTo(0, 0); window.scrollTo(0, 0);
  };

  const scr = merged.screens[route] || merged.screens[first];
  const Cmp = window[scr.c];

  const Brand = (
    <div className="u-brand">
      <div className="u-logo">FT</div>
      <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">{cfg.brand}</div></div>
    </div>
  );

  return (
    <div className="u-shell">
      <aside className="u-sidebar">
        {Brand}
        <nav className="u-nav u-grow"><RoleNavList nav={navForRender} route={route} go={go} /></nav>
        <div className="fb-divider" style={{ margin: "8px 0" }} />
        <div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div>
      </aside>

      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}>
          <div className="u-logo">FT</div>
          <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">{cfg.brand}</div></div>
          <span className="u-grow" /><IconBtn name="x" onClick={() => setDrawer(false)} aria-label="Close navigation" />
        </div>
        <div className="u-drawer-nav u-grow"><RoleNavList nav={navForRender} route={route} go={go} onNavigate={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div></div>
      </div>

      <div className="u-main">
        <RoleTopbar cfg={cfg} role={role} store={store} actions={actions} roleLabel={roleLabel} title={scr.title} dark={dark} setDark={setDark} openDrawer={() => setDrawer(true)} go={go} nav={navForRender} profileKey={profileRoute(merged.screens)} />
        <div style={{ flex: 1 }}>
          <Cmp store={store} actions={actions} go={go} roleCfg={cfg} hat={scr} role={role} />
        </div>
      </div>
    </div>
  );
}

/* profile screen wrapper that receives roleCfg */
function RoleProfileScreen({ roleCfg }) { return <RoleProfile roleCfg={roleCfg} />; }

Object.assign(window, {
  rstate, SPill, StatCards, RoleHero, RoleProfile, RoleProfileScreen,
  REP_KEY, classRepId, classRepOf, iAmClassRep, portalEvents, eventsAt, EventChip,
  buildRoleConfig, RolePortal, ROLE_IDS: ["lecturer", "adviser", "hod", "dean", "exams", "bursary", "hostel", "registry", "admissions", "librarian", "clinic", "ict"],
  ROLE_LABELS: {
    lecturer: "Lecturer", adviser: "Level Adviser", hod: "Head of Department", dean: "Dean · Computing",
    exams: "Exams & Records", bursary: "Bursary Officer", hostel: "Hostel Officer", registry: "Registry / Admissions", admissions: "Admissions Officer", librarian: "Librarian", clinic: "Medical Officer", ict: "ICT / Super Admin",
  },
});
