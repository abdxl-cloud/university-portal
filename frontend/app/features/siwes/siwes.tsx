/* Student — SIWES / Industrial Training (400 Level only) */
import React from "react";
import { Icon } from "../../components/icons";
import { Btn, Card, Empty, Field, PageHead, Seg, Tag } from "../../components/ui";
import { PLACEMENT_COORD, SAMPLE_COMPANIES, SIWES_STATES } from "../../data/siwes-data";
import type { Company, SiwesState } from "../../data/siwes-data";
import type { LogEntryStatus, SiwesPlacement as Placement, SiwesStoreState, Store } from "../../store/types";
import type { Actions } from "../../store/store";
import type { TagVariant } from "../../types";

function siwesStatusTag(status: SiwesState) {
  const s = SIWES_STATES[status] || SIWES_STATES.none;
  return <Tag variant={s.tone === "neutral" ? undefined : (s.tone as TagVariant)} dot>{s.label}</Tag>;
}

type SiwesTab = "placement" | "logbook" | "checkin";

export interface SiwesProps {
  store: Store;
  actions: Actions;
}

export function Siwes({ store, actions }: SiwesProps) {
  const w: SiwesStoreState = store.siwes || { status: "none", placement: null, logbook: [], checkins: [] };
  const [tab, setTab] = React.useState<SiwesTab>("placement");

  return (
    <div className="u-content">
      <PageHead title="Industrial Training (SIWES)" sub="Student Industrial Work Experience Scheme">
        {siwesStatusTag(w.status)}
      </PageHead>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <Seg value={tab} onChange={setTab} options={[
          { value: "placement", label: "Placement" },
          { value: "logbook", label: "Logbook" },
          { value: "checkin", label: "Location Check-in" },
        ]} />
      </Card>

      {tab === "placement" && <SiwesPlacementTab actions={actions} w={w} />}
      {tab === "logbook" && <SiwesLogbook actions={actions} w={w} />}
      {tab === "checkin" && <SiwesCheckinTab actions={actions} w={w} />}
    </div>
  );
}

interface TabProps {
  actions: Actions;
  w: SiwesStoreState;
}

/* ---------- PLACEMENT: propose company → dept approval workflow ---------- */
function SiwesPlacementTab({ actions, w }: TabProps) {
  const [form, setForm] = React.useState<Placement>({ company: "", address: "", industry: "", supervisorName: "", supervisorPhone: "", supervisorEmail: "", startDate: "", endDate: "" });
  const set = <K extends keyof Placement>(k: K, v: Placement[K]) => setForm((f) => ({ ...f, [k]: v }));
  const fillSample = (c: Company) => setForm((f) => ({ ...f, company: c.name, address: c.address, industry: c.industry }));

  const canSubmit = form.company.trim() && form.address.trim() && form.supervisorName.trim() && form.startDate && form.endDate;
  const submit = () => actions.siwesPropose({ ...form });

  if (w.status === "none" || w.status === "rejected") {
    return (
      <div className="u-stack" style={{ gap: 16 }}>
        {w.status === "rejected" && (
          <Card className="u-pad" style={{ borderColor: "var(--danger)", background: "var(--danger-soft)" }}>
            <div className="u-h3" style={{ color: "var(--danger)" }}>Your placement proposal was rejected</div>
            <div className="u-meta" style={{ marginTop: 4, color: "oklch(from var(--danger) calc(l - 0.05) c h)" }}>{w.deptNote || "Please propose a different placement."}</div>
          </Card>
        )}
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 4 }}>Propose your IT placement</div>
          <div className="u-meta" style={{ marginBottom: 14 }}>Your department must approve your placement before you can start logging hours.</div>

          <div className="u-meta" style={{ marginBottom: 8 }}>Quick-fill from a sample host company:</div>
          <div className="u-row u-wrap" style={{ gap: 8, marginBottom: 16 }}>
            {SAMPLE_COMPANIES.map((c) => (
              <button key={c.name} className="u-chipbtn" onClick={() => fillSample(c)}>{c.name}</button>
            ))}
          </div>

          <div className="u-grid u-grid--2" style={{ gap: 14 }}>
            <Field label="Company / organisation"><input className="fb-input" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" /></Field>
            <Field label="Industry"><input className="fb-input" value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. Software Engineering" /></Field>
          </div>
          <div style={{ marginTop: 14 }}><Field label="Placement address"><input className="fb-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, city" /></Field></div>
          <div className="u-grid u-grid--2" style={{ gap: 14, marginTop: 14 }}>
            <Field label="Supervisor name"><input className="fb-input" value={form.supervisorName} onChange={(e) => set("supervisorName", e.target.value)} placeholder="Full name" /></Field>
            <Field label="Supervisor phone"><input className="fb-input" value={form.supervisorPhone} onChange={(e) => set("supervisorPhone", e.target.value)} placeholder="+234…" /></Field>
          </div>
          <div style={{ marginTop: 14 }}><Field label="Supervisor email"><input className="fb-input" value={form.supervisorEmail} onChange={(e) => set("supervisorEmail", e.target.value)} placeholder="supervisor@company.com" /></Field></div>
          <div className="u-grid u-grid--2" style={{ gap: 14, marginTop: 14 }}>
            <Field label="Start date"><input className="fb-input" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="End date"><input className="fb-input" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
          </div>
          <Btn variant="accent" size="lg" icon="check" disabled={!canSubmit} style={{ width: "100%", marginTop: 18 }} onClick={submit}>Submit for department approval</Btn>
        </Card>
      </div>
    );
  }

  const p = w.placement;
  const rows: [string, string | undefined][] = [
    ["Company", p?.company], ["Industry", p?.industry], ["Address", p?.address],
    ["Supervisor", p?.supervisorName], ["Supervisor phone", p?.supervisorPhone],
    ["Supervisor email", p?.supervisorEmail], ["Duration", p ? p.startDate + " – " + p.endDate : undefined],
  ];
  return (
    <div className="u-stack" style={{ gap: 16 }}>
      {w.status === "proposed" && (
        <Card className="u-pad" style={{ borderColor: "var(--warning)", background: "var(--warning-soft)" }}>
          <div className="u-row" style={{ gap: 10 }}>
            <Icon name="clock" size={16} style={{ color: "oklch(from var(--warning) calc(l - 0.2) c h)" }} />
            <div className="u-grow">
              <div className="u-h3" style={{ color: "oklch(from var(--warning) calc(l - 0.3) c h)" }}>Awaiting department approval</div>
              <div style={{ fontSize: 13, color: "oklch(from var(--warning) calc(l - 0.25) c h)" }}>The SIWES coordinator will review your placement details.</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={() => actions.siwesDecide(true)}>▶ Simulate approval</Btn>
          </div>
        </Card>
      )}
      {w.status === "approved" && (
        <Card className="u-pad" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
          <div className="u-row" style={{ gap: 10 }}>
            <Icon name="check" size={16} style={{ color: "var(--accent-soft-fg)" }} />
            <div className="u-grow"><div className="u-h3" style={{ color: "var(--accent-soft-fg)" }}>Placement approved</div><div style={{ fontSize: 13, color: "var(--accent-soft-fg)" }}>You may begin your IT and start logging your logbook.</div></div>
            <Btn variant="accent" size="sm" onClick={actions.siwesStart}>Begin IT</Btn>
          </div>
        </Card>
      )}
      {(w.status === "ongoing" || w.status === "completed") && (
        <Card className="u-pad" style={{ background: w.status === "completed" ? "var(--success-soft)" : "var(--accent-soft)", borderColor: "transparent" }}>
          <div className="u-row" style={{ gap: 10, justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 10 }}>
              <Icon name={w.status === "completed" ? "cap" : "clock"} size={16} style={{ color: w.status === "completed" ? "var(--success)" : "var(--accent-soft-fg)" }} />
              <div><div className="u-h3">{w.status === "completed" ? "IT completed" : "IT in progress"}</div><div className="u-meta">{p?.startDate} – {p?.endDate}</div></div>
            </div>
            {w.status === "ongoing" && <Btn variant="secondary" size="sm" onClick={actions.siwesComplete}>Mark completed</Btn>}
          </div>
        </Card>
      )}

      <Card>
        <div className="u-slip__head"><span className="u-icon"><Icon name="building" size={18} /></span><div className="u-grow"><div className="u-h3">Placement details</div></div></div>
        <div className="u-pad">
          {rows.map(([k, v]) => (
            <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">{k}</span><span className="v">{v || "—"}</span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const LOG_STATUS_TONE: Record<LogEntryStatus, TagVariant> = { submitted: "accent", signed: "success", returned: "danger" };

/* ---------- LOGBOOK: weekly/daily entries + supervisor sign-off ---------- */
function SiwesLogbook({ actions, w }: TabProps) {
  const [date, setDate] = React.useState("");
  const [activity, setActivity] = React.useState("");
  const [hours, setHours] = React.useState("6");
  const active = w.status === "ongoing" || w.status === "completed";

  const submit = () => {
    if (!date || !activity.trim()) return;
    actions.siwesAddLog({ date, activity: activity.trim(), hours: Number(hours) || 0 });
    setDate(""); setActivity(""); setHours("6");
  };

  if (!active) {
    return <Card className="u-pad"><Empty icon="doc" title="Logbook locked" sub="Your logbook opens once your placement is approved and IT has begun." /></Card>;
  }

  return (
    <div className="u-grid" style={{ gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start" }}>
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>New entry</div>
        <div className="u-stack" style={{ gap: 12 }}>
          <Field label="Date"><input className="fb-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Hours"><input className="fb-input" type="number" min="1" max="12" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
          <Field label="Activity / task description"><textarea className="fb-textarea" rows={4} value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Describe the work done today…" /></Field>
          <Btn variant="accent" icon="check" disabled={!date || !activity.trim()} onClick={submit}>Submit entry</Btn>
        </div>
      </Card>

      <Card>
        <div className="u-pad" style={{ paddingBottom: 8 }}><div className="u-h3">Logbook entries · {w.logbook.length}</div></div>
        {w.logbook.length === 0 ? <Empty icon="doc" title="No entries yet" sub="Submit your first daily or weekly log." /> : (
          <div className="u-stack" style={{ gap: 0 }}>
            {w.logbook.map((l) => (
              <div key={l.id} className="u-li" style={{ padding: "13px 22px", flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div className="u-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{l.date}</span>
                  <div className="u-row" style={{ gap: 8 }}><span className="u-meta">{l.hours}h</span><Tag variant={LOG_STATUS_TONE[l.status]} dot>{l.status}</Tag></div>
                </div>
                <div style={{ fontSize: 13.5 }}>{l.activity}</div>
                {l.supervisorNote && <div className="u-meta" style={{ fontStyle: "italic" }}>Supervisor: {l.supervisorNote}</div>}
                {l.status === "submitted" && (
                  <div className="u-row" style={{ gap: 6, marginTop: 4 }}>
                    <Btn variant="secondary" size="sm" icon="check" onClick={() => actions.siwesSignLog(l.id, true)}>▶ Simulate supervisor sign-off</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => actions.siwesSignLog(l.id, false, "Please add more detail on tasks performed.")}>▶ Simulate return</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- CHECK-IN: verify student is at the registered placement location ---------- */
function SiwesCheckinTab({ actions, w }: TabProps) {
  const [checking, setChecking] = React.useState(false);
  const active = w.status === "ongoing" || w.status === "completed";

  const doCheckIn = (matched: boolean) => {
    setChecking(true);
    setTimeout(() => { setChecking(false); actions.siwesCheckIn(matched); }, 1100);
  };

  if (!active) {
    return <Card className="u-pad"><Empty icon="pin" title="Check-in locked" sub="Location check-in opens once your IT has begun." /></Card>;
  }

  return (
    <div className="u-grid" style={{ gridTemplateColumns: "1fr 1.2fr", gap: 16, alignItems: "start" }}>
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 4 }}>Check in at your placement</div>
        <div className="u-meta" style={{ marginBottom: 16 }}>We verify your device location against your registered placement address: <strong>{w.placement && w.placement.address}</strong>.</div>
        <div className="u-ph" style={{ height: 140, marginBottom: 16 }}>map preview · {PLACEMENT_COORD.lat.toFixed(4)}, {PLACEMENT_COORD.lng.toFixed(4)}</div>
        <div className="u-row u-wrap" style={{ gap: 8 }}>
          <Btn variant="accent" icon="pin" disabled={checking} onClick={() => doCheckIn(true)}>{checking ? "Locating…" : "Check in now"}</Btn>
          <Btn variant="ghost" size="sm" disabled={checking} onClick={() => doCheckIn(false)}>▶ Simulate off-site attempt</Btn>
        </div>
        <div className="u-meta" style={{ marginTop: 10 }}>Demo only — location is simulated, not read from your device.</div>
      </Card>

      <Card>
        <div className="u-pad" style={{ paddingBottom: 8 }}><div className="u-h3">Check-in history · {w.checkins.length}</div></div>
        {w.checkins.length === 0 ? <Empty icon="pin" title="No check-ins yet" sub="Check in during your IT hours to build an attendance trail." /> : (
          <div className="u-stack" style={{ gap: 0 }}>
            {w.checkins.map((c) => (
              <div key={c.id} className="u-li" style={{ padding: "12px 22px", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 10 }}>
                  <Icon name="pin" size={15} style={{ color: c.matched ? "var(--success)" : "var(--danger)" }} />
                  <span style={{ fontSize: 13.5 }}>{c.at}</span>
                </div>
                <Tag variant={c.matched ? "success" : "danger"} dot>{c.matched ? "At placement" : "Off-site"}</Tag>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
