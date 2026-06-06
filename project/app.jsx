/* App shell, store, routing, entry */

const NAV = [
  { section: "Overview", items: [["dashboard", "Dashboard", "dashboard"]] },
  { section: "Academics", items: [["registration", "Course Registration", "book"], ["classes", "Classes", "cap"], ["timetable", "Timetable", "calendar"], ["results", "Results", "chart"]] },
  { section: "Finance", items: [["finance", "Finance", "wallet"]] },
  { section: "Campus", items: [["hostel", "Hostel", "bed"], ["library", "Library", "bookOpen"], ["clinic", "Health Centre", "heart"]] },
  { section: "Account", items: [["profile", "Profile", "user"], ["support", "Support", "help"]] },
];

const SCREENS = {
  dashboard: { c: "Dashboard", title: "Dashboard" },
  registration: { c: "Registration", title: "Course Registration" },
  classes: { c: "Classes", title: "Classes" },
  timetable: { c: "Timetable", title: "Timetable" },
  results: { c: "Results", title: "Results" },
  finance: { c: "Finance", title: "Finance" },
  fees: { c: "Fees", title: "School Fees" },
  hostel: { c: "Hostel", title: "Hostel" },
  library: { c: "Library", title: "Library" },
  clinic: { c: "Clinic", title: "Health Centre" },
  profile: { c: "Profile", title: "Profile" },
  support: { c: "Support", title: "Support" },
};

const DEFAULT_STORE = {
  feesPaid: false,
  feesReceipt: null,
  payments: [],
  registration: { status: "none", courses: [], units: 0 },
  hostel: { status: "none" },
  submissions: {},
  staff: { scores: {}, results: {}, grades: {}, materials: {}, posts: {}, assignments: {} },
  campus: { loans: [], reservations: [], returned: {}, renewed: {}, appointments: [], cancelled: {}, finePaid: false },
  roles: {},
};

function genRef(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function nowStr() {
  return new Date().toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function NavList({ route, go, onNavigate }) {
  return (
    <>
      {NAV.map((grp) => (
        <div key={grp.section}>
          <div className="fb-section-title">{grp.section}</div>
          {grp.items.map(([key, label, icon]) => (
            <div key={key} className="fb-nav-item" data-active={route === key}
              onClick={() => { go(key); onNavigate && onNavigate(); }}>
              <Icon name={icon} size={16} />
              <span className="u-grow">{label}</span>
              {key === "fees" && <Tag variant="danger">!</Tag>}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Sidebar({ route, go }) {
  return (
    <aside className="u-sidebar">
      <div className="u-brand">
        <div className="u-logo">FT</div>
        <div>
          <div className="u-brand__name">FUTECH</div>
          <div className="u-brand__sub">Student Portal</div>
        </div>
      </div>
      <nav className="u-nav u-grow"><NavList route={route} go={go} /></nav>
      <div className="fb-divider" style={{ margin: "8px 0" }} />
      <div className="fb-nav-item" onClick={() => go("__logout")}><Icon name="logout" size={16} /> Sign out</div>
    </aside>
  );
}

function Topbar({ title, dark, setDark, openDrawer, go }) {
  const { STUDENT, NOTIFICATIONS } = window.DATA;
  const [notifs, setNotifs] = React.useState(NOTIFICATIONS);
  const [open, setOpen] = React.useState(false);
  const unread = notifs.filter((n) => n.unread).length;
  return (
    <header className="u-topbar">
      <button className="fb-icon-btn u-menu-btn" onClick={openDrawer}><Icon name="menu" size={18} /></button>
      <div className="u-h3 u-grow">{title}</div>
      <div className="fb-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="fb-btn fb-btn--secondary fb-btn--sm fb-hide-mobile" style={{ width: 200, justifyContent: "flex-start", color: "var(--fg-faint)" }}>
          <Icon name="search" size={14} /> Search… <span className="u-grow" /> <span className="fb-kbd">⌘K</span>
        </button>
        <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} />
        <button className="fb-icon-btn" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label="Notifications">
          <Icon name="bell" size={18} />
          {unread > 0 && <span style={{ position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 9.5, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid var(--bg-elev)" }}>{unread}</span>}
        </button>
        {open && <NotificationsPanel items={notifs} onClose={() => setOpen(false)} onReadAll={() => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))} />}
        <div className="u-row" style={{ gap: 8, cursor: "pointer", paddingLeft: 4 }} onClick={() => go("profile")}>
          <Avatar initials={STUDENT.initials} size={30} />
          <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{STUDENT.first}</div>
            <div className="u-meta" style={{ fontSize: 11 }}>{STUDENT.level}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Portal({ store, actions, dark, setDark, onLogout }) {
  const [route, setRoute] = React.useState(() => localStorage.getItem("futech.route") || "dashboard");
  const [drawer, setDrawer] = React.useState(false);
  const go = (r) => {
    if (r === "__logout") { onLogout(); return; }
    setRoute(r); localStorage.setItem("futech.route", r);
    document.querySelector(".u-main")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };
  const Cmp = window[SCREENS[route].c];

  return (
    <div className="u-shell">
      <Sidebar route={route} go={go} />

      {/* mobile drawer */}
      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}>
          <div className="u-logo">FT</div>
          <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Student Portal</div></div>
          <span className="u-grow" />
          <IconBtn name="x" onClick={() => setDrawer(false)} />
        </div>
        <div className="u-drawer-nav u-grow"><NavList route={route} go={go} onNavigate={() => setDrawer(false)} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div></div>
      </div>

      <div className="u-main">
        <Topbar title={SCREENS[route].title} dark={dark} setDark={setDark} openDrawer={() => setDrawer(true)} go={go} />
        <div style={{ flex: 1 }}>
          <Cmp store={store} actions={actions} go={go} />
        </div>
      </div>
    </div>
  );
}

const ACCENT_MAP = { "#2c7a57": "green", "#3a5fb0": "blue", "#9a6a1a": "amber", "#6b4fc0": "violet" };
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2c7a57",
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [dark, setDark] = React.useState(() => localStorage.getItem("futech.dark") === "1");
  const [view, setView] = React.useState(() => localStorage.getItem("futech.authed") === "1" ? "portal" : "home");
  const [role, setRole] = React.useState(() => localStorage.getItem("futech.role") || "student");
  const [store, setStore] = React.useState(() => {
    try { return { ...DEFAULT_STORE, ...JSON.parse(localStorage.getItem("futech.store") || "{}") }; }
    catch { return DEFAULT_STORE; }
  });

  React.useEffect(() => { localStorage.setItem("futech.dark", dark ? "1" : "0"); }, [dark]);
  React.useEffect(() => { localStorage.setItem("futech.store", JSON.stringify(store)); }, [store]);

  const actions = React.useMemo(() => ({
    payFees: (method) => setStore((s) => ({ ...s, feesPaid: true, feesReceipt: { ref: genRef("PAY"), date: nowStr(), method: { card: "Debit card", transfer: "Bank transfer", ussd: "USSD" }[method] || "Card" } })),
    payCharge: (p) => setStore((s) => ({ ...s, payments: [{ id: genRef("PAY"), ref: genRef("PAY"), date: nowStr(), ...p }, ...(s.payments || [])] })),
    submitRegistration: (courses, units) => setStore((s) => ({ ...s, registration: { status: "pending", courses, units } })),
    approveRegistration: () => setStore((s) => ({ ...s, registration: { ...s.registration, status: "approved" } })),
    allocateHostel: (a) => setStore((s) => ({ ...s, hostel: { status: "allocated", ...a, ref: genRef("HST"), date: nowStr(), method: a.method || "Debit card" } })),
    submitAssignment: (id, sub) => setStore((s) => ({ ...s, submissions: { ...(s.submissions || {}), [id]: sub } })),
    borrowBook: (book) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      const loans = campus.loans || [];
      if (loans.some((l) => l.bookId === book.id)) return s;
      return {
        ...s,
        campus: {
          ...campus,
          loans: [{
            id: genRef("LIB"),
            bookId: book.id,
            title: book.title,
            author: book.author,
            borrowed: "Today",
            due: "14 days",
            overdue: false,
            renewed: false,
          }, ...loans],
          reservations: (campus.reservations || []).filter((r) => r.bookId !== book.id),
        },
      };
    }),
    reserveBook: (book) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      const reservations = campus.reservations || [];
      if (reservations.some((r) => r.bookId === book.id)) return s;
      return { ...s, campus: { ...campus, reservations: [{ bookId: book.id, title: book.title, author: book.author }, ...reservations] } };
    }),
    cancelReservation: (bookId) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      return { ...s, campus: { ...campus, reservations: (campus.reservations || []).filter((r) => r.bookId !== bookId) } };
    }),
    renewLoan: (id) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      const loans = (campus.loans || []).map((l) => l.id === id ? { ...l, renewed: true, due: "28 days" } : l);
      return { ...s, campus: { ...campus, loans, renewed: { ...(campus.renewed || {}), [id]: true } } };
    }),
    returnBook: (id) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      return { ...s, campus: { ...campus, returned: { ...(campus.returned || {}), [id]: true } } };
    }),
    payLibraryFine: () => setStore((s) => ({ ...s, campus: { ...(s.campus || {}), finePaid: true } })),
    bookAppointment: (appt) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      return { ...s, campus: { ...campus, appointments: [appt, ...((campus.appointments) || [])] } };
    }),
    cancelAppointment: (id) => setStore((s) => {
      const campus = { ...(s.campus || {}) };
      return { ...s, campus: { ...campus, cancelled: { ...(campus.cancelled || {}), [id]: true } } };
    }),
    // staff actions
    setScore: (code, matric, field, value) => setStore((s) => {
      const staff = s.staff || {}; const scores = { ...(staff.scores || {}) };
      const k = code + ":" + matric; scores[k] = { ...(scores[k] || {}), [field]: value };
      return { ...s, staff: { ...staff, scores } };
    }),
    submitResults: (code) => setStore((s) => ({ ...s, staff: { ...s.staff, results: { ...(s.staff && s.staff.results), [code]: "submitted" } } })),
    approveResults: (code) => setStore((s) => ({ ...s, staff: { ...s.staff, results: { ...(s.staff && s.staff.results), [code]: "approved" } } })),
    gradeSubmission: (aid, matric, grade) => setStore((s) => ({ ...s, staff: { ...s.staff, grades: { ...(s.staff && s.staff.grades), [aid + ":" + matric]: grade } } })),
    addMaterial: (code, m) => setStore((s) => { const mats = { ...(s.staff && s.staff.materials) }; mats[code] = [m, ...(mats[code] || [])]; return { ...s, staff: { ...s.staff, materials: mats } }; }),
    postAnnouncement: (code, body) => setStore((s) => { const posts = { ...(s.staff && s.staff.posts) }; posts[code] = [{ who: window.STAFF_DATA.STAFF.name, time: nowStr(), body }, ...(posts[code] || [])]; return { ...s, staff: { ...s.staff, posts } }; }),
    addAssignment: (code, a) => setStore((s) => { const asg = { ...(s.staff && s.staff.assignments) }; asg[code] = [...(asg[code] || []), a]; return { ...s, staff: { ...s.staff, assignments: asg } }; }),
    // generic multi-role decision action: store.roles[role][key][id] = value
    roleAct: (role, key, id, value) => setStore((s) => {
      const roles = { ...(s.roles || {}) };
      const r = { ...(roles[role] || {}) };
      const m = { ...(r[key] || {}) };
      m[id] = value; r[key] = m; roles[role] = r;
      return { ...s, roles };
    }),
    reset: () => { setStore(DEFAULT_STORE); localStorage.removeItem("futech.route"); },
  }), []);

  const go = (v) => {
    if (v === "login") setView("login");
    else if (v === "home") setView("home");
  };
  const login = (r) => { const rr = r || "student"; localStorage.setItem("futech.role", rr); setRole(rr); localStorage.setItem("futech.authed", "1"); setView("portal"); };
  const logout = () => { localStorage.setItem("futech.authed", "0"); setView("home"); };

  // expose for tweaks panel
  React.useEffect(() => { window.__futechReset = actions.reset; window.__futechSetDark = setDark; }, [actions]);

  let body;
  if (view === "home") body = <PublicHome go={go} dark={dark} setDark={setDark} />;
  else if (view === "login") body = <Login go={go} onLogin={login} dark={dark} setDark={setDark} />;
  else if (role === "student") body = <Portal store={store} actions={actions} dark={dark} setDark={setDark} onLogout={logout} />;
  else body = <RolePortal role={role} store={store} actions={actions} dark={dark} setDark={setDark} onLogout={logout} />;

  return (
    <div className="fb-app" data-theme={dark ? "dark" : "light"} data-accent={ACCENT_MAP[t.accent] || "green"} data-density={t.density} style={{ minHeight: "100vh" }}>
      {body}
      <DetailLayer />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={["#2c7a57", "#3a5fb0", "#9a6a1a", "#6b4fc0"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakToggle label="Dark mode" value={dark} onChange={setDark} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={["compact", "comfortable", "spacious"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Demo" />
        <TweakButton label="Reset demo progress" onClick={() => { window.__futechReset && window.__futechReset(); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
