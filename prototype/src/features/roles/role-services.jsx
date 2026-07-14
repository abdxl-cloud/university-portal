import React from "react";
const { Avatar, Btn, Card, ConfirmButton, Decide, Empty, Icon, Modal, ModalHead, PageHead, RoleHero, SPill, Seg, StatCards, Switch, Tag, rstate } = window;
/* Role screens: services cluster: Bursary, Hostel, Registry, ICT */

/* key/value line for detail popups */
function DRow({ k, v }) {
  return (
    <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
      <span className="k">{k}</span><span className="v">{v}</span>
    </div>
  );
}

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

function PaymentRows({ store, actions, limit, only, rows: rowsProp, onOpen }) {
  const { PAYMENTS, fmt } = window.ROLE_DATA;
  const pst = (p) => rstate(store, "bursary", "pay", p.id, p.baseStatus);
  let rows = rowsProp || PAYMENTS; if (!rowsProp && only) rows = rows.filter((p) => pst(p) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No pending transactions" sub="All payments have been verified." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((p) => {
        const s = pst(p);
        return (
          <div key={p.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: onOpen ? "pointer" : "default" }} onClick={onOpen ? () => onOpen(p.id) : undefined}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <span className="u-icon u-icon--plain"><Icon name="wallet" size={15} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.item}</span><span className="fb-mono u-meta">{p.ref}</span></div>
                <div className="u-meta">{p.name} · {p.matric} · {p.channel} · {p.date}</div>
              </div>
            </div>
            <div className="u-row" style={{ gap: 14 }}>
              <div className="u-num" style={{ fontWeight: 700 }}>{fmt(p.amount)}</div>
              {s === "pending" && onOpen
                ? <Btn variant="secondary" size="sm" iconRight="chevron" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}>Review</Btn>
                : s === "pending" && actions
                  ? <div className="u-row" style={{ gap: 6 }}><Btn variant="secondary" size="sm" onClick={() => actions.roleAct("bursary", "pay", p.id, "flagged")}>Flag</Btn><Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("bursary", "pay", p.id, "confirmed")}>Verify</Btn></div>
                  : <SPill s={s} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* full transaction record: verify or flag from here */
function PaymentDetail({ payment: p, status, onClose, actions }) {
  const { fmt } = window.ROLE_DATA;
  const decide = (v) => { actions.roleAct("bursary", "pay", p.id, v); onClose(); };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Transaction details" sub={p.ref} onClose={onClose} />
      <div className="u-pad">
        <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
          <span className="u-icon"><Icon name="wallet" size={16} /></span>
          <div className="u-grow">
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.item}</div>
            <div className="u-meta">Paid via {p.channel} · {p.date}</div>
          </div>
          <SPill s={status} />
        </div>
        <DRow k="Amount" v={<span className="u-num" style={{ fontWeight: 700 }}>{fmt(p.amount)}</span>} />
        <DRow k="Payer" v={p.name} />
        <DRow k="Matric no." v={<span className="fb-mono">{p.matric}</span>} />
        <DRow k="Reference" v={<span className="fb-mono">{p.ref}</span>} />
        <DRow k="Channel" v={p.channel} />
        <DRow k="Date" v={p.date + ", 2025"} />
        <DRow k="Gateway response" v={<Tag variant="success" dot>Successful</Tag>} />
        <DRow k="Settlement account" v="FUTECH Fees Collection · 2041...880" />
        {status === "pending" ? (
          <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => decide("flagged")}>Flag for review</Btn>
            <Btn variant="accent" icon="check" onClick={() => decide("confirmed")}>Verify payment</Btn>
          </div>
        ) : (
          <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => decide("pending")}>Reopen</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

function BursaryVerify({ store, actions }) {
  const { PAYMENTS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState(null);
  const pst = (p) => rstate(store, "bursary", "pay", p.id, p.baseStatus);
  const open = PAYMENTS.find((p) => p.id === openId);
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
        <div className="u-pad"><PaymentRows store={store} actions={actions} rows={pager.slice} onOpen={setOpenId} /></div>
        <Pagination pager={pager} label="transactions" sizes={[12, 25, 50]} />
      </Card>
      {open && <PaymentDetail payment={open} status={pst(open)} onClose={() => setOpenId(null)} actions={actions} />}
    </div>
  );
}

function BursaryDebtors() {
  const { DEBTORS, fmt } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const [remindedAt, setRemindedAt] = React.useState(null);
  const filtered = DEBTORS.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.matric.toLowerCase().includes(q.toLowerCase()));
  const pager = usePaged(filtered, 15);
  const totalOwed = DEBTORS.reduce((s, d) => s + d.owed, 0);
  return (
    <div className="u-content">
      <PageHead title="Debtors" sub={DEBTORS.length + " students owing " + fmt(totalOwed)}>
        {remindedAt
          ? <Btn variant="secondary" icon="check" disabled>Reminders sent · {remindedAt}</Btn>
          : <Btn variant="secondary" icon="bell" onClick={() => setRemindedAt(new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }))}>Send reminders</Btn>}
      </PageHead>
      {remindedAt && (
        <Card className="u-pad" style={{ marginBottom: 14, background: "var(--success-soft)", borderColor: "transparent" }}>
          <div className="u-row" style={{ gap: 10 }}>
            <Icon name="check" size={15} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: 13, color: "oklch(from var(--success) calc(l - 0.15) c h)" }}>Payment reminders sent to {DEBTORS.length} debtors by email and SMS.</span>
          </div>
        </Card>
      )}
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name or matric no.…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
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
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Level</th><th className="u-right">Fresh student</th><th className="u-right">Returning student</th></tr></thead>
            <tbody>
              {FEE_STRUCTURE.map((f) => (
                <tr key={f.level}>
                  <td style={{ fontWeight: 600 }}>{f.level}</td>
                  <td className="u-right u-num">{f.fresh != null ? fmt(f.fresh) : "Not available"}</td>
                  <td className="u-right u-num">{f.returning != null ? fmt(f.returning) : "Not available"}</td>
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

function HostelAppRows({ store, actions, limit, only, rows: rowsProp, onOpen }) {
  const { HOSTEL_APPS } = window.ROLE_DATA;
  const hst = (a) => rstate(store, "hostel", "app", a.id, a.baseStatus);
  let rows = rowsProp || HOSTEL_APPS; if (!rowsProp && only) rows = rows.filter((a) => hst(a) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No pending applications" sub="New hostel applications will appear here." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const s = hst(a);
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: onOpen ? "pointer" : "default" }} onClick={onOpen ? () => onOpen(a.id) : undefined}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <Avatar initials={a.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</span><Tag>{a.level}</Tag></div>
                <div className="u-meta">{a.matric} · {a.hall} · {a.gender}</div>
              </div>
            </div>
            <div className="u-row" style={{ gap: 12 }}>
              {!a.feesPaid && <Tag variant="danger">Fees unpaid</Tag>}
              {s === "pending" && onOpen
                ? <Btn variant="secondary" size="sm" iconRight="chevron" onClick={(e) => { e.stopPropagation(); onOpen(a.id); }}>Review</Btn>
                : s === "pending" && actions
                  ? (a.feesPaid
                    ? <Decide onApprove={() => actions.roleAct("hostel", "app", a.id, "allocated")} onReject={() => actions.roleAct("hostel", "app", a.id, "rejected")} approveLabel="Allocate bed" rejectLabel="Decline"
                        confirmTitle={"Decline " + a.name + "'s application?"} confirmBody={"This declines " + a.name + "'s hostel application. They'll be notified and will need to reapply."} />
                    : <Btn variant="secondary" size="sm" disabled>Ineligible</Btn>)
                  : <SPill s={s} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* full application record: allocate or decline from here */
function HostelAppDetail({ app: a, status, onClose, actions }) {
  const { HOSTEL_STATS } = window.ROLE_DATA;
  const hall = HOSTEL_STATS.find((h) => h.hall === a.hall);
  const free = hall ? hall.total - hall.taken : 0;
  const decide = (v) => { actions.roleAct("hostel", "app", a.id, v); onClose(); };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Hostel application" sub={a.matric} onClose={onClose} />
      <div className="u-pad">
        <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
          <Avatar initials={a.initials} size={44} />
          <div className="u-grow">
            <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
            <div className="u-meta">{a.level} · {a.gender}</div>
          </div>
          <SPill s={status} />
        </div>
        <DRow k="Matric no." v={<span className="fb-mono">{a.matric}</span>} />
        <DRow k="Level" v={a.level} />
        <DRow k="Gender" v={a.gender} />
        <DRow k="Requested hall" v={a.hall} />
        <DRow k="Hall availability" v={hall ? <Tag variant={free > 0 ? "success" : "danger"} dot>{free > 0 ? free + " beds free" : "Full"}</Tag> : "Not available"} />
        <DRow k="School fees" v={a.feesPaid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>} />
        {status === "pending" ? (
          a.feesPaid ? (
            <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <ConfirmButton title={"Decline " + a.name + "'s application?"} body={"This declines " + a.name + "'s hostel application. They'll be notified and will need to reapply."} onConfirm={() => decide("rejected")}>Decline</ConfirmButton>
              <Btn variant="accent" icon="check" onClick={() => decide("allocated")}>Allocate bed</Btn>
            </div>
          ) : (
            <div className="u-formerr" style={{ marginTop: 16 }}>
              <Icon name="info" size={14} />
              <span>Ineligible: school fees for the session are unpaid.</span>
            </div>
          )
        ) : (
          <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => decide("pending")}>Reopen</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

function HostelApplications({ store, actions }) {
  const { HOSTEL_APPS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState(null);
  const hst = (a) => rstate(store, "hostel", "app", a.id, a.baseStatus);
  const open = HOSTEL_APPS.find((a) => a.id === openId);
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
        <div className="u-pad"><HostelAppRows store={store} actions={actions} rows={pager.slice} onOpen={setOpenId} /></div>
        <Pagination pager={pager} label="applications" sizes={[12, 25, 50]} />
      </Card>
      {open && <HostelAppDetail app={open} status={hst(open)} onClose={() => setOpenId(null)} actions={actions} />}
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

function ApplicantRows({ store, actions, limit, only, onOpen }) {
  const { APPLICANTS } = window.ROLE_DATA;
  const ast = (a) => rstate(store, "registry", "app", a.id, a.baseStatus);
  let rows = APPLICANTS; if (only) rows = rows.filter((a) => ast(a) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No applications pending" sub="New applications will appear here for screening." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const s = ast(a);
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: onOpen ? "pointer" : "default" }} onClick={onOpen ? () => onOpen(a.id) : undefined}>
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
            {s === "pending" && onOpen
              ? <Btn variant="secondary" size="sm" iconRight="chevron" onClick={(e) => { e.stopPropagation(); onOpen(a.id); }}>Review</Btn>
              : s === "pending" && actions
                ? <Decide onApprove={() => actions.roleAct("registry", "app", a.id, "admitted")} onReject={() => actions.roleAct("registry", "app", a.id, "rejected")} approveLabel="Admit" rejectLabel="Reject"
                    confirmTitle={"Reject " + a.name + "'s application?"} confirmBody={"This rejects " + a.name + "'s admission application. They'll be notified of the decision."} />
                : <SPill s={s} />}
          </div>
        );
      })}
    </div>
  );
}

/* full applicant record: admit or reject from here */
function ApplicantDetail({ applicant: a, status, onClose, actions }) {
  const decide = (v) => { actions.roleAct("registry", "app", a.id, v); onClose(); };
  const weak = a.oLevel !== "5+ credits" || a.docs === "Incomplete";
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Application details" sub={"JAMB " + a.jamb} onClose={onClose} />
      <div className="u-pad">
        <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
          <Avatar initials={a.initials} size={44} />
          <div className="u-grow">
            <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
            <div className="u-meta">{a.programme}</div>
          </div>
          <SPill s={status} />
        </div>
        <DRow k="JAMB reg. no." v={<span className="fb-mono">{a.jamb}</span>} />
        <DRow k="UTME score" v={<span className="u-num" style={{ fontWeight: 600 }}>{a.utme} / 400</span>} />
        <DRow k="Programme" v={a.programme} />
        <DRow k="O'Level" v={<Tag variant={a.oLevel === "5+ credits" ? "success" : "warning"}>{a.oLevel}</Tag>} />
        <DRow k="Documents" v={<Tag variant={a.docs === "Complete" ? "success" : "danger"}>{a.docs}</Tag>} />
        {weak && status === "pending" && (
          <div className="u-formerr" style={{ marginTop: 14 }}>
            <Icon name="info" size={14} />
            <span>{a.oLevel !== "5+ credits" ? "O'Level below the 5-credit requirement. " : ""}{a.docs === "Incomplete" ? "Uploaded documents are incomplete." : ""}</span>
          </div>
        )}
        {status === "pending" ? (
          <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <ConfirmButton title={"Reject " + a.name + "'s application?"} body={"This rejects " + a.name + "'s admission application. They'll be notified of the decision."} onConfirm={() => decide("rejected")}>Reject</ConfirmButton>
            <Btn variant="accent" icon="check" onClick={() => decide("admitted")}>Admit</Btn>
          </div>
        ) : (
          <div className="u-row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => decide("pending")}>Reopen</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

function RegistryApplications({ store, actions }) {
  const { APPLICANTS } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const [openId, setOpenId] = React.useState(null);
  const ast = (a) => rstate(store, "registry", "app", a.id, a.baseStatus);
  const counts = {}; APPLICANTS.forEach((a) => { const s = ast(a); counts[s] = (counts[s] || 0) + 1; });
  const open = APPLICANTS.find((a) => a.id === openId);
  return (
    <div className="u-content">
      <PageHead title="Admission Applications" sub="Screen applicants and approve admissions">
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "admitted", label: "Admitted" }, { value: "rejected", label: "Rejected" },
        ]} />
      </PageHead>
      <Card className="u-pad"><ApplicantRows store={store} actions={actions} only={filter} onOpen={setOpenId} /></Card>
      {open && <ApplicantDetail applicant={open} status={ast(open)} onClose={() => setOpenId(null)} actions={actions} />}
    </div>
  );
}

function RegistryRecords() {
  const { ADVISEES } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="Student Records" sub="Official bio-data and registration status" />
      <Card>
        <div className="u-table-scroll">
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
const SERVICE_TONE = { operational: "success", degraded: "warning", down: "danger" };
const SERVICE_LABEL = { operational: "Operational", degraded: "Degraded", down: "Down" };

function IctDashboard({ store, go }) {
  const { USERS, ICT_METRICS: M, ICT_SERVICES } = window.ROLE_DATA;
  const created = (store.roles && store.roles.ict && store.roles.ict.users) || [];
  const allUsers = [...created, ...USERS];
  const suspended = allUsers.filter((u) => rstate(store, "ict", "user", u.id, u.baseStatus) === "suspended").length;
  const degraded = ICT_SERVICES.filter((s) => s.status !== "operational");
  const se = store.session || {};
  const openWindows = ["registration", "fees", "hostel"].filter((k) => se[k] !== false).length + (se.results ? 1 : 0);
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.ict}>
        <Tag variant={degraded.length ? "warning" : "success"} dot>{degraded.length ? degraded.length + " service degraded" : "All systems operational"}</Tag>
      </RoleHero>
      <StatCards items={[
        { icon: "shield", k: "Uptime (30 days)", v: M.uptime, plain: true },
        { icon: "user", k: "Users online now", v: M.activeNow, plain: true },
        { icon: "lock", k: "Failed logins (24h)", v: M.failedLogins24h, tag: M.failedLogins24h > 10 ? "Watch" : "OK", tone: M.failedLogins24h > 10 ? "warning" : "success", onClick: () => go("ict-audit") },
        { icon: "layers", k: "Storage used", v: M.storagePct + "%", tag: M.storagePct > 85 ? "Expand" : "OK", tone: M.storagePct > 85 ? "danger" : "success" },
      ]} />

      <div className="u-cols u-cols--main">
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Service status</div>
            <div className="u-stack" style={{ gap: 0 }}>
              {ICT_SERVICES.map((s, i) => (
                <div key={s.name} className="u-row" style={{ gap: 11, padding: "11px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <span className="u-icon u-icon--plain" style={{ width: 28, height: 28, background: "var(--" + SERVICE_TONE[s.status] + "-soft)", color: "var(--" + SERVICE_TONE[s.status] + ")" }}><Icon name={s.status === "operational" ? "check" : "info"} size={13} /></span>
                  <div className="u-grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.name}</div>
                    <div className="u-meta">{s.detail}{s.note ? " · " + s.note : ""}</div>
                  </div>
                  <Tag variant={SERVICE_TONE[s.status]} dot>{SERVICE_LABEL[s.status]}</Tag>
                </div>
              ))}
            </div>
          </Card>
          <Card className="u-pad">
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div className="u-h3">Recent activity</div><a className="fb-link" onClick={() => go("ict-audit")}>Full log</a>
            </div>
            <AuditRows limit={4} />
          </Card>
        </div>

        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Platform</div>
            {[["API latency (p95)", M.apiLatency], ["DB connections", M.dbConnections], ["Last backup", M.lastBackup], ["Backup size", M.backupSize]].map(([k, v]) => (
              <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="k">{k}</span><span className="v u-num">{v}</span>
              </div>
            ))}
            <div className="u-bar" style={{ marginTop: 14, height: 8 }}><div className="u-bar__fill" style={{ width: M.storagePct + "%" }} /></div>
            <div className="u-meta" style={{ marginTop: 6 }}>Storage · {M.storagePct}% of 2 TB used</div>
          </Card>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Accounts & session</div>
            {[["Total accounts", allUsers.length], ["Suspended", suspended], ["Active session", se.current || "2025/2026"], ["Open windows", openWindows + " of 4"]].map(([k, v]) => (
              <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="k">{k}</span><span className="v u-num">{v}</span>
              </div>
            ))}
            <div className="u-row u-wrap" style={{ gap: 8, marginTop: 14 }}>
              <Btn variant="secondary" size="sm" icon="user" onClick={() => go("ict-users")}>Manage users</Btn>
              <Btn variant="secondary" size="sm" icon="calendar" onClick={() => go("ict-sessions")}>Sessions</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IctUsers({ store, actions }) {
  const { USERS } = window.ROLE_DATA;
  const [q, setQ] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [resetSent, setResetSent] = React.useState({});
  const created = (store.roles && store.roles.ict && store.roles.ict.users) || [];
  const all = [...created, ...USERS];
  const filtered = all.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || (u.role || "").toLowerCase().includes(q.toLowerCase()) || (u.dept || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="u-content">
      <PageHead title="User Management" sub={all.length + " accounts across all roles"}>
        <Btn variant="accent" icon="plus" onClick={() => setCreating(true)}>Create user</Btn>
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 340, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by name, role or department…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Last active</th><th>Status</th><th className="u-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map((u) => {
                const s = rstate(store, "ict", "user", u.id, u.baseStatus);
                return (
                  <tr key={u.id}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={u.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} /><span style={{ fontWeight: 500 }}>{u.name}</span>{u.id.startsWith("usr-new") && <Tag variant="success">New</Tag>}</div></td>
                    <td className="u-muted">{u.role}</td>
                    <td className="u-muted">{u.dept}</td>
                    <td className="u-meta">{u.last}</td>
                    <td><SPill s={s} /></td>
                    <td className="u-right">
                      <div className="u-row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        {resetSent[u.id]
                          ? <Tag variant="success" dot>Link sent</Tag>
                          : <Btn variant="ghost" size="sm" onClick={() => setResetSent((m) => ({ ...m, [u.id]: true }))}>Reset</Btn>}
                        <Btn variant="secondary" size="sm" onClick={() => actions.roleAct("ict", "user", u.id, s === "active" ? "suspended" : "active")}>{s === "active" ? "Suspend" : "Activate"}</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6}><Empty icon="search" title="No matches" sub="No accounts match your search." /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {creating && <CreateUserModal actions={actions} onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateUserModal({ actions, onClose }) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("Lecturer");
  const [dept, setDept] = React.useState("Computer Science");
  const [email, setEmail] = React.useState("");
  const ROLES = ["Lecturer", "Level Adviser", "HOD", "Exams & Records", "Bursary Officer", "Hostel Officer", "Registry", "Student"];
  const depts = (window.ORG ? window.ORG.FACULTIES.flatMap((f) => f.departments.map((d) => d.name)) : ["Computer Science"]);
  const create = () => {
    actions.ictCreateUser({ name: name.trim(), role, dept, email: email.trim() });
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Create user" sub="Provision a new portal account" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Full name">
          <input className="fb-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Amina Yusuf" />
        </Field>
        <div className="u-grid u-grid--2" style={{ gap: 10 }}>
          <Field label="Role">
            <select className="fb-input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Department">
            <select className="fb-input" value={dept} onChange={(e) => setDept(e.target.value)}>
              {depts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Email">
          <input className="fb-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@futech.edu.ng" />
        </Field>
        <Btn variant="accent" size="lg" disabled={!name.trim() || !email.trim()} onClick={create} style={{ width: "100%" }}>Create account</Btn>
        <div className="u-meta" style={{ textAlign: "center" }}>An invite with a temporary password is emailed to the user (demo).</div>
      </div>
    </Modal>
  );
}

function IctSessions({ store, actions }) {
  const { SESSIONS } = window.ROLE_DATA;
  const se = store.session || {};
  const [creating, setCreating] = React.useState(false);
  const [viewing, setViewing] = React.useState(null);
  const created = (store.roles && store.roles.ict && store.roles.ict.sessions) || [];
  const allSessions = [...created.slice().reverse(), ...SESSIONS];
  const windows = [
    { key: "registration", label: "Course registration", icon: "book", note: se.regCloses ? "Closes " + se.regCloses : "" },
    { key: "fees", label: "Fee payment", icon: "wallet", note: se.feesCloses ? "Closes " + se.feesCloses : "" },
    { key: "hostel", label: "Hostel application", icon: "bed", note: "Eligible students only" },
    { key: "results", label: "Results published", icon: "chart", note: "Students can view released results" },
  ];
  return (
    <div className="u-content">
      <PageHead title="Sessions & Semesters" sub="Open or close academic windows for the active session">
        <Btn variant="secondary" icon="plus" onClick={() => setCreating(true)}>New session</Btn>
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
        <div className="u-row u-wrap" style={{ gap: 12, marginTop: 14, padding: "13px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>Result release policy</div>
            <div className="u-meta">{(se.releaseMode || "batch") === "batch" ? "Whole levels are released at once after Senate approval." : "Approved courses are released one by one; GPAs stay provisional until the level completes."}</div>
          </div>
          <Seg value={se.releaseMode || "batch"} onChange={actions.setReleaseMode} options={[{ value: "batch", label: "Batch by level" }, { value: "course", label: "Per course" }]} />
        </div>
        <div className="u-meta" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Changes take effect immediately in every student portal.</div>
      </Card>

      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Session</th><th>State</th><th>Course registration</th><th>Fee payment</th><th className="u-right">Actions</th></tr></thead>
            <tbody>
              {allSessions.map((s) => {
                const isActive = s.state === "Active";
                const reg = isActive ? (se.registration !== false ? "Open" : "Closed") : s.reg;
                const fees = isActive ? (se.fees !== false ? "Open" : "Closed") : s.fees;
                return (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><Tag variant={isActive ? "success" : s.state === "Draft" ? "accent" : undefined} dot={isActive}>{s.state}</Tag></td>
                    <td><Tag variant={reg === "Open" ? "accent" : undefined}>{reg}</Tag></td>
                    <td><Tag variant={fees === "Open" ? "accent" : undefined}>{fees}</Tag></td>
                    <td className="u-right">{isActive
                      ? <Btn variant="secondary" size="sm" onClick={() => { const m = document.querySelector(".u-main"); m ? m.scrollTo({ top: 0, behavior: "smooth" }) : window.scrollTo({ top: 0, behavior: "smooth" }); }}>Manage windows ↑</Btn>
                      : <Btn variant="ghost" size="sm" onClick={() => setViewing(s)}>View</Btn>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {creating && <NewSessionModal actions={actions} existing={allSessions.map((s) => s.name)} onClose={() => setCreating(false)} />}
      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <ModalHead title={viewing.name + " session"} sub={viewing.state} onClose={() => setViewing(null)} />
          <div className="u-pad">
            {[["State", viewing.state], ["Course registration", viewing.reg], ["Fee payment", viewing.fees], ["Results", viewing.state === "Archived" ? "Released" : "Not released"], ["Semesters", viewing.state === "Draft" ? "Not started" : "First & Second"]].map(([k, v]) => (
              <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="k">{k}</span><span className="v">{v}</span>
              </div>
            ))}
            <div className="u-meta" style={{ marginTop: 12 }}>
              {viewing.state === "Draft"
                ? "A draft session goes live when the current one is archived. Windows stay closed until then."
                : "Archived sessions are read-only. Records remain available to Exams & Records and the Registry."}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---- approval workflow: the review chain a compiled level walks before
   release. Exams & Records always compiles first and releases last; this
   configures what happens in between, and it's deliberately flexible since
   the real sequence differs school to school. ---- */
const WORKFLOW_ROLE_LABELS = {
  hod: "Head of Department", dean: "Dean / School Board", exams: "Exams & Records",
  adviser: "Level Adviser", lecturer: "Lecturer", bursary: "Bursary", hostel: "Hostel Officer",
  registry: "Registry", admissions: "Admissions", librarian: "Librarian", clinic: "Medical Officer", ict: "ICT / Super Admin",
};
function IctWorkflow({ store, actions }) {
  const stages = (store.workflow && store.workflow.stages) || [];
  const [adding, setAdding] = React.useState(false);
  const move = (i, dir) => {
    const next = stages.slice();
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    actions.setWorkflowStages(next);
  };
  const remove = (i) => actions.setWorkflowStages(stages.filter((_, k) => k !== i));
  const relabel = (i, label) => actions.setWorkflowStages(stages.map((s, k) => k === i ? { ...s, label } : s));

  return (
    <div className="u-content">
      <PageHead title="Approval Workflow" sub="The review chain a compiled level walks through before release">
        <Btn variant="accent" icon="plus" onClick={() => setAdding(true)}>Add stage</Btn>
      </PageHead>

      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Fixed:</span>
          <Tag variant="accent">Lecturer submits</Tag>
          <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />
          <Tag variant="accent">Exams & Records compiles</Tag>
          <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />
          <span className="u-meta">: your configured stages run here :</span>
          <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />
          <Tag variant="accent">Senate</Tag>
          <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />
          <Tag variant="accent">Exams & Records releases</Tag>
        </div>
        <div className="u-meta" style={{ marginTop: 10 }}>Every course sheet is approved by Exams &amp; Records, then compiled into a level. What happens next: who reviews it, in what order: is entirely up to you. Different schools run this differently, so nothing below is hard-coded.</div>
      </Card>

      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>Review stages, in order</div>
        {stages.length === 0 ? (
          <Empty icon="chart" title="No review stages configured" sub="Compiled levels will go straight to Senate and release. Add a stage to require review first." />
        ) : (
          <div className="u-stack" style={{ gap: 8 }}>
            {stages.map((s, i) => (
              <div key={s.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 12, minWidth: 0 }}>
                  <span className="u-icon u-icon--plain" style={{ width: 30, height: 30 }}><span className="u-num" style={{ fontWeight: 700, fontSize: 13 }}>{i + 1}</span></span>
                  <div style={{ minWidth: 0 }}>
                    <input className="fb-input" value={s.label} onChange={(e) => relabel(i, e.target.value)} style={{ padding: "5px 8px", fontSize: 13.5, fontWeight: 500, minWidth: 220 }} />
                    <div className="u-meta" style={{ marginTop: 4 }}>Actioned by <Tag>{WORKFLOW_ROLE_LABELS[s.actorRole] || s.actorRole}</Tag></div>
                  </div>
                </div>
                <div className="u-row" style={{ gap: 6 }}>
                  <Btn variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>↑</Btn>
                  <Btn variant="ghost" size="sm" disabled={i === stages.length - 1} onClick={() => move(i, 1)}>↓</Btn>
                  <Btn variant="secondary" size="sm" onClick={() => remove(i)}>Remove</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Changes take effect immediately. A level already mid-review keeps its place in the old sequence; only newly compiled levels use the new one.</div>

      {adding && <AddWorkflowStageModal existing={stages} onClose={() => setAdding(false)} onAdd={(rec) => { actions.setWorkflowStages([...stages, rec]); setAdding(false); }} />}
    </div>
  );
}

function AddWorkflowStageModal({ onAdd, onClose }) {
  const roles = Object.keys(WORKFLOW_ROLE_LABELS);
  const [actorRole, setActorRole] = React.useState(roles[0]);
  const [label, setLabel] = React.useState(WORKFLOW_ROLE_LABELS[roles[0]] + " Review");
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Add review stage" sub="Any staff role can be assigned as a reviewer" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Who reviews at this stage?">
          <select className="fb-input" value={actorRole} onChange={(e) => { setActorRole(e.target.value); setLabel(WORKFLOW_ROLE_LABELS[e.target.value] + " Review"); }}>
            {roles.map((r) => <option key={r} value={r}>{WORKFLOW_ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Stage label (shown on the result flow)">
          <input className="fb-input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Btn variant="accent" size="lg" disabled={!label.trim()} onClick={() => onAdd({ id: "st-" + Date.now(), actorRole, label: label.trim() })} style={{ width: "100%" }}>Add stage</Btn>
      </div>
    </Modal>
  );
}

function NewSessionModal({ actions, existing, onClose }) {
  const suggest = (() => {
    const years = existing.map((n) => parseInt(n)).filter(Boolean);
    const next = Math.max(...years, 2025) + 1;
    return next + "/" + (next + 1);
  })();
  const [name, setName] = React.useState(suggest);
  const dup = existing.includes(name.trim());
  return (
    <Modal onClose={onClose}>
      <ModalHead title="New academic session" sub="Created as a draft: activate it when the current session ends" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Session name">
          <input className="fb-input fb-input--mono" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="2026/2027" />
        </Field>
        {dup && (
          <div className="u-formerr"><Icon name="info" size={14} /><span>A session named {name.trim()} already exists.</span></div>
        )}
        <Btn variant="accent" size="lg" disabled={!name.trim() || dup} onClick={() => { actions.ictCreateSession(name.trim()); onClose(); }} style={{ width: "100%" }}>Create draft session</Btn>
      </div>
    </Modal>
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
          <div className="u-grow"><div style={{ fontSize: 13.5 }}><strong style={{ fontWeight: 600 }}>{a.who}</strong>: {a.action}</div></div>
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
  IctDashboard, IctUsers, IctSessions, IctWorkflow, IctAudit,
});
