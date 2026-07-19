/* Portal screens: Course Registration + Hostel allocation */
import React from "react";
import { Icon } from "../../components/icons";
import { Btn, Card, Modal, ModalHead, PageHead, Seg, Steps, Tag } from "../../components/ui";
import { Ref, printRegion } from "../../components/detail";
import { COURSES, HOSTELS, STUDENT, courseName, fmt, passedCourses } from "../../data/student-data";
import type { Bed, Block, Course, Hostel as HostelHall, Room } from "../../data/student-data";
import type { Store } from "../../store/types";
import type { Actions } from "../../store/store";

interface LockedGateProps {
  title: string;
  sub: string;
  go: (route: string) => void;
}

function LockedGate({ title, sub, go }: LockedGateProps) {
  return (
    <Card className="u-pad" style={{ textAlign: "center" }}>
      <div className="u-stack" style={{ alignItems: "center", gap: 12, padding: "32px 20px" }}>
        <span className="u-icon" style={{ width: 48, height: 48, background: "var(--warning-soft)", color: "oklch(from var(--warning) calc(l - 0.18) c h)" }}><Icon name="lock" size={22} /></span>
        <div className="u-h2">{title}</div>
        <div className="u-muted" style={{ maxWidth: 380, fontSize: 14 }}>{sub}</div>
        <Btn variant="accent" icon="wallet" onClick={() => go("fees")} style={{ marginTop: 6 }}>Pay school fees</Btn>
      </div>
    </Card>
  );
}

/* ============ COURSE REGISTRATION ============ */
const MIN_UNITS = 15, MAX_UNITS = 24;

export interface RegistrationProps {
  store: Store;
  actions: Actions;
  go: (route: string) => void;
}

export function Registration({ store, actions, go }: RegistrationProps) {
  const passed = passedCourses();
  const unmetOf = (c: Course) => (c.prereq || []).filter((p) => !passed.has(p));
  const isPrereqLocked = (c: Course) => !c.carryover && unmetOf(c).length > 0;
  const initial = COURSES.filter((c) => (c.carryover || c.type === "Core") && !isPrereqLocked(c)).map((c) => c.code);
  const [sel, setSel] = React.useState<string[]>(store.registration.courses.length ? store.registration.courses : initial);
  const status = store.registration.status;
  const se = store.session || {};
  const regOpen = se.registration !== false;

  // registration window closed (and nothing submitted yet) — hard gate
  if (!regOpen && (status === "none" || !status)) {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Course Registration" sub={(se.current || "2025/2026") + " · " + (se.semester || "First Semester")} />
        <Card className="u-pad" style={{ textAlign: "center" }}>
          <div className="u-stack" style={{ alignItems: "center", gap: 12, padding: "32px 20px" }}>
            <span className="u-icon" style={{ width: 48, height: 48, background: "var(--bg-muted)", color: "var(--fg-muted)" }}><Icon name="clock" size={22} /></span>
            <div className="u-h2">Registration is closed</div>
            <div className="u-muted" style={{ maxWidth: 400, fontSize: 14 }}>The course registration window for this semester is not open. You'll be able to register once the registry opens it. Check the academic calendar or announcements for dates.</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!store.feesPaid) {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Course Registration" sub="2025/2026 · First Semester" />
        <LockedGate title="Pay your school fees first" sub="Course registration is locked until your school fees for this session are confirmed." go={go} />
      </div>
    );
  }

  const toggle = (c: Course) => {
    if (c.carryover) return; // mandatory
    if (isPrereqLocked(c)) return; // prerequisites not met
    setSel((s) => s.includes(c.code) ? s.filter((x) => x !== c.code) : [...s, c.code]);
  };
  const selected = COURSES.filter((c) => sel.includes(c.code));
  const units = selected.reduce((s, c) => s + c.units, 0);
  const overUnder = units < MIN_UNITS ? "under" : units > MAX_UNITS ? "over" : "ok";
  const locked = status === "pending" || status === "approved";

  const pct = Math.min(100, (units / MAX_UNITS) * 100);

  return (
    <div className="u-content">
      <PageHead title="Course Registration" sub="2025/2026 · First Semester · 300 Level">
        {status === "approved" && <Btn variant="secondary" icon="print">Print course form</Btn>}
      </PageHead>

      {status === "pending" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--warning)", background: "var(--warning-soft)" }}>
          <div className="u-row" style={{ gap: 12 }}>
            <span className="u-icon" style={{ background: "transparent", color: "oklch(from var(--warning) calc(l - 0.2) c h)" }}><Icon name="clock" size={18} /></span>
            <div className="u-grow">
              <div className="u-h3" style={{ color: "oklch(from var(--warning) calc(l - 0.3) c h)" }}>Awaiting level adviser approval</div>
              <div style={{ fontSize: 13, color: "oklch(from var(--warning) calc(l - 0.25) c h)" }}>Submitted to Dr. C. Madu (300L adviser). You'll be notified once reviewed.</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={actions.approveRegistration}>▶ Simulate approval</Btn>
          </div>
        </Card>
      )}

      {status === "approved" && (
        <Card className="u-pad" style={{ marginBottom: 16, borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
          <div className="u-row" style={{ gap: 12 }}>
            <span className="u-icon"><Icon name="check" size={18} /></span>
            <div className="u-grow">
              <div className="u-h3" style={{ color: "var(--accent-soft-fg)" }}>Registration approved</div>
              <div style={{ fontSize: 13, color: "var(--accent-soft-fg)" }}>Approved by Dr. C. Madu · {store.registration.units} units. Your course form is ready to print.</div>
            </div>
          </div>
        </Card>
      )}

      <div className="u-cols u-cols--main">
        {/* course picker */}
        <Card>
          <div className="u-pad" style={{ paddingBottom: 12 }}>
            <div className="u-h3">Available courses</div>
            <div className="u-meta" style={{ marginTop: 2 }}>Core courses & carryovers are required. Add electives up to {MAX_UNITS} units.</div>
          </div>
          <div className="u-list" style={{ padding: "0 8px 8px" }}>
            {COURSES.map((c) => {
              const on = sel.includes(c.code);
              const unmet = unmetOf(c);
              const plocked = isPrereqLocked(c);
              const rowDisabled = locked || plocked;
              return (
                <button key={c.code} className="u-row" disabled={rowDisabled} onClick={() => toggle(c)}
                  style={{ gap: 12, padding: "12px 14px", border: 0, borderTop: "1px solid var(--border)", background: on ? "var(--bg-sunken)" : "transparent", color: "inherit", cursor: rowDisabled || c.carryover ? "default" : "pointer", textAlign: "left", width: "100%", opacity: (locked && !on) || plocked ? 0.6 : 1 }}>
                  {plocked
                    ? <span style={{ flexShrink: 0, color: "var(--fg-subtle)" }}><Icon name="lock" size={16} /></span>
                    : <span className="fb-check" data-on={on} style={{ opacity: c.carryover ? 0.7 : 1 }} />}
                  <div className="u-grow">
                    <div className="u-row" style={{ gap: 8 }}>
                      <Ref type="course" k={c.code} mono strong>{c.code}</Ref>
                      {c.type === "Carryover" && <Tag variant="danger">Carryover</Tag>}
                      {c.type === "Elective" && <Tag>Elective</Tag>}
                      {c.type === "GST" && <Tag>GST</Tag>}
                      {plocked && <Tag variant="danger">Locked</Tag>}
                    </div>
                    <div style={{ fontSize: 13.5, marginTop: 2 }}>{c.title}</div>
                    <div className="u-meta" style={{ marginTop: 1 }}><Ref type="lecturer" k={c.lecturer} /></div>
                    {c.prereq && c.prereq.length > 0 && (
                      <div className="u-meta" style={{ marginTop: 5 }}>
                        Prereq:{" "}
                        {c.prereq.map((p, i) => {
                          const ok = passed.has(p);
                          return (
                            <React.Fragment key={p}>
                              {i > 0 && ", "}
                              <span style={{ color: ok ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                                {ok ? "✓ " : "✗ "}<span className="fb-mono">{p}</span>
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                    {plocked && (
                      <div className="u-meta" style={{ marginTop: 3, color: "var(--danger)" }}>
                        Pass {unmet.map((p) => courseName(p)).join(", ")} to unlock this course.
                      </div>
                    )}
                  </div>
                  <div className="u-meta u-num" style={{ whiteSpace: "nowrap" }}>{c.units} units</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* summary */}
        <Card className="u-pad u-sticky">
          <div className="u-h3">Registration summary</div>
          <div className="u-row" style={{ justifyContent: "space-between", marginTop: 14, alignItems: "flex-end" }}>
            <div>
              <div className="u-stat__v u-num">{units}<span style={{ fontSize: 14, color: "var(--fg-subtle)", fontWeight: 400 }}> / {MAX_UNITS} units</span></div>
              <div className="u-meta">{selected.length} courses selected</div>
            </div>
            <Tag variant={overUnder === "ok" ? "success" : "warning"} dot>{overUnder === "ok" ? "Valid load" : overUnder === "under" ? "Below min" : "Over max"}</Tag>
          </div>
          <div className="u-bar" style={{ marginTop: 12 }}>
            <div className="u-bar__fill" style={{ width: pct + "%", background: overUnder === "ok" ? "var(--accent)" : "var(--warning)" }} />
          </div>
          <div className="u-meta" style={{ marginTop: 8 }}>Minimum {MIN_UNITS} · Maximum {MAX_UNITS} units per semester.</div>

          <div className="fb-divider" style={{ margin: "16px 0" }} />

          {!locked ? (
            <Btn variant="accent" size="lg" disabled={overUnder !== "ok"} style={{ width: "100%" }}
              onClick={() => actions.submitRegistration(sel, units)}>
              Submit for approval
            </Btn>
          ) : (
            <Btn variant="secondary" size="lg" disabled style={{ width: "100%" }}>
              {status === "approved" ? "Registration approved ✓" : "Submitted — pending"}
            </Btn>
          )}
          {overUnder !== "ok" && !locked && (
            <div className="u-meta" style={{ marginTop: 8, color: "var(--danger)" }}>
              {overUnder === "under" ? "Add more courses to reach the minimum load." : "Remove electives to stay within the limit."}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============ HOSTEL ALLOCATION ============ */
export interface HostelProps {
  store: Store;
  actions: Actions;
  go: (route: string) => void;
}

export function Hostel({ store, actions, go }: HostelProps) {
  const [step, setStep] = React.useState(0);
  const [hostel, setHostel] = React.useState<HostelHall | null>(null);
  const [block, setBlock] = React.useState<Block | null>(null);
  const [room, setRoom] = React.useState<Room | null>(null);
  const [bed, setBed] = React.useState<Bed | null>(null);
  const [payOpen, setPayOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  const labels = ["Eligibility", "Choose room", "Select bed", "Payment"];
  const se = store.session || {};

  // hostel application window closed (and not yet allocated)
  if (se.hostel === false && store.hostel.status !== "allocated") {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Hostel Accommodation" sub={se.current || "2025/2026"} />
        <Card className="u-pad" style={{ textAlign: "center" }}>
          <div className="u-stack" style={{ alignItems: "center", gap: 12, padding: "32px 20px" }}>
            <span className="u-icon" style={{ width: 48, height: 48, background: "var(--bg-muted)", color: "var(--fg-muted)" }}><Icon name="clock" size={22} /></span>
            <div className="u-h2">Hostel applications are closed</div>
            <div className="u-muted" style={{ maxWidth: 400, fontSize: 14 }}>The accommodation window is not currently open. Watch announcements for when bed-space allocation reopens.</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!store.feesPaid) {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Hostel Accommodation" sub="2025/2026 · Female halls" />
        <LockedGate title="Pay your school fees first" sub="Only students who have paid their school fees for the session are eligible to apply for hostel accommodation." go={go} />
      </div>
    );
  }

  // already allocated
  if (store.hostel.status === "allocated") {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Hostel Accommodation" sub="2025/2026">
          <Btn variant="secondary" icon="print" onClick={printRegion}>Print allocation slip</Btn>
        </PageHead>
        <AllocationSlip store={store} />
      </div>
    );
  }

  const eligibleHostels = HOSTELS.filter((h) => h.gender === STUDENT.gender);

  const confirmPay = () => {
    if (!hostel || !block || !room || !bed) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPayOpen(false);
      actions.allocateHostel({
        hostelName: hostel.name, block: block.id, room: room.number,
        bedLabel: bed.label, price: hostel.pricePerBed,
      });
    }, 1300);
  };

  return (
    <div className="u-content">
      <PageHead title="Hostel Accommodation" sub="2025/2026 · Bed space allocation" />

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <Steps current={step} labels={labels} />
      </Card>

      {/* STEP 0 — eligibility / choose hall */}
      {step === 0 && (
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad" style={{ background: "var(--success-soft)", borderColor: "transparent" }}>
            <div className="u-row" style={{ gap: 12 }}>
              <span className="u-icon" style={{ background: "transparent", color: "var(--success)" }}><Icon name="shield" size={18} /></span>
              <div className="u-grow">
                <div className="u-h3" style={{ color: "var(--success)" }}>You are eligible</div>
                <div style={{ fontSize: 13, color: "oklch(from var(--success) calc(l - 0.15) c h)" }}>School fees confirmed · {STUDENT.gender} · {STUDENT.level}. Choose an available hall to continue.</div>
              </div>
            </div>
          </Card>

          <div className="u-grid u-grid--2">
            {eligibleHostels.map((h) => {
              const beds = h.blocks.reduce((s, b) => s + b.rooms.reduce((x, r) => x + r.free, 0), 0);
              return (
                <Card key={h.id} className="u-pad" data-on={hostel?.id === h.id}
                  style={{ cursor: "pointer", borderColor: hostel?.id === h.id ? "var(--accent)" : "var(--border)", boxShadow: hostel?.id === h.id ? "var(--ring)" : undefined }}
                  onClick={() => { setHostel(h); setBlock(null); setRoom(null); setBed(null); }}>
                  <div className="u-ph" style={{ height: 120, marginBottom: 14 }}>hall exterior photo</div>
                  <div className="u-row" style={{ justifyContent: "space-between" }}>
                    <div className="u-h3">{h.name}</div>
                    <Tag variant="accent">{h.gender}</Tag>
                  </div>
                  <div className="u-meta" style={{ marginTop: 4 }}>{h.desc}</div>
                  <div className="u-row" style={{ justifyContent: "space-between", marginTop: 14 }}>
                    <span className="u-num" style={{ fontWeight: 600 }}>{fmt(h.pricePerBed)}<span className="u-meta" style={{ fontWeight: 400 }}> / session</span></span>
                    <Tag variant={beds > 0 ? "success" : "danger"} dot>{beds} beds free</Tag>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="u-row" style={{ justifyContent: "flex-end" }}>
            <Btn variant="accent" disabled={!hostel} iconRight="arrowRight" onClick={() => setStep(1)}>Continue</Btn>
          </div>
        </div>
      )}

      {/* STEP 1 — choose block + room */}
      {step === 1 && hostel && (
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div className="u-h3">{hostel.name}</div>
                <div className="u-meta">Select a block, then a room with a free bed space.</div>
              </div>
              <Seg value={block?.id || hostel.blocks[0].id}
                onChange={(id) => { setBlock(hostel.blocks.find((b) => b.id === id) || null); setRoom(null); setBed(null); }}
                options={hostel.blocks.map((b) => ({ value: b.id, label: "Block " + b.id }))} />
            </div>
            <div className="u-rooms">
              {(block || hostel.blocks[0]).rooms.map((r) => {
                const full = r.free === 0;
                const on = room?.number === r.number;
                return (
                  <button key={r.id} className="u-room" data-full={full} data-on={on}
                    onClick={() => { if (!full) { setRoom(r); setBed(null); } }}>
                    <div className="u-row" style={{ justifyContent: "space-between" }}>
                      <span className="u-room__no">{r.number}</span>
                      <Icon name="bed" size={15} style={{ color: "var(--fg-subtle)" }} />
                    </div>
                    <div className="u-meta" style={{ marginTop: 8 }}>{r.capacity}-person room</div>
                    <Tag variant={full ? "danger" : "success"} dot>{full ? "Full" : r.free + " free"}</Tag>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="u-row" style={{ justifyContent: "space-between" }}>
            <Btn variant="ghost" icon="arrowLeft" onClick={() => setStep(0)}>Back</Btn>
            <Btn variant="accent" disabled={!room} iconRight="arrowRight" onClick={() => setStep(2)}>Continue</Btn>
          </div>
        </div>
      )}

      {/* STEP 2 — select bed */}
      {step === 2 && room && hostel && (
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3">Room {room.number} · {hostel.name}</div>
            <div className="u-meta" style={{ marginBottom: 16 }}>Pick an available bed space. Greyed beds are already taken.</div>
            <div className="u-beds" style={{ maxWidth: 420 }}>
              {room.beds.map((b) => {
                const on = bed?.id === b.id;
                return (
                  <button key={b.id} className="u-bed" data-taken={b.taken} data-on={on}
                    onClick={() => { if (!b.taken) setBed(b); }}>
                    <Icon name="bed" size={26} />
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{b.label}</div>
                    <Tag variant={b.taken ? "danger" : on ? "accent" : "success"}>{b.taken ? "Taken" : on ? "Selected" : "Available"}</Tag>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="u-row" style={{ justifyContent: "space-between" }}>
            <Btn variant="ghost" icon="arrowLeft" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="accent" disabled={!bed} iconRight="arrowRight" onClick={() => setStep(3)}>Continue to payment</Btn>
          </div>
        </div>
      )}

      {/* STEP 3 — review + pay */}
      {step === 3 && bed && hostel && room && (
        <div className="u-cols u-cols--aside">
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 8 }}>Confirm your selection</div>
            {([["Hall", hostel.name], ["Block", "Block " + (block || hostel.blocks[0]).id], ["Room", room.number], ["Bed space", bed.label], ["Occupancy", room.capacity + "-person room"]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="k">{k}</span><span className="v">{v}</span>
              </div>
            ))}
            <div className="u-meta" style={{ marginTop: 12 }}>Your bed space is held for 30 minutes while you complete payment.</div>
          </Card>
          <Card className="u-pad u-sticky">
            <div className="u-h3">Hostel fee</div>
            <div className="u-stat__v u-num" style={{ marginTop: 10 }}>{fmt(hostel.pricePerBed)}</div>
            <div className="u-meta">Per bed space · full session</div>
            <Btn variant="accent" size="lg" icon="wallet" style={{ width: "100%", marginTop: 16 }} onClick={() => setPayOpen(true)}>Pay & allocate</Btn>
            <Btn variant="ghost" style={{ width: "100%", marginTop: 6 }} onClick={() => setStep(2)}>Change selection</Btn>
          </Card>
        </div>
      )}

      {payOpen && hostel && room && bed && (
        <Modal onClose={() => !processing && setPayOpen(false)}>
          <ModalHead title="Pay hostel fee" sub={fmt(hostel.pricePerBed) + " · " + room.number + " " + bed.label} onClose={() => !processing && setPayOpen(false)} />
          <div className="u-pad u-stack" style={{ gap: 14 }}>
            <div className="u-ph" style={{ height: 64 }}>FUTECH Pay · card form</div>
            <input className="fb-input" placeholder="Card number" defaultValue="4084 0000 0000 1234" />
            <Btn variant="accent" size="lg" disabled={processing} onClick={confirmPay} style={{ width: "100%" }}>
              {processing ? "Processing…" : "Pay " + fmt(hostel.pricePerBed)}
            </Btn>
            <div className="u-meta" style={{ textAlign: "center" }}>Demo only — no real payment is made.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AllocationSlip({ store }: { store: Store }) {
  const h = store.hostel;
  const left: [string, string][] = [["Student", STUDENT.name], ["Matric no.", STUDENT.matric], ["Session", STUDENT.session], ["Gender", STUDENT.gender]];
  const right: [string, string | undefined][] = [["Hall", h.hostelName], ["Block", "Block " + h.block], ["Room", h.room], ["Bed space", h.bedLabel], ["Reference", h.ref]];
  return (
    <Card className="u-print-area">
      <div className="u-slip__head">
        <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="bed" size={18} /></span>
        <div className="u-grow">
          <div className="u-h3">Bed space allocated</div>
          <div className="u-meta">Present this slip at the hall porter's lodge on resumption.</div>
        </div>
        <span className="u-stamp fb-hide-mobile">Allocated</span>
      </div>
      <div className="u-pad">
        <div className="u-grid u-grid--2" style={{ rowGap: 0, columnGap: 36 }}>
          <div>
            {left.map(([k, v]) => (
              <div key={k} className="u-slip__row"><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
          <div>
            {right.map(([k, v]) => (
              <div key={k} className="u-slip__row"><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="u-slip__row" style={{ borderTop: "1px solid var(--border-strong)", marginTop: 6 }}>
          <span style={{ fontWeight: 600 }}>Hostel fee paid</span>
          <span style={{ fontWeight: 700 }} className="u-num">{fmt(h.price ?? 0)}</span>
        </div>
        <Btn variant="secondary" icon="print" className="u-no-print" style={{ marginTop: 16 }} onClick={printRegion}>Print allocation slip</Btn>
      </div>
    </Card>
  );
}
