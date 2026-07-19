import React from "react";
const { Avatar, Btn, Card, Empty, Field, Icon, Modal, ModalHead, PageHead, Tag } = window;
/* Lecturer: final-year project supervision (My project students) */

// role-shell.jsx loads after this module, so resolve rstate at call time
const rst = (...a) => window.rstate(...a);

/* effective state of a seeded supervisee, with store overrides via roleAct("sup", …) */
function supTopic(store, s) { return rst(store, "sup", "topic", s.id, s.topicStatus); }
function supTopicNote(store, s) { return rst(store, "sup", "topicNote", s.id, ""); }
function supChapter(store, s, n) {
  const fb = n <= s.chAppr ? "approved" : n === s.chPend ? "submitted" : "none";
  return rst(store, "sup", "ch" + n, s.id, fb);
}
function supFeedback(store, s, n) { return rst(store, "sup", "fb" + n, s.id, ""); }
function supCleared(store, s) { return rst(store, "sup", "cleared", s.id, false); }
function supLogSigned(store, s) { return rst(store, "sup", "log", s.id, s.logPending === 0); }

/* the demo student appears as a live supervisee, driven by her real project store */
function liveSupervisee(store) {
  const { STUDENT } = window.DATA;
  const p = store.project || { topicStatus: "none", chapters: {}, log: [], cleared: false };
  return {
    id: "prj-me", live: true,
    name: STUDENT.name, initials: STUDENT.initials, matric: STUDENT.matric,
    topic: p.topic ? p.topic.title : null, abstract: p.topic ? p.topic.abstract : "",
    p,
  };
}

function chaptersApproved(store, s) {
  if (s.live) return [1, 2, 3, 4, 5].filter((n) => (s.p.chapters[n] || {}).status === "approved").length;
  return [1, 2, 3, 4, 5].filter((n) => supChapter(store, s, n) === "approved").length;
}
function pendingCount(store, s) {
  if (s.live) return [1, 2, 3, 4, 5].filter((n) => (s.p.chapters[n] || {}).status === "submitted").length + (s.p.topicStatus === "pending" ? 1 : 0) + s.p.log.filter((l) => l.status === "pending").length;
  return [1, 2, 3, 4, 5].filter((n) => supChapter(store, s, n) === "submitted").length + (supTopic(store, s) === "pending" ? 1 : 0) + (supLogSigned(store, s) ? 0 : 1);
}

function StaffSupervision({ store, actions }) {
  const P = window.PROJECT_DATA;
  const [openId, setOpenId] = React.useState(null);
  const all = [liveSupervisee(store), ...P.SUPERVISEES];
  if (openId) {
    const s = all.find((x) => x.id === openId);
    return <SuperviseeDetail store={store} actions={actions} s={s} onBack={() => setOpenId(null)} />;
  }
  const attention = all.reduce((a, s) => a + pendingCount(store, s), 0);
  return (
    <div className="u-content">
      <PageHead title="Supervision" sub={all.length + " project students · 2025/2026 session"}>
        {attention > 0 && <Tag variant="warning" dot>{attention} item{attention > 1 ? "s" : ""} need you</Tag>}
      </PageHead>
      <Card className="u-pad">
        <div className="u-stack" style={{ gap: 8 }}>
          {all.map((s) => {
            const topic = s.live ? s.p.topicStatus : supTopic(store, s);
            const appr = chaptersApproved(store, s);
            const pend = pendingCount(store, s);
            const cleared = s.live ? s.p.cleared : supCleared(store, s);
            return (
              <div key={s.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpenId(s.id)}>
                <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                  <Avatar initials={s.initials} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                    <div className="u-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
                      {s.topic || <em>No topic proposed yet</em>}
                    </div>
                  </div>
                </div>
                <div className="u-row" style={{ gap: 14 }}>
                  <div style={{ width: 130 }}>
                    <div className="u-meta" style={{ marginBottom: 4 }}>{appr} / 5 chapters</div>
                    <div className="u-bar"><div className="u-bar__fill" style={{ width: (appr * 20) + "%" }} /></div>
                  </div>
                  {cleared
                    ? <Tag variant="success" dot>Cleared</Tag>
                    : topic === "pending"
                      ? <Tag variant="warning" dot>Topic to review</Tag>
                      : pend > 0
                        ? <Tag variant="warning" dot>{pend} pending</Tag>
                        : topic === "none"
                          ? <Tag>No topic</Tag>
                          : <Tag variant="accent" dot>On track</Tag>}
                  <Btn variant="secondary" size="sm" iconRight="chevron" onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }}>Open</Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SuperviseeDetail({ store, actions, s, onBack }) {
  const { CHAPTERS } = window.PROJECT_DATA;
  const [reviewCh, setReviewCh] = React.useState(null);
  const [topicNote, setTopicNote] = React.useState("");
  const topic = s.live ? s.p.topicStatus : supTopic(store, s);
  const note = s.live ? s.p.topicNote : supTopicNote(store, s);
  const appr = chaptersApproved(store, s);
  const cleared = s.live ? s.p.cleared : supCleared(store, s);

  const decideTopic = (ok) => {
    if (s.live) actions.projTopicDecide(ok, topicNote.trim());
    else { actions.roleAct("sup", "topic", s.id, ok ? "approved" : "returned"); actions.roleAct("sup", "topicNote", s.id, topicNote.trim()); }
    setTopicNote("");
  };
  const chState = (n) => (s.live ? (s.p.chapters[n] || { status: "none" }).status : supChapter(store, s, n));
  const chInfo = (n) => (s.live ? (s.p.chapters[n] || {}) : { fileName: "chapter-" + n + ".docx", feedback: supFeedback(store, s, n) });
  const clear = () => { if (s.live) actions.projClearDefence(); else actions.roleAct("sup", "cleared", s.id, true); };

  return (
    <div className="u-content u-content--narrow">
      <div style={{ marginBottom: 14 }}>
        <button className="u-filelink" onClick={onBack}><Icon name="arrowLeft" size={14} /> All project students</button>
      </div>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 12, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 12 }}>
            <Avatar initials={s.initials} size={44} />
            <div>
              <div className="u-h2">{s.name}</div>
              <div className="u-meta fb-mono">{s.matric} · 500L CSC</div>
            </div>
          </div>
          <div className="u-row" style={{ gap: 8 }}>
            <Btn variant="secondary" size="sm" icon="chart" onClick={() => window.showDetail("student", { name: s.name, matric: s.matric, level: "500L" })}>Academic record</Btn>
            {cleared && <Tag variant="success" dot>Cleared for defence</Tag>}
          </div>
        </div>
      </Card>

      {/* topic */}
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div className="u-h3">Topic</div>
          {topic === "pending" && <Tag variant="warning" dot>Awaiting your decision</Tag>}
          {topic === "approved" && <Tag variant="success" dot>Approved</Tag>}
          {topic === "returned" && <Tag variant="danger" dot>Returned</Tag>}
          {topic === "none" && <Tag>Not proposed</Tag>}
        </div>
        {s.topic ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.4 }}>{s.topic}</div>
            {s.abstract && <div className="u-meta" style={{ marginTop: 6, lineHeight: 1.55 }}>{s.abstract}</div>}
          </>
        ) : <div className="u-meta">The student has not proposed a topic yet.</div>}
        {topic === "returned" && note && (
          <div className="u-formerr" style={{ marginTop: 10 }}><Icon name="info" size={14} /><span>Your note: {note}</span></div>
        )}
        {topic === "pending" && (
          <div className="u-stack" style={{ gap: 10, marginTop: 14 }}>
            <textarea className="fb-textarea" rows={2} value={topicNote} onChange={(e) => setTopicNote(e.target.value)} placeholder="Optional guidance if returning: e.g. narrow the scope to one faculty's data…" />
            <div className="u-row" style={{ gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => decideTopic(false)}>Return with note</Btn>
              <Btn variant="accent" icon="check" onClick={() => decideTopic(true)}>Approve topic</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* chapters */}
      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-h3" style={{ marginBottom: 12 }}>Chapters · {appr} of 5 approved</div>
        <div className="u-stack" style={{ gap: 8 }}>
          {CHAPTERS.map((c) => {
            const st = chState(c.n);
            const info = chInfo(c.n);
            return (
              <div key={c.n} className="u-row u-wrap" style={{ gap: 10, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Chapter {c.n}: {c.title}</div>
                  {st !== "none" && info.fileName && <div className="u-meta" style={{ marginTop: 2 }}>{info.fileName}{info.note ? " · “" + info.note + "”" : ""}</div>}
                  {st === "revise" && info.feedback && <div className="u-meta" style={{ marginTop: 2 }}>Your comments: “{info.feedback}”</div>}
                </div>
                {st === "submitted"
                  ? <Btn variant="accent" size="sm" onClick={() => setReviewCh(c.n)}>Review</Btn>
                  : st === "approved" ? <Tag variant="success" dot>Approved</Tag>
                    : st === "revise" ? <Tag variant="warning" dot>Sent back</Tag>
                      : <Tag>Not submitted</Tag>}
              </div>
            );
          })}
        </div>
        {appr === 5 && !cleared && (
          <Btn variant="accent" icon="cap" style={{ marginTop: 14 }} onClick={clear}>Clear for defence</Btn>
        )}
      </Card>

      {/* meeting log */}
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>Supervision log</div>
        {s.live ? (
          s.p.log.length === 0 ? <div className="u-meta">No meetings logged by the student yet.</div> : (
            <div className="u-stack" style={{ gap: 8 }}>
              {s.p.log.map((l) => (
                <div key={l.id} className="u-row" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", alignItems: "flex-start" }}>
                  <div className="u-grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>{l.summary}</div>
                    <div className="u-meta" style={{ marginTop: 2 }}>{l.at}</div>
                  </div>
                  {l.status === "signed" ? <Tag variant="success" dot>Signed</Tag> : <Btn variant="secondary" size="sm" icon="check" onClick={() => actions.projLogSign(l.id)}>Sign</Btn>}
                </div>
              ))}
            </div>
          )
        ) : (
          supLogSigned(store, s)
            ? <div className="u-meta">All logged meetings are signed.</div>
            : <div className="u-row" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div className="u-grow"><div style={{ fontSize: 13 }}>Discussed literature review scope and agreed on the evaluation dataset.</div><div className="u-meta" style={{ marginTop: 2 }}>Last week</div></div>
                <Btn variant="secondary" size="sm" icon="check" onClick={() => actions.roleAct("sup", "log", s.id, true)}>Sign</Btn>
              </div>
        )}
      </Card>

      {reviewCh && <ReviewChapterModal n={reviewCh} s={s} store={store} actions={actions} onClose={() => setReviewCh(null)} />}
    </div>
  );
}

function ReviewChapterModal({ n, s, store, actions, onClose }) {
  const { CHAPTERS } = window.PROJECT_DATA;
  const c = CHAPTERS.find((x) => x.n === n);
  const [feedback, setFeedback] = React.useState("");
  const decide = (ok) => {
    if (s.live) actions.projChapterDecide(n, ok, feedback.trim());
    else { actions.roleAct("sup", "ch" + n, s.id, ok ? "approved" : "revise"); actions.roleAct("sup", "fb" + n, s.id, feedback.trim()); }
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <ModalHead title={"Review Chapter " + n} sub={c.title + " · " + s.name} onClose={onClose} />
      <div className="u-pad u-stack" style={{ gap: 14 }}>
        <div className="u-pad-sm" style={{ borderRadius: "var(--r-md)", background: "var(--bg-sunken)", fontSize: 13, color: "var(--fg-muted)" }}>
          <Icon name="doc" size={13} /> {(s.live ? (s.p.chapters[n] || {}).fileName : "chapter-" + n + ".docx") || "chapter-" + n + ".docx"}: open in your reader, then record your decision here.
        </div>
        <Field label="Comments to the student">
          <textarea className="fb-textarea" rows={3} autoFocus value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g. Solid draft. Expand the related-work comparison and fix citation format in section 2.3…" />
        </Field>
        <div className="u-row" style={{ gap: 8 }}>
          <Btn variant="secondary" style={{ flex: 1 }} onClick={() => decide(false)}>Return for revision</Btn>
          <Btn variant="accent" icon="check" style={{ flex: 1 }} onClick={() => decide(true)}>Approve chapter</Btn>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { StaffSupervision });
