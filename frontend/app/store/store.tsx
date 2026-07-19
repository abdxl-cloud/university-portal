/* The demo store and every action that writes to it, provided over context.

   React Router renders route components directly, so `store`/`actions` reach
   screens through `useStore()` rather than being threaded down as props. */
import React from "react";
import { STUDENT, fmt } from "../data/student-data";
import { STAFF } from "../data/staff-data";
import { HOD_RESULTS } from "../data/roles-data";
import type {
  AssignmentSubmission, Audience, CampusState, Defence, LiveNotification, NotificationInput,
  ProjectState, RolesState, SessionState, SiwesStoreState, Store,
  AdmissionsStoreState, LevelStage, LogEntryStatus, SiwesPlacement, StoreAppointment, StoreLibBook, WorkflowStage,
} from "./types";

export const DEFAULT_STORE: Store = {
  feesPaid: false,
  feesReceipt: null,
  payments: [],
  registration: { status: "none", courses: [], units: 0 },
  deferment: { status: "none", reason: "", details: "", note: "" },
  hostel: { status: "none" },
  submissions: {},
  campus: { loans: [], returned: {}, reservations: [], finePaid: false, appointments: [], cancelled: {}, libBooks: [], libColl: {}, libNewColl: [] },
  staff: { scores: {}, results: {}, grades: {}, materials: {}, posts: {}, assignments: {}, feedback: {} },
  admissions: {
    verified: false, activated: false, state: "jamb_imported",
    step: 0, form: {}, screeningPaid: false,
    queryResponse: "", accepted: false, acceptancePaid: false, clearance: {},
    pool: {}, imported: [], audit: [],
  },
  roles: {},
  events: [],
  notifs: [],
  resultIssues: [],
  // the review chain a compiled level walks before release, configurable by ICT.
  // EO always compiles first and releases last: these are the stages in between.
  workflow: { stages: [{ id: "st-hod", actorRole: "hod", label: "HOD Review" }, { id: "st-dean", actorRole: "dean", label: "School Board (Dean)" }] },
  siwes: { status: "none", placement: null, logbook: [], checkins: [] },
  project: { topic: null, topicStatus: "none", topicNote: "", chapters: {}, log: [], cleared: false, defence: null },
  session: {
    current: "2025/2026", semester: "First Semester",
    registration: true, fees: true, hostel: true, results: false,
    regCloses: "Nov 7, 2025", feesCloses: "Oct 31, 2025",
  },
};

export function genRef(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function nowStr(): string {
  return new Date().toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// append a live notification; `audiences` is one or more portal keys
// ("student", "lecturer", "adviser", …) whose bell should light up
function pushN(s: Store, audiences: Audience | Audience[], n: NotificationInput): LiveNotification[] {
  const list = Array.isArray(audiences) ? audiences : [audiences];
  const added: LiveNotification[] = list.map((aud) => ({
    id: genRef("NTF"), audience: aud, time: "Just now", unread: true,
    tone: "accent", icon: "bell", ...n,
  }));
  return [...added, ...(s.notifs || [])];
}

// campus namespace helper
function cz(s: Store): CampusState {
  return s.campus || { loans: [], returned: {}, reservations: [], finePaid: false, appointments: [], cancelled: {}, libBooks: [], libColl: {}, libNewColl: [] };
}

// session lifecycle namespace helper
function sz(s: Store): SessionState {
  return s.session || { current: "2025/2026", semester: "First Semester", registration: true, fees: true, hostel: true, results: false, regCloses: "Nov 7, 2025", feesCloses: "Oct 31, 2025" };
}

// siwes / industrial training namespace helper
function wz(s: Store): SiwesStoreState {
  return s.siwes || { status: "none", placement: null, logbook: [], checkins: [] };
}

// write a level's pipeline stage (and optionally its position in the
// configured review chain) into store.roles.levels
function withLevelStage(s: Store, key: string, val: LevelStage, reviewIndex?: number): RolesState {
  const roles: RolesState = { ...(s.roles || {}) };
  const lv = { ...(roles.levels || {}) };
  lv.stage = { ...(lv.stage || {}), [key]: val };
  if (reviewIndex !== undefined) lv.reviewIndex = { ...(lv.reviewIndex || {}), [key]: reviewIndex };
  roles.levels = lv;
  return roles;
}

// final-year project namespace helper
function pz(s: Store): ProjectState {
  return s.project || { topic: null, topicStatus: "none", topicNote: "", chapters: {}, log: [], cleared: false, defence: null };
}

// admissions namespace helper
function az(s: Store): AdmissionsStoreState {
  return s.admissions || { verified: false, activated: false, state: "jamb_imported", step: 0, form: {}, screeningPaid: false, queryResponse: "", accepted: false, acceptancePaid: false, clearance: {}, pool: {}, imported: [], audit: [] };
}

// advance the live candidate's state + push an audit entry
function admPush(s: Store, state: AdmissionsStoreState["state"], note?: string): Store {
  const a = az(s);
  const audit = [{ id: "ev" + Date.now() + Math.random().toString(36).slice(2, 5), who: "me", text: note || ("Status → " + state), at: nowStr() }, ...(a.audit || [])];
  return { ...s, admissions: { ...a, state, audit } };
}

/** Read a role decision written by `roleAct`: store.roles[role][key][id].
    Contains the dynamic indexing so call sites stay typed. */
export function rstate<T>(store: Store, role: string, key: string, id: string, fb: T): T {
  const roles = (store.roles || {}) as Record<string, any>;
  const v = roles[role]?.[key]?.[id];
  return v !== undefined ? (v as T) : fb;
}

export interface Actions {
  payFees: (method: string) => void;
  payCharge: (p: { label: string; amount: number; [k: string]: unknown }) => void;
  submitRegistration: (courses: string[], units: number) => void;
  approveRegistration: () => void;
  queryRegistration: (note: string) => void;
  allocateHostel: (a: { hostelName: string; block: string; room: string; bedLabel: string; method?: string; [k: string]: unknown }) => void;
  requestDeferment: (reason: string, details: string) => void;
  decideDeferment: (approve: boolean, note?: string) => void;
  setReleaseMode: (mode: string) => void;
  setWorkflowStages: (stages: WorkflowStage[]) => void;
  eoDecideSheet: (code: string, level: string, decision: string, note?: string) => void;
  eoPresentLevel: (key: string, label: string) => void;
  reviewStageDecide: (key: string, label: string, approve: boolean, note?: string) => void;
  examsPublishLevel: (key: string, label: string) => void;
  examsPublishCourse: (code: string, isDemoLevel: boolean) => void;
  examsCreateCourse: (c: unknown) => void;
  raiseResultIssue: (rec: { code: string; category: string; text: string }) => void;
  resultIssueStatus: (id: string, status: "open" | "resolved", resolution?: string) => void;
  adviserSetUnits: (min: number, max: number) => void;
  markNotifsRead: (audience: Audience) => void;
  submitAssignment: (id: string, sub: AssignmentSubmission) => void;
  setScore: (code: string, matric: string, field: string, value: number | null) => void;
  submitResults: (code: string) => void;
  gradeSubmission: (aid: string, matric: string, grade: number | null) => void;
  addFeedback: (aid: string, matric: string, text: string, page?: number) => void;
  removeFeedback: (aid: string, matric: string, id: string) => void;
  addMaterial: (code: string, m: { name: string; type: string; size: string; date: string }) => void;
  postAnnouncement: (code: string, body: string) => void;
  addAssignment: (code: string, a: { id: string; title: string; due: string; points: number }) => void;
  roleAct: (role: string, key: string, id: string, value: unknown) => void;
  ictCreateUser: (u: Record<string, unknown>) => void;
  ictCreateSession: (name: string) => void;
  toggleWindow: (key: string) => void;
  setSemester: (sem: string) => void;
  publishResults: (on: boolean) => void;
  adviserComment: (adviseeId: string, courseCode: string, text: string) => void;
  repPost: (code: string, body: string) => void;
  repRemind: (aid: string, code: string, title: string, due: string) => void;
  repReport: (rec: { code: string; category: string; text: string }) => void;
  resolveRepIssue: (id: string) => void;
  scheduleEvent: (ev: Record<string, unknown>) => void;
  cancelEvent: (id: string) => void;
  assignInvigilator: (id: string, name: string) => void;
  postClassNote: (code: string, text: string) => void;
  projPropose: (title: string, abstract: string) => void;
  projTopicDecide: (approve: boolean, note?: string) => void;
  projSubmitChapter: (n: number, fileName: string, note?: string) => void;
  projChapterDecide: (n: number, approve: boolean, feedback?: string) => void;
  projLogAdd: (summary: string) => void;
  projLogSign: (id: string) => void;
  projClearDefence: () => void;
  projScheduleDefence: (d: Defence) => void;
  siwesPropose: (placement: SiwesPlacement) => void;
  siwesDecide: (approve: boolean, note?: string) => void;
  siwesStart: () => void;
  siwesComplete: () => void;
  siwesAddLog: (entry: { date: string; activity: string; hours: number }) => void;
  siwesSignLog: (id: string, approve: boolean, note?: string) => void;
  siwesCheckIn: (matched: boolean) => void;
  borrowBook: (b: { id: string; title: string; author: string }) => void;
  returnBook: (id: string) => void;
  renewLoan: (id: string) => void;
  reserveBook: (b: { id: string; title: string; author: string }) => void;
  cancelReservation: (bookId: string) => void;
  payLibraryFine: () => void;
  addLibraryBook: (book: Omit<StoreLibBook, "id" | "addedAt" | "collections">, collections?: string[]) => void;
  createCollection: (name: string, desc?: string) => void;
  bookAppointment: (a: StoreAppointment) => void;
  cancelAppointment: (id: string) => void;
  reset: () => void;
  admVerify: () => void;
  admActivate: () => void;
  admSaveForm: (patch: Record<string, unknown>) => void;
  admSetStep: (n: number) => void;
  admPayScreening: () => void;
  admSubmit: () => void;
  admRespondQuery: (text: string) => void;
  admAccept: () => void;
  admPayAcceptance: () => void;
  admClearItem: (id: string) => void;
  admEnrol: () => void;
  admStaffSet: (state: AdmissionsStoreState["state"], note?: string) => void;
  admStaffQuery: (text: string) => void;
  admPoolSet: (id: string, state: AdmissionsStoreState["state"], note?: string) => void;
  admImport: (jambs: string[]) => void;
}

const STORE_KEY = "futech.store";

function loadStore(): Store {
  // SPA mode still prerenders the root route in Node to emit index.html, where
  // there is no localStorage — fall back to defaults rather than throwing.
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    return { ...DEFAULT_STORE, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return DEFAULT_STORE;
  }
}

export function useStoreState(): { store: Store; actions: Actions } {
  const [store, setStore] = React.useState<Store>(loadStore);

  React.useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }, [store]);

  const actions = React.useMemo<Actions>(() => ({
    payFees: (method) => setStore((s) => ({ ...s, feesPaid: true, feesReceipt: { ref: genRef("PAY"), date: nowStr(), method: ({ card: "Debit card", transfer: "Bank transfer", ussd: "USSD" } as Record<string, string>)[method] || "Card" }, notifs: pushN(s, "student", { icon: "wallet", tone: "success", title: "School fees confirmed", body: "Your 2025/2026 payment was received. Course registration and hostel application are now unlocked." }) })),
    payCharge: (p) => setStore((s) => ({ ...s, payments: [{ id: genRef("PAY"), ref: genRef("PAY"), date: nowStr(), ...p }, ...(s.payments || [])], notifs: pushN(s, "student", { icon: "wallet", tone: "success", title: "Payment received: " + p.label, body: "Your payment of " + fmt(p.amount) + " was successful. Receipt available under Finance." }) })),
    submitRegistration: (courses, units) => setStore((s) => ({ ...s, registration: { status: "pending", courses, units }, notifs: pushN(s, "adviser", { icon: "book", tone: "warning", title: "New course form submitted", body: STUDENT.name + " submitted " + courses.length + " courses (" + units + " units) for your approval." }) })),
    approveRegistration: () => setStore((s) => ({ ...s, registration: { ...s.registration, status: "approved" }, notifs: pushN(s, "student", { icon: "check", tone: "success", title: "Course registration approved", body: "Dr. C. Madu approved your course form. Your class spaces are now open." }) })),
    queryRegistration: (note) => setStore((s) => ({ ...s, registration: { ...s.registration, status: "query", note }, notifs: pushN(s, "student", { icon: "info", tone: "warning", title: "Course registration returned", body: "Dr. C. Madu sent your course form back: " + note }) })),
    allocateHostel: (a) => setStore((s) => ({ ...s, hostel: { status: "allocated", ...a, ref: genRef("HST"), date: nowStr(), method: a.method || "Debit card" }, notifs: pushN(s, "student", { icon: "bed", tone: "success", title: "Bed space allocated", body: a.hostelName + " · Block " + a.block + " · Room " + a.room + " · " + a.bedLabel + ". Print your slip from the Hostel page." }) })),
    // ---- deferment: the one "student case" type a student actually requests
    // themselves (Absconded/Suspended/DEX/Teaching Practice stay department-raised).
    // Approving writes into the same levels/case slot HOD & Dean's broadsheet
    // review already reads, so it flows through the existing case mechanism. ----
    requestDeferment: (reason, details) => setStore((s) => ({
      ...s, deferment: { status: "pending", reason, details, note: "" },
      notifs: pushN(s, "adviser", { icon: "info", tone: "warning", title: "Deferment requested", body: STUDENT.name + " requested a deferment (" + reason + "). Review under Advisees." }),
    })),
    decideDeferment: (approve, note) => setStore((s) => {
      const base: Store = { ...s, deferment: { ...(s.deferment || {}), status: approve ? "approved" : "declined", note: note || "" } };
      if (!approve) {
        return { ...base, notifs: pushN(s, "student", { icon: "info", tone: "warning", title: "Deferment request declined", body: "Your level adviser declined your deferment request" + (note ? ": " + note : ".") }) };
      }
      const roles: RolesState = { ...(base.roles || {}) };
      const levels = { ...(roles.levels || {}) };
      const cases = { ...(levels.case || {}) };
      cases["CSC-300L|" + STUDENT.matric] = { type: "Deferment", status: "approved" };
      levels.case = cases; roles.levels = levels;
      return {
        ...base, roles,
        notifs: pushN(base, "student", { icon: "check", tone: "success", title: "Deferment approved", body: "Your level adviser approved your deferment. This semester is excluded from your GPA." }),
      };
    }),
    // ---- level result pipeline: EO approves each course sheet and compiles the
    // level → it walks the configured review chain (ICT-editable) → Senate stamp
    // → Exams releases. ----
    setReleaseMode: (mode) => setStore((s) => ({ ...s, session: { ...sz(s), releaseMode: mode } })),
    setWorkflowStages: (stages) => setStore((s) => ({ ...s, workflow: { ...(s.workflow || {}), stages } })),
    // EO decides one course sheet. If that was the last pending sheet for the
    // live 300L level, it compiles automatically: no separate "compile" step :
    // and hands off to the first configured review stage (or straight to
    // "ready" if none are configured). The EO can always view the level
    // result regardless of stage; nothing here restricts that.
    eoDecideSheet: (code, level, decision, note) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const eo = { ...(roles.eo || {}) };
      eo.result = { ...(eo.result || {}), [code]: decision };
      if (note) eo.note = { ...(eo.note || {}), [code]: note };
      roles.eo = eo;
      let out: Store = {
        ...s, roles,
        notifs: decision === "query"
          ? pushN(s, "lecturer", { icon: "info", tone: "warning", title: "Course sheet returned: " + code, body: "Exams & Records sent your " + code + " results back: " + note })
          : (s.notifs || []),
      };
      // the level itself does not advance automatically: it just becomes
      // eligible; Exams & Records still has to choose to push it for scrutiny
      // (see eoPresentLevel) so nothing reaches HOD/Dean without that decision
      if (decision === "approved" && level === "300L") {
        const levelSheets = HOD_RESULTS.filter((r) => r.level === "300L");
        const allApproved = levelSheets.every((r) => (eo.result![r.code] || r.baseStatus) === "approved");
        if (allApproved) {
          out = { ...out, notifs: pushN(out, "exams", { icon: "check", tone: "success", title: "Level ready to compile", body: "Computer Science 300L: every course sheet is now approved. Push it for scrutiny from Level Results when you're ready." }) };
        }
      }
      return out;
    }),
    // Exams & Records explicitly pushes a fully-approved level for scrutiny :
    // this is the moment HOD/Dean/whoever's first in the workflow first gets
    // to see it. Nothing before this point is visible outside Exams & Records.
    eoPresentLevel: (key, label) => setStore((s) => {
      const stages = (s.workflow && s.workflow.stages) || [];
      return stages.length === 0
        ? { ...s, roles: withLevelStage(s, key, "ready", 0), notifs: pushN(s, "exams", { icon: "check", tone: "success", title: "Level compiled", body: label + " compiled: no review stages configured, ready to release." }) }
        : { ...s, roles: withLevelStage(s, key, "reviewing", 0), notifs: pushN(s, [stages[0].actorRole], { icon: "chart", tone: "warning", title: "Your review: " + label, body: label + " has been compiled and pushed for scrutiny by Exams & Records. Now awaiting " + stages[0].label + "." }) };
    }),
    reviewStageDecide: (key, label, approve, note) => setStore((s) => {
      const stages = (s.workflow && s.workflow.stages) || [];
      const idx = (s.roles?.levels?.reviewIndex || {})[key] || 0;
      if (!approve) {
        const roles = withLevelStage(s, key, "compiling", 0);
        const levels = { ...(roles.levels || {}) };
        if (note) levels.reviewNote = { ...(levels.reviewNote || {}), [key]: note };
        return {
          ...s, roles: { ...roles, levels },
          notifs: pushN(s, "exams", { icon: "info", tone: "warning", title: "Level results returned", body: label + " was returned by " + (stages[idx] ? stages[idx].label : "a reviewer") + (note ? ": " + note : ".") }),
        };
      }
      const next = idx + 1;
      if (next >= stages.length) {
        return {
          ...s, roles: withLevelStage(s, key, "ready", next),
          notifs: pushN(s, "exams", { icon: "check", tone: "success", title: "Level results Senate-approved", body: label + " has cleared every review stage and been ratified. It is ready to release." }),
        };
      }
      return {
        ...s, roles: withLevelStage(s, key, "reviewing", next),
        notifs: pushN(s, stages[next].actorRole === "dean" ? ["dean"] : [stages[next].actorRole], { icon: "chart", tone: "warning", title: "Your review: " + label, body: stages[idx].label + " approved. Now awaiting " + stages[next].label + "." }),
      };
    }),
    examsPublishLevel: (key) => setStore((s) => ({
      ...s, roles: withLevelStage(s, key, "published"),
      notifs: key === "CSC-300L"
        ? pushN(s, "student", { icon: "chart", tone: "accent", title: "Semester results released", body: "Your 300L First Semester results are now available on the Results page." })
        : (s.notifs || []),
    })),
    // per-course release, when ICT policy is set to "per course"
    examsPublishCourse: (code, isDemoLevel) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const ex = { ...(roles.exams || {}) };
      ex.pubc = { ...(ex.pubc || {}), [code]: true };
      roles.exams = ex;
      return {
        ...s, roles,
        notifs: isDemoLevel
          ? pushN(s, "student", { icon: "chart", tone: "accent", title: "Result released: " + code, body: "Your " + code + " result is out. Your GPA stays provisional until the full level is released." })
          : (s.notifs || []),
      };
    }),
    // EO: course catalogue, result issues, adviser unit limits
    examsCreateCourse: (c) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const ex = { ...(roles.exams || {}) };
      ex.courses = [c, ...(ex.courses || [])];
      roles.exams = ex;
      return { ...s, roles };
    }),
    raiseResultIssue: (rec) => setStore((s) => ({
      ...s,
      resultIssues: [{ id: genRef("RIS"), at: nowStr(), status: "open", student: STUDENT.name, matric: STUDENT.matric, ...rec }, ...(s.resultIssues || [])],
      notifs: pushN(s, ["exams", "lecturer"], { icon: "info", tone: "warning", title: "Result issue raised: " + rec.code, body: rec.category + ": " + rec.text }),
    })),
    resultIssueStatus: (id, status, resolution) => setStore((s) => ({
      ...s,
      resultIssues: (s.resultIssues || []).map((i) => i.id === id ? { ...i, status, resolution: resolution || i.resolution } : i),
      notifs: status === "resolved"
        ? pushN(s, "student", { icon: "check", tone: "success", title: "Result issue resolved", body: resolution || "Your result complaint has been resolved by Exams & Records." })
        : (s.notifs || []),
    })),
    adviserSetUnits: (min, max) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const adv = { ...(roles.adviser || {}) };
      adv.units = { min, max };
      roles.adviser = adv;
      return { ...s, roles, notifs: pushN(s, "student", { icon: "book", title: "Registration limits updated", body: "Your level adviser set the unit load to " + min + "–" + max + " units this semester." }) };
    }),
    markNotifsRead: (audience) => setStore((s) => ({ ...s, notifs: (s.notifs || []).map((n) => n.audience === audience ? { ...n, unread: false } : n) })),
    submitAssignment: (id, sub) => setStore((s) => ({ ...s, submissions: { ...(s.submissions || {}), [id]: sub } })),
    // staff actions
    setScore: (code, matric, field, value) => setStore((s) => {
      const staff = s.staff || {}; const scores = { ...(staff.scores || {}) };
      const k = code + ":" + matric; scores[k] = { ...(scores[k] || {}), [field]: value };
      return { ...s, staff: { ...staff, scores } };
    }),
    submitResults: (code) => setStore((s) => {
      const out: Store = { ...s, staff: { ...s.staff, results: { ...(s.staff && s.staff.results), [code]: "submitted" } } };
      // resubmitting after a query puts the sheet back in the EO's queue as pending
      const seed = HOD_RESULTS.find((r) => r.code === code);
      if (!seed) return out;
      const roles: RolesState = { ...(out.roles || {}) };
      const eo = { ...(roles.eo || {}) };
      eo.result = { ...(eo.result || {}), [code]: "pending" };
      roles.eo = eo;
      return { ...out, roles };
    }),
    gradeSubmission: (aid, matric, grade) => setStore((s) => ({ ...s, staff: { ...s.staff, grades: { ...(s.staff && s.staff.grades), [aid + ":" + matric]: grade } } })),
    addFeedback: (aid, matric, text, page) => setStore((s) => { const fb = { ...(s.staff && s.staff.feedback) }; const k = aid + ":" + matric; fb[k] = [...(fb[k] || []), { id: genRef("FB"), text, page, at: nowStr() }]; return { ...s, staff: { ...s.staff, feedback: fb } }; }),
    removeFeedback: (aid, matric, id) => setStore((s) => { const fb = { ...(s.staff && s.staff.feedback) }; const k = aid + ":" + matric; fb[k] = (fb[k] || []).filter((c) => c.id !== id); return { ...s, staff: { ...s.staff, feedback: fb } }; }),
    addMaterial: (code, m) => setStore((s) => { const mats = { ...(s.staff && s.staff.materials) }; mats[code] = [m, ...(mats[code] || [])]; return { ...s, staff: { ...s.staff, materials: mats } }; }),
    postAnnouncement: (code, body) => setStore((s) => { const posts = { ...(s.staff && s.staff.posts) }; posts[code] = [{ who: STAFF.name, time: nowStr(), body }, ...(posts[code] || [])]; return { ...s, staff: { ...s.staff, posts } }; }),
    addAssignment: (code, a) => setStore((s) => { const asg = { ...(s.staff && s.staff.assignments) }; asg[code] = [...(asg[code] || []), a]; return { ...s, staff: { ...s.staff, assignments: asg } }; }),
    // generic multi-role decision action: store.roles[role][key][id] = value
    roleAct: (role, key, id, value) => setStore((s) => {
      const roles = { ...(s.roles || {}) } as Record<string, any>;
      const r = { ...(roles[role] || {}) };
      const m = { ...(r[key] || {}) };
      m[id] = value; r[key] = m; roles[role] = r;
      return { ...s, roles: roles as RolesState };
    }),
    // ---- ICT admin: provision users & sessions ----
    ictCreateUser: (u) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const ict = { ...(roles.ict || {}) };
      ict.users = [{ id: "usr-new-" + Date.now(), last: "just now", baseStatus: "active", ...u }, ...(ict.users || [])];
      roles.ict = ict;
      return { ...s, roles };
    }),
    ictCreateSession: (name) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const ict = { ...(roles.ict || {}) };
      ict.sessions = [...(ict.sessions || []), { name, state: "Draft", reg: "Closed", fees: "Closed" }];
      roles.ict = ict;
      return { ...s, roles };
    }),
    // ---- semester lifecycle (registrar / ICT controls) ----
    toggleWindow: (key) => setStore((s) => { const se = sz(s); return { ...s, session: { ...se, [key]: !se[key] } }; }),
    setSemester: (sem) => setStore((s) => ({ ...s, session: { ...sz(s), semester: sem } })),
    publishResults: (on) => setStore((s) => ({ ...s, session: { ...sz(s), results: on } })),
    // adviser per-course advice: store.roles.adviser.advice[adviseeId][courseCode] = text
    adviserComment: (adviseeId, courseCode, text) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const r = { ...(roles.adviser || {}) };
      const advice = { ...(r.advice || {}) };
      const perStudent = { ...(advice[adviseeId] || {}) };
      if (text) perStudent[courseCode] = text; else delete perStudent[courseCode];
      advice[adviseeId] = perStudent; r.advice = advice; roles.adviser = r;
      return { ...s, roles };
    }),
    // ---- class rep (store.roles.rep.*) ----
    repPost: (code, body) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const rep = { ...(roles.rep || {}) };
      const posts = { ...(rep.posts || {}) };
      posts[code] = [{ id: genRef("RP"), body, at: nowStr() }, ...(posts[code] || [])];
      rep.posts = posts; roles.rep = rep;
      return { ...s, roles };
    }),
    repRemind: (aid, code, title, due) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const rep = { ...(roles.rep || {}) };
      const posts = { ...(rep.posts || {}) };
      posts[code] = [{ id: genRef("RP"), body: "Reminder from your class rep: “" + title + "” is due " + due + ". Submit on the Assignments tab.", at: nowStr() }, ...(posts[code] || [])];
      rep.posts = posts;
      rep.reminded = { ...(rep.reminded || {}), [aid]: true };
      roles.rep = rep;
      return { ...s, roles };
    }),
    repReport: (rec) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const rep = { ...(roles.rep || {}) };
      rep.issues = [{ id: genRef("ISS"), at: nowStr(), status: "open", ...rec }, ...(rep.issues || [])];
      roles.rep = rep;
      return { ...s, roles, notifs: pushN(s, "adviser", { icon: "info", tone: "warning", title: "Class rep reported an issue", body: rec.code + " · " + rec.category + ": " + rec.text }) };
    }),
    resolveRepIssue: (id) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const rep = { ...(roles.rep || {}) };
      rep.issues = (rep.issues || []).map((i) => i.id === id ? { ...i, status: "resolved" } : i);
      roles.rep = rep;
      return { ...s, roles };
    }),
    // ---- dean/hod scheduled meetings & events ----
    scheduleEvent: (ev) => setStore((s) => {
      const e = ev as { audience?: string; title?: string; day?: string; start?: string; venue?: string; by?: string; clashes?: { code: string }[] };
      const audiences: Audience[] = e.audience === "both" ? ["student", "lecturer"] : e.audience === "students" ? ["student"] : ["lecturer"];
      return {
        ...s,
        events: [{ id: genRef("EVT"), createdAt: nowStr(), ...ev } as Store["events"][number], ...(s.events || [])],
        notifs: pushN(s, audiences, { icon: "calendar", title: "New on your schedule: " + e.title, body: e.day + " " + e.start + " · " + e.venue + " · scheduled by " + e.by + (e.clashes && e.clashes.length ? ". Note: clashes with " + e.clashes.map((c) => c.code).join(", ") + "." : ".") }),
      };
    }),
    cancelEvent: (id) => setStore((s) => ({ ...s, events: (s.events || []).filter((e) => e.id !== id) })),
    assignInvigilator: (id, name) => setStore((s) => ({ ...s, events: (s.events || []).map((e) => e.id === id ? { ...e, invigilator: name } : e) })),
    // mini-lecturer hat: class notes posted per course code
    postClassNote: (code, text) => setStore((s) => {
      const roles: RolesState = { ...(s.roles || {}) };
      const mini = { ...(roles.mini || {}) };
      const notes = { ...(mini.notes || {}) };
      notes[code] = [{ id: "cn" + Date.now(), text, at: nowStr() }, ...(notes[code] || [])];
      mini.notes = notes; roles.mini = mini;
      return { ...s, roles };
    }),
    // ---- final-year project (400L): topic → chapters → clearance → defence ----
    projPropose: (title, abstract) => setStore((s) => ({
      ...s, project: { ...pz(s), topic: { title, abstract }, topicStatus: "pending", topicNote: "" },
      notifs: pushN(s, "lecturer", { icon: "doc", tone: "warning", title: "Project topic proposed", body: STUDENT.name + " proposed: “" + title + "”. Review it under Supervision." }),
    })),
    projTopicDecide: (approve, note) => setStore((s) => ({
      ...s, project: { ...pz(s), topicStatus: approve ? "approved" : "returned", topicNote: note || "" },
      notifs: pushN(s, "student", approve
        ? { icon: "check", tone: "success", title: "Project topic approved", body: "Your supervisor approved your topic. You can now submit Chapter 1." }
        : { icon: "info", tone: "warning", title: "Project topic returned", body: (note ? "“" + note + "”: " : "") + "Revise your topic and propose again." }),
    })),
    projSubmitChapter: (n, fileName, note) => setStore((s) => ({
      ...s, project: { ...pz(s), chapters: { ...pz(s).chapters, [n]: { status: "submitted", fileName, note: note || "", at: nowStr(), feedback: "" } } },
      notifs: pushN(s, "lecturer", { icon: "doc", tone: "warning", title: "Chapter " + n + " submitted", body: STUDENT.name + " submitted Chapter " + n + " for review." }),
    })),
    projChapterDecide: (n, approve, feedback) => setStore((s) => ({
      ...s, project: { ...pz(s), chapters: { ...pz(s).chapters, [n]: { ...(pz(s).chapters[n] || {}), status: approve ? "approved" : "revise", feedback: feedback || "", decidedAt: nowStr() } } },
      notifs: pushN(s, "student", approve
        ? { icon: "check", tone: "success", title: "Chapter " + n + " approved", body: feedback ? "Supervisor: “" + feedback + "”" : "Move on to the next chapter." }
        : { icon: "info", tone: "warning", title: "Chapter " + n + " needs revision", body: feedback ? "Supervisor: “" + feedback + "”" : "See your supervisor's comments and resubmit." }),
    })),
    projLogAdd: (summary) => setStore((s) => ({
      ...s, project: { ...pz(s), log: [{ id: genRef("MTG"), at: nowStr(), summary, status: "pending" }, ...pz(s).log] },
      notifs: pushN(s, "lecturer", { icon: "calendar", title: "Supervision meeting logged", body: STUDENT.name + " logged a consultation for your sign-off." }),
    })),
    projLogSign: (id) => setStore((s) => ({
      ...s, project: { ...pz(s), log: pz(s).log.map((l) => l.id === id ? { ...l, status: "signed" } : l) },
    })),
    projClearDefence: () => setStore((s) => ({
      ...s, project: { ...pz(s), cleared: true },
      notifs: pushN(s, "student", { icon: "cap", tone: "success", title: "Cleared for defence", body: "Your supervisor has cleared your project. The department will schedule your defence." }),
    })),
    projScheduleDefence: (d) => setStore((s) => ({
      ...s, project: { ...pz(s), defence: { ...d, at: nowStr() } },
      notifs: pushN(s, ["student", "lecturer"], { icon: "calendar", tone: "accent", title: "Project defence scheduled", body: d.day + " " + d.start + " · " + d.venue + " · Panel: " + d.panel }),
    })),
    // siwes / industrial training (400L)
    siwesPropose: (placement) => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "proposed", placement } })),
    siwesDecide: (approve, note) => setStore((s) => { const w = wz(s); return { ...s, siwes: { ...w, status: approve ? "approved" : "rejected", deptNote: note || "" } }; }),
    siwesStart: () => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "ongoing" } })),
    siwesComplete: () => setStore((s) => ({ ...s, siwes: { ...wz(s), status: "completed" } })),
    siwesAddLog: (entry) => setStore((s) => { const w = wz(s); const log = { id: "lg" + Date.now(), status: "submitted" as const, supervisorNote: "", ...entry }; return { ...s, siwes: { ...w, logbook: [log, ...w.logbook] } }; }),
    siwesSignLog: (id, approve, note) => setStore((s) => {
      const w = wz(s);
      const status: LogEntryStatus = approve ? "signed" : "returned";
      const logbook = w.logbook.map((l) => l.id === id ? { ...l, status, supervisorNote: note || l.supervisorNote } : l);
      return { ...s, siwes: { ...w, logbook } };
    }),
    siwesCheckIn: (matched) => setStore((s) => { const w = wz(s); const rec = { id: "ci" + Date.now(), at: nowStr(), matched }; return { ...s, siwes: { ...w, checkins: [rec, ...w.checkins] } }; }),
    // campus: library
    borrowBook: (b) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, loans: [...c.loans, { id: "UL" + Date.now(), bookId: b.id, title: b.title, author: b.author, borrowed: "Today", due: "in 14 days", overdue: false, renewed: false }] } }; }),
    returnBook: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, returned: { ...c.returned, [id]: true } } }; }),
    renewLoan: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, loans: c.loans.map((l) => l.id === id ? { ...l, renewed: true, due: "in 14 days" } : l), renewedSeed: { ...(c.renewedSeed || {}), [id]: true } } }; }),
    reserveBook: (b) => setStore((s) => { const c = cz(s); if (c.reservations.some((r) => r.bookId === b.id)) return s; return { ...s, campus: { ...c, reservations: [...c.reservations, { bookId: b.id, title: b.title, author: b.author }] } }; }),
    cancelReservation: (bookId) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, reservations: c.reservations.filter((r) => r.bookId !== bookId) } }; }),
    payLibraryFine: () => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, finePaid: true } }; }),
    // librarian: acquisitions & collections
    addLibraryBook: (book, collections) => setStore((s) => {
      const c = cz(s);
      const id = "nb" + Date.now();
      const rec = { ...book, id, addedAt: "Today", collections: collections || [] };
      const libColl = { ...(c.libColl || {}) };
      (collections || []).forEach((cid) => { libColl[cid] = [...(libColl[cid] || []), id]; });
      return { ...s, campus: { ...c, libBooks: [rec, ...(c.libBooks || [])], libColl } };
    }),
    createCollection: (name, desc) => setStore((s) => {
      const c = cz(s);
      const id = "c" + Date.now();
      return { ...s, campus: { ...c, libNewColl: [...(c.libNewColl || []), { id, name, desc: desc || "", icon: "layers", seed: [] }] } };
    }),
    // campus: clinic
    bookAppointment: (a) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, appointments: [...c.appointments, a] } }; }),
    cancelAppointment: (id) => setStore((s) => { const c = cz(s); return { ...s, campus: { ...c, cancelled: { ...c.cancelled, [id]: true } } }; }),
    reset: () => { setStore(DEFAULT_STORE); localStorage.removeItem("futech.route"); },
    // ---- admissions: candidate ----
    admVerify: () => setStore((s) => ({ ...s, admissions: { ...az(s), verified: true } })),
    admActivate: () => setStore((s) => ({ ...s, admissions: { ...az(s), activated: true, state: az(s).state === "jamb_imported" ? "draft" : az(s).state } })),
    admSaveForm: (patch) => setStore((s) => ({ ...s, admissions: { ...az(s), form: { ...az(s).form, ...patch } } })),
    admSetStep: (n) => setStore((s) => ({ ...s, admissions: { ...az(s), step: n } })),
    admPayScreening: () => setStore((s) => ({ ...s, admissions: { ...az(s), screeningPaid: true } })),
    admSubmit: () => setStore((s) => admPush(s, "submitted", "Application submitted by candidate")),
    admRespondQuery: (text) => setStore((s) => admPush({ ...s, admissions: { ...az(s), queryResponse: text } }, "under_review", "Candidate responded to query")),
    admAccept: () => setStore((s) => admPush({ ...s, admissions: { ...az(s), accepted: true } }, "accepted", "Offer accepted by candidate")),
    admPayAcceptance: () => setStore((s) => admPush({ ...s, admissions: { ...az(s), acceptancePaid: true } }, "clearance_pending", "Acceptance fee paid")),
    admClearItem: (id) => setStore((s) => { const a = az(s); const cl = { ...a.clearance, [id]: !a.clearance[id] }; return { ...s, admissions: { ...a, clearance: cl } }; }),
    admEnrol: () => setStore((s) => admPush(s, "enrolled", "Fresh-student clearance completed")),
    // ---- admissions: staff (acts on live candidate) ----
    admStaffSet: (state, note) => setStore((s) => admPush(s, state, note || ("Status set to " + state))),
    admStaffQuery: (text) => setStore((s) => admPush({ ...s, admissions: { ...az(s), staffQuery: text } }, "queried", "Query raised: " + text)),
    // ---- admissions: staff (acts on seed pool) ----
    admPoolSet: (id, state, note) => setStore((s) => { const a = az(s); const pool = { ...a.pool, [id]: { ...(a.pool[id] || {}), state } }; const audit = [{ id: "ev" + Date.now(), who: id, text: note || ("Set to " + state), at: nowStr() }, ...(a.audit || [])]; return { ...s, admissions: { ...a, pool, audit } }; }),
    admImport: (jambs) => setStore((s) => { const a = az(s); const audit = [{ id: "ev" + Date.now(), who: "batch", text: jambs.length + " candidate(s) imported from JAMB", at: nowStr() }, ...(a.audit || [])]; return { ...s, admissions: { ...a, imported: [...new Set([...(a.imported || []), ...jambs])], audit } }; }),
  }), []);

  return { store, actions };
}

export interface StoreContextValue {
  store: Store;
  actions: Actions;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreState();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
