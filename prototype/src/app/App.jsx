import React from "react";
import "./bootstrap.js";

const {
  Avatar,
  CandidateApp,
  CommandPalette,
  DetailLayer,
  Icon,
  IconBtn,
  Login,
  NotificationsPanel,
  PublicHome,
  RolePortal,
  Tag,
  TweakButton,
  TweakColor,
  TweakRadio,
  TweakSection,
  TweakSelect,
  TweakToggle,
  TweaksPanel,
  useTweaks,
} = window;

/* App shell, store, routing, entry */

const NAV = [
  { section: "Overview", items: [["dashboard", "Dashboard", "dashboard"]] },
  { section: "Academics", items: [["registration", "Course Registration", "book"], ["classes", "Classes", "cap"], ["timetable", "Timetable", "calendar"], ["results", "Results", "chart"]] },
  { section: "Finance", items: [["finance", "Finance", "wallet"]] },
  { section: "Campus", items: [["hostel", "Hostel", "bed"], ["library", "Library", "bookOpen"], ["clinic", "Health Centre", "heart"]] },
  { section: "Account", items: [["profile", "Profile", "user"], ["support", "Support", "help"]] },
];
const NAV_400 = [
  { section: "Overview", items: [["dashboard", "Dashboard", "dashboard"]] },
  { section: "Academics", items: [["registration", "Course Registration", "book"], ["classes", "Classes", "cap"], ["timetable", "Timetable", "calendar"], ["results", "Results", "chart"]] },
  { section: "Industrial Training", items: [["siwes", "SIWES / IT", "pin"]] },
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
  siwes: { c: "Siwes", title: "SIWES / Industrial Training" },
  finance: { c: "Finance", title: "Finance" },
  fees: { c: "Fees", title: "School Fees" },
  hostel: { c: "Hostel", title: "Hostel" },
  library: { c: "Library", title: "Library" },
  clinic: { c: "Clinic", title: "Health Centre" },
  profile: { c: "Profile", title: "Profile" },
  support: { c: "Support", title: "Support" },
};

function cleanHashPart(value) {
  return decodeURIComponent(value || "").replace(/[^a-z0-9_-]/gi, "");
}

function readPrototypeLocation() {
  const source = window.location.hash
    ? window.location.hash.replace(/^#\/?/, "")
    : window.location.pathname.replace(/^\/+/, "");
  const parts = source.split("/").filter(Boolean).map(cleanHashPart);
  if (parts[0] === "login") return { view: "login" };
  if (parts[0] === "apply" || parts[0] === "admissions") return { view: "admissions", route: parts[1] || "overview" };
  if (parts[0] === "portal") return { view: "portal", route: parts[1] || localStorage.getItem("futech.route") || "dashboard" };
  if (parts[0] === "role") return { view: "role", role: parts[1] || localStorage.getItem("futech.role") || "lecturer", route: parts[2] };
  return { view: "home" };
}

function writePrototypeLocation(next) {
  const parts = [];
  if (next.view === "login") parts.push("login");
  else if (next.view === "admissions") parts.push("admissions", next.route || "overview");
  else if (next.view === "portal") parts.push("portal", next.route || "dashboard");
  else if (next.view === "role") parts.push("role", next.role || "lecturer", next.route || "");
  const path = "/" + parts.filter(Boolean).map(encodeURIComponent).join("/");
  if (window.location.pathname + window.location.search + window.location.hash !== path) {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new Event("futech:navigation"));
  }
}

const DEFAULT_STORE = {
  feesPaid: false,
  feesReceipt: null,
  payments: [],
  registration: { status: "none", courses: [], units: 0 },
  hostel: { status: "none" },
  submissions: {},
  campus: { loans: [], returned: {}, reservations: [], finePaid: false, appointments: [], cancelled: {}, libBooks: [], libColl: {}, libNewColl: [] },
  staff: { scores: {}, results: {}, grades: {}, materials: {}, posts: {}, assignments: {}, feedback: {} },
  admissions: {
    verified: false, activated: false, state: "jamb_imported",
    step: 0, form: {}, screeningPaid: false,
    queryResponse: "", accepted: false, acceptancePaid: false, clearance: {},
    pool: {}, imported: [], audit: [],
  },
  roles: {},
  siwes: { status: "none", placement: null, logbook: [], checkins: [] },
  session: {
    current: "2025/2026", semester: "First Semester",
    registration: true, fees: true, hostel: true, results: false,
    regCloses: "Nov 7, 2025", feesCloses: "Oct 31, 2025",
  },
};

function genRef(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function nowStr() {
  return new Date().toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
// campus namespace helper
function cz(s) {
  return s.campus || { loans: [], returned: {}, reservations: [], finePaid: false, appointments: [], cancelled: {}, libBooks: [], libColl: {}, libNewColl: [] };
}

// session lifecycle namespace helper
function sz(s) {
  return s.session || { current: "2025/2026", semester: "First Semester", registration: true, fees: true, hostel: true, results: false, regCloses: "Nov 7, 2025", feesCloses: "Oct 31, 2025" };
}
// siwes / industrial training namespace helper
function wz(s) {
  return s.siwes || { status: "none", placement: null, logbook: [], checkins: [] };
}
// admissions namespace helper
function az(s) {
  return s.admissions || { verified: false, activated: false, state: "jamb_imported", step: 0, form: {}, screeningPaid: false, queryResponse: "", accepted: false, acceptancePaid: false, clearance: {}, pool: {}, imported: [], audit: [] };
}
// advance the live candidate's state + push an audit entry
function admPush(s, state, note) {
  const a = az(s);
  const audit = [{ id: "ev" + Date.now() + Math.random().toString(36).slice(2, 5), who: "me", text: note || ("Status \u2192 " + state), at: nowStr() }, ...(a.audit || [])];
  return { ...s, admissions: { ...a, state, audit } };
}

function NavList({ route, go, onNavigate, nav }) {
  return (
    <>
      {(nav || NAV).map((grp) => (
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

function Sidebar({ route, go, nav }) {
  return (
    <aside className="u-sidebar">
      <div className="u-brand">
        <div className="u-logo">FT</div>
        <div>
          <div className="u-brand__name">FUTECH</div>
          <div className="u-brand__sub">Student Portal</div>
        </div>
      </div>
      <nav className="u-nav u-grow"><NavList route={route} go={go} nav={nav} /></nav>
      <div className="fb-divider" style={{ margin: "8px 0" }} />
      <div className="fb-nav-item" onClick={() => go("__logout")}><Icon name="logout" size={16} /> Sign out</div>
    </aside>
  );
}

function Topbar({ title, dark, setDark, openDrawer, go, levelLabel }) {
  const { STUDENT, NOTIFICATIONS } = window.DATA;
  const [notifs, setNotifs] = React.useState(NOTIFICATIONS);
  const [open, setOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
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
      <button className="fb-icon-btn u-menu-btn" onClick={openDrawer}><Icon name="menu" size={18} /></button>
      <div className="u-h3 u-grow">{title}</div>
      <div className="fb-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="u-search fb-hide-mobile" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={15} />
          <span className="ph">Search…</span>
          <span className="fb-kbd">⌘K</span>
        </button>
        <button className="fb-icon-btn fb-show-mobile" onClick={() => setSearchOpen(true)} aria-label="Search"><Icon name="search" size={18} /></button>
        <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} />
        <button className="fb-icon-btn" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label="Notifications">
          <Icon name="bell" size={18} />
          {unread > 0 && <span style={{ position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 9.5, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid var(--bg-elev)" }}>{unread}</span>}
        </button>
        {open && <NotificationsPanel items={notifs} onClose={() => setOpen(false)} onReadAll={() => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))} />}
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} go={go} />
        <div className="u-row" style={{ gap: 8, cursor: "pointer", paddingLeft: 4 }} onClick={() => go("profile")}>
          <Avatar initials={STUDENT.initials} size={30} />
          <div className="fb-hide-mobile" style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{STUDENT.first}</div>
            <div className="u-meta" style={{ fontSize: 11 }}>{levelLabel || STUDENT.level}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Portal({ store, actions, dark, setDark, onLogout, level400, route: routeFromUrl, onRouteChange }) {
  const [route, setRoute] = React.useState(() => routeFromUrl || localStorage.getItem("futech.route") || "dashboard");
  const [drawer, setDrawer] = React.useState(false);
  const nav = level400 ? NAV_400 : NAV;
  React.useEffect(() => {
    if (routeFromUrl && SCREENS[routeFromUrl] && routeFromUrl !== route) setRoute(routeFromUrl);
  }, [routeFromUrl, route]);
  const go = (r) => {
    if (r === "__logout") { onLogout(); return; }
    setRoute(r); localStorage.setItem("futech.route", r);
    onRouteChange && onRouteChange(r);
    document.querySelector(".u-main")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };
  const validRoute = SCREENS[route] ? route : "dashboard";
  const Cmp = window[SCREENS[validRoute].c];

  return (
    <div className="u-shell">
      <Sidebar route={validRoute} go={go} nav={nav} />

      {/* mobile drawer */}
      <div className="fb-drawer-backdrop" data-open={drawer} onClick={() => setDrawer(false)} />
      <div className="fb-drawer" data-open={drawer}>
        <div className="u-brand" style={{ padding: "14px 16px" }}>
          <div className="u-logo">FT</div>
          <div><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Student Portal</div></div>
          <span className="u-grow" />
          <IconBtn name="x" onClick={() => setDrawer(false)} />
        </div>
        <div className="u-drawer-nav u-grow"><NavList route={validRoute} go={go} onNavigate={() => setDrawer(false)} nav={nav} /></div>
        <div className="u-drawer-nav"><div className="fb-nav-item" onClick={onLogout}><Icon name="logout" size={16} /> Sign out</div></div>
      </div>

      <div className="u-main">
        <Topbar title={SCREENS[validRoute].title} dark={dark} setDark={setDark} openDrawer={() => setDrawer(true)} go={go} levelLabel={level400 ? "400 Level" : undefined} />
        <div style={{ flex: 1 }}>
          <Cmp store={store} actions={actions} go={go} />
        </div>
      </div>
    </div>
  );
}

const ACCENT_MAP = { "#5a1a8a": "crest", "#2c7a57": "green", "#3a5fb0": "blue", "#9a6a1a": "amber" };
const FONT_STACKS = {
  "Geist": '"Geist","Geist Fallback","Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  "IBM Plex Sans": '"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif',
  "Source Sans 3": '"Source Sans 3",ui-sans-serif,system-ui,sans-serif',
  "Source Serif 4": '"Source Serif 4",Georgia,"Times New Roman",serif',
};
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#5a1a8a",
  "font": "IBM Plex Sans",
  "density": "comfortable",
  "studentLevel": "300"
}/*EDITMODE-END*/;

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [location, setLocation] = React.useState(readPrototypeLocation);
  const [dark, setDark] = React.useState(() => localStorage.getItem("futech.dark") === "1");
  const [view, setView] = React.useState(() => {
    const initial = readPrototypeLocation();
    if (initial.view === "home" && localStorage.getItem("futech.authed") === "1") return localStorage.getItem("futech.role") === "student" ? "portal" : "role";
    return initial.view;
  });
  const [role, setRole] = React.useState(() => readPrototypeLocation().role || localStorage.getItem("futech.role") || "student");
  const [store, setStore] = React.useState(() => {
    try { return { ...DEFAULT_STORE, ...JSON.parse(localStorage.getItem("futech.store") || "{}") }; }
    catch { return DEFAULT_STORE; }
  });

  React.useEffect(() => {
    const onHash = () => setLocation(readPrototypeLocation());
    const onNavigate = () => setLocation(readPrototypeLocation());
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onNavigate);
    window.addEventListener("futech:navigation", onNavigate);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("futech:navigation", onNavigate);
    };
  }, []);
  React.useEffect(() => {
    if (location.view === "home" && window.location.pathname === "/" && !window.location.hash && localStorage.getItem("futech.authed") === "1") return;
    setView(location.view);
    if (location.role) {
      setRole(location.role);
      localStorage.setItem("futech.role", location.role);
    }
  }, [location]);
  React.useEffect(() => { localStorage.setItem("futech.dark", dark ? "1" : "0"); }, [dark]);
  React.useEffect(() => { localStorage.setItem("futech.store", JSON.stringify(store)); }, [store]);

  const actions = React.useMemo(() => ({
    payFees: (method) => setStore((s) => ({ ...s, feesPaid: true, feesReceipt: { ref: genRef("PAY"), date: nowStr(), method: { card: "Debit card", transfer: "Bank transfer", ussd: "USSD" }[method] || "Card" } })),
    payCharge: (p) => setStore((s) => ({ ...s, payments: [{ id: genRef("PAY"), ref: genRef("PAY"), date: nowStr(), ...p }, ...(s.payments || [])] })),
    submitRegistration: (courses, units) => setStore((s) => ({ ...s, registration: { status: "pending", courses, units } })),
    approveRegistration: () => setStore((s) => ({ ...s, registration: { ...s.registration, status: "approved" } })),
    allocateHostel: (a) => setStore((s) => ({ ...s, hostel: { status: "allocated", ...a, ref: genRef("HST"), date: nowStr(), method: a.method || "Debit card" } })),
    submitAssignment: (id, sub) => setStore((s) => ({ ...s, submissions: { ...(s.submissions || {}), [id]: sub } })),
    // staff actions
    setScore: (code, matric, field, value) => setStore((s) => {
      const staff = s.staff || {}; const scores = { ...(staff.scores || {}) };
      const k = code + ":" + matric; scores[k] = { ...(scores[k] || {}), [field]: value };
      return { ...s, staff: { ...staff, scores } };
    }),
    submitResults: (code) => setStore((s) => ({ ...s, staff: { ...s.staff, results: { ...(s.staff && s.staff.results), [code]: "submitted" } } })),
    approveResults: (code) => setStore((s) => ({ ...s, staff: { ...s.staff, results: { ...(s.staff && s.staff.results), [code]: "approved" } } })),
    gradeSubmission: (aid, matric, grade) => setStore((s) => ({ ...s, staff: { ...s.staff, grades: { ...(s.staff && s.staff.grades), [aid + ":" + matric]: grade } } })),
    addFeedback: (aid, matric, text, page) => setStore((s) => { const fb = { ...(s.staff && s.staff.feedback) }; const k = aid + ":" + matric; fb[k] = [...(fb[k] || []), { id: genRef("FB"), text, page, at: nowStr() }]; return { ...s, staff: { ...s.staff, feedback: fb } }; }),
    removeFeedback: (aid, matric, id) => setStore((s) => { const fb = { ...(s.staff && s.staff.feedback) }; const k = aid + ":" + matric; fb[k] = (fb[k] || []).filter((c) => c.id !== id); return { ...s, staff: { ...s.staff, feedback: fb } }; }),
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
    // ---- semester lifecycle (registrar / ICT controls) ----
    toggleWindow: (key) => setStore((s) => { const se = sz(s); return { ...s, session: { ...se, [key]: !se[key] } }; }),
    setSemester: (sem) => setStore((s) => ({ ...s, session: { ...sz(s), semester: sem } })),
    publishResults: (on) => setStore((s) => ({ ...s, session: { ...sz(s), results: on } })),
    // adviser per-course advice: store.roles.adviser.advice[adviseeId][courseCode] = text
    adviserComment: (adviseeId, courseCode, text) => setStore((s) => {
      const roles = { ...(s.roles || {}) };
      const r = { ...(roles.adviser || {}) };
      const advice = { ...(r.advice || {}) };
      const perStudent = { ...(advice[adviseeId] || {}) };
      if (text) perStudent[courseCode] = text; else delete perStudent[courseCode];
      advice[adviseeId] = perStudent; r.advice = advice; roles.adviser = r;
      return { ...s, roles };
    }),
    // mini-lecturer hat: class notes posted per course code
    postClassNote: (code, text) => setStore((s) => {
      const roles = { ...(s.roles || {}) };
      const mini = { ...(roles.mini || {}) };
      const notes = { ...(mini.notes || {}) };
      notes[code] = [{ id: "cn" + Date.now(), text, at: nowStr() }, ...(notes[code] || [])];
      mini.notes = notes; roles.mini = mini;
      return { ...s, roles };
    }),
    // siwes / industrial training (400L)
    siwesPropose: (placement) => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "proposed", placement } })),
    siwesDecide: (approve, note) => setStore((s) => { const w = wz(s); return { ...s, siwes: { ...w, status: approve ? "approved" : "rejected", deptNote: note || "" } }; }),
    siwesStart: () => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "ongoing" } })),
    siwesComplete: () => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "completed" } })),
    siwesAddLog: (entry) => setStore((s) => { const w = wz(s); const log = { id: "lg" + Date.now(), status: "submitted", supervisorNote: "", ...entry }; return { ...s, siwes: { ...w, logbook: [log, ...w.logbook] } }; }),
    siwesSignLog: (id, approve, note) => setStore((s) => { const w = wz(s); const logbook = w.logbook.map((l) => l.id === id ? { ...l, status: approve ? "signed" : "returned", supervisorNote: note || l.supervisorNote } : l); return { ...s, siwes: { ...w, logbook } }; }),
    siwesCheckIn: (matched) => setStore((s) => { const w = wz(s); const rec = { id: "ci" + Date.now(), at: nowStr(), matched }; return { ...s, siwes: { ...w, checkins: [rec, ...w.checkins] } }; }),
    // campus: library
    borrowBook: (b) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, loans: [...c.loans, { id: "UL" + Date.now(), bookId: b.id, title: b.title, author: b.author, borrowed: "Today", due: "in 14 days", overdue: false, renewed: false }] } }; }),
    returnBook: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, returned: { ...c.returned, [id]: true } } }; }),
    renewLoan: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, loans: c.loans.map((l) => l.id === id ? { ...l, renewed: true, due: "in 14 days" } : l), renewedSeed: { ...(c.renewedSeed || {}), [id]: true } } }; }),
    reserveBook: (b) => setStore((s) => { const c = cz(s); if (c.reservations.some((r) => r.bookId === b.id)) return s; return { ...s, campus: { ...c, reservations: [...c.reservations, { bookId: b.id, title: b.title, author: b.author }] } }; }),
    cancelReservation: (bookId) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, reservations: c.reservations.filter((r) => r.bookId !== bookId) } }; }),
    payLibraryFine: () => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, finePaid: true } }; }),
    // librarian: acquisitions & collections
    addLibraryBook: (book, collections) => setStore((s) => {
      const c = cz(s);
      const id = "nb" + Date.now();
      const rec = { ...book, id, addedAt: "Today", collections: collections || [] };
      const libColl = { ...(c.libColl || {}) };
      (collections || []).forEach((cid) => { libColl[cid] = [...(libColl[cid] || []), id]; });
      return { ...s, campus: { ...c, libBooks: [rec, ...(c.libBooks || [])], libColl } };
    }),
    createCollection: (name, desc) => setStore((s) => {
      const c = cz(s);
      const id = "c" + Date.now();
      return { ...s, campus: { ...c, libNewColl: [...(c.libNewColl || []), { id, name, desc: desc || "", icon: "layers", seed: [] }] } };
    }),
    // campus: clinic
    bookAppointment: (a) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, appointments: [...c.appointments, a] } }; }),
    cancelAppointment: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, cancelled: { ...c.cancelled, [id]: true } } }; }),
    reset: () => { setStore(DEFAULT_STORE); localStorage.removeItem("futech.route"); },
    // ---- admissions: candidate ----
    admVerify: () => setStore((s) => ({ ...s, admissions: { ...az(s), verified: true } })),
    admActivate: () => setStore((s) => ({ ...s, admissions: { ...az(s), activated: true, state: az(s).state === "jamb_imported" ? "draft" : az(s).state } })),
    admSaveForm: (patch) => setStore((s) => ({ ...s, admissions: { ...az(s), form: { ...az(s).form, ...patch } } })),
    admSetStep: (n) => setStore((s) => ({ ...s, admissions: { ...az(s), step: n } })),
    admPayScreening: () => setStore((s) => ({ ...s, admissions: { ...az(s), screeningPaid: true } })),
    admSubmit: () => setStore((s) => admPush(s, "submitted", "Application submitted by candidate")),
    admRespondQuery: (text) => setStore((s) => admPush({ ...s, admissions: { ...az(s), queryResponse: text } }, "under_review", "Candidate responded to query")),
    admAccept: () => setStore((s) => admPush({ ...s, admissions: { ...az(s), accepted: true } }, "accepted", "Offer accepted by candidate")),
    admPayAcceptance: () => setStore((s) => admPush({ ...s, admissions: { ...az(s), acceptancePaid: true } }, "clearance_pending", "Acceptance fee paid")),
    admClearItem: (id) => setStore((s) => { const a = az(s); const cl = { ...a.clearance, [id]: !a.clearance[id] }; return { ...s, admissions: { ...a, clearance: cl } }; }),
    admEnrol: () => setStore((s) => admPush(s, "enrolled", "Fresh-student clearance completed")),
    // ---- admissions: staff (acts on live candidate) ----
    admStaffSet: (state, note) => setStore((s) => admPush(s, state, note || ("Status set to " + state))),
    admStaffQuery: (text) => setStore((s) => admPush({ ...s, admissions: { ...az(s), staffQuery: text } }, "queried", "Query raised: " + text)),
    // ---- admissions: staff (acts on seed pool) ----
    admPoolSet: (id, state, note) => setStore((s) => { const a = az(s); const pool = { ...a.pool, [id]: { ...(a.pool[id] || {}), state } }; const audit = [{ id: "ev" + Date.now(), who: id, text: note || ("Set to " + state), at: nowStr() }, ...(a.audit || [])]; return { ...s, admissions: { ...a, pool, audit } }; }),
    admImport: (jambs) => setStore((s) => { const a = az(s); const audit = [{ id: "ev" + Date.now(), who: "batch", text: jambs.length + " candidate(s) imported from JAMB", at: nowStr() }, ...(a.audit || [])]; return { ...s, admissions: { ...a, imported: [...new Set([...(a.imported || []), ...jambs])], audit } }; }),
  }), []);

  const go = (v) => {
    if (v === "login") { setView("login"); writePrototypeLocation({ view: "login" }); }
    else if (v === "apply") { setView("admissions"); writePrototypeLocation({ view: "admissions", route: "overview" }); }
    else if (v === "home") { setView("home"); writePrototypeLocation({ view: "home" }); }
  };
  const login = (r) => {
    const rr = r || "student";
    localStorage.setItem("futech.role", rr);
    setRole(rr);
    localStorage.setItem("futech.authed", "1");
    setView(rr === "student" ? "portal" : "role");
    writePrototypeLocation(rr === "student" ? { view: "portal", route: localStorage.getItem("futech.route") || "dashboard" } : { view: "role", role: rr });
  };
  const logout = () => { localStorage.setItem("futech.authed", "0"); setView("home"); writePrototypeLocation({ view: "home" }); };

  // expose for tweaks panel
  React.useEffect(() => { window.__futechReset = actions.reset; window.__futechSetDark = setDark; }, [actions]);

  let body;
  if (view === "home") body = <PublicHome go={go} dark={dark} setDark={setDark} />;
  else if (view === "login") body = <Login go={go} onLogin={login} dark={dark} setDark={setDark} />;
  else if (view === "admissions") body = <CandidateApp store={store} actions={actions} dark={dark} setDark={setDark} onExit={() => writePrototypeLocation({ view: "home" })} route={location.route} onRouteChange={(route) => writePrototypeLocation({ view: "admissions", route })} />;
  else if (role === "student") body = <Portal store={store} actions={actions} dark={dark} setDark={setDark} onLogout={logout} level400={t.studentLevel === "400"} route={location.view === "portal" ? location.route : undefined} onRouteChange={(route) => writePrototypeLocation({ view: "portal", route })} />;
  else body = <RolePortal role={role} store={store} actions={actions} dark={dark} setDark={setDark} onLogout={logout} route={location.view === "role" ? location.route : undefined} onRouteChange={(route) => writePrototypeLocation({ view: "role", role, route })} />;

  return (
    <div className="fb-app" data-theme={dark ? "dark" : "light"} data-accent={ACCENT_MAP[t.accent] || "crest"} data-density={t.density} style={{ minHeight: "100vh", "--font-sans": FONT_STACKS[t.font] || FONT_STACKS.Geist }}>
      {body}
      <DetailLayer />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={["#5a1a8a", "#2c7a57", "#3a5fb0", "#9a6a1a"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSelect label="Font" value={t.font}
          options={["Geist", "IBM Plex Sans", "Source Sans 3", "Source Serif 4"]}
          onChange={(v) => setTweak("font", v)} />
        <TweakToggle label="Dark mode" value={dark} onChange={setDark} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={["compact", "comfortable", "spacious"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Student level (demo)" value={t.studentLevel}
          options={["300", "400"]}
          onChange={(v) => setTweak("studentLevel", v)} />
        <TweakSection label="Demo" />
        <TweakButton label="Reset demo progress" onClick={() => { window.__futechReset && window.__futechReset(); }} />
      </TweaksPanel>
    </div>
  );
}
