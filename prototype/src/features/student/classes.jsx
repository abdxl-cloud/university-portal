import React from "react";
const { Btn, Card, Empty, Field, Icon, Modal, ModalHead, PageHead, Ref, Seg, Tag } = window;
/* Classes / LMS — student side. Approved courses become interactive class spaces. */

function nowStr() {
  return new Date().toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const FILE_TONE = { PDF: "danger", PPTX: "warning", ZIP: "accent", SQL: "accent", DOC: "accent" };

// resolve effective status of an assignment for this student
function asgStatus(a, store) {
  const sub = store.submissions && store.submissions[a.id];
  if (sub) return sub; // { status, submittedAt, fileName, grade?, feedback? }
  if (a.seed === "graded") return { status: "graded", submittedAt: "Oct 17, 2025", fileName: "submission.pdf", grade: a.grade, feedback: a.feedback };
  if (a.seed === "submitted") return { status: "submitted", submittedAt: "Oct 30, 2025", fileName: "submission.zip" };
  return { status: "open" };
}

const STATUS_META = {
  open: { tone: "warning", label: "To do" },
  submitted: { tone: "accent", label: "Submitted" },
  graded: { tone: "success", label: "Graded" },
};

function approvedClassCourses(store) {
  const { COURSES } = window.DATA;
  if (store.registration.status !== "approved") return [];
  return store.registration.courses
    .map((code) => COURSES.find((c) => c.code === code))
    .filter(Boolean);
}

// open assignments across approved courses, soonest due first
function pendingAssignments(store) {
  const { classFor } = window.DATA;
  const out = [];
  approvedClassCourses(store).forEach((c) => {
    classFor(c.code).assignments.forEach((a) => {
      if (asgStatus(a, store).status === "open") {
        out.push({ ...a, code: c.code, _due: new Date(a.due).getTime() || Infinity });
      }
    });
  });
  return out.sort((x, y) => x._due - y._due);
}

/* ---------------- list ---------------- */
function Classes({ store, actions, go }) {
  const { classFor } = window.DATA;
  const [open, setOpen] = React.useState(null); // course code

  if (store.registration.status !== "approved") {
    return (
      <div className="u-content u-content--narrow">
        <PageHead title="Classes" sub="Your interactive course spaces" />
        <Card className="u-pad" style={{ textAlign: "center" }}>
          <div className="u-stack" style={{ alignItems: "center", gap: 12, padding: "32px 20px" }}>
            <span className="u-icon" style={{ width: 48, height: 48, background: "var(--warning-soft)", color: "oklch(from var(--warning) calc(l - 0.18) c h)" }}><Icon name="lock" size={22} /></span>
            <div className="u-h2">Classes unlock after registration approval</div>
            <div className="u-muted" style={{ maxWidth: 400, fontSize: 14 }}>
              Once your level adviser approves your course registration, each course opens here as a class space — with the lecturer's materials, assignments and announcements.
            </div>
            <Btn variant="accent" icon="book" onClick={() => go("registration")} style={{ marginTop: 6 }}>Go to course registration</Btn>
          </div>
        </Card>
      </div>
    );
  }

  const courses = approvedClassCourses(store);

  if (open) {
    return <ClassDetail code={open} store={store} actions={actions} onBack={() => setOpen(null)} />;
  }

  return (
    <div className="u-content">
      <PageHead title="Classes" sub={courses.length + " active courses · 2025/2026 First Semester"} />
      <div className="u-grid u-grid--3">
        {courses.map((c) => {
          const content = classFor(c.code);
          const todo = content.assignments.filter((a) => asgStatus(a, store).status === "open").length;
          const next = content.assignments.find((a) => asgStatus(a, store).status === "open");
          return (
            <Card key={c.code} className="u-pad" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }} onClick={() => setOpen(c.code)}>
              <div className="u-row" style={{ justifyContent: "space-between" }}>
                <span className="u-icon"><Icon name="book" size={16} /></span>
                {todo > 0 ? <Tag variant="warning" dot>{todo} due</Tag> : <Tag variant="success" dot>Up to date</Tag>}
              </div>
              <div>
                <div className="fb-mono" style={{ fontWeight: 700, fontSize: 13 }}>{c.code}</div>
                <div style={{ fontWeight: 600, marginTop: 3, lineHeight: 1.25 }}>{c.title}</div>
                <div className="u-meta" style={{ marginTop: 4 }}>{c.lecturer}</div>
              </div>
              <div className="fb-divider" />
              <div className="u-row" style={{ gap: 14 }}>
                <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="doc" size={13} /> {content.materials.length} materials</span>
                <span className="u-meta u-row" style={{ gap: 5 }}><Icon name="check" size={13} /> {content.assignments.length} tasks</span>
              </div>
              {next && <div className="u-meta" style={{ color: "var(--fg-muted)" }}>Next due: <strong style={{ color: "var(--fg)" }}>{next.title.replace(/^Assignment \d+ — |^Lab \d+ — /, "")}</strong> · {next.due}</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- detail ---------------- */
function ClassDetail({ code, store, actions, onBack }) {
  const { COURSES, classFor } = window.DATA;
  const course = COURSES.find((c) => c.code === code);
  const content = classFor(code);
  const [tab, setTab] = React.useState("stream");
  const [submitFor, setSubmitFor] = React.useState(null);

  const tabs = [
    { value: "stream", label: "Stream" },
    { value: "materials", label: "Materials" },
    { value: "assignments", label: "Assignments" },
  ];

  return (
    <div className="u-content">
      <button className="fb-link u-row" style={{ gap: 6, marginBottom: 14, background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={onBack}>
        <Icon name="arrowLeft" size={15} /> All classes
      </button>

      <Card className="u-pad" style={{ marginBottom: 16 }}>
        <div className="u-row u-wrap" style={{ gap: 14, justifyContent: "space-between" }}>
          <div className="u-row" style={{ gap: 14, minWidth: 0 }}>
            <span className="u-icon" style={{ width: 44, height: 44 }}><Icon name="book" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="u-row" style={{ gap: 8 }}>
                <span className="fb-mono" style={{ fontWeight: 700 }}>{course.code}</span>
                <Tag>{course.units} units</Tag>
              </div>
              <div className="u-h2" style={{ marginTop: 2 }}>{course.title}</div>
              <div className="u-meta" style={{ marginTop: 2 }}>
                <Ref type="lecturer" k={course.lecturer} /> · <Ref type="venue" k={course.venue}>{course.venue}</Ref>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="u-row" style={{ marginBottom: 16, overflowX: "auto" }}>
        <Seg value={tab} onChange={setTab} options={tabs} />
      </div>

      {tab === "stream" && <Stream content={content} />}
      {tab === "materials" && <Materials content={content} />}
      {tab === "assignments" && <Assignments content={content} store={store} onSubmit={setSubmitFor} />}

      {submitFor && (
        <SubmitModal a={submitFor} store={store} actions={actions} onClose={() => setSubmitFor(null)} />
      )}
    </div>
  );
}

function Stream({ content }) {
  return (
    <div className="u-stack" style={{ gap: 12, maxWidth: 720 }}>
      {content.stream.map((p, i) => {
        const initials = p.who.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/g, "").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("") || "L";
        return (
          <Card key={i} className="u-pad">
            <div className="u-row" style={{ gap: 11, marginBottom: 10 }}>
              <Avatar initials={initials} size={36} />
              <div className="u-grow">
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.who}</div>
                <div className="u-meta">{p.time}</div>
              </div>
              <Tag variant="accent">Lecturer</Tag>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg-muted)" }}>{p.body}</div>
          </Card>
        );
      })}
    </div>
  );
}

function Materials({ content }) {
  const download = (m) => {
    const blob = new Blob(["FUTECH course material (demo)\n\n" + m.name + "\n\nThis is a placeholder file generated by the prototype."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = m.name.replace(/\.[a-z]+$/i, "") + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card>
      <div className="u-list" style={{ padding: "4px 0" }}>
        {content.materials.map((m, i) => (
          <div key={i} className="u-row" style={{ gap: 13, padding: "13px 18px", borderTop: i ? "1px solid var(--border)" : 0 }}>
            <span className="u-icon u-icon--plain" style={{ background: "var(--" + (FILE_TONE[m.type] || "accent") + "-soft)", color: "var(--" + (FILE_TONE[m.type] || "accent") + ")" }}><Icon name="doc" size={15} /></span>
            <div className="u-grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
              <div className="u-meta">{m.type} · {m.size} · posted {m.date}</div>
            </div>
            <Btn variant="ghost" size="sm" icon="download" onClick={() => download(m)}>Download</Btn>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Assignments({ content, store, onSubmit }) {
  return (
    <div className="u-stack" style={{ gap: 12, maxWidth: 760 }}>
      {content.assignments.map((a) => {
        const st = asgStatus(a, store);
        const meta = STATUS_META[st.status];
        return (
          <Card key={a.id} className="u-pad">
            <div className="u-row u-wrap" style={{ justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div className="u-row" style={{ gap: 10, minWidth: 0 }}>
                <span className="u-icon u-icon--plain"><Icon name="doc" size={15} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className="u-meta">Due {a.due} · {a.points} marks</div>
                </div>
              </div>
              <Tag variant={meta.tone} dot>{meta.label}</Tag>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.5 }}>{a.instructions}</div>

            {st.status === "graded" && (
              <div className="u-pad-sm" style={{ marginTop: 12, borderRadius: "var(--r-md)", background: "var(--success-soft)" }}>
                <div className="u-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: "var(--success)" }}>Grade: {st.grade} / {a.points}</span>
                  <span className="u-meta">Submitted {st.submittedAt}</span>
                </div>
                {st.feedback && <div style={{ fontSize: 13, marginTop: 6, color: "oklch(from var(--success) calc(l - 0.2) c h)" }}><strong>Feedback:</strong> {st.feedback}</div>}
              </div>
            )}

            {st.status === "submitted" && (
              <div className="u-row" style={{ gap: 10, marginTop: 12, justifyContent: "space-between" }}>
                <span className="u-meta u-row" style={{ gap: 6 }}><Icon name="check" size={14} style={{ color: "var(--accent)" }} /> Submitted {st.fileName ? "· " + st.fileName : ""} on {st.submittedAt}</span>
                <Btn variant="ghost" size="sm" onClick={() => onSubmit(a)}>Resubmit</Btn>
              </div>
            )}

            {st.status === "open" && (
              <div className="u-row" style={{ marginTop: 12 }}>
                <Btn variant="accent" icon="download" iconRight="arrowRight" onClick={() => onSubmit(a)}>Submit assignment</Btn>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SubmitModal({ a, store, actions, onClose }) {
  const [file, setFile] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      actions.submitAssignment(a.id, { status: "submitted", submittedAt: nowStr(), fileName: file || "submission.pdf", note });
      setBusy(false);
      onClose();
    }, 1100);
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
      <ModalHead title="Submit assignment" sub={a.title} onClose={() => !busy && onClose()} />
      <div className="u-pad u-stack" style={{ gap: 16 }}>
        <div className="u-pad-sm" style={{ borderRadius: "var(--r-md)", background: "var(--bg-sunken)", fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--fg)" }}>Due {a.due}</strong> · {a.points} marks<br />{a.instructions}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Your file</div>
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0]?.name || null)} />
          <button className="u-row" onClick={() => inputRef.current?.click()}
            style={{ width: "100%", gap: 12, padding: "16px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-sunken)", cursor: "pointer", color: "inherit", textAlign: "left" }}>
            <span className="u-icon"><Icon name="download" size={16} /></span>
            <div className="u-grow">
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{file || "Choose a file to upload"}</div>
              <div className="u-meta">PDF, ZIP, DOCX — up to 25 MB</div>
            </div>
            {file && <Icon name="check" size={16} style={{ color: "var(--success)" }} />}
          </button>
        </div>

        <Field label="Note to lecturer (optional)">
          <textarea className="fb-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything you'd like to add…" />
        </Field>

        <Btn variant="accent" size="lg" disabled={busy} onClick={submit} style={{ width: "100%" }}>
          {busy ? "Submitting…" : "Submit for grading"}
        </Btn>
        <div className="u-meta" style={{ textAlign: "center" }}>Demo only — your file is not uploaded anywhere.</div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Classes, pendingAssignments, approvedClassCourses });
