import React from "react";
const { Avatar, Btn, Card, Empty, Icon, SkeletonBlock, SPill, StatCards, Tag, useSkeleton } = window;
/* Admissions: STAFF (Admissions Officer) screens */

/* read a pool candidate's effective state: live candidate reflects store.admissions.state,
   seed candidates reflect store overrides, else their seed state */
function admPoolState(store, c) {
  const a = store.admissions || {};
  if (c.state === "__live__") return a.state;
  if (a.pool && a.pool[c.id] && a.pool[c.id].state) return a.pool[c.id].state;
  return c.state;
}
function admPoolList(store) {
  const A = window.ADM;
  return A.POOL.map((c) => ({ ...c, _state: admPoolState(store, c), _live: c.state === "__live__" }));
}

function AdmStaffHead(person) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="u-h1">Admissions Office</div>
      <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{person.role} · {new Date().getFullYear()}/{new Date().getFullYear() + 1} admission cycle</div>
    </div>
  );
}

/* ============ DASHBOARD ============ */
function AdmDashboard({ store, actions, go }) {
  const A = window.ADM;
  const RD = window.ROLE_DATA;
  const person = (RD && RD.PEOPLE && RD.PEOPLE.admissions) || { first: "Officer", role: "Admissions Officer", name: "Admissions Officer" };
  const list = admPoolList(store);  const count = (s) => list.filter((c) => c._state === s).length;
  const pending = list.filter((c) => ["submitted", "under_review", "queried"].includes(c._state)).length;
  const admitted = list.filter((c) => ["admitted", "accepted", "clearance_pending", "enrolled"].includes(c._state)).length;
  const loadingQueue = useSkeleton();

  return (
    <div className="u-content">
      {AdmStaffHead(person)}
      <StatCards items={[
        { icon: "doc", k: "Awaiting screening", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("adm-review") },
        { icon: "barcode", k: "JAMB pool", v: list.length, plain: true, onClick: () => go("adm-import") },
        { icon: "cap", k: "Admitted", v: admitted, tone: "success", onClick: () => go("adm-eligibility") },
        { icon: "info", k: "Queried", v: count("queried"), tag: count("queried") ? "Follow up" : "None", tone: count("queried") ? "warning" : "success", onClick: () => go("adm-review") },
      ]} />

      <div className="u-grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card className="u-pad">
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}><div className="u-h3">Screening queue</div><a className="fb-link" onClick={() => go("adm-review")}>Open review</a></div>
          <div className="u-stack" style={{ gap: 8 }}>
            {loadingQueue && Array.from({ length: 3 }).map((_, i) => (
              <div key={"sk" + i} className="u-row" style={{ gap: 11, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <span className="fb-skeleton-shimmer" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--bg-muted)", flexShrink: 0 }} />
                <div className="u-grow" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <SkeletonBlock w="45%" />
                  <SkeletonBlock w="65%" h={11} />
                </div>
              </div>
            ))}
            {!loadingQueue && list.filter((c) => ["submitted", "under_review", "queried"].includes(c._state)).slice(0, 5).map((c) => (
              <div key={c.id} className="u-row u-wrap" style={{ gap: 11, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: "pointer" }} onClick={() => go("adm-review")}>
                <div className="u-row" style={{ gap: 11, minWidth: 0 }}><Avatar initials={c.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={32} /><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}{c._live && <Tag variant="accent" style={{ marginLeft: 6 }}>You</Tag>}</div><div className="u-meta">{A.progById(c.prog).name} · UTME {c.score}</div></div></div>
                <SPill tone={A.STATES[c._state].tone}>{A.STATES[c._state].label}</SPill>
              </div>
            ))}
            {!loadingQueue && pending === 0 && <Empty icon="check" title="Queue is clear" sub="No applications waiting for screening." />}
          </div>
        </Card>

        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Quota at a glance</div>
          <div className="u-stack" style={{ gap: 12 }}>
            {A.PROGRAMMES.slice(0, 4).map((p) => {
              const adm = list.filter((c) => c.prog === p.id && ["admitted", "accepted", "clearance_pending", "enrolled"].includes(c._state)).length;
              const pct = Math.min(100, Math.round((adm / p.quota) * 100));
              return (
                <div key={p.id}>
                  <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</span><span className="u-meta u-num">{adm}/{p.quota}</span></div>
                  <div className="u-bar"><div className="u-bar__fill" style={{ width: pct + "%" }} /></div>
                </div>
              );
            })}
          </div>
          <Btn variant="secondary" size="sm" icon="chart" style={{ marginTop: 14, width: "100%" }} onClick={() => go("adm-quota")}>Full quota tracking</Btn>
        </Card>
      </div>
    </div>
  );
}

/* ============ JAMB IMPORT (preview + validation) ============ */
function AdmImport({ store, actions, go }) {
  const A = window.ADM;
  const [sel, setSel] = React.useState(() => A.IMPORT_BATCH.filter((r) => !r.issues.includes("duplicate")).map((r) => r.jamb));
  const [loading, setLoading] = React.useState(true);
  const [done, setDone] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 900); return () => clearTimeout(t); }, []);

  const already = new Set(store.admissions.imported || []);
  const toggle = (j) => setSel((s) => s.includes(j) ? s.filter((x) => x !== j) : [...s, j]);
  const blocking = (r) => r.issues.includes("duplicate");
  const importable = sel.filter((j) => { const r = A.IMPORT_BATCH.find((x) => x.jamb === j); return r && !blocking(r); });
  const runImport = () => { actions.admImport(importable); setDone(true); };

  return (
    <div className="u-content">
      <div className="u-page-head">
        <div><div className="u-h1">JAMB Candidate Import</div><div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>Preview and validate the JAMB batch before importing</div></div>
        {!done && <Btn variant="accent" icon="download" disabled={loading || importable.length === 0} onClick={runImport}>Import {importable.length} candidate{importable.length === 1 ? "" : "s"}</Btn>}
      </div>

      {done && (
        <Card className="u-pad" style={{ marginBottom: 16, background: "var(--success-soft)", borderColor: "transparent" }}>
          <div className="u-row" style={{ gap: 10 }}><Icon name="check" size={16} style={{ color: "var(--success)" }} /><div className="u-grow"><div className="u-h3" style={{ color: "oklch(from var(--success) calc(l - 0.12) c h)" }}>{importable.length} candidate(s) imported</div><div className="u-meta">Imported records appear as drafts. They are <strong>not</strong> enrolled students until they apply, are screened and admitted.</div></div><Btn variant="secondary" size="sm" onClick={() => go("adm-review")}>Go to screening</Btn></div>
        </Card>
      )}

      <Card>
        <div className="u-pad" style={{ paddingBottom: 10 }}>
          <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 8 }}>
            <div className="u-h3">Import preview · {A.IMPORT_BATCH.length} rows</div>
            <div className="u-row" style={{ gap: 8 }}>
              <Tag variant="warning" dot>{A.IMPORT_BATCH.filter((r) => r.issues.length && !r.issues.includes("duplicate")).length} warnings</Tag>
              <Tag variant="danger" dot>{A.IMPORT_BATCH.filter((r) => r.issues.includes("duplicate")).length} blocked</Tag>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="u-pad u-stack" style={{ gap: 10 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="u-skel" style={{ height: 44 }} />)}</div>
        ) : (
          <div className="u-table-scroll">
            <table className="u-table">
              <thead><tr><th style={{ width: 40 }}></th><th>JAMB no.</th><th>Name</th><th>Programme</th><th className="u-right">UTME</th><th>Validation</th></tr></thead>
              <tbody>
                {A.IMPORT_BATCH.map((r) => {
                  const block = blocking(r);
                  const on = sel.includes(r.jamb) && !block;
                  const dup = already.has(r.jamb);
                  return (
                    <tr key={r.jamb} style={{ opacity: block ? 0.6 : 1 }}>
                      <td><button className="fb-check" data-on={on} disabled={block} onClick={() => !block && toggle(r.jamb)} style={{ cursor: block ? "not-allowed" : "pointer" }} /></td>
                      <td className="fb-mono" style={{ fontSize: 12.5 }}>{r.jamb}</td>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
                      <td className="u-muted">{A.progById(r.prog).name}</td>
                      <td className="u-right u-num">{r.score}</td>
                      <td>
                        {r.issues.length === 0 && !dup ? <Tag variant="success" dot>Valid</Tag> : (
                          <div className="u-row u-wrap" style={{ gap: 5 }}>
                            {r.issues.map((iss) => { const m = A.IMPORT_ISSUE_LABELS[iss]; return <Tag key={iss} variant={m.tone}>{m.label}</Tag>; })}
                            {dup && <Tag>Already imported</Tag>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Duplicate records are blocked from import. Below-cutoff candidates can be imported but flagged for change-of-course.</div>
    </div>
  );
}

window.admPoolState = admPoolState;
window.admPoolList = admPoolList;
window.AdmDashboard = AdmDashboard;
window.AdmImport = AdmImport;
