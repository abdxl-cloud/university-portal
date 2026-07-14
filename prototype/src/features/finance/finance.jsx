import React from "react";
const { Btn, Card, Icon, Modal, ModalHead, PageHead, SkeletonBlock, Stat, Tag, useSkeleton } = window;
/* Finance hub: payments, services, history. Reusable PayModal. */

/* Reusable payment modal */
function PayModal({ title, sub, amount, onClose, onPaid }) {
  const { fmt } = window.DATA;
  const [method, setMethod] = React.useState("card");
  const [processing, setProcessing] = React.useState(false);
  const pay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onPaid(method); }, 1200);
  };
  return (
    <Modal onClose={() => !processing && onClose()}>
      <ModalHead title={title} sub={sub} onClose={() => !processing && onClose()} />
      <div className="u-pad u-stack" style={{ gap: 16 }}>
        <div className="u-stack" style={{ gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Payment method</span>
          {[["card", "wallet", "Debit / Credit card"], ["transfer", "building", "Bank transfer"], ["ussd", "phone", "USSD"]].map(([v, ic, lb]) => (
            <button key={v} className="u-row" onClick={() => setMethod(v)}
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
          {processing ? "Processing…" : "Pay " + fmt(amount)}
        </Btn>
        <div className="u-meta" style={{ textAlign: "center" }}>This is a demo: no real payment is made.</div>
      </div>
    </Modal>
  );
}

/* Build the unified payment ledger from store + history */
function ledger(store) {
  const { FEES, PAYMENT_HISTORY, fmt } = window.DATA;
  const total = window.totalFees();
  const rows = [];
  if (store.feesPaid && store.feesReceipt) {
    rows.push({ id: "fees-cur", label: "School Fees", amount: total, ref: store.feesReceipt.ref,
      date: store.feesReceipt.date, method: store.feesReceipt.method, category: "Obligatory", session: FEES.session });
  }
  if (store.hostel && store.hostel.status === "allocated") {
    rows.push({ id: "hostel-cur", label: "Hostel Fee: " + store.hostel.hostelName, amount: store.hostel.price,
      ref: store.hostel.ref, date: store.hostel.date || "This session", method: store.hostel.method || "Card", category: "Accommodation", session: FEES.session });
  }
  (store.payments || []).forEach((p) => rows.push({ ...p, session: FEES.session }));
  return rows.concat(PAYMENT_HISTORY);
}

function chargeStatus(charge, store) {
  if (!charge.once) return { paid: false, count: (store.payments || []).filter((p) => p.chargeId === charge.id).length };
  return { paid: (store.payments || []).some((p) => p.chargeId === charge.id) };
}

function Finance({ store, actions, go }) {
  const { FEES, CHARGES, STUDENT, fmt } = window.DATA;
  const [payFor, setPayFor] = React.useState(null);
  const loadingHistory = useSkeleton();
  const feesTotal = window.totalFees();

  const all = ledger(store);
  const paidThisSession = all.filter((r) => r.session === FEES.session).reduce((s, r) => s + r.amount, 0);
  const paidTotal = all.reduce((s, r) => s + r.amount, 0);

  // outstanding obligatory charges
  const outstanding = [];
  if (!store.feesPaid) outstanding.push({ id: "fees", label: "School Fees", sub: FEES.session + " · Invoice " + FEES.invoiceNo, amount: feesTotal, due: FEES.dueDate, to: "fees" });
  if (store.feesPaid && (!store.hostel || store.hostel.status !== "allocated"))
    outstanding.push({ id: "hostel", label: "Hostel Accommodation", sub: "Optional · bed space for the session", amount: null, to: "hostel", optional: true });

  const groups = ["Academic", "Penalties", "Documents"];

  const confirmCharge = (method) => {
    actions.payCharge({ chargeId: payFor.id, label: payFor.label, amount: payFor.amount, method:
      { card: "Debit card", transfer: "Bank transfer", ussd: "USSD" }[method] || "Card", category: payFor.group });
    setPayFor(null);
  };

  return (
    <div className="u-content">
      <PageHead title="Finance" sub={"All your university payments \u00b7 " + STUDENT.session}>
        <Btn variant="secondary" icon="doc" onClick={() => go("fees")}>School fees invoice</Btn>
      </PageHead>

      {/* overview */}
      <div className="u-grid u-grid--3" style={{ marginBottom: 16 }}>
        <Card className="u-pad"><Stat icon="wallet" k="Paid this session" v={fmt(paidThisSession)} sub={FEES.session} accent /></Card>
        <Card className="u-pad">
          <div className="u-stat">
            <div className="u-stat__k">Outstanding</div>
            <div className="u-stat__v u-num">{store.feesPaid ? fmt(0) : fmt(feesTotal)}</div>
            <div className="u-stat__sub">{store.feesPaid ? "School fees cleared" : "School fees due " + FEES.dueDate}</div>
          </div>
        </Card>
        <Card className="u-pad"><Stat icon="chart" k="Lifetime paid" v={fmt(paidTotal)} sub="Across all sessions" /></Card>
      </div>

      {/* outstanding / required */}
      {outstanding.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="u-h3" style={{ marginBottom: 10 }}>Requires your attention</div>
          <div className="u-stack" style={{ gap: 10 }}>
            {outstanding.map((o) => (
              <Card key={o.id} className="u-pad">
                <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
                  <div className="u-row" style={{ gap: 12, minWidth: 0 }}>
                    <span className="u-icon" style={{ background: o.optional ? "var(--accent-soft)" : "var(--danger-soft)", color: o.optional ? "var(--accent-soft-fg)" : "var(--danger)" }}><Icon name={o.id === "hostel" ? "bed" : "wallet"} size={16} /></span>
                    <div style={{ minWidth: 0 }}>
                      <div className="u-row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>{o.optional ? <Tag>Optional</Tag> : <Tag variant="danger" dot>Due</Tag>}</div>
                      <div className="u-meta" style={{ marginTop: 2 }}>{o.sub}</div>
                    </div>
                  </div>
                  <div className="u-row" style={{ gap: 14 }}>
                    {o.amount != null && <div className="u-num" style={{ fontWeight: 700, fontSize: 16 }}>{fmt(o.amount)}</div>}
                    <Btn variant={o.optional ? "secondary" : "accent"} iconRight="arrowRight" onClick={() => go(o.to)}>{o.optional ? "View" : "Pay now"}</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* services catalog */}
      <div style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 4 }}>Other payments & services</div>
        <div className="u-meta" style={{ marginBottom: 12 }}>Pay for documents, levies and services on demand. Receipts are saved to your history.</div>
        {groups.map((g) => {
          const items = CHARGES.filter((c) => c.group === g);
          if (!items.length) return null;
          return (
            <div key={g} style={{ marginBottom: 14 }}>
              <div className="u-meta" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{g}</div>
              <div className="u-grid u-grid--3">
                {items.map((c) => {
                  const st = chargeStatus(c, store);
                  return (
                    <Card key={c.id} className="u-pad u-stack" style={{ gap: 10 }}>
                      <div className="u-row" style={{ justifyContent: "space-between" }}>
                        <span className="u-icon"><Icon name={c.icon} size={16} /></span>
                        {st.paid ? <Tag variant="success" dot>Paid</Tag> : c.once ? <Tag>One-time</Tag> : st.count > 0 ? <Tag>{"\u00d7" + st.count} paid</Tag> : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                        <div className="u-meta" style={{ marginTop: 3, lineHeight: 1.45 }}>{c.desc}</div>
                      </div>
                      <div className="u-row" style={{ justifyContent: "space-between", marginTop: "auto", paddingTop: 4 }}>
                        <span className="u-num" style={{ fontWeight: 700 }}>{fmt(c.amount)}</span>
                        <Btn variant={st.paid ? "secondary" : "accent"} size="sm" disabled={st.paid} icon={st.paid ? "check" : "wallet"} onClick={() => setPayFor(c)}>
                          {st.paid ? "Paid" : "Pay"}
                        </Btn>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* history */}
      <div className="u-h3" style={{ marginBottom: 10 }}>Payment history</div>
      <Card>
        <div className="u-table-scroll">
          <table className="u-table">
            <thead><tr><th>Date</th><th>Item</th><th>Category</th><th>Reference</th><th>Method</th><th className="u-right">Amount</th></tr></thead>
            <tbody>
              {loadingHistory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={"sk" + i}>
                    <td><SkeletonBlock w={64} /></td>
                    <td><SkeletonBlock w="70%" /></td>
                    <td><SkeletonBlock w={80} /></td>
                    <td><SkeletonBlock w={90} /></td>
                    <td><SkeletonBlock w={70} /></td>
                    <td className="u-right"><SkeletonBlock w={60} /></td>
                  </tr>
                ))
              ) : all.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{r.date}</td>
                  <td><div style={{ fontWeight: 500 }}>{r.label}</div><div className="u-meta">{r.session}</div></td>
                  <td><Tag variant={r.category === "Obligatory" ? "accent" : r.category === "Penalties" ? "warning" : undefined}>{r.category}</Tag></td>
                  <td className="fb-mono u-meta">{r.ref}</td>
                  <td className="u-muted">{r.method}</td>
                  <td className="u-right u-num" style={{ fontWeight: 600 }}>{fmt(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {payFor && (
        <PayModal title={"Pay " + payFor.label} sub={fmt(payFor.amount) + " · " + payFor.group}
          amount={payFor.amount} onClose={() => setPayFor(null)} onPaid={confirmCharge} />
      )}
    </div>
  );
}

Object.assign(window, { Finance, PayModal });
