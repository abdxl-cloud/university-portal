/* The demo store: every mutation the prototype can make, in one serialisable
   object persisted to localStorage under `futech.store`. */
import type { IconName, Tone } from "../types";
import type { CandidateState } from "../data/admissions-data";
import type { SiwesState as SiwesLifecycle } from "../data/siwes-data";

/** Which portal's bell a live notification lights up. */
export type Audience =
  | "student" | "lecturer" | "adviser" | "hod" | "dean" | "exams"
  | "bursary" | "hostel" | "registry" | "ict" | "admissions";

/** A notification created at runtime by an action (seeded ones live in data/). */
export interface LiveNotification {
  id: string;
  audience: Audience;
  time: string;
  unread: boolean;
  tone: Tone;
  icon: IconName;
  title: string;
  body: string;
}

/** What an action passes to pushN — the store stamps the rest. */
export interface NotificationInput {
  icon?: IconName;
  tone?: Tone;
  title: string;
  body: string;
}

export interface Receipt {
  ref: string;
  date: string;
  method: string;
}

export interface PaymentEntry {
  id: string;
  ref: string;
  date: string;
  label: string;
  amount: number;
  [extra: string]: unknown;
}

export type RegistrationStatus = "none" | "pending" | "approved" | "query";

export interface RegistrationState {
  status: RegistrationStatus;
  /** Course codes, e.g. "CSC 301". */
  courses: string[];
  units: number;
  note?: string;
}

/** A student's submission for one assignment. */
export interface AssignmentSubmission {
  status: "open" | "submitted" | "graded";
  submittedAt?: string;
  fileName?: string;
  note?: string;
  grade?: number;
  feedback?: string;
}

export type DefermentStatus = "none" | "pending" | "approved" | "declined";

export interface DefermentState {
  status: DefermentStatus;
  reason: string;
  details: string;
  note: string;
}

export interface HostelState {
  status: "none" | "allocated";
  hostelName?: string;
  block?: string;
  room?: string;
  bedLabel?: string;
  /** Price of the allocated bed, carried through to the finance ledger. */
  price?: number;
  ref?: string;
  date?: string;
  method?: string;
}

/** A book a student has borrowed (created at runtime by borrowBook). */
export interface StoreLoan {
  id: string;
  bookId: string;
  title: string;
  author: string;
  borrowed: string;
  due: string;
  overdue: boolean;
  renewed: boolean;
}

export interface StoreAppointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  doctor?: string;
}

/** A book added by the librarian at runtime. Carries the full catalogue shape
    so it merges with the seed BOOKS list on the shelf. */
export interface StoreLibBook {
  id: string;
  title: string;
  author: string;
  cat: string;
  year: number;
  copies: number;
  available: number;
  call: string;
  publisher?: string;
  isbn?: string;
  shelf?: string;
  addedAt: string;
  collections: string[];
}

/** A collection created by the librarian at runtime. */
export interface StoreCollection {
  id: string;
  name: string;
  desc: string;
  icon: string;
  seed: string[];
}

export interface CampusState {
  loans: StoreLoan[];
  returned: Record<string, boolean>;
  reservations: { bookId: string; title: string; author: string }[];
  finePaid: boolean;
  appointments: StoreAppointment[];
  cancelled: Record<string, boolean>;
  libBooks: StoreLibBook[];
  libColl: Record<string, string[]>;
  libNewColl: StoreCollection[];
  renewedSeed?: Record<string, boolean>;
}

/** A feedback comment on a submission. `page` 0 means "general". */
export interface FeedbackComment {
  id: string;
  text: string;
  page?: number;
  at: string;
}

/** A lecturer-authored material/post/assignment carries an open shape (seed
    vs. store-added rows differ), so these stay index-typed. */
export interface StaffState {
  scores: Record<string, { ca?: number | null; exam?: number | null }>;
  results: Record<string, string>;
  grades: Record<string, number | null>;
  materials: Record<string, { name: string; type: string; size: string; date: string }[]>;
  posts: Record<string, { who?: string; time: string; body: string }[]>;
  assignments: Record<string, { id: string; title: string; due: string; points: number }[]>;
  feedback: Record<string, FeedbackComment[]>;
}

export interface AdmissionsStoreState {
  verified: boolean;
  activated: boolean;
  state: CandidateState;
  step: number;
  form: Record<string, unknown>;
  screeningPaid: boolean;
  queryResponse: string;
  accepted: boolean;
  acceptancePaid: boolean;
  clearance: Record<string, boolean>;
  pool: Record<string, { state: CandidateState }>;
  imported: string[];
  audit: { id: string; who: string; text: string; at: string }[];
  staffQuery?: string;
}

/** One stage in the level-result review chain, configurable by ICT. */
export interface WorkflowStage {
  id: string;
  actorRole: Audience;
  label: string;
}

export interface Workflow {
  stages: WorkflowStage[];
}

/** The host company a student proposes for industrial training. */
export interface SiwesPlacement {
  company: string;
  address: string;
  industry: string;
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail: string;
  startDate: string;
  endDate: string;
}

export type LogEntryStatus = "submitted" | "signed" | "returned";

export interface SiwesLogEntry {
  id: string;
  date: string;
  activity: string;
  hours: number;
  status: LogEntryStatus;
  supervisorNote: string;
}

export interface SiwesCheckin {
  id: string;
  at: string;
  /** Whether the (simulated) device location matched the placement address. */
  matched: boolean;
}

export interface SiwesStoreState {
  status: SiwesLifecycle;
  placement: SiwesPlacement | null;
  logbook: SiwesLogEntry[];
  checkins: SiwesCheckin[];
  deptNote?: string;
}

export interface ProjectState {
  topic: { title: string; abstract: string } | null;
  topicStatus: "none" | "pending" | "approved" | "returned";
  topicNote: string;
  chapters: Record<string, { status: string; fileName?: string; note?: string; at?: string; feedback?: string; decidedAt?: string }>;
  log: { id: string; at: string; summary: string; status: string }[];
  cleared: boolean;
  defence: Defence | null;
}

export interface Defence {
  day: string;
  start: string;
  venue: string;
  panel: string;
  at?: string;
}

export interface SessionState {
  current: string;
  semester: string;
  registration: boolean;
  fees: boolean;
  hostel: boolean;
  results: boolean;
  regCloses: string;
  feesCloses: string;
  releaseMode?: string;
  [window: string]: unknown;
}

/** Who a scheduled event appears for. Matches the scheduling form's options. */
export type EventAudienceValue = "both" | "students" | "staff";

export interface EventRec {
  id: string;
  createdAt: string;
  title: string;
  day: string;
  start: string;
  venue: string;
  by: string;
  audience: EventAudienceValue;
  type?: string;
  invigilator?: string;
  clashes?: { code: string }[];
  [extra: string]: unknown;
}

export interface ResultIssue {
  id: string;
  at: string;
  status: "open" | "resolved";
  student: string;
  matric: string;
  code: string;
  category: string;
  text: string;
  resolution?: string;
}

/* ---- roles: the generic decision bag, plus the slices with known shapes ---- */

/** Where a compiled level sits in the review chain. */
export type LevelStage = "compiling" | "reviewing" | "ready" | "published";

export interface LevelsState {
  stage?: Record<string, LevelStage>;
  reviewIndex?: Record<string, number>;
  reviewNote?: Record<string, string>;
  case?: Record<string, { type: string; status: string }>;
}

export interface EoState {
  result?: Record<string, string>;
  note?: Record<string, string>;
}

export interface ExamsRoleState {
  pubc?: Record<string, boolean>;
  courses?: unknown[];
}

export interface IctRoleState {
  users?: { id: string; last: string; baseStatus: string; [k: string]: unknown }[];
  sessions?: { name: string; state: string; reg: string; fees: string }[];
}

export interface AdviserRoleState {
  units?: { min: number; max: number };
  advice?: Record<string, Record<string, string>>;
}

export interface RepRoleState {
  posts?: Record<string, { id: string; body: string; at: string }[]>;
  issues?: { id: string; at: string; status: string; [k: string]: unknown }[];
  reminded?: Record<string, boolean>;
}

export interface MiniRoleState {
  notes?: Record<string, { id: string; text: string; at: string }[]>;
}

/** store.roles: named slices above, plus `roles[role][key][id]` written by
    roleAct for every ad-hoc decision. Read it through `rstate`, which contains
    the dynamic indexing rather than leaking `any` to call sites. */
export interface RolesState {
  levels?: LevelsState;
  eo?: EoState;
  exams?: ExamsRoleState;
  ict?: IctRoleState;
  adviser?: AdviserRoleState;
  rep?: RepRoleState;
  mini?: MiniRoleState;
  [role: string]: unknown;
}

export interface Store {
  feesPaid: boolean;
  feesReceipt: Receipt | null;
  payments: PaymentEntry[];
  registration: RegistrationState;
  deferment: DefermentState;
  hostel: HostelState;
  submissions: Record<string, AssignmentSubmission>;
  campus: CampusState;
  staff: StaffState;
  admissions: AdmissionsStoreState;
  roles: RolesState;
  events: EventRec[];
  notifs: LiveNotification[];
  resultIssues: ResultIssue[];
  workflow: Workflow;
  siwes: SiwesStoreState;
  project: ProjectState;
  session: SessionState;
}
