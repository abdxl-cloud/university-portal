import React from "react";
const { Btn, Card, Field, Icon, Modal, ModalHead, PageHead, Steps, Tag } = window;
/* Student: Final-Year Project / Thesis (400 Level only) */

const CH_META = {
  none: { tone: undefined, label: "Not submitted" },
  submitted: { tone: "accent", label: "With supervisor" },
  revise: { tone: "warning", label: "Revise" },
  approved: { tone: "success", label: "Approved" },
};

function projectStage(p) {
  if (p.defence) return 6;
  if (p.cleared) return 5;
  if (p.topicStatus !== "approved") return 0;
  const appr = [1, 2, 3, 4, 5].filter((n) => (p.chapters[n] || {}).status === "approved").length;
  return Math.min(4, 1 + Math.floor(appr * 4 / 5));
}

function Project({ store, actions }) {
  const P = window.PROJECT_DATA;
  const p = store.project || { topic: null, topicStatus: "none", chapters: {}, log: [], cleared: false, defence: null };
  const supervisor = window.STAFF_DATA.STAFF;
  const labels = ["Topic", "Chapters 1–2", "Chapters 3–4", "Chapter 5", "Final draft", "Cleared", "Defence"];
  const [submitFor, setSubmitFor] = React.useState(null);
  const [logOpen, setLogOpen] = React.useState(false);

  return (
    <div className="u-content">
      <PageHead title="Final-Year Project" sub="B.Sc. project supervision · 2025/2026">
        {p.cleared
          ? <Tag variant="success" dot>Cleared for defence</Tag>
          : p.topicStatus === "approved" ? <Tag variant="accent" dot>In progress</Tag> : null}
      </PageHead>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <Steps current={projectStage(p)} labels={labels} />
      </Card>

      <div className="u-cols u-cols--main">
        <div className="u-stack" style={{ gap: 16 }}>
          <TopicCard p={p} actions={actions} />
          {p.topicStatus === "approved" && <ChaptersCard p={p} onSubmit={setSubmitFor} />}
          {p.defence && <DefenceCard p={p} />}
        </div>
        <div className="u-stack" style={{ gap: 16 }}>
          <Card className="u-pad">
            <div className="u-h3" style={{ marginBottom: 12 }}>Your supervisor</div>
            <div className="u-row" style={{ gap: 12 }}>
              <Avatar initials={supervisor.initials} size={42} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{supervisor.name}</div>
                <div className="u-meta">{supervisor.area || "Databases & Data Engineering"}</div>
              </div>
            </div>
            <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)", marginTop: 12 }}>
              <span className="k">Office</span><span className="v">{supervisor.office || "CS Block, Rm 21"}</span>
            </div>
            <div className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="k">Email</span><span className="v">{supervisor.email}</span>
            </div>
          </Card>
          <LogCard p={p} onAdd={() => setLogOpen(true)} />
        </div>
      </div>

      {submitFor && <SubmitChapterModal n={submitFor} p={p} actions={actions} onClose={() => setSubmitFor(null)} />}
      {logOpen && <LogMeetingModal actions={actions} onClose={() => setLogOpen(false)} />}
    </div>
  );
}

/* ---------- topic proposal & approval ---------- */
function TopicCard({ p, actions }) {
  const [title, setTitle] = React.useState(p.topic ? p.topic.title : "");
  const [abstract, setAbstract] = React.useState(p.topic ? p.topic.abstract : "");
  const editable = p.topicStatus === "none" || p.topicStatus === "returned";

  return (
    <Card className="u-pad">
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <div className="u-h3">Project topic</div>
        {p.topicStatus === "pending" && <Tag variant="warning" dot>Awaiting supervisor</Tag>}
        {p.topicStatus === "approved" && <Tag variant="success" dot>Approved</Tag>}
        {p.topicStatus === "returned" && <Tag variant="danger" dot>Returned</Tag>}
      </div>

      {p.topicStatus === "returned" && p.topicNote && (
        <div className="u-formerr" style={{ margin: "10px 0 4px" }}>
          <Icon name="info" size={14} />
          <span><strong>Supervisor:</strong> {p.topicNote}</span>
        </div>
      )}

      {editable ? (
        <div className="u-stack" style={{ gap: 12, marginTop: 10 }}>
          <div className="u-meta">Propose your topic with a short abstract. Your supervisor will approve it or return it with guidance.</div>
          <Field label="Topic title">
            <input className="fb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A Machine-Learning Model for Predicting Student Dropout Risk" />
          </Field>
          <Field label="Abstract (what & why, briefly)">
            <textarea className="fb-textarea" rows={3} value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="The problem, your approach, and what you will deliver…" />
          </Field>
          <div className="u-row" style={{ justifyContent: "flex-end" }}>
            <Btn variant="accent" icon="check" disabled={!title.trim() || !abstract.trim()} onClick={() => actions.projPropose(title.trim(), abstract.trim())}>
              {p.topicStatus === "returned" ? "Re-propose topic" : "Propose topic"}
            </Btn>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.4 }}>{p.topic && p.topic.title}</div>
          <div className="u-meta" style={{ marginTop: 6, lineHeight: 1.55 }}>{p.topic && p.topic.abstract}</div>
        </div>
      )}
    </Card>
  );
}

/* ---------- chapter-by-chapter submissions ---------- */
function ChaptersCard({ p, onSubmit }) {
  const { CHAPTERS } = window.PROJECT_DATA;
  // a chapter unlocks when the previous one is approved
  const unlocked = (n) => n === 1 || (p.chapters[n - 1] || {}).status === "approved";
  return (
    <Card className="u-pad">
      <div className="u-h3" style={{ marginBottom: 4 }}>Chapters</div>
      <div className="u-meta" style={{ marginBottom: 12 }}>Submit chapter by chapter. Each one comes back approved, or with your supervisor's comments to address.</div>
      <div className="u-stack" style={{ gap: 8 }}>
        {CHAPTERS.map((c) => {
          const ch = p.chapters[c.n] || { status: "none" };
          const meta = CH_META[ch.status] || CH_META.none;
          const locked = !unlocked(c.n) && ch.status === "none";
          return (
            <div key={c.n} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 14px", opacity: locked ? 0.55 : 1 }}>
              <div className="u-row u-wrap" style={{ gap: 10, justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                  {locked && <Icon name="lock" size={14} style={{ color: "var(--fg-subtle)" }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Chapter {c.n}: {c.title}</div>
                    {ch.fileName && <div className="u-meta" style={{ marginTop: 2 }}>{ch.fileName} · {ch.at}</div>}
                  </div>
                </div>
                <div className="u-row" style={{ gap: 8 }}>
                  <Tag variant={meta.tone} dot={!!meta.tone}>{meta.label}</Tag>
                  {!locked && (ch.status === "none" || ch.status === "revise") && (
                    <Btn variant={ch.status === "revise" ? "accent" : "secondary"} size="sm" onClick={() => onSubmit(c.n)}>{ch.status === "revise" ? "Resubmit" : "Submit"}</Btn>
                  )}
                </div>
              </div>
              {ch.feedback && ch.status !== "approved" && (
                <div className="u-adv-note" style={{ marginTop: 10 }}>
                  <span className="u-icon" style={{ width: 24, height: 24, flexShrink: 0 }}><Icon name="user" size={13} /></span>
                  <div className="u-grow"><div className="u-meta" style={{ fontWeight: 600, color: "var(--accent-soft-fg)" }}>Supervisor's comments</div><div style={{ fontSize: 13 }}>{ch.feedback}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SubmitChapterModal({ n, p, actions, onClose }) {
  const { CHAPTERS } = window.PROJECT_DATA;
  const c = CHAPTERS.find((x) => x.n === n);
  const [file, setFile] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      actions.projSubmitChapter(n, file || ("chapter-" + n + ".docx"), note.trim());
      setBusy(false); onClose();
    }, 900);
  };
  return (
    <Modal onClose={() => !busy && onClose()}>
      <ModalHead title={"Submit Chapter " + n} sub={c.title} onClose={() => !busy && onClose()} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0]?.name || null)} />
        <button className="u-row" onClick={() => inputRef.current?.click()}
          style={{ width: "100%", gap: 12, padding: "16px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-sunken)", cursor: "pointer", color: "inherit", textAlign: "left" }}>
          <span className="u-icon"><Icon name="download" size={16} /></span>
          <div className="u-grow">
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{file || "Choose your chapter file"}</div>
            <div className="u-meta">DOCX or PDF: up to 25 MB</div>
          </div>
          {file && <Icon name="check" size={16} style={{ color: "var(--success)" }} />}
        </button>
        <Field label="Note to supervisor (optional)">
          <textarea className="fb-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything you'd like them to focus on…" />
        </Field>
        <Btn variant="accent" size="lg" disabled={busy} onClick={submit} style={{ width: "100%" }}>{busy ? "Submitting…" : "Submit for review"}</Btn>
      </div>
    </Modal>
  );
}

/* ---------- supervision meeting log ---------- */
function LogCard({ p, onAdd }) {
  return (
    <Card className="u-pad">
      <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div className="u-h3">Supervision log</div>
        <Btn variant="secondary" size="sm" icon="plus" onClick={onAdd}>Log meeting</Btn>
      </div>
      {p.log.length === 0
        ? <div className="u-meta">No meetings logged yet. Record each consultation: your supervisor signs it off, and the log goes into your project file.</div>
        : (
          <div className="u-stack" style={{ gap: 8 }}>
            {p.log.map((l) => (
              <div key={l.id} className="u-row" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", alignItems: "flex-start" }}>
                <span className="u-icon u-icon--plain" style={{ width: 28, height: 28, flexShrink: 0 }}><Icon name="calendar" size={13} /></span>
                <div className="u-grow" style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{l.summary}</div>
                  <div className="u-meta" style={{ marginTop: 2 }}>{l.at}</div>
                </div>
                {l.status === "signed" ? <Tag variant="success" dot>Signed</Tag> : <Tag variant="warning" dot>Unsigned</Tag>}
              </div>
            ))}
          </div>
        )}
    </Card>
  );
}

function LogMeetingModal({ actions, onClose }) {
  const [summary, setSummary] = React.useState("");
  return (
    <Modal onClose={onClose}>
      <ModalHead title="Log a supervision meeting" sub="Your supervisor signs it afterwards" onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <Field label="What was discussed / agreed">
          <textarea className="fb-textarea" rows={3} autoFocus value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Reviewed chapter 2 corrections; agreed to add a comparison table before resubmitting…" />
        </Field>
        <Btn variant="accent" size="lg" disabled={!summary.trim()} onClick={() => { actions.projLogAdd(summary.trim()); onClose(); }} style={{ width: "100%" }}>Add to log</Btn>
      </div>
    </Modal>
  );
}

/* ---------- defence ---------- */
function DefenceCard({ p }) {
  const d = p.defence;
  return (
    <Card className="u-pad" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
      <div className="u-row" style={{ gap: 12 }}>
        <span className="u-icon"><Icon name="cap" size={18} /></span>
        <div className="u-grow">
          <div className="u-h3" style={{ color: "var(--accent-soft-fg)" }}>Project defence scheduled</div>
          <div style={{ fontSize: 13.5, color: "var(--accent-soft-fg)", marginTop: 3 }}>{d.day} {d.start} · {d.venue}</div>
          <div className="u-meta" style={{ marginTop: 2 }}>Panel: {d.panel}</div>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { Project, projectStage });
