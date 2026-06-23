/* Generic role-driven portal shell + registry + shared helpers + dashboards */

/* read a role decision from the store: store.roles[role][key][id] */
function rstate(store, role, key, id, fb) {
  const r = store.roles || {};
  return (((r[role] || {})[key] || {})[id]) !== undefined ? r[role][key][id] : fb;
}

/* status pill */
function SPill({ s }) {
  const map = {
    pending: ["warning", "Pending"], approved: ["success", "Approved"], rejected: ["danger", "Rejected"],
    query: ["warning", "Queried"], confirmed: ["success", "Confirmed"], flagged: ["danger", "Flagged"],
    declined: ["danger", "Declined"], returned: ["success", "Returned"], fulfilled: ["success", "Fulfilled"], cancelled: ["danger", "Cancelled"],
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
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <span className={"u-icon" + (c.plain ? " u-icon--plain" : "")}><Icon name={c.icon} size={16} /></span>
            {c.tag && <Tag variant={c.tone} dot={!!c.tone}>{c.tag}</Tag>}
          </div>
          <div className="u-stat__v u-num">{c.v}</div>
          <div className="u-stat__sub">{c.k}</div>
        </Card>
      ))}
    </div>
  );
}

function RoleHero({ person, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="u-h1">Welcome, {person.first} 👋</div>
      <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{person.role} · 2025/2026 First Semester</div>
    </div>
  );
}

/* generic profile for any role */
function RoleProfile({ roleCfg }) {
  const p = roleCfg.person;
  const bio = [
    ["Full name", p.name], ["Staff ID", p.staffId], ["Designation", p.title], ["Role", p.role],
    ["Department", p.department], ["Faculty", p.faculty], ["Area", p.area],
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
        <div className="u-grid u-grid--2" style={{ gap: 0 }}>
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
      nav: window.STAFF_NAV, screens: window.STAFF_SCREENS,
    },
    adviser: {
      label: "Level Adviser", brand: "Adviser Portal", person: RD.PEOPLE.adviser, notifications: RD.notif("adviser"),
      nav: [
        { section: "Overview", items: [["adv-dash", "Dashboard", "dashboard"]] },
        { section: "Advising", items: [["adv-reg", "Course Approvals", "book"], ["adv-list", "My Advisees", "user"]] },
        { section: "Account", items: [["adv-profile", "Profile", "user"]] },
      ],
      screens: { "adv-dash": { c: "AdviserDashboard", title: "Dashboard" }, "adv-reg": { c: "AdviserApprovals", title: "Course Approvals" }, "adv-list": { c: "AdviserAdvisees", title: "My Advisees" }, "adv-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    hod: {
      label: "Head of Department", brand: "HOD Portal", person: RD.PEOPLE.hod, notifications: RD.notif("hod"),
      nav: [
        { section: "Overview", items: [["hod-dash", "Dashboard", "dashboard"]] },
        { section: "Department", items: [["hod-assign", "Course Assignments", "book"], ["hod-results", "Result Approvals", "chart"], ["hod-staff", "Staff", "user"]] },
        { section: "Account", items: [["hod-profile", "Profile", "user"]] },
      ],
      screens: { "hod-dash": { c: "HodDashboard", title: "Dashboard" }, "hod-assign": { c: "HodAssignments", title: "Course Assignments" }, "hod-results": { c: "HodApprovals", title: "Result Approvals" }, "hod-staff": { c: "HodStaff", title: "Department Staff" }, "hod-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    dean: {
      label: "Dean of Faculty", brand: "Dean's Portal", person: RD.PEOPLE.dean, notifications: RD.notif("dean"),
      nav: [
        { section: "Overview", items: [["dean-dash", "Dashboard", "dashboard"]] },
        { section: "Faculty", items: [["dean-depts", "Departments", "building"], ["dean-results", "Result Approvals", "chart"]] },
        { section: "Account", items: [["dean-profile", "Profile", "user"]] },
      ],
      screens: { "dean-dash": { c: "DeanDashboard", title: "Dashboard" }, "dean-depts": { c: "DeanDepts", title: "Departments" }, "dean-results": { c: "DeanApprovals", title: "Result Approvals" }, "dean-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    exams: {
      label: "Exams & Records", brand: "Exams & Records", person: RD.PEOPLE.exams, notifications: RD.notif("exams"),
      nav: [
        { section: "Overview", items: [["exm-dash", "Dashboard", "dashboard"]] },
        { section: "Records", items: [["exm-publish", "Publish Results", "chart"], ["exm-trans", "Transcripts", "doc"]] },
        { section: "Account", items: [["exm-profile", "Profile", "user"]] },
      ],
      screens: { "exm-dash": { c: "ExamsDashboard", title: "Dashboard" }, "exm-publish": { c: "ExamsPublish", title: "Publish Results" }, "exm-trans": { c: "ExamsTranscripts", title: "Transcripts" }, "exm-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    bursary: {
      label: "Bursary", brand: "Bursary Portal", person: RD.PEOPLE.bursary, notifications: RD.notif("bursary"),
      nav: [
        { section: "Overview", items: [["bur-dash", "Dashboard", "dashboard"]] },
        { section: "Finance", items: [["bur-verify", "Payment Verification", "wallet"], ["bur-debtors", "Debtors", "info"], ["bur-fees", "Fee Structure", "doc"]] },
        { section: "Account", items: [["bur-profile", "Profile", "user"]] },
      ],
      screens: { "bur-dash": { c: "BursaryDashboard", title: "Dashboard" }, "bur-verify": { c: "BursaryVerify", title: "Payment Verification" }, "bur-debtors": { c: "BursaryDebtors", title: "Debtors" }, "bur-fees": { c: "BursaryFees", title: "Fee Structure" }, "bur-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    librarian: {
      label: "Librarian", brand: "Library Portal", person: window.CAMPUS_DATA.PEOPLE.librarian, notifications: window.CAMPUS_DATA.NOTIF.librarian,
      nav: [
        { section: "Overview", items: [["lib-dash", "Dashboard", "dashboard"]] },
        { section: "Library", items: [["lib-desk", "Circulation Desk", "bookOpen"], ["lib-res", "Reservations", "clock"], ["lib-overdue", "Overdue & Fines", "info"], ["lib-cat", "Catalogue", "book"]] },
        { section: "Account", items: [["lib-profile", "Profile", "user"]] },
      ],
      screens: { "lib-dash": { c: "LibrarianDashboard", title: "Dashboard" }, "lib-desk": { c: "LibrarianDesk", title: "Circulation Desk" }, "lib-res": { c: "LibrarianReservations", title: "Reservations" }, "lib-overdue": { c: "LibrarianOverdue", title: "Overdue & Fines" }, "lib-cat": { c: "LibrarianCatalogue", title: "Catalogue" }, "lib-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    clinic: {
      label: "Medical Officer", brand: "Health Services", person: window.CAMPUS_DATA.PEOPLE.clinic, notifications: window.CAMPUS_DATA.NOTIF.clinic,
      nav: [
        { section: "Overview", items: [["cl-dash", "Dashboard", "dashboard"]] },
        { section: "Clinic", items: [["cl-queue", "Appointment Queue", "heart"], ["cl-patients", "Patient Records", "user"], ["cl-pharmacy", "Pharmacy", "pill"]] },
        { section: "Account", items: [["cl-profile", "Profile", "user"]] },
      ],
      screens: { "cl-dash": { c: "ClinicDashboard", title: "Dashboard" }, "cl-queue": { c: "ClinicQueue", title: "Appointment Queue" }, "cl-patients": { c: "ClinicPatients", title: "Patient Records" }, "cl-pharmacy": { c: "ClinicPharmacy", title: "Pharmacy" }, "cl-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    hostel: {
      label: "Hostel Officer", brand: "Accommodation", person: RD.PEOPLE.hostel, notifications: RD.notif("hostel"),
      nav: [
        { section: "Overview", items: [["hos-dash", "Dashboard", "dashboard"]] },
        { section: "Accommodation", items: [["hos-apps", "Applications", "bed"], ["hos-rooms", "Hall Occupancy", "building"]] },
        { section: "Account", items: [["hos-profile", "Profile", "user"]] },
      ],
      screens: { "hos-dash": { c: "HostelDashboard", title: "Dashboard" }, "hos-apps": { c: "HostelApplications", title: "Applications" }, "hos-rooms": { c: "HostelOccupancy", title: "Hall Occupancy" }, "hos-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    registry: {
      label: "Registry / Admissions", brand: "Registry Portal", person: RD.PEOPLE.registry, notifications: RD.notif("registry"),
      nav: [
        { section: "Overview", items: [["reg-dash", "Dashboard", "dashboard"]] },
        { section: "Admissions", items: [["reg-apps", "Applications", "doc"], ["reg-records", "Student Records", "user"]] },
        { section: "Account", items: [["reg-profile", "Profile", "user"]] },
      ],
      screens: { "reg-dash": { c: "RegistryDashboard", title: "Dashboard" }, "reg-apps": { c: "RegistryApplications", title: "Applications" }, "reg-records": { c: "RegistryRecords", title: "Student Records" }, "reg-profile": { c: "RoleProfileScreen", title: "Profile" } },
    },
    ict: {
      label: "ICT / Super Admin", brand: "ICT Admin", person: RD.PEOPLE.ict, notifications: RD.notif("ict"),
      nav: [
        { section: "Overview", items: [["ict-dash", "Dashboard", "dashboard"]] },
        { section: "System", items: [["ict-users", "User Management", "user"], ["ict-sessions", "Sessions", "calendar"], ["ict-audit", "Audit Log", "shield"]] },
        { section: "Account", items: [["ict-profile", "Profile", "user"]] },
      ],
      screens: { "ict-dash": { c: "IctDashboard", title: "Dashboard" }, "ict-users": { c: "IctUsers", title: "User Management" }, "ict-sessions": { c: "IctSessions", title: "Sessions" }, "ict-audit": { c: "IctAudit", title: "Audit Log" }, "ict-profile": { c: "RoleProfileScreen", title: "Profile" } },
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

function RoleTopbar({ cfg, title, dark, setDark, openDrawer, go }) {
  const [notifs, setNotifs] = React.useState(cfg.notifications || []);
  const [open, setOpen] = React.useState(false);
  const unread = notifs.filter((n) => n.unread).length;
  return (
    <header className="u-topbar">
      <button className="fb-icon-btn u-menu-btn" onClick={openDrawer}><Icon name="menu" size={18} /></button>
      <div className="u-h3 u-grow">{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} />
        <button className="fb-icon-btn" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label="Notifications">
          <Icon name="bell" size={18} />
          {unread > 0 && <span style={{ position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 9.5, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid var(--bg-elev)" }}>{unread}</span>}
        </button>
        {open && <NotificationsPanel items={notifs} onClose={() => setOpen(false)} onReadAll={() => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))} />}
        <div className="u-row" style={{ gap: 8, cursor: "pointer", paddingLeft: 4 }} onClick={() => go(profileRoute(cfg))}>
          <Avatar initials={cfg.person.initials} size={30} />
          <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{cfg.person.first}</div>
            <div className="u-meta" style={{ fontSize: 11 }}>{cfg.label}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function profileRoute(cfg) {
  return Object.keys(cfg.screens).find((k) => /profile/.test(k)) || Object.keys(cfg.screens)[0];
}

function RolePortal({ role, store, actions, dark, setDark, onLogout }) {
  const CFG = React.useMemo(() => buildRoleConfig(), []);
  const cfg = CFG[role] || CFG.lecturer;
  const first = cfg.nav[0].items[0][0];
  const [route, setRoute] = React.useState(() => {
    const saved = localStorage.getItem("futech.rt." + role);
    return saved && cfg.screens[saved] ? saved : first;
  });
  const [drawer, setDrawer] = React.useState(false);
  window.__store = store;
  const go = (r) => {
    if (r === "__logout") { onLogout(); return; }
    setRoute(r); localStorage.setItem("futech.rt." + role, r);
    document.querySelector(".u-main")?.scrollTo(0, 0); window.scrollTo(0, 0);
  };
  const scr = cfg.screens[route] || cfg.screens[first];
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
        <nav className="u-nav u-grow"><RoleNavList nav={cfg.nav} route={route} go={go} /></nav>
        <div className="fb-divider" style={{ margin: "8px 0" }} />
        <div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div>
      </aside>

      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}>
          <div className="u-logo">FT</div>
          <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">{cfg.brand}</div></div>
          <span className="u-grow" /><IconBtn name="x" onClick={() => setDrawer(false)} />
        </div>
        <div className="u-drawer-nav u-grow"><RoleNavList nav={cfg.nav} route={route} go={go} onNavigate={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div></div>
      </div>

      <div className="u-main">
        <RoleTopbar cfg={cfg} title={scr.title} dark={dark} setDark={setDark} openDrawer={() => setDrawer(true)} go={go} />
        <div style={{ flex: 1 }}>
          <Cmp store={store} actions={actions} go={go} roleCfg={cfg} role={role} />
        </div>
      </div>
    </div>
  );
}

/* profile screen wrapper that receives roleCfg */
function RoleProfileScreen({ roleCfg }) { return <RoleProfile roleCfg={roleCfg} />; }

Object.assign(window, {
  rstate, SPill, StatCards, RoleHero, RoleProfile, RoleProfileScreen,
  buildRoleConfig, RolePortal, ROLE_IDS: ["lecturer", "adviser", "hod", "dean", "exams", "bursary", "librarian", "clinic", "hostel", "registry", "ict"],
  ROLE_LABELS: {
    lecturer: "Lecturer", adviser: "Level Adviser", hod: "Head of Department", dean: "Dean of Faculty",
    exams: "Exams & Records", bursary: "Bursary Officer", librarian: "Librarian", clinic: "Medical Officer",
    hostel: "Hostel Officer", registry: "Registry / Admissions", ict: "ICT / Super Admin",
  },
});
