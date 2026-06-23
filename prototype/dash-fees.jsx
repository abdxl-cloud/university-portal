/* Portal screens: Dashboard + School Fees */

function PageHead({ title, sub, children }) {
  return (
    <div className="u-page-head">
      <div>
        <div className="u-h1">{title}</div>
        {sub && <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{sub}</div>}
      </div>
      {children && <div className="u-row u-wrap" style={{ gap: 8 }}>{children}</div>}
    </div>
  );
}

function totalFees() {
  return window.DATA.FEES.items.reduce((s, i) => s + i.amount, 0);
}

/* ============ DASHBOARD ============ */
function Dashboard({ store, go }) {
  const { STUDENT, ANNOUNCEMENTS, TIMETABLE, fmt } = window.DATA;
  const today = "Monday";
  const todays = TIMETABLE.lectures.filter((l) => l.day === today)
    .sort((a, b) => TIMETABLE.periods.indexOf(a.start) - TIMETABLE.periods.indexOf(b.start));

  const regStatus = store.registration.status;
  const regLabel = { none: "Not started", pending: "Pending approval", approved: "Approved" }[regStatus];
  const regTone = { none: "neutral", pending: "warning", approved: "success" }[regStatus];

  const pending = (window.pendingAssignments ? window.pendingAssignments(store) : []).slice(0, 3);

  const hostelLabel = store.hostel.status === "allocated"
    ? store.hostel.room + " · " + store.hostel.bedLabel : "Not allocated";

  const cards = [
    { icon: "wallet", k: "School Fees", v: store.feesPaid ? "Paid" : "Outstanding", tag: store.feesPaid ? "Paid" : "Due Oct 31", tone: store.feesPaid ? "success" : "danger", to: "finance" },
    { icon: "book", k: "Course Registration", v: regLabel, tag: regStatus === "approved" ? "Complete" : regStatus === "pending" ? "Awaiting adviser" : "Action needed", tone: regTone, to: "registration" },
    { icon: "bed", k: "Hostel", v: hostelLabel, tag: store.hostel.status === "allocated" ? "Allocated" : "Open", tone: store.hostel.status === "allocated" ? "success" : "accent", to: "hostel" },
    { icon: "chart", k: "Current CGPA", v: STUDENT.cgpa.toFixed(2), tag: STUDENT.standing, tone: "success", to: "results" },
  ];

  return (
    <div className="u-content">
      <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
        <div>
          <div className="u-h1">Good morning, {STUDENT.first} 👋</div>
          <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>
            {STUDENT.session} · {STUDENT.semester} · {STUDENT.level}
          </div>
        </div>
        {!store.feesPaid && <Btn variant="accent" icon="wallet" onClick={() => go("fees")}>Pay school fees</Btn>}
      </div>

      {/* status cards */}
      <div className="u-grid u-grid--4" style={{ marginBottom: 16 }}>
        {cards.map((c) => (
          <Card key={c.k} className="u-pad" style={{ cursor: "pointer" }} onClick={() => go(c.to)}>
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <span className="u-icon"><Icon name={c.icon} size={16} /></span>
              <Tag variant={c.tone} dot>{c.tag}</Tag>
            </div>
            <div className="u-stat__sub">{c.k}</div>
            <div className="u-h2" style={{ marginTop: 2 }}>{c.v}</div>
          </Card>
        ))}
      </div>

      <div className="u-cols u-cols--main">
        {/* left: outstanding + announcements */}
        <div className="u-stack" style={{ gap: 16 }}>
          {!store.feesPaid && (
            <Card className="u-pad">
              <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                <div className="u-h3">Outstanding payment</div>
                <Tag variant="danger" dot>Action required</Tag>
              </div>
              <div className="u-row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div className="u-stat__v u-num">{fmt(totalFees())}</div>
                  <div className="u-meta" style={{ marginTop: 4 }}>{STUDENT.session} school fees · Invoice {window.DATA.FEES.invoiceNo}</div>
                </div>
                <Btn variant="accent" iconRight="arrowRight" onClick={() => go("fees")}>Pay now</Btn>
              </div>
              <div className="u-bar" style={{ marginTop: 16 }}><div className="u-bar__fill" style={{ width: "0%" }} /></div>
              <div className="u-meta" style={{ marginTop: 8 }}>Paying fees unlocks course registration and hostel application.</div>
            </Card>
          )}

          <Card className="u-pad">
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <div className="u-h3">Announcements</div>
              <Tag>{ANNOUNCEMENTS.length} new</Tag>
            </div>
            <div className="u-list">
              {ANNOUNCEMENTS.map((a) => (
                <div key={a.title} className="u-ann">
                  <Tag variant={a.tone === "neutral" ? undefined : a.tone}>{a.tag}</Tag>
                  <div className="u-grow">
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{a.title}</div>
                    <div className="u-meta" style={{ marginTop: 2 }}>{a.body}</div>
                  </div>
                  <div className="u-meta" style={{ whiteSpace: "nowrap" }}>{a.time}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* right: today + quick links */}
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div className="u-h3">Today · {today}</div>
              <a className="fb-link" onClick={() => go("timetable")}>Full timetable</a>
            </div>
            {todays.length === 0 ? <Empty icon="calendar" title="No classes today" /> : (
              <div className="u-stack" style={{ gap: 8 }}>
                {todays.map((l, i) => (
                  <div key={i} className="u-row" style={{ gap: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                    <div className="u-meta fb-mono" style={{ width: 42 }}>{l.start}</div>
                    <div className="u-grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}><Ref type="course" k={l.code} strong>{l.code}</Ref></div>
                      <div className="u-meta"><Ref type="venue" k={l.room}>{l.room}</Ref></div>
                    </div>
                    <Icon name="pin" size={14} style={{ color: "var(--fg-subtle)" }} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {regStatus === "approved" && (
            <Card className="u-pad">
              <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <div className="u-h3">Pending assignments</div>
                <a className="fb-link" onClick={() => go("classes")}>Open classes</a>
              </div>
              {pending.length === 0 ? (
                <div className="u-row" style={{ gap: 10, padding: "6px 2px" }}>
                  <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="check" size={16} /></span>
                  <div className="u-meta">You're all caught up — nothing due.</div>
                </div>
              ) : (
                <div className="u-stack" style={{ gap: 8 }}>
                  {pending.map((a) => (
                    <button key={a.id} className="u-row" onClick={() => go("classes")}
                      style={{ gap: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <span className="u-icon" style={{ background: "var(--warning-soft)", color: "oklch(from var(--warning) calc(l - 0.18) c h)", width: 30, height: 30 }}><Icon name="doc" size={15} /></span>
                      <div className="u-grow" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.title.replace(/^Assignment \d+ — |^Lab \d+ — |^Reading response — /, "")}
                        </div>
                        <div className="u-meta"><span className="fb-mono">{a.code}</span> · {a.points} pts</div>
                      </div>
                      <div className="u-meta" style={{ whiteSpace: "nowrap" }}>Due {a.due.replace(/, \d{4}$/, "")}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Quick actions</div>
            <div className="u-qa">
              {[["wallet", "Pay fees", "fees"], ["book", "Register", "registration"], ["cap", "Classes", "classes"], ["bed", "Apply hostel", "hostel"], ["chart", "Results", "results"], ["help", "Support", "support"]].map(([ic, lb, to]) => (
                <button key={lb} className="fb-btn fb-btn--secondary" style={{ justifyContent: "flex-start", height: 38 }} onClick={() => go(to)}>
                  <Icon name={ic} size={15} /> <span>{lb}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============ SCHOOL FEES ============ */
function Fees({ store, actions, go }) {
  const { FEES, STUDENT, fmt } = window.DATA;
  const [modal, setModal] = React.useState(false);
  const [method, setMethod] = React.useState("card");
  const [processing, setProcessing] = React.useState(false);
  const total = totalFees();

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setModal(false);
      actions.payFees(method);
    }, 1300);
  };

  return (
    <div className="u-content u-content--narrow">
      <PageHead title="School Fees" sub={STUDENT.session + " · " + STUDENT.semester}>
        {store.feesPaid && <Btn variant="secondary" icon="download" onClick={printRegion}>Download / print receipt</Btn>}
      </PageHead>

      {store.feesPaid ? (
        <Card className="u-print-area">
          <div className="u-slip__head">
            <span className="u-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="check" size={18} /></span>
            <div className="u-grow">
              <div className="u-h3">Payment successful</div>
              <div className="u-meta">Your school fees for {STUDENT.session} have been confirmed.</div>
            </div>
            <span className="u-stamp fb-hide-mobile">Paid</span>
          </div>
          <div className="u-pad">
            <Receipt store={store} fmt={fmt} total={total} />
            <div className="u-row u-wrap u-no-print" style={{ gap: 8, marginTop: 18 }}>
              <Btn variant="accent" icon="book" onClick={() => go("registration")}>Continue to course registration</Btn>
              <Btn variant="secondary" icon="print" onClick={printRegion}>Print receipt</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="u-cols u-cols--main">
          <Card>
            <div className="u-pad" style={{ paddingBottom: 6 }}>
              <div className="u-row" style={{ justifyContent: "space-between" }}>
                <div className="u-h3">Invoice breakdown</div>
                <Tag variant="warning" dot>Unpaid</Tag>
              </div>
            </div>
            <div style={{ padding: "0 22px 8px" }}>
              {FEES.items.map((it) => (
                <div key={it.id} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="k">{it.label}</span>
                  <span className="v u-num">{fmt(it.amount)}</span>
                </div>
              ))}
              <div className="u-slip__row" style={{ borderTop: "1px solid var(--border-strong)", marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>Total due</span>
                <span style={{ fontWeight: 700 }} className="u-num">{fmt(total)}</span>
              </div>
            </div>
          </Card>

          <Card className="u-pad">
            <div className="u-h3">Invoice</div>
            <div className="u-slip__row"><span className="k">Invoice no.</span><span className="v fb-mono">{FEES.invoiceNo}</span></div>
            <div className="u-slip__row"><span className="k">Matric no.</span><span className="v fb-mono">{STUDENT.matric}</span></div>
            <div className="u-slip__row"><span className="k">Due date</span><span className="v">{FEES.dueDate}</span></div>
            <Btn variant="accent" size="lg" icon="wallet" style={{ width: "100%", marginTop: 14 }} onClick={() => setModal(true)}>Pay {fmt(total)}</Btn>
            <div className="u-meta" style={{ marginTop: 10, textAlign: "center" }}>Secured by FUTECH Pay · Paystack</div>
          </Card>
        </div>
      )}

      {modal && (
        <Modal onClose={() => !processing && setModal(false)}>
          <ModalHead title="Pay school fees" sub={fmt(total) + " · Invoice " + FEES.invoiceNo} onClose={() => !processing && setModal(false)} />
          <div className="u-pad u-stack" style={{ gap: 16 }}>
            <div className="u-stack" style={{ gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Payment method</span>
              {[["card", "wallet", "Debit / Credit card"], ["transfer", "building", "Bank transfer"], ["ussd", "phone", "USSD"]].map(([v, ic, lb]) => (
                <button key={v} className="u-row" data-on={method === v} onClick={() => setMethod(v)}
                  style={{ gap: 12, padding: "12px 14px", border: "1px solid " + (method === v ? "var(--accent)" : "var(--border)"), borderRadius: "var(--r-md)", background: method === v ? "var(--accent-soft)" : "var(--bg-elev)", color: "inherit", cursor: "pointer", textAlign: "left", boxShadow: method === v ? "var(--ring)" : "none" }}>
                  <Icon name={ic} size={17} style={{ color: method === v ? "var(--accent-soft-fg)" : "var(--fg-muted)" }} />
                  <span className="u-grow" style={{ fontWeight: 500, fontSize: 13.5 }}>{lb}</span>
                  <span className="fb-check" data-on={method === v} />
                </button>
              ))}
            </div>
            {method === "card" && (
              <div className="u-stack" style={{ gap: 10 }}>
                <input className="fb-input" placeholder="Card number" defaultValue="4084 0000 0000 1234" />
                <div className="u-row" style={{ gap: 10 }}>
                  <input className="fb-input" placeholder="MM / YY" defaultValue="09 / 28" />
                  <input className="fb-input" placeholder="CVV" defaultValue="123" />
                </div>
              </div>
            )}
            <Btn variant="accent" size="lg" disabled={processing} onClick={pay} style={{ width: "100%" }}>
              {processing ? "Processing…" : "Pay " + fmt(total)}
            </Btn>
            <div className="u-meta" style={{ textAlign: "center" }}>This is a demo — no real payment is made.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Receipt({ store, fmt, total }) {
  const { FEES, STUDENT } = window.DATA;
  const r = store.feesReceipt || {};
  const rows = [
    ["Student", STUDENT.name], ["Matric no.", STUDENT.matric], ["Session", STUDENT.session],
    ["Invoice no.", FEES.invoiceNo], ["Reference", r.ref], ["Date", r.date], ["Method", r.method],
  ];
  return (
    <div>
      {rows.map(([k, v]) => (
        <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="k">{k}</span><span className="v">{v}</span>
        </div>
      ))}
      <div className="u-slip__row" style={{ borderTop: "1px solid var(--border-strong)" }}>
        <span style={{ fontWeight: 600 }}>Amount paid</span>
        <span style={{ fontWeight: 700 }} className="u-num">{fmt(total)}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, Fees, Receipt, PageHead, totalFees });
