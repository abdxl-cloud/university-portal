/* Student campus services: Library & Clinic */
import React from "react";
import { Icon } from "../../components/icons";
import { Btn, Card, ConfirmButton, Empty, PageHead, SPill, Seg, Stat, Tag } from "../../components/ui";
import { PayModal } from "../finance/finance";
import {
  BOOKS, ERESOURCES, FINE_PER_DAY, LABS, MEDICAL, MY_APPOINTMENTS, MY_LOANS,
  OVERDUE_DAYS, PRESCRIPTIONS, SERVICES, SLOTS, VISITS, fmt, nextDays,
} from "../../data/campus-data";
import type { Book, ClinicService, DayOption } from "../../data/campus-data";
import type { Store, StoreLoan } from "../../store/types";
import type { Actions } from "../../store/store";

/* ============ LIBRARY (student) ============ */
export interface LibraryProps {
  store: Store;
  actions: Actions;
}

type LibraryTab = "catalogue" | "loans" | "reservations" | "elib";

export function Library({ store, actions }: LibraryProps) {
  const [tab, setTab] = React.useState<LibraryTab>("catalogue");
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");

  const seedLoans: StoreLoan[] = MY_LOANS.map((l) => ({ ...l, bookId: l.bookId }));
  const myLoans = [...seedLoans, ...((store.campus && store.campus.loans) || [])]
    .filter((l) => !((store.campus && store.campus.returned) || {})[l.id])
    .map((l) => (((store.campus && store.campus.renewedSeed) || {})[l.id]) ? { ...l, renewed: true, overdue: false } : l);
  const myReservations = (store.campus && store.campus.reservations) || [];
  const finePaid = store.campus && store.campus.finePaid;
  const fineAmount = FINE_PER_DAY * OVERDUE_DAYS;
  const hasFine = myLoans.some((l) => l.overdue) && !finePaid;

  const cats = ["All", ...Array.from(new Set(BOOKS.map((b) => b.cat)))];
  const borrowedIds = new Set(myLoans.map((l) => l.bookId));
  const reservedIds = new Set(myReservations.map((r) => r.bookId));
  const filtered = BOOKS.filter((b) =>
    (cat === "All" || b.cat === cat) &&
    (b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()))
  );

  const tabs: { value: LibraryTab; label: string }[] = [
    { value: "catalogue", label: "Catalogue" },
    { value: "loans", label: "My Loans" + (myLoans.length ? " · " + myLoans.length : "") },
    { value: "reservations", label: "Reservations" },
    { value: "elib", label: "E-Library" },
  ];

  return (
    <div className="u-content">
      <PageHead title="University Library" sub="Search the catalogue, manage loans and access e-resources">
        <Seg value={tab} onChange={setTab} options={tabs} />
      </PageHead>

      {hasFine && tab !== "loans" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--danger)", background: "var(--danger-soft)" }}>
          <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 12 }}>
              <span className="u-icon" style={{ background: "transparent", color: "var(--danger)" }}><Icon name="info" size={18} /></span>
              <div><div className="u-h3" style={{ color: "var(--danger)" }}>Overdue fine: {fmt(fineAmount)}</div><div style={{ fontSize: 13, color: "oklch(from var(--danger) calc(l - 0.1) c h)" }}>You have an overdue book. Settle the fine to keep borrowing.</div></div>
            </div>
            <Btn variant="accent" onClick={() => setTab("loans")}>View loans</Btn>
          </div>
        </Card>
      )}

      {tab === "catalogue" && (
        <div className="u-stack" style={{ gap: 14 }}>
          <div className="u-row u-wrap" style={{ gap: 10 }}>
            <div className="u-grow" style={{ position: "relative", minWidth: 220 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
              <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search by title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Seg value={cat} onChange={setCat} options={cats.map((c) => ({ value: c, label: c }))} />
          </div>
          <Card>
            <div className="u-list" style={{ padding: "2px 0" }}>
              {filtered.length === 0 ? <Empty icon="search" title="No matches" sub="Try a different title, author or category." /> : filtered.map((b, i) => {
                const mine = borrowedIds.has(b.id), reserved = reservedIds.has(b.id);
                const avail = Math.max(0, b.available - (mine ? 1 : 0));
                return (
                  <div key={b.id} className="u-row u-wrap" style={{ gap: 13, padding: "14px 18px", borderTop: i ? "1px solid var(--border)" : 0, justifyContent: "space-between" }}>
                    <div className="u-row" style={{ gap: 13, minWidth: 0 }}>
                      <span className="u-icon u-icon--plain" style={{ width: 38, height: 46, borderRadius: 5 }}><Icon name="bookOpen" size={17} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                        <div className="u-meta">{b.author} · {b.year}</div>
                        <div className="u-row u-wrap" style={{ gap: 6, marginTop: 5 }}>
                          <Tag>{b.cat}</Tag>
                          <Tag variant={avail > 0 ? "success" : "danger"} dot>{avail > 0 ? avail + " available" : "All on loan"}</Tag>
                          <span className="u-meta fb-mono">{b.call}</span>
                        </div>
                      </div>
                    </div>
                    <div className="u-row" style={{ gap: 8 }}>
                      {mine ? <Tag variant="accent" dot>Borrowed</Tag>
                        : reserved ? <Tag variant="warning" dot>Reserved</Tag>
                        : avail > 0
                          ? <Btn variant="accent" size="sm" icon="check" onClick={() => actions.borrowBook(b)}>Borrow</Btn>
                          : <Btn variant="secondary" size="sm" onClick={() => actions.reserveBook(b)}>Reserve</Btn>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "loans" && (
        <div className="u-stack" style={{ gap: 14 }}>
          {hasFine && (
            <Card className="u-pad">
              <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
                <div><div className="u-h3">Outstanding fine</div><div className="u-meta">{OVERDUE_DAYS} days overdue × {fmt(FINE_PER_DAY)}/day</div></div>
                <div className="u-row" style={{ gap: 14 }}><div className="u-stat__v u-num" style={{ color: "var(--danger)" }}>{fmt(fineAmount)}</div><FinePayButton actions={actions} amount={fineAmount} /></div>
              </div>
            </Card>
          )}
          {myLoans.length === 0 ? <Card className="u-pad"><Empty icon="bookOpen" title="No active loans" sub="Books you borrow appear here with their due dates." /></Card> : (
            <Card>
              <div className="u-list" style={{ padding: "2px 0" }}>
                {myLoans.map((l, i) => (
                  <div key={l.id} className="u-row u-wrap" style={{ gap: 13, padding: "14px 18px", borderTop: i ? "1px solid var(--border)" : 0, justifyContent: "space-between" }}>
                    <div className="u-row" style={{ gap: 13, minWidth: 0 }}>
                      <span className="u-icon u-icon--plain" style={{ width: 38, height: 46, borderRadius: 5 }}><Icon name="bookOpen" size={17} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{l.title}</div>
                        <div className="u-meta">{l.author}</div>
                        <div className="u-row u-wrap" style={{ gap: 6, marginTop: 5 }}>
                          <Tag variant={l.overdue ? "danger" : "accent"} dot>{l.overdue ? "Overdue" : "Due " + l.due}</Tag>
                          {l.renewed && <Tag>Renewed</Tag>}
                          <span className="u-meta">Borrowed {l.borrowed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="u-row" style={{ gap: 8 }}>
                      {!l.overdue && !l.renewed && <Btn variant="secondary" size="sm" onClick={() => actions.renewLoan(l.id)}>Renew</Btn>}
                      <Btn variant="ghost" size="sm" onClick={() => actions.returnBook(l.id)}>Return</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "reservations" && (
        <Card className="u-pad">
          {myReservations.length === 0 ? <Empty icon="clock" title="No reservations" sub="Reserve a book that's fully on loan and we'll hold it for you when a copy returns." /> : (
            <div className="u-list">
              {myReservations.map((r, i) => (
                <div key={r.bookId} className="u-row" style={{ gap: 13, padding: "13px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <span className="u-icon u-icon--plain"><Icon name="clock" size={15} /></span>
                  <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.title}</div><div className="u-meta">{r.author}</div></div>
                  <Tag variant="warning" dot>In queue</Tag>
                  <ConfirmButton size="sm" title="Cancel this reservation?" body={"You'll lose your place in the queue for “" + r.title + "”."} onConfirm={() => actions.cancelReservation(r.bookId)}>Cancel</ConfirmButton>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "elib" && (
        <div className="u-grid u-grid--2">
          {ERESOURCES.map((e) => (
            <Card key={e.name} className="u-pad u-row" style={{ gap: 13, alignItems: "flex-start" }}>
              <span className="u-icon"><Icon name={e.icon} size={16} /></span>
              <div className="u-grow">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                <div className="u-meta" style={{ marginTop: 2 }}>{e.provider}</div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.45 }}>{e.desc}</div>
                <a className="fb-link u-row" style={{ gap: 5, marginTop: 10, fontSize: 13 }}>Access via campus login <Icon name="arrowRight" size={13} /></a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FinePayButton({ actions, amount }: { actions: Actions; amount: number }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Btn variant="accent" icon="wallet" onClick={() => setOpen(true)}>Pay fine</Btn>
      {open && <PayModal title="Pay library fine" sub={fmt(amount) + " · overdue charges"} amount={amount}
        onClose={() => setOpen(false)} onPaid={() => { actions.payLibraryFine(); setOpen(false); }} />}
    </>
  );
}

/* ============ CLINIC (student) ============ */
export interface ClinicProps {
  store: Store;
  actions: Actions;
}

type ClinicTab = "overview" | "book" | "appts" | "records";

export function Clinic({ store, actions }: ClinicProps) {
  const [tab, setTab] = React.useState<ClinicTab>("overview");
  const appts = [...MY_APPOINTMENTS, ...((store.campus && store.campus.appointments) || [])]
    .filter((a) => !((store.campus && store.campus.cancelled) || {})[a.id]);

  const tabs: { value: ClinicTab; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "book", label: "Book Appointment" },
    { value: "appts", label: "Appointments" + (appts.length ? " · " + appts.length : "") },
    { value: "records", label: "Records" },
  ];

  const healthCard: [string, string][] = [
    ["Height", MEDICAL.height], ["Weight", MEDICAL.weight], ["Known allergies", MEDICAL.allergies],
    ["Next of kin", MEDICAL.emergencyName], ["Emergency phone", MEDICAL.emergencyPhone],
  ];

  return (
    <div className="u-content">
      <PageHead title="Health Centre" sub="Book appointments, view your medical record and prescriptions">
        <Seg value={tab} onChange={setTab} options={tabs} />
      </PageHead>

      {tab === "overview" && (
        <div className="u-stack" style={{ gap: 16 }}>
          <div className="u-grid u-grid--4">
            <Card className="u-pad"><Stat icon="heart" k="Blood group" v={MEDICAL.bloodGroup} accent /></Card>
            <Card className="u-pad"><Stat icon="heart" k="Genotype" v={MEDICAL.genotype} /></Card>
            <Card className="u-pad"><Stat icon="shield" k="NHIS cover" v={MEDICAL.nhis} sub="Student health insurance" /></Card>
            <Card className="u-pad"><Stat icon="clock" k="Last visit" v={MEDICAL.lastVisit} /></Card>
          </div>
          <div className="u-cols u-cols--main">
            <Card className="u-pad">
              <div className="u-h3" style={{ marginBottom: 12 }}>Health card</div>
              {healthCard.map(([k, v]) => (
                <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">{k}</span><span className="v">{v}</span></div>
              ))}
            </Card>
            <Card className="u-pad">
              <div className="u-h3" style={{ marginBottom: 10 }}>Need to see a doctor?</div>
              <div className="u-muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>Book an appointment at the campus medical centre: no queuing required.</div>
              <Btn variant="accent" icon="heart" style={{ width: "100%" }} onClick={() => setTab("book")}>Book appointment</Btn>
              <div className="u-meta" style={{ marginTop: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <strong style={{ color: "var(--danger)" }}>Emergency?</strong> Call the clinic directly on <strong>+234 800 FUTECH MED</strong> or go to the Medical Centre (open 24/7).
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "book" && <ClinicBooking actions={actions} onDone={() => setTab("appts")} />}

      {tab === "appts" && (
        <Card className="u-pad">
          {appts.length === 0 ? <Empty icon="heart" title="No appointments" sub="Book an appointment and it will appear here." /> : (
            <div className="u-stack" style={{ gap: 8 }}>
              {appts.map((a) => (
                <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "13px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                  <div className="u-row" style={{ gap: 12, minWidth: 0 }}>
                    <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.service}</div><div className="u-meta">{a.date} · {a.time}{a.doctor ? " · " + a.doctor : ""}</div></div>
                  </div>
                  <div className="u-row" style={{ gap: 8 }}>
                    <SPill s={a.status} />
                    {a.status !== "completed" && <ConfirmButton size="sm" title="Cancel this appointment?" body={a.service + " on " + a.date + " at " + a.time + " will be cancelled."} onConfirm={() => actions.cancelAppointment(a.id)}>Cancel</ConfirmButton>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "records" && (
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 10 }}>Prescriptions</div>
            <div className="u-list">
              {PRESCRIPTIONS.map((p, i) => (
                <div key={i} className="u-row" style={{ gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <span className="u-icon u-icon--plain"><Icon name="pill" size={15} /></span>
                  <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.drug}</div><div className="u-meta">{p.dosage}</div></div>
                  <div className="u-meta" style={{ textAlign: "right" }}>{p.date}<br />{p.doctor}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 10 }}>Laboratory results</div>
            <div className="u-table-scroll">
              <table className="u-table">
                <thead><tr><th>Date</th><th>Test</th><th>Result</th><th>Status</th></tr></thead>
                <tbody>{LABS.map((l, i) => (<tr key={i}><td style={{ whiteSpace: "nowrap" }}>{l.date}</td><td>{l.test}</td><td className="u-num">{l.result}</td><td><Tag variant="success" dot>{l.status}</Tag></td></tr>))}</tbody>
              </table>
            </div>
          </Card>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 10 }}>Visit history</div>
            <div className="u-list">
              {VISITS.map((v, i) => (
                <div key={i} className="u-row" style={{ gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <span className="u-icon u-icon--plain"><Icon name="stethoscope" size={15} /></span>
                  <div className="u-grow"><div style={{ fontWeight: 500, fontSize: 13.5 }}>{v.service}</div><div className="u-meta" style={{ marginTop: 2 }}>{v.notes}</div></div>
                  <div className="u-meta" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{v.date}<br />{v.doctor}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ClinicBookingProps {
  actions: Actions;
  onDone: () => void;
}

function ClinicBooking({ actions, onDone }: ClinicBookingProps) {
  const [svc, setSvc] = React.useState<ClinicService | null>(null);
  const [day, setDay] = React.useState<string | null>(null);
  const [slot, setSlot] = React.useState<string | null>(null);
  const days = nextDays(6);
  const ready = svc && day && slot;

  return (
    <div className="u-stack" style={{ gap: 16 }}>
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>1 · Choose a service</div>
        <div className="u-grid u-grid--3">
          {SERVICES.map((s) => (
            <button key={s.id} className="u-tile" data-on={svc?.id === s.id}
              style={{ borderColor: svc?.id === s.id ? "var(--accent)" : undefined, boxShadow: svc?.id === s.id ? "var(--ring)" : undefined }}
              onClick={() => setSvc(s)}>
              <span className="u-icon"><Icon name={s.icon} size={16} /></span>
              <div><div className="u-tile__t">{s.name}</div><div className="u-tile__d">{s.desc}</div></div>
            </button>
          ))}
        </div>
      </Card>

      {svc && (
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>2 · Pick a date</div>
          <div className="u-row u-wrap" style={{ gap: 8, marginBottom: 18 }}>
            {days.map((d: DayOption) => (
              <button key={d.key} className="fb-btn" data-on={day === d.key}
                style={{ borderColor: day === d.key ? "var(--accent)" : "var(--border)", background: day === d.key ? "var(--accent-soft)" : "var(--bg-elev)", color: day === d.key ? "var(--accent-soft-fg)" : "inherit" }}
                onClick={() => setDay(d.key)}>{d.label}</button>
            ))}
          </div>
          <div className="u-h3" style={{ marginBottom: 12 }}>3 · Pick a time</div>
          <div className="u-row u-wrap" style={{ gap: 8 }}>
            {SLOTS.map((t) => (
              <button key={t} className="fb-btn" data-on={slot === t}
                style={{ minWidth: 64, borderColor: slot === t ? "var(--accent)" : "var(--border)", background: slot === t ? "var(--accent-soft)" : "var(--bg-elev)", color: slot === t ? "var(--accent-soft-fg)" : "inherit" }}
                onClick={() => setSlot(t)}>{t}</button>
            ))}
          </div>
        </Card>
      )}

      <div className="u-row" style={{ justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="accent" size="lg" icon="check" disabled={!ready}
          onClick={() => { const d = days.find((x) => x.key === day); if (svc && d && slot) actions.bookAppointment({ id: "AP" + Date.now(), service: svc.name, date: d.label, time: slot, status: "pending" }); onDone(); }}>
          Confirm booking
        </Btn>
      </div>
    </div>
  );
}
