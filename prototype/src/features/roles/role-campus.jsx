import React from "react";
const { AddToCollectionModal, Avatar, Btn, Card, Empty, Field, Icon, PageHead, RoleHero, SPill, Seg, StatCards, Tag, rstate } = window;
/* Staff roles: Librarian & Medical Officer (clinic) */

/* ============ LIBRARIAN ============ */
function LibrarianDashboard({ store, actions, go }) {
  const C = window.CAMPUS_DATA;
  const lst = (l) => rstate(store, "library", "loan", l.id, l.baseStatus);
  const onLoan = C.LIB_LOANS.filter((l) => lst(l) === "on-loan").length;
  const overdue = C.LIB_LOANS.filter((l) => l.overdue && lst(l) === "on-loan").length;
  const res = C.LIB_RESERVATIONS.filter((r) => rstate(store, "library", "res", r.id, r.baseStatus) === "waiting").length;
  const [adding, setAdding] = React.useState(false);
  return (
    <div className="u-content">
      <RoleHero person={C.PEOPLE.librarian}>
        <Btn variant="accent" icon="barcode" onClick={() => setAdding(true)}>Add to collection</Btn>
      </RoleHero>
      <StatCards items={[
        { icon: "bookOpen", k: "Books on loan", v: onLoan, plain: true, onClick: () => go("lib-desk") },
        { icon: "info", k: "Overdue", v: overdue, tag: overdue ? "Follow up" : "Clear", tone: overdue ? "danger" : "success", onClick: () => go("lib-overdue") },
        { icon: "clock", k: "Reservations", v: res, tag: res ? "Issue" : "Clear", tone: res ? "warning" : "success", onClick: () => go("lib-res") },
        { icon: "user", k: "Members", v: C.LIB_STATS.members.toLocaleString(), plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Active loans</div><a className="fb-link" onClick={() => go("lib-desk")}>Circulation desk</a>
        </div>
        <LibLoanRows store={store} actions={null} limit={4} />
      </Card>
      {adding && <AddToCollectionModal store={store} actions={actions} onClose={() => setAdding(false)} />}
    </div>
  );
}

function LibLoanRows({ store, actions, limit, onlyOverdue }) {
  const C = window.CAMPUS_DATA;
  const lst = (l) => rstate(store, "library", "loan", l.id, l.baseStatus);
  const issued = Object.values((store.roles && store.roles.library && store.roles.library.issued) || {});
  let rows = [...issued, ...C.LIB_LOANS].filter((l) => lst(l) === "on-loan");
  if (onlyOverdue) rows = rows.filter((l) => l.overdue);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="Nothing here" sub="All clear at the circulation desk." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((l) => (
        <div key={l.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
            <Avatar initials={l.initials} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.book}</div>
              <div className="u-meta">{l.student} · {l.matric}</div>
            </div>
          </div>
          <div className="u-row" style={{ gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <Tag variant={l.overdue ? "danger" : "accent"} dot>{l.overdue ? "Overdue" : "Due " + l.due}</Tag>
              {l.overdue && <div className="u-meta u-num" style={{ marginTop: 3, color: "var(--danger)" }}>Fine {C.fmt(l.fine)}</div>}
            </div>
            {actions && <Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("library", "loan", l.id, "returned")}>Check in</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LibrarianDesk({ store, actions }) {
  const C = window.CAMPUS_DATA;
  const [matric, setMatric] = React.useState("FUT/2022/CSC/10428");
  const [book, setBook] = React.useState("");
  const issue = () => {
    const id = "UL" + Date.now();
    const student = matric.trim() === "FUT/2022/CSC/10428" ? "Adaeze N. Okeke" : "Library member";
    actions.roleAct("library", "issued", id, {
      id, book: book.trim(), student, matric: matric.trim(),
      initials: C.init(student), due: "in 14 days", overdue: false, baseStatus: "on-loan",
    });
    setBook("");
  };
  return (
    <div className="u-content">
      <PageHead title="Circulation Desk" sub="Check books in and out" />
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 12 }}>Issue a book</div>
        <div className="u-row u-wrap" style={{ gap: 10, alignItems: "flex-end" }}>
          <Field label="Member matric no."><input className="fb-input fb-input--mono" placeholder="FUT/2022/CSC/00000" value={matric} onChange={(e) => setMatric(e.target.value)} /></Field>
          <Field label="Book / call number"><input className="fb-input" placeholder="Title or call number" value={book} onChange={(e) => setBook(e.target.value)} /></Field>
          <Btn variant="accent" icon="check" disabled={!book.trim() || !matric.trim()} onClick={issue}>Issue (14 days)</Btn>
        </div>
      </Card>
      <div className="u-h3" style={{ marginBottom: 10 }}>Currently on loan</div>
      <Card className="u-pad"><LibLoanRows store={store} actions={actions} /></Card>
    </div>
  );
}

function LibrarianReservations({ store, actions }) {
  const C = window.CAMPUS_DATA;
  const rst = (r) => rstate(store, "library", "res", r.id, r.baseStatus);
  return (
    <div className="u-content">
      <PageHead title="Reservations" sub="Issue held copies to the next member in the queue" />
      <Card className="u-pad">
        <div className="u-stack" style={{ gap: 8 }}>
          {C.LIB_RESERVATIONS.map((r) => {
            const s = rst(r);
            return (
              <div key={r.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                  <Avatar initials={r.initials} size={34} />
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.book}</div><div className="u-meta">{r.student} · waiting since {r.since}</div></div>
                </div>
                {s === "waiting"
                  ? <div className="u-row" style={{ gap: 6 }}><Btn variant="secondary" size="sm" onClick={() => actions.roleAct("library", "res", r.id, "cancelled")}>Cancel</Btn><Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("library", "res", r.id, "fulfilled")}>Issue</Btn></div>
                  : <SPill s={s === "fulfilled" ? "done" : "rejected"} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function LibrarianOverdue({ store, actions }) {
  return (
    <div className="u-content">
      <PageHead title="Overdue & Fines" sub="Loans past their due date accruing fines" />
      <Card className="u-pad"><LibLoanRows store={store} actions={actions} onlyOverdue /></Card>
    </div>
  );
}

function LibrarianCatalogue({ store, go }) {
  const C = window.CAMPUS_DATA;
  const [q, setQ] = React.useState("");
  const all = window.allLibBooks ? window.allLibBooks(store) : C.BOOKS;
  const rows = all.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));
  const titles = (C.LIB_STATS.titles + ((store.campus && store.campus.libBooks) || []).length).toLocaleString();
  return (
    <div className="u-content">
      <PageHead title="Catalogue" sub={titles + " titles · " + C.LIB_STATS.copies.toLocaleString() + " copies"}>
        <Btn variant="accent" icon="barcode" onClick={() => go("lib-add")}>Add to collection</Btn>
      </PageHead>
      <div style={{ marginBottom: 14, maxWidth: 360, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
        <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search catalogue…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Call no.</th><th className="u-right">Available</th></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.title}{b.addedAt && <Tag variant="success" style={{ marginLeft: 8 }}>New</Tag>}</td>
                  <td className="u-muted">{b.author}</td>
                  <td><Tag>{b.cat}</Tag></td>
                  <td className="fb-mono u-meta">{b.call}</td>
                  <td className="u-right"><Tag variant={b.available > 0 ? "success" : "danger"} dot>{b.available} / {b.copies}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============ MEDICAL OFFICER (clinic) ============ */
function ClinicDashboard({ store, go }) {
  const C = window.CAMPUS_DATA;
  const cst = (a) => rstate(store, "clinic", "appt", a.id, a.baseStatus);
  const pending = C.CLINIC_QUEUE.filter((a) => cst(a) === "pending").length;
  const today = C.CLINIC_QUEUE.filter((a) => a.date === "Today" && cst(a) !== "completed" && cst(a) !== "declined").length;
  const lowStock = C.DRUGS.filter((d) => d.level !== "ok").length;
  return (
    <div className="u-content">
      <RoleHero person={C.PEOPLE.clinic} />
      <StatCards items={[
        { icon: "heart", k: "Appointments today", v: today, tag: today ? "See patients" : "Clear", tone: today ? "warning" : "success", onClick: () => go("cl-queue") },
        { icon: "clock", k: "Awaiting confirmation", v: pending, onClick: () => go("cl-queue") },
        { icon: "user", k: "Registered patients", v: C.CLINIC_STATS.patients.toLocaleString(), plain: true },
        { icon: "pill", k: "Low / out of stock", v: lowStock, tag: lowStock ? "Restock" : "OK", tone: lowStock ? "danger" : "success", onClick: () => go("cl-pharmacy") },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Today's appointment queue</div><a className="fb-link" onClick={() => go("cl-queue")}>Full queue</a>
        </div>
        <ClinicQueueRows store={store} actions={null} limit={4} todayOnly />
      </Card>
    </div>
  );
}

function ClinicQueueRows({ store, actions, limit, todayOnly, filter }) {
  const C = window.CAMPUS_DATA;
  const cst = (a) => rstate(store, "clinic", "appt", a.id, a.baseStatus);
  let rows = C.CLINIC_QUEUE;
  if (todayOnly) rows = rows.filter((a) => a.date === "Today");
  if (filter) rows = rows.filter((a) => cst(a) === filter);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No appointments" sub="The queue is clear." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const s = cst(a);
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <span className="u-meta fb-mono" style={{ width: 42 }}>{a.time}</span>
              <Avatar initials={a.initials} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.student}</div>
                <div className="u-meta">{a.service} · {a.date} · {a.matric}</div>
              </div>
            </div>
            <div className="u-row" style={{ gap: 8 }}>
              {actions && s === "pending" && <><Btn variant="secondary" size="sm" onClick={() => actions.roleAct("clinic", "appt", a.id, "declined")}>Decline</Btn><Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("clinic", "appt", a.id, "confirmed")}>Confirm</Btn></>}
              {actions && s === "confirmed" && <Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("clinic", "appt", a.id, "completed")}>Mark seen</Btn>}
              {(!actions || s === "completed" || s === "declined") && <SPill s={s} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClinicQueue({ store, actions }) {
  const C = window.CAMPUS_DATA;
  const [filter, setFilter] = React.useState("pending");
  const cst = (a) => rstate(store, "clinic", "appt", a.id, a.baseStatus);
  const counts = {}; C.CLINIC_QUEUE.forEach((a) => { const s = cst(a); counts[s] = (counts[s] || 0) + 1; });
  return (
    <div className="u-content">
      <PageHead title="Appointment Queue" sub="Confirm, see and close patient appointments">
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "confirmed", label: "Confirmed" }, { value: "completed", label: "Seen" },
        ]} />
      </PageHead>
      <Card className="u-pad"><ClinicQueueRows store={store} actions={actions} filter={filter} /></Card>
    </div>
  );
}

function ClinicPatients() {
  const C = window.CAMPUS_DATA;
  const [openRec, setOpenRec] = React.useState(null);
  const seen = Array.from(new Set(C.CLINIC_QUEUE.map((c) => c.student))).slice(0, 10).map((name, i) => ({
    name, initials: C.init(name), matric: "FUT/2022/CSC/" + (10700 + i * 5), visits: 1 + (i % 5), last: ["Today", "2 days ago", "1 week ago", "Oct 2", "Sep 18"][i % 5],
    bloodGroup: ["O+", "A+", "B+", "AB+", "O-"][i % 5],
    genotype: ["AA", "AS", "AA", "AA", "AS"][i % 5],
    allergies: i % 3 === 0 ? "Penicillin" : "None recorded",
    lastComplaint: ["Malaria symptoms", "Sports injury: ankle", "Migraine", "Typhoid follow-up", "General check-up"][i % 5],
  }));
  return (
    <div className="u-content">
      <PageHead title="Patient Records" sub="Students registered with the health centre" />
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Patient</th><th>Matric</th><th className="u-right">Visits</th><th>Last seen</th><th className="u-right">Record</th></tr></thead>
            <tbody>
              {seen.map((p) => (
                <tr key={p.matric} style={{ cursor: "pointer" }} onClick={() => setOpenRec(p)}>
                  <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={p.initials} size={30} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{p.matric}</td>
                  <td className="u-right u-num">{p.visits}</td>
                  <td className="u-meta">{p.last}</td>
                  <td className="u-right"><Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenRec(p); }}>Open</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {openRec && <PatientRecordModal p={openRec} onClose={() => setOpenRec(null)} />}
    </div>
  );
}

/* read-only medical record card for a patient */
function PatientRecordModal({ p, onClose }) {
  const Row = ({ k, v }) => (
    <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
      <span className="k">{k}</span><span className="v">{v}</span>
    </div>
  );
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Patient record" sub={p.matric} onClose={onClose} />
      <div className="u-pad">
        <div className="u-row" style={{ gap: 12, marginBottom: 14 }}>
          <Avatar initials={p.initials} size={44} />
          <div className="u-grow">
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
            <div className="u-meta">Registered patient · {p.visits} visit{p.visits === 1 ? "" : "s"} this session</div>
          </div>
          <Tag variant="success" dot>Active</Tag>
        </div>
        <Row k="Blood group" v={p.bloodGroup} />
        <Row k="Genotype" v={p.genotype} />
        <Row k="Allergies" v={p.allergies === "None recorded" ? p.allergies : <Tag variant="danger">{p.allergies}</Tag>} />
        <Row k="Last visit" v={p.last} />
        <Row k="Last complaint" v={p.lastComplaint} />
        <Row k="Emergency contact" v="On file · Registry" />
        <div className="u-meta" style={{ marginTop: 12 }}><Icon name="lock" size={12} /> Full clinical notes are restricted to attending medical staff.</div>
      </div>
    </Modal>
  );
}

function ClinicPharmacy({ store, actions }) {
  const C = window.CAMPUS_DATA;
  const tone = { ok: "success", low: "warning", out: "danger" };
  const label = { ok: "In stock", low: "Low", out: "Out of stock" };
  const [restocking, setRestocking] = React.useState(false);
  // restocked units live in the store so they survive navigation
  const added = (name) => rstate(store, "clinic", "restock", name, 0);
  return (
    <div className="u-content">
      <PageHead title="Pharmacy Inventory" sub="Drug stock levels at the medical centre">
        <Btn variant="accent" icon="plus" onClick={() => setRestocking(true)}>Record restock</Btn>
      </PageHead>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Drug / item</th><th className="u-right">In stock</th><th>Status</th></tr></thead>
            <tbody>
              {C.DRUGS.map((d) => {
                const extra = added(d.name);
                const stock = d.stock + extra;
                const level = extra > 0 ? "ok" : d.level;
                return (
                  <tr key={d.name}>
                    <td style={{ fontWeight: 500 }}>{d.name} {extra > 0 && <Tag variant="success">+{extra} restocked</Tag>}</td>
                    <td className="u-right u-num">{stock} {d.unit}</td>
                    <td><Tag variant={tone[level]} dot>{label[level]}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {restocking && <RestockModal store={store} actions={actions} onClose={() => setRestocking(false)} />}
    </div>
  );
}

function RestockModal({ store, actions, onClose }) {
  const C = window.CAMPUS_DATA;
  const [drug, setDrug] = React.useState(C.DRUGS.find((d) => d.level !== "ok")?.name || C.DRUGS[0].name);
  const [qty, setQty] = React.useState(100);
  const save = () => {
    const prev = rstate(store, "clinic", "restock", drug, 0);
    actions.roleAct("clinic", "restock", drug, prev + Number(qty || 0));
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Record restock" sub="Add received supply to inventory" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="Drug / item">
          <select className="fb-input" value={drug} onChange={(e) => setDrug(e.target.value)}>
            {C.DRUGS.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Quantity received">
          <input className="fb-input" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Btn variant="accent" size="lg" disabled={!qty || Number(qty) <= 0} onClick={save} style={{ width: "100%" }}>Add to inventory</Btn>
      </div>
    </Modal>
  );
}

Object.assign(window, {
  LibrarianDashboard, LibrarianDesk, LibrarianReservations, LibrarianOverdue, LibrarianCatalogue,
  ClinicDashboard, ClinicQueue, ClinicPatients, ClinicPharmacy,
});
