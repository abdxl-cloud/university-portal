import React from "react";
const { Avatar, Btn, Card, Decide, Empty, Icon, PageHead, RoleHero, SPill, Seg, StatCards, Switch, Tag, rstate } = window;
/* Role screens — services cluster: Bursary, Hostel, Registry, ICT */

/* ============ BURSARY ============ */
function BursaryDashboard({ store, go }) {
  const { PAYMENTS, DEBTORS, fmt } = window.ROLE_DATA;
  const pst = (p) => rstate(store, "bursary", "pay", p.id, p.baseStatus);
  const pending = PAYMENTS.filter((p) => pst(p) === "pending").length;
  const confirmedToday = PAYMENTS.filter((p) => pst(p) === "confirmed").reduce((s, p) => s + p.amount, 0);
  const owed = DEBTORS.reduce((s, d) => s + d.owed, 0);
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.bursary} />
      <StatCards items={[
        { icon: "wallet", k: "Payments to verify", v: pending, tag: pending ? "Verify" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("bur-verify") },
        { icon: "check", k: "Confirmed (session)", v: fmt(confirmedToday), plain: true },
        { icon: "info", k: "Debtors", v: DEBTORS.length, tag: "Owing", tone: "danger", onClick: () => go("bur-debtors") },
        { icon: "chart", k: "Outstanding", v: fmt(owed), plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Transactions awaiting verification</div><a className="fb-link" onClick={() => go("bur-verify")}>Open queue</a>
        </div>
        <PaymentRows store={store} go={go} limit={4} only="pending" />
      </Card>
    </div>
  );
}

function PaymentRows({ store, actions, limit, only, rows: rowsProp }) {
  const { PAYMENTS, fmt } = window.ROLE_DATA;
  const pst = (p) => rstate(store, "bursary", "pay", p.id, p.baseStatus);
  let rows = rowsProp || PAYMENTS; if (!rowsProp && only) rows = rows.filter((p) => pst(p) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No pending transactions" sub="All payments have been verified." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((p) => {
        const s = pst(p);
        return (
          <div key={p.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <span className="u-icon u-icon--plain"><Icon name="wallet" size={15} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.item}</span><span className="fb-mono u-meta">{p.ref}</span></div>
                <div className="u-meta">{p.name} · {p.matric} · {p.channel} · {p.date}</div>
              </div>
            </div>
            <div className="u-row" style={{ gap: 14 }}>
              <div className="u-num" style={{ fontWeight: 700 }}>{fmt(p.amount)}</div>
              {s === "pending" && actions
                ? <div className="u-row" style={{ gap: 6 }}><Btn variant="secondary" size="sm" onClick={() => actions.roleAct("bursary", "pay", p.id, "flagged")}>Flag</Btn><Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("bursary", "pay", p.id, "confirmed")}>Verify</Btn></div>
                : <SPill s={s} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BursaryVerify({ store, actions }) {
  const { PAYMENTS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const pst = (p) => rstate(store, "bursary", "pay", p.id, p.baseStatus);
  const counts = {}; PAYMENTS.forEach((p) => { const s = pst(p); counts[s] = (counts[s] || 0) + 1; });
  const filtered = PAYMENTS.filter((p) => pst(p) === filter).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.ref.toLowerCase().includes(q.toLowerCase()) || p.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);
  return (
    <div className="u-content">
      <PageHead title="Payment Verification" sub={(counts.pending || 0) + " transactions awaiting verification"}>
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "confirmed", label: "Confirmed · " + (counts.confirmed || 0) }, { value: "flagged", label: "Flagged · " + (counts.flagged || 0) },
        ]} />
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name, ref or matric…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-pad"><PaymentRows store={store} actions={actions} rows={pager.slice} /></div>
        <Pagination pager={pager} label="transactions" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

function BursaryDebtors() {
  const { DEBTORS, fmt } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const filtered = DEBTORS.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 15);
  const totalOwed = DEBTORS.reduce((s, d) => s + d.owed, 0);
  return (
    <div className="u-content">
      <PageHead title="Debtors" sub={DEBTORS.length + " students owing " + fmt(totalOwed)}>
        <Btn variant="secondary" icon="bell">Send reminders</Btn>
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th>Level</th><th>Outstanding item</th><th className="u-right">Amount owed</th></tr></thead>
            <tbody>
              {pager.slice.map((d) => (
                <tr key={d.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{d.matric}</td>
                  <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={d.initials} size={30} /><span style={{ fontWeight: 500 }}>{d.name}</span></div></td>
                  <td><Tag>{d.level}</Tag></td>
                  <td className="u-muted">{d.item}</td>
                  <td className="u-right u-num" style={{ fontWeight: 700, color: "var(--danger)" }}>{fmt(d.owed)}</td>
                </tr>
              ))}
              {pager.slice.length === 0 && <tr><td colSpan={5}><Empty icon="search" title="No matches" sub="No debtors match your search." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pager={pager} label="debtors" sizes={[15, 30, 60]} />
      </Card>
    </div>
  );
}

function BursaryFees() {
  const { FEE_STRUCTURE, fmt } = window.ROLE_DATA;
  return (
    <div className="u-content u-content--narrow">
      <PageHead title="Fee Structure" sub="2025/2026 session · Computer Science" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Level</th><th className="u-right">Fresh student</th><th className="u-right">Returning student</th></tr></thead>
            <tbody>
              {FEE_STRUCTURE.map((f) => (
                <tr key={f.level}>
                  <td style={{ fontWeight: 600 }}>{f.level}</td>
                  <td className="u-right u-num">{f.fresh ? fmt(f.fresh) : "—"}</td>
                  <td className="u-right u-num">{f.returning ? fmt(f.returning) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Fresh students pay an additional one-time acceptance fee. Hostel and service charges are billed separately.</div>
    </div>
  );
}

/* ============ HOSTEL OFFICER ============ */
function HostelDashboard({ store, go }) {
  const { HOSTEL_APPS, HOSTEL_STATS } = window.ROLE_DATA;
  const hst = (a) => rstate(store, "hostel", "app", a.id, a.baseStatus);
  const pending = HOSTEL_APPS.filter((a) => hst(a) === "pending").length;
  const totalBeds = HOSTEL_STATS.reduce((s, h) => s + h.total, 0);
  const taken = HOSTEL_STATS.reduce((s, h) => s + h.taken, 0);
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.hostel} />
      <StatCards items={[
        { icon: "bed", k: "Applications", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("hos-apps") },
        { icon: "building", k: "Halls", v: HOSTEL_STATS.length, plain: true },
        { icon: "user", k: "Beds occupied", v: taken + " / " + totalBeds, plain: true },
        { icon: "chart", k: "Occupancy", v: Math.round((taken / totalBeds) * 100) + "%", plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Allocation requests</div><a className="fb-link" onClick={() => go("hos-apps")}>Open queue</a>
        </div>
        <HostelAppRows store={store} go={go} limit={4} only="pending" />
      </Card>
    </div>
  );
}

function HostelAppRows({ store, actions, limit, only, rows: rowsProp }) {
  const { HOSTEL_APPS } = window.ROLE_DATA;
  const hst = (a) => rstate(store, "hostel", "app", a.id, a.baseStatus);
  let rows = rowsProp || HOSTEL_APPS; if (!rowsProp && only) rows = rows.filter((a) => hst(a) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No pending applications" sub="New hostel applications will appear here." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const s = hst(a);
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <Avatar initials={a.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</span><Tag>{a.level}</Tag></div>
                <div className="u-meta">{a.matric} · {a.hall} · {a.gender}</div>
              </div>
            </div>
            <div className="u-row" style={{ gap: 12 }}>
              {!a.feesPaid && <Tag variant="danger">Fees unpaid</Tag>}
              {s === "pending" && actions
                ? (a.feesPaid
                  ? <Decide onApprove={() => actions.roleAct("hostel", "app", a.id, "allocated")} onReject={() => actions.roleAct("hostel", "app", a.id, "rejected")} approveLabel="Allocate bed" rejectLabel="Decline" />
                  : <Btn variant="secondary" size="sm" disabled>Ineligible</Btn>)
                : <SPill s={s} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HostelApplications({ store, actions }) {
  const { HOSTEL_APPS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const hst = (a) => rstate(store, "hostel", "app", a.id, a.baseStatus);
  const counts = {}; HOSTEL_APPS.forEach((a) => { const s = hst(a); counts[s] = (counts[s] || 0) + 1; });
  const filtered = HOSTEL_APPS.filter((a) => hst(a) === filter).filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 12);
  return (
    <div className="u-content">
      <PageHead title="Hostel Applications" sub={(counts.pending || 0) + " of " + HOSTEL_APPS.length + " applications awaiting allocation"}>
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "allocated", label: "Allocated · " + (counts.allocated || 0) }, { value: "rejected", label: "Declined · " + (counts.rejected || 0) },
        ]} />
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-pad"><HostelAppRows store={store} actions={actions} rows={pager.slice} /></div>
        <Pagination pager={pager} label="applications" sizes={[12, 25, 50]} />
      </Card>
    </div>
  );
}

function HostelOccupancy() {
  const { HOSTEL_STATS } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="Hall Occupancy" sub="Live bed-space utilisation across halls" />
      <div className="u-grid u-grid--2">
        {HOSTEL_STATS.map((h) => {
          const pct = Math.round((h.taken / h.total) * 100);
          const full = h.taken >= h.total;
          return (
            <Card key={h.hall} className="u-pad">
              <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <div><div className="u-h3">{h.hall}</div><div className="u-meta">{h.gender} hall</div></div>
                <Tag variant={full ? "danger" : pct > 85 ? "warning" : "success"} dot>{full ? "Full" : (h.total - h.taken) + " free"}</Tag>
              </div>
              <div className="u-bar" style={{ height: 10 }}><div className="u-bar__fill" style={{ width: pct + "%", background: full ? "var(--danger)" : "var(--accent)" }} /></div>
              <div className="u-row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                <span className="u-meta u-num">{h.taken} / {h.total} beds</span>
                <span className="u-num" style={{ fontWeight: 600 }}>{pct}%</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============ REGISTRY / ADMISSIONS ============ */
function RegistryDashboard({ store, go }) {
  const { APPLICANTS } = window.ROLE_DATA;
  const ast = (a) => rstate(store, "registry", "app", a.id, a.baseStatus);
  const pending = APPLICANTS.filter((a) => ast(a) === "pending").length;
  const admitted = APPLICANTS.filter((a) => ast(a) === "admitted").length;
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.registry} />
      <StatCards items={[
        { icon: "doc", k: "Applications to screen", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("reg-apps") },
        { icon: "check", k: "Admitted", v: admitted },
        { icon: "user", k: "Total applicants", v: APPLICANTS.length, plain: true },
        { icon: "cap", k: "Matric numbers issued", v: admitted, plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Applications awaiting screening</div><a className="fb-link" onClick={() => go("reg-apps")}>Open queue</a>
        </div>
        <ApplicantRows store={store} go={go} limit={4} only="pending" />
      </Card>
    </div>
  );
}

function ApplicantRows({ store, actions, limit, only }) {
  const { APPLICANTS } = window.ROLE_DATA;
  const ast = (a) => rstate(store, "registry", "app", a.id, a.baseStatus);
  let rows = APPLICANTS; if (only) rows = rows.filter((a) => ast(a) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No applications pending" sub="New applications will appear here for screening." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const s = ast(a);
        const weak = a.oLevel !== "5+ credits" || a.docs === "Incomplete";
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <Avatar initials={a.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
                <div className="u-meta">JAMB {a.jamb} · UTME {a.utme} · {a.programme}</div>
                <div className="u-row u-wrap" style={{ gap: 5, marginTop: 5 }}>
                  <Tag variant={a.oLevel === "5+ credits" ? "success" : "warning"}>{a.oLevel}</Tag>
                  <Tag variant={a.docs === "Complete" ? "success" : "danger"}>Docs {a.docs}</Tag>
                </div>
              </div>
            </div>
            {s === "pending" && actions
              ? <Decide onApprove={() => actions.roleAct("registry", "app", a.id, "admitted")} onReject={() => actions.roleAct("registry", "app", a.id, "rejected")} approveLabel="Admit" rejectLabel="Reject" />
              : <SPill s={s} />}
          </div>
        );
      })}
    </div>
  );
}

function RegistryApplications({ store, actions }) {
  const { APPLICANTS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const ast = (a) => rstate(store, "registry", "app", a.id, a.baseStatus);
  const counts = {}; APPLICANTS.forEach((a) => { const s = ast(a); counts[s] = (counts[s] || 0) + 1; });
  return (
    <div className="u-content">
      <PageHead title="Admission Applications" sub="Screen applicants and approve admissions">
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "admitted", label: "Admitted" }, { value: "rejected", label: "Rejected" },
        ]} />
      </PageHead>
      <Card className="u-pad"><ApplicantRows store={store} actions={actions} only={filter} /></Card>
    </div>
  );
}

function RegistryRecords() {
  const { ADVISEES } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="Student Records" sub="Official bio-data and registration status" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th>Level</th><th>Programme</th><th>Status</th></tr></thead>
            <tbody>
              {ADVISEES.slice(0, 12).map((a) => (
                <tr key={a.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{a.matric}</td>
                  <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={a.initials} size={30} /><span style={{ fontWeight: 500 }}>{a.name}</span></div></td>
                  <td><Tag>300L</Tag></td>
                  <td className="u-muted">B.Sc. Computer Science</td>
                  <td><Tag variant="success" dot>Active</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============ ICT / SUPER ADMIN ============ */
function IctDashboard({ store, go }) {
  const { USERS, SESSIONS } = window.ROLE_DATA;
  const active = USERS.filter((u) => rstate(store, "ict", "user", u.id, u.baseStatus) === "active").length;
  const suspended = USERS.length - active;
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.ict} />
      <StatCards items={[
        { icon: "user", k: "Active accounts", v: active, plain: true },
        { icon: "lock", k: "Suspended", v: suspended, tag: suspended ? "Review" : null, tone: suspended ? "danger" : undefined, onClick: () => go("ict-users") },
        { icon: "calendar", k: "Active session", v: "2025/26", plain: true },
        { icon: "shield", k: "System status", v: "Healthy", tag: "OK", tone: "success" },
      ]} />
      <div className="u-cols u-cols--main">
        <Card className="u-pad">
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="u-h3">Recent activity</div><a className="fb-link" onClick={() => go("ict-audit")}>Full log</a>
          </div>
          <AuditRows limit={5} />
        </Card>
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Sessions</div>
          {SESSIONS.map((s) => (
            <div key={s.name} className="u-row" style={{ gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
              <span className="u-icon u-icon--plain"><Icon name="calendar" size={14} /></span>
              <div className="u-grow"><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div className="u-meta">Reg {s.reg} · Fees {s.fees}</div></div>
              <Tag variant={s.state === "Active" ? "success" : undefined} dot={s.state === "Active"}>{s.state}</Tag>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function IctUsers({ store, actions }) {
  const { USERS } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="User Management" sub={USERS.length + " accounts across all roles"}>
        <Btn variant="accent" icon="plus">Create user</Btn>
      </PageHead>
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Last active</th><th>Status</th><th className="u-right">Actions</th></tr></thead>
            <tbody>
              {USERS.map((u) => {
                const s = rstate(store, "ict", "user", u.id, u.baseStatus);
                return (
                  <tr key={u.id}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={u.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} /><span style={{ fontWeight: 500 }}>{u.name}</span></div></td>
                    <td className="u-muted">{u.role}</td>
                    <td className="u-muted">{u.dept}</td>
                    <td className="u-meta">{u.last}</td>
                    <td><SPill s={s} /></td>
                    <td className="u-right">
                      <div className="u-row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <Btn variant="ghost" size="sm" onClick={() => alert("Password reset link sent (demo).")}>Reset</Btn>
                        <Btn variant="secondary" size="sm" onClick={() => actions.roleAct("ict", "user", u.id, s === "active" ? "suspended" : "active")}>{s === "active" ? "Suspend" : "Activate"}</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function IctSessions({ store, actions }) {
  const { SESSIONS } = window.ROLE_DATA;
  const se = store.session || {};
  const windows = [
    { key: "registration", label: "Course registration", icon: "book", note: se.regCloses ? "Closes " + se.regCloses : "" },
    { key: "fees", label: "Fee payment", icon: "wallet", note: se.feesCloses ? "Closes " + se.feesCloses : "" },
    { key: "hostel", label: "Hostel application", icon: "bed", note: "Eligible students only" },
    { key: "results", label: "Results published", icon: "chart", note: "Students can view released results" },
  ];
  return (
    <div className="u-content">
      <PageHead title="Sessions & Semesters" sub="Open or close academic windows for the active session">
        <Btn variant="secondary" icon="plus">New session</Btn>
      </PageHead>

      {/* active session window controls */}
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
          <div>
            <div className="u-row" style={{ gap: 10 }}><div className="u-h3">{se.current || "2025/2026"} session</div><Tag variant="success" dot>Active</Tag></div>
            <div className="u-meta" style={{ marginTop: 3 }}>{se.semester || "First Semester"}</div>
          </div>
          <Seg value={se.semester} onChange={actions.setSemester} options={[{ value: "First Semester", label: "First" }, { value: "Second Semester", label: "Second" }]} />
        </div>
        <div className="u-grid u-grid--2" style={{ gap: 10 }}>
          {windows.map((w) => {
            const on = w.key === "results" ? !!se.results : se[w.key] !== false;
            return (
              <div key={w.key} className="u-row" style={{ gap: 12, padding: "13px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <span className="u-icon" style={{ background: on ? "var(--accent-soft)" : "var(--bg-muted)", color: on ? "var(--accent-soft-fg)" : "var(--fg-muted)" }}><Icon name={w.icon} size={15} /></span>
                <div className="u-grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{w.label}</div>
                  <div className="u-meta">{on ? "Open" : "Closed"}{w.note ? " · " + w.note : ""}</div>
                </div>
                <Switch on={on} onClick={() => w.key === "results" ? actions.publishResults(!se.results) : actions.toggleWindow(w.key)} />
              </div>
            );
          })}
        </div>
        <div className="u-meta" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Changes take effect immediately in every student portal.</div>
      </Card>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Session</th><th>State</th><th>Course registration</th><th>Fee payment</th><th className="u-right">Actions</th></tr></thead>
            <tbody>
              {SESSIONS.map((s) => {
                const isActive = s.state === "Active";
                const reg = isActive ? (se.registration !== false ? "Open" : "Closed") : s.reg;
                const fees = isActive ? (se.fees !== false ? "Open" : "Closed") : s.fees;
                return (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><Tag variant={isActive ? "success" : undefined} dot={isActive}>{s.state}</Tag></td>
                    <td><Tag variant={reg === "Open" ? "accent" : undefined}>{reg}</Tag></td>
                    <td><Tag variant={fees === "Open" ? "accent" : undefined}>{fees}</Tag></td>
                    <td className="u-right">{isActive ? <Btn variant="secondary" size="sm">Manage</Btn> : <Btn variant="ghost" size="sm">View</Btn>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AuditRows({ limit }) {
  const { AUDIT } = window.ROLE_DATA;
  const rows = limit ? AUDIT.slice(0, limit) : AUDIT;
  return (
    <div className="u-stack" style={{ gap: 0 }}>
      {rows.map((a, i) => (
        <div key={i} className="u-row" style={{ gap: 11, padding: "11px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
          <span className="u-icon u-icon--plain" style={{ width: 28, height: 28 }}><Icon name="shield" size={13} /></span>
          <div className="u-grow"><div style={{ fontSize: 13.5 }}><strong style={{ fontWeight: 600 }}>{a.who}</strong> — {a.action}</div></div>
          <div className="u-meta" style={{ whiteSpace: "nowrap" }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

function IctAudit() {
  return (
    <div className="u-content">
      <PageHead title="Audit Log" sub="System-wide record of sensitive actions" />
      <Card className="u-pad"><AuditRows /></Card>
    </div>
  );
}

Object.assign(window, {
  BursaryDashboard, BursaryVerify, BursaryDebtors, BursaryFees,
  HostelDashboard, HostelApplications, HostelOccupancy,
  RegistryDashboard, RegistryApplications, RegistryRecords,
  IctDashboard, IctUsers, IctSessions, IctAudit,
});
