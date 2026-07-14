import React from "react";
const { Btn, Card, Field, Icon, IconBtn, Tag } = window;
/* Public homepage + auth gate */

function PublicNav({ go, dark, setDark }) {
  const links = ["About", "Admissions", "Faculties", "News", "Contact"];
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <div className="u-pub__nav">
        <div className="u-row" style={{ gap: 10, cursor: "pointer" }} onClick={() => go("home")}>
          <div className="u-logo" style={{ width: 32, height: 32 }}>FT</div>
          <div className="fb-hide-mobile">
            <div className="u-brand__name">FUTECH</div>
            <div className="u-brand__sub">Federal University of Technology</div>
          </div>
        </div>
        <div className="u-pub__links">
          {links.map((l) => <a key={l} onClick={() => go("home")}>{l}</a>)}
        </div>
        <span className="u-grow" />
        <IconBtn name={dark ? "sun" : "moon"} onClick={() => setDark(!dark)} aria-label={dark ? "Use light mode" : "Use dark mode"} />
        <Btn variant="ghost" className="u-pub__cta" onClick={() => go("login")}>Sign in</Btn>
        <Btn variant="accent" className="u-pub__cta" iconRight="arrowRight" onClick={() => go("login")}>Student Portal</Btn>
        <button className="fb-icon-btn u-pub__burger" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={18} /></button>
      </div>

      {/* mobile drawer: rendered outside .u-pub__nav, since its backdrop-filter would otherwise
          become the containing block for these fixed-position elements and clip them to its 64px height */}
      <div className="fb-drawer-backdrop" data-open={open} onClick={close} />
      <div className="fb-drawer fb-drawer--right" data-open={open}>
        <div className="u-brand" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="u-logo" style={{ width: 30, height: 30 }}>FT</div>
          <div className="u-grow"><div className="u-brand__name">FUTECH</div><div className="u-brand__sub">Federal University of Technology</div></div>
          <IconBtn name="x" onClick={close} aria-label="Close menu" />
        </div>
        <div className="u-pub__draw-links u-grow">
          {links.map((l) => <a key={l} onClick={() => { go("home"); close(); }}>{l}</a>)}
        </div>
        <div className="u-stack" style={{ gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <Btn variant="secondary" size="lg" onClick={() => { go("login"); close(); }}>Sign in</Btn>
          <Btn variant="accent" size="lg" iconRight="arrowRight" onClick={() => { go("login"); close(); }}>Student Portal</Btn>
        </div>
      </div>
    </>
  );
}

const PORTAL_TILES = [
  { icon: "doc", t: "Apply for Admission", d: "Start or continue your application", to: "apply" },
  { icon: "user", t: "Student Portal", d: "Fees, courses, results & hostel", to: "login" },
  { icon: "wallet", t: "Pay School Fees", d: "Generate invoice & pay online", to: "login" },
  { icon: "search", t: "Check Admission Status", d: "Track your application", to: "apply" },
];

function PublicHome({ go, dark, setDark }) {
  const { NEWS } = window.DATA;
  return (
    <div className="u-pub">
      <PublicNav go={go} dark={dark} setDark={setDark} />

      {/* hero */}
      <div className="u-hero">
        <div className="u-hero__blobs" aria-hidden="true">
          <div className="u-blob fb-blob" style={{ width: 420, height: 420, background: "var(--accent)", top: -120, right: 40 }} />
          <div className="u-blob fb-blob fb-blob--2" style={{ width: 320, height: 320, background: "var(--accent-soft-fg)", bottom: -160, left: -60, opacity: 0.3 }} />
        </div>
        <div className="u-hero__inner">
          <span className="u-hero__eyebrow"><Icon name="spark" size={13} /> 2025/2026 admissions & registration now open</span>
          <h1>A connected campus, from application to graduation.</h1>
          <p>One secure platform for fees, course registration, results, hostel allocation and everything in between: for students, lecturers and staff.</p>
          <div className="u-row u-wrap" style={{ gap: 10, marginTop: 28 }}>
            <Btn variant="accent" size="lg" iconRight="arrowRight" onClick={() => go("login")}>Enter Student Portal</Btn>
            <Btn variant="secondary" size="lg" onClick={() => go("apply")}>Apply for admission</Btn>
          </div>
        </div>
      </div>

      {/* quick-access portal tiles */}
      <div style={{ marginTop: -34, position: "relative", zIndex: 5, paddingBottom: 8 }}>
        <div className="u-portal-grid">
          {PORTAL_TILES.map((t) => (
            <button key={t.t} className="u-tile" onClick={() => go(t.to)}>
              <span className="u-icon"><Icon name={t.icon} size={16} /></span>
              <div>
                <div className="u-tile__t">{t.t}</div>
                <div className="u-tile__d">{t.d}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* stats */}
      <div className="u-section">
        <div className="u-stat-strip">
          {[["18,400+", "Students enrolled"], ["7", "Faculties"], ["52", "Degree programmes"], ["94%", "Graduate employability"]].map(([n, l]) => (
            <div key={l}>
              <div className="n u-num">{n}</div>
              <div className="u-meta" style={{ marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* news + image */}
      <div className="u-section" style={{ paddingTop: 0 }}>
        <div className="u-grid u-grid--2" style={{ gap: 28, alignItems: "stretch" }}>
          <div className="u-stack" style={{ gap: 14 }}>
            <div className="u-row" style={{ justifyContent: "space-between" }}>
              <div className="u-h2">Latest from campus</div>
              <a className="fb-link" onClick={() => go("home")}>View all</a>
            </div>
            <Card>
              <div className="u-list u-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
                {NEWS.map((n) => (
                  <div key={n.title} className="u-li">
                    <Tag variant="accent">{n.kind}</Tag>
                    <div className="u-grow">
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{n.title}</div>
                      <div className="u-meta">{n.date}</div>
                    </div>
                    <Icon name="arrowRight" size={15} style={{ color: "var(--fg-subtle)" }} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="u-ph" style={{ minHeight: 280 }}>campus / aerial photo</div>
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-elev)" }}>
        <div className="u-section" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 20 }}>
            <div className="u-row" style={{ gap: 10 }}>
              <div className="u-logo" style={{ width: 30, height: 30 }}>FT</div>
              <div>
                <div className="u-brand__name">FUTECH</div>
                <div className="u-brand__sub">Federal University of Technology</div>
              </div>
            </div>
            <div className="u-meta" style={{ maxWidth: 360 }}>
              <div className="u-row" style={{ gap: 6 }}><Icon name="pin" size={13} /> University Road, Education City</div>
              <div className="u-row" style={{ gap: 6, marginTop: 4 }}><Icon name="mail" size={13} /> info@futech.edu.ng · +234 800 000 0000</div>
            </div>
          </div>
          <div className="u-meta" style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            © 2026 FUTECH. A demonstration prototype. Not affiliated with any real institution.
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ go, onLogin, dark, setDark }) {
  // remember whichever tab/role was last signed in as, so returning to
  // /login (e.g. after signing out) doesn't reset to the student default
  const lastRole = localStorage.getItem("futech.role") || "student";
  const lastRoleIsStaff = lastRole !== "student" && (window.ROLE_IDS || []).includes(lastRole);
  const [role, setRole] = React.useState(lastRole === "student" ? "student" : "staff");
  const [staffRole, setStaffRole] = React.useState(lastRoleIsStaff ? lastRole : "lecturer");
  const staffIds = {
    lecturer: "FUT/STF/CSC/0391", adviser: "FUT/STF/CSC/0288", hod: "FUT/STF/CSC/0102",
    dean: "FUT/STF/COM/0007", exams: "FUT/STF/EXM/0451", bursary: "FUT/STF/BUR/0319",
    hostel: "FUT/STF/SAF/0277", registry: "FUT/STF/REG/0061", ict: "FUT/STF/ICT/0015",
    librarian: "FUT/STF/LIB/0044", clinic: "FUT/STF/MED/0009", admissions: "FUT/STF/ADM/0048",
  };
  const labels = (window.ROLE_LABELS) || { lecturer: "Lecturer" };
  const ids = (window.ROLE_IDS) || ["lecturer"];
  const presets = {
    student: { id: "FUT/2022/CSC/10428", label: "Matriculation number", sub: "Sign in with your matriculation number to continue." },
    staff: { id: staffIds[staffRole], label: "Staff ID", sub: "Choose your role and sign in to continue." },
  };
  const [matric, setMatric] = React.useState(presets[role === "student" ? "student" : "staff"].id);
  const [pw, setPw] = React.useState("demo1234");
  const pickRole = (r) => { setRole(r); setMatric(r === "student" ? presets.student.id : staffIds[staffRole]); };
  const pickStaffRole = (sr) => { setStaffRole(sr); setMatric(staffIds[sr]); };
  const submit = (e) => { e.preventDefault(); onLogin(role === "student" ? "student" : staffRole); };
  const cfg = presets[role];
  return (
    <div className="u-auth fb-app" data-theme={dark ? "dark" : "light"}>
      <div className="u-auth__panel">
        <div className="u-auth__card">
          <div className="u-row" style={{ gap: 10, marginBottom: 28, cursor: "pointer" }} onClick={() => go("home")}>
            <div className="u-logo">FT</div>
            <div>
              <div className="u-brand__name">FUTECH</div>
              <div className="u-brand__sub">{role === "student" ? "Student Portal" : "Staff & Admin Portal"}</div>
            </div>
          </div>
          <div className="u-h1" style={{ fontSize: 24 }}>Welcome back</div>
          <div className="u-muted" style={{ marginTop: 6, marginBottom: 18, fontSize: 14 }}>{cfg.sub}</div>

          <div className="u-seg" style={{ marginBottom: 18, width: "100%" }}>
            <button data-on={role === "student"} onClick={() => pickRole("student")} style={{ flex: 1 }}>Student</button>
            <button data-on={role === "staff"} onClick={() => pickRole("staff")} style={{ flex: 1 }}>Staff</button>
          </div>

          {role === "staff" && (
            <div style={{ marginBottom: 16 }}>
              <Field label="Sign in as">
                <select className="fb-input" value={staffRole} onChange={(e) => pickStaffRole(e.target.value)}>
                  {ids.map((id) => <option key={id} value={id}>{labels[id]}</option>)}
                </select>
              </Field>
            </div>
          )}

          <form onSubmit={submit} className="u-stack" style={{ gap: 16 }}>
            <Field label={cfg.label}>
              <input className="fb-input fb-input--mono" value={matric} onChange={(e) => setMatric(e.target.value)} />
            </Field>
            <Field label="Password">
              <input className="fb-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <div className="u-row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <label className="u-row" style={{ gap: 8, cursor: "pointer" }}>
                <span className="fb-check" data-on="true" /> Remember me
              </label>
              <a className="fb-link">Forgot password?</a>
            </div>
            <Btn variant="accent" size="lg" type="submit" iconRight="arrowRight" style={{ width: "100%" }}>Sign in to portal</Btn>
          </form>

          <div className="u-or" style={{ margin: "20px 0" }}>demo credentials are pre-filled</div>
          <div className="u-meta" style={{ textAlign: "center" }}>
            {role === "student" ? <>New here? <a className="fb-link" onClick={() => go("apply")}>Apply for admission</a></> : <>Need access? <a className="fb-link" onClick={() => go("home")}>Contact ICT support</a></>}
          </div>
        </div>
      </div>
      <div className="u-auth__art">
        <div className="u-hero__blobs" aria-hidden="true">
          <div className="u-blob fb-blob" style={{ width: 360, height: 360, background: "var(--accent)", top: 60, left: 40 }} />
          <div className="u-blob fb-blob fb-blob--2" style={{ width: 300, height: 300, background: "var(--accent-soft-fg)", bottom: 20, right: -40, opacity: 0.3 }} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 48 }}>
          <div style={{ position: "relative", zIndex: 2, maxWidth: 380 }}>
            <Icon name={role === "student" ? "cap" : "layers"} size={30} style={{ color: "var(--accent)" }} />
            <div className="u-h1" style={{ fontSize: 28, marginTop: 16 }}>{role === "student" ? "Everything you need, in one portal." : "Every role, one console."}</div>
            <div className="u-muted" style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.5 }}>
              {role === "student"
                ? "Pay your fees, register courses, secure a hostel bed space and check results: without queuing at any office."
                : "Approve results, manage courses, track admissions and handle department duties: whichever staff role you sign in as."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublicHome, Login });
