/* Role screens — academic cluster: Adviser, HOD, Dean, Exams & Records */

/* small reusable: action buttons for a decision row */
function Decide({ onApprove, onReject, approveLabel = "Approve", rejectLabel = "Query", size = "sm" }) {
  return (
    <div className="u-row" style={{ gap: 6 }}>
      <Btn variant="secondary" size={size} onClick={onReject}>{rejectLabel}</Btn>
      <Btn variant="accent" size={size} icon="check" onClick={onApprove}>{approveLabel}</Btn>
    </div>
  );
}

/* ============ LEVEL ADVISER ============ */
function AdviserDashboard({ store, go }) {
  const { ADVISEES } = window.ROLE_DATA;
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const pending = ADVISEES.filter((a) => dec(a) === "pending").length;
  const approved = ADVISEES.filter((a) => dec(a) === "approved").length;
  const flagged = ADVISEES.filter((a) => a.flags.length && dec(a) === "pending").length;

  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.adviser} />
      <StatCards items={[
        { icon: "user", k: "Advisees", v: ADVISEES.length, plain: true },
        { icon: "book", k: "Awaiting approval", v: pending, tag: pending ? "Action" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("adv-reg") },
        { icon: "check", k: "Approved", v: approved },
        { icon: "info", k: "Flagged issues", v: flagged, tag: flagged ? "Review" : null, tone: flagged ? "danger" : undefined },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Registrations awaiting your approval</div>
          <a className="fb-link" onClick={() => go("adv-reg")}>Open queue</a>
        </div>
        <AdviseeRows store={store} go={go} limit={4} only="pending" />
      </Card>
    </div>
  );
}

function AdviseeRows({ store, actions, go, limit, only }) {
  const { ADVISEES } = window.ROLE_DATA;
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  let rows = ADVISEES.filter((a) => a.submitted);
  if (only) rows = rows.filter((a) => dec(a) === only);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="Nothing pending" sub="All submitted course forms have been reviewed." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((a) => {
        const st = dec(a);
        return (
          <div key={a.id} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <Avatar initials={a.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
                <div className="u-meta fb-mono">{a.matric}</div>
                {a.flags.length > 0 && <div className="u-row u-wrap" style={{ gap: 5, marginTop: 5 }}>{a.flags.map((f) => <Tag key={f} variant="danger">{f}</Tag>)}</div>}
              </div>
            </div>
            <div className="u-row" style={{ gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div className="u-meta">{a.courses} courses</div>
                <div className="u-num" style={{ fontWeight: 600, fontSize: 13.5 }}>{a.units} units</div>
              </div>
              {st === "pending" && actions
                ? <Decide onApprove={() => actions.roleAct("adviser", "reg", a.id, "approved")} onReject={() => actions.roleAct("adviser", "reg", a.id, "query")} />
                : <SPill s={st} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdviserApprovals({ store, actions, go }) {
  const { ADVISEES } = window.ROLE_DATA;
  const [filter, setFilter] = React.useState("pending");
  const dec = (a) => rstate(store, "adviser", "reg", a.id, a.baseStatus);
  const counts = { pending: 0, approved: 0, query: 0 };
  ADVISEES.filter((a) => a.submitted).forEach((a) => { const s = dec(a); counts[s] = (counts[s] || 0) + 1; });

  return (
    <div className="u-content">
      <PageHead title="Course Approvals" sub="Review and approve 300L course registrations">
        <Seg value={filter} onChange={setFilter} options={[
          { value: "pending", label: "Pending · " + (counts.pending || 0) },
          { value: "approved", label: "Approved" }, { value: "query", label: "Queried" },
        ]} />
      </PageHead>
      <Card className="u-pad"><AdviseeRows store={store} actions={actions} go={go} only={filter} /></Card>
    </div>
  );
}

function AdviserAdvisees({ store }) {
  const { ADVISEES } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="My Advisees" sub={ADVISEES.length + " students · 300 Level Computer Science"} />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Matric</th><th>Student</th><th className="u-right">Units</th><th>Fees</th><th>Carryover</th><th>Registration</th></tr></thead>
            <tbody>
              {ADVISEES.map((a) => (
                <tr key={a.id}>
                  <td className="fb-mono" style={{ fontSize: 12 }}>{a.matric}</td>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td className="u-right u-num">{a.submitted ? a.units : "—"}</td>
                  <td>{a.feesPaid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>}</td>
                  <td>{a.carryover ? <Tag variant="warning">Yes</Tag> : <span className="u-muted">None</span>}</td>
                  <td><SPill s={rstate(store, "adviser", "reg", a.id, a.baseStatus)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============ HOD ============ */
function HodDashboard({ store, go }) {
  const { HOD_COURSES, HOD_RESULTS } = window.ROLE_DATA;
  const unassigned = HOD_COURSES.filter((c) => (rstate(store, "hod", "assign", c.code, c.lecturer)) === "Unassigned").length;
  const pendingRes = HOD_RESULTS.filter((r) => rstate(store, "hod", "result", r.code, r.baseStatus) === "pending").length;
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.hod} />
      <StatCards items={[
        { icon: "book", k: "Department courses", v: HOD_COURSES.length, plain: true },
        { icon: "user", k: "Unassigned courses", v: unassigned, tag: unassigned ? "Assign" : "Done", tone: unassigned ? "warning" : "success", onClick: () => go("hod-assign") },
        { icon: "chart", k: "Results to approve", v: pendingRes, tag: pendingRes ? "Review" : "Clear", tone: pendingRes ? "warning" : "success", onClick: () => go("hod-results") },
        { icon: "user", k: "Department students", v: "1,240", plain: true },
      ]} />
      <div className="u-cols u-cols--main">
        <Card className="u-pad">
          <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="u-h3">Results awaiting approval</div><a className="fb-link" onClick={() => go("hod-results")}>All</a>
          </div>
          <HodResultRows store={store} go={go} limit={3} only="pending" />
        </Card>
        <Card className="u-pad">
          <div className="u-h3" style={{ marginBottom: 12 }}>Unassigned courses</div>
          {HOD_COURSES.filter((c) => rstate(store, "hod", "assign", c.code, c.lecturer) === "Unassigned").length === 0
            ? <div className="u-meta">Every course has a lecturer assigned.</div>
            : HOD_COURSES.filter((c) => rstate(store, "hod", "assign", c.code, c.lecturer) === "Unassigned").map((c) => (
              <div key={c.code} className="u-row" style={{ gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <span className="u-icon u-icon--plain"><Icon name="book" size={15} /></span>
                <div className="u-grow"><div className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</div><div className="u-meta">{c.title}</div></div>
                <Btn variant="secondary" size="sm" onClick={() => go("hod-assign")}>Assign</Btn>
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}

function HodAssignments({ store, actions }) {
  const { HOD_COURSES, STAFF_POOL } = window.ROLE_DATA;
  return (
    <div className="u-content">
      <PageHead title="Course Assignments" sub="Assign lecturers to department courses this semester" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Code</th><th>Course</th><th>Level</th><th className="u-right">Units</th><th>Assigned lecturer</th></tr></thead>
            <tbody>
              {HOD_COURSES.map((c) => {
                const cur = rstate(store, "hod", "assign", c.code, c.lecturer);
                return (
                  <tr key={c.code}>
                    <td className="fb-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                    <td>{c.title}</td>
                    <td><Tag>{c.level}</Tag></td>
                    <td className="u-right u-num">{c.units}</td>
                    <td>
                      <select className="fb-input" style={{ minWidth: 180, padding: "7px 10px", borderColor: cur === "Unassigned" ? "var(--danger)" : undefined }}
                        value={cur} onChange={(e) => actions.roleAct("hod", "assign", c.code, e.target.value)}>
                        {STAFF_POOL.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Changes save instantly. Newly assigned lecturers gain access to that course's roster and class space.</div>
    </div>
  );
}

function HodResultRows({ store, actions, go, limit, only }) {
  const { HOD_RESULTS } = window.ROLE_DATA;
  const st = (r) => rstate(store, "hod", "result", r.code, r.baseStatus);
  let rows = HOD_RESULTS; if (only) rows = rows.filter((r) => st(r) === only); if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <Empty icon="check" title="No results pending" sub="Submitted results will appear here for your approval." />;
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((r) => {
        const s = st(r);
        return (
          <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <span className="u-icon"><Icon name="chart" size={15} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                <div className="u-meta">{r.lecturer} · {r.students} students · {r.passRate}% pass · submitted {r.submittedAt}</div>
              </div>
            </div>
            {s === "pending" && actions
              ? <Decide onApprove={() => actions.roleAct("hod", "result", r.code, "approved")} onReject={() => actions.roleAct("hod", "result", r.code, "query")} approveLabel="Approve" rejectLabel="Return" />
              : <SPill s={s} />}
          </div>
        );
      })}
    </div>
  );
}

function HodApprovals({ store, actions, go }) {
  return (
    <div className="u-content">
      <PageHead title="Result Approvals" sub="Approve lecturer-submitted results before they go to faculty" />
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Approval flow:</span>
          {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => (
            <React.Fragment key={s}>{i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}<Tag variant={s === "HOD" ? "accent" : undefined}>{s}</Tag></React.Fragment>
          ))}
        </div>
      </Card>
      <Card className="u-pad"><HodResultRows store={store} actions={actions} go={go} /></Card>
    </div>
  );
}

function HodStaff() {
  const { STAFF_POOL, HOD_COURSES } = window.ROLE_DATA;
  const staff = STAFF_POOL.filter((s) => s !== "Unassigned");
  return (
    <div className="u-content">
      <PageHead title="Department Staff" sub={staff.length + " academic staff · Computer Science"} />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Lecturer</th><th className="u-right">Courses</th><th>Workload</th></tr></thead>
            <tbody>
              {staff.map((s) => {
                const load = HOD_COURSES.filter((c) => c.lecturer === s).length;
                return (
                  <tr key={s}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={s.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/g, "").split(" ").map((x) => x[0]).slice(0, 2).join("")} size={30} /><span style={{ fontWeight: 500 }}>{s}</span></div></td>
                    <td className="u-right u-num">{load}</td>
                    <td><div className="u-bar" style={{ width: 120 }}><div className="u-bar__fill" style={{ width: Math.min(100, load * 33) + "%" }} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============ DEAN ============ */
function DeanDashboard({ store, go }) {
  const { DEAN_DEPTS, DEAN_RESULTS } = window.ROLE_DATA;
  const pending = DEAN_RESULTS.filter((r) => rstate(store, "dean", "result", r.code, r.baseStatus) === "pending").length;
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.dean} />
      <StatCards items={[
        { icon: "building", k: "Departments", v: DEAN_DEPTS.length, plain: true },
        { icon: "user", k: "Faculty students", v: "3,410", plain: true },
        { icon: "chart", k: "Results to sign off", v: pending, tag: pending ? "Review" : "Clear", tone: pending ? "warning" : "success", onClick: () => go("dean-results") },
        { icon: "cap", k: "Graduating (proj.)", v: "612", plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-h3" style={{ marginBottom: 12 }}>Departments</div>
        <DeanDeptRows />
      </Card>
    </div>
  );
}

function DeanDeptRows() {
  const { DEAN_DEPTS } = window.ROLE_DATA;
  const tone = { "In review": "warning", "Submitted": "accent", "Approved": "success" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="u-table">
        <thead><tr><th>Department</th><th>HOD</th><th className="u-right">Students</th><th className="u-right">Staff</th><th>Results</th></tr></thead>
        <tbody>
          {DEAN_DEPTS.map((d) => (
            <tr key={d.dept}>
              <td style={{ fontWeight: 600 }}>{d.dept}</td>
              <td className="u-muted">{d.hod}</td>
              <td className="u-right u-num">{d.students}</td>
              <td className="u-right u-num">{d.staff}</td>
              <td><Tag variant={tone[d.results]} dot>{d.results}</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeanDepts() {
  return (
    <div className="u-content">
      <PageHead title="Departments" sub="Faculty of Computing — 4 departments" />
      <Card className="u-pad"><DeanDeptRows /></Card>
    </div>
  );
}

function DeanApprovals({ store, actions }) {
  const { DEAN_RESULTS } = window.ROLE_DATA;
  const st = (r) => rstate(store, "dean", "result", r.code, r.baseStatus);
  return (
    <div className="u-content">
      <PageHead title="Faculty Result Approvals" sub="Sign off HOD-approved results before they reach Senate" />
      <Card className="u-pad" style={{ marginBottom: 16, background: "var(--bg-sunken)" }}>
        <div className="u-row u-wrap" style={{ gap: 8, alignItems: "center" }}>
          <span className="u-meta" style={{ fontWeight: 600 }}>Approval flow:</span>
          {["Lecturer", "HOD", "Faculty", "Senate", "Released"].map((s, i) => (
            <React.Fragment key={s}>{i > 0 && <Icon name="chevron" size={13} style={{ color: "var(--fg-subtle)" }} />}<Tag variant={s === "Faculty" ? "accent" : undefined}>{s}</Tag></React.Fragment>
          ))}
        </div>
      </Card>
      <Card className="u-pad">
        <div className="u-stack" style={{ gap: 8 }}>
          {DEAN_RESULTS.map((r) => {
            const s = st(r);
            return (
              <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
                <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
                  <span className="u-icon"><Icon name="chart" size={15} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                    <div className="u-meta">{r.dept} · {r.students} students · HOD-approved {r.hodAt}</div>
                  </div>
                </div>
                {s === "pending" ? <Decide onApprove={() => actions.roleAct("dean", "result", r.code, "approved")} onReject={() => actions.roleAct("dean", "result", r.code, "query")} approveLabel="Sign off" rejectLabel="Return" /> : <SPill s={s} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============ EXAMS & RECORDS ============ */
function ExamsDashboard({ store, go }) {
  const { EXAM_PUBLISH, TRANSCRIPTS } = window.ROLE_DATA;
  const ready = EXAM_PUBLISH.filter((r) => rstate(store, "exams", "pub", r.code, r.baseStatus) === "ready").length;
  const tpending = TRANSCRIPTS.filter((t) => rstate(store, "exams", "tr", t.id, t.baseStatus) !== "done").length;
  return (
    <div className="u-content">
      <RoleHero person={window.ROLE_DATA.PEOPLE.exams} />
      <StatCards items={[
        { icon: "chart", k: "Results to publish", v: ready, tag: ready ? "Release" : "Clear", tone: ready ? "warning" : "success", onClick: () => go("exm-publish") },
        { icon: "doc", k: "Transcript requests", v: tpending, tag: tpending ? "Process" : "Clear", tone: tpending ? "warning" : "success", onClick: () => go("exm-trans") },
        { icon: "cap", k: "Records on file", v: "18,402", plain: true },
        { icon: "check", k: "Published this week", v: EXAM_PUBLISH.filter((r) => rstate(store, "exams", "pub", r.code, r.baseStatus) === "published").length, plain: true },
      ]} />
      <Card className="u-pad">
        <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="u-h3">Senate-approved results ready to release</div><a className="fb-link" onClick={() => go("exm-publish")}>All</a>
        </div>
        <ExamPubRows store={store} limit={3} />
      </Card>
    </div>
  );
}

function ExamPubRows({ store, actions, limit }) {
  const { EXAM_PUBLISH } = window.ROLE_DATA;
  let rows = EXAM_PUBLISH; if (limit) rows = rows.slice(0, limit);
  return (
    <div className="u-stack" style={{ gap: 8 }}>
      {rows.map((r) => {
        const s = rstate(store, "exams", "pub", r.code, r.baseStatus);
        return (
          <div key={r.code} className="u-row u-wrap" style={{ gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", justifyContent: "space-between" }}>
            <div className="u-row" style={{ gap: 11, minWidth: 0 }}>
              <span className="u-icon"><Icon name="chart" size={15} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="u-row" style={{ gap: 8 }}><span className="fb-mono" style={{ fontWeight: 600, fontSize: 13 }}>{r.code}</span><Tag>{r.level}</Tag></div>
                <div className="u-meta">{r.title} · {r.dept} · {r.students} students · Senate {r.senateAt}</div>
              </div>
            </div>
            {s === "published" ? <SPill s="published" /> : actions
              ? <Btn variant="accent" size="sm" icon="check" onClick={() => actions.roleAct("exams", "pub", r.code, "published")}>Publish to students</Btn>
              : <Tag variant="accent" dot>Ready</Tag>}
          </div>
        );
      })}
    </div>
  );
}

function ExamsPublish({ store, actions }) {
  return (
    <div className="u-content">
      <PageHead title="Publish Results" sub="Release Senate-approved results to students' portals" />
      <Card className="u-pad"><ExamPubRows store={store} actions={actions} /></Card>
      <div className="u-meta" style={{ marginTop: 12 }}>Once published, results become visible on students' Results screen with GPA and grades.</div>
    </div>
  );
}

function ExamsTranscripts({ store, actions }) {
  const { TRANSCRIPTS, fmt } = window.ROLE_DATA;
  const next = { pending: "processing", processing: "done" };
  const label = { pending: "Start processing", processing: "Mark dispatched" };
  return (
    <div className="u-content">
      <PageHead title="Transcript Requests" sub="Process and dispatch official transcripts" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="u-table">
            <thead><tr><th>Applicant</th><th>Destination</th><th className="u-right">Copies</th><th>Payment</th><th>Status</th><th className="u-right">Action</th></tr></thead>
            <tbody>
              {TRANSCRIPTS.map((t) => {
                const s = rstate(store, "exams", "tr", t.id, t.baseStatus);
                return (
                  <tr key={t.id}>
                    <td><div className="u-row" style={{ gap: 10 }}><Avatar initials={t.initials} size={30} /><div><div style={{ fontWeight: 500 }}>{t.name}</div><div className="u-meta fb-mono">{t.matric}</div></div></div></td>
                    <td>{t.destination}</td>
                    <td className="u-right u-num">{t.copies}</td>
                    <td>{t.paid ? <Tag variant="success" dot>Paid</Tag> : <Tag variant="danger" dot>Unpaid</Tag>}</td>
                    <td><SPill s={s} /></td>
                    <td className="u-right">
                      {s !== "done" && t.paid && <Btn variant={s === "processing" ? "accent" : "secondary"} size="sm" onClick={() => actions.roleAct("exams", "tr", t.id, next[s])}>{label[s]}</Btn>}
                      {!t.paid && <span className="u-meta">Awaiting payment</span>}
                      {s === "done" && <Tag variant="success" dot>Dispatched</Tag>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, {
  Decide,
  AdviserDashboard, AdviserApprovals, AdviserAdvisees,
  HodDashboard, HodAssignments, HodApprovals, HodStaff,
  DeanDashboard, DeanDepts, DeanApprovals,
  ExamsDashboard, ExamsPublish, ExamsTranscripts,
});
