/* Multi-role staff data — advisers, HOD, dean, exams, bursary, hostel, registry, ICT. */
import type { Notification, Tone } from "../types";
import { STAFF, type StaffProfile } from "./staff-data";

/** Roles whose person record lives in this module's PEOPLE. Note this is not
    the same set as the signable roles: `dean2` is here but cannot be signed in
    as, while librarian/clinic are signable but their people live in campus-data. */
export type RoleKey =
  | "lecturer" | "adviser" | "hod" | "dean" | "exams" | "bursary"
  | "hostel" | "registry" | "ict" | "admissions" | "dean2";

/** Every role a staff member can sign in as, from the login picker. */
export type SignableRole = Exclude<RoleKey, "dean2"> | "librarian" | "clinic";

/** A staff member behind a role. Mirrors StaffProfile minus the teaching fields. */
export interface Person {
  name: string;
  first: string;
  initials: string;
  title: string;
  role: string;
  staffId: string;
  department: string;
  faculty: string;
  email: string;
  phone: string;
  office: string;
  area: string;
  session?: string;
  semester?: string;
}

export interface PoolCourse {
  code: string;
  title: string;
  units: number;
  type: string;
}

export interface Advisee {
  id: string;
  matric: string;
  name: string;
  initials: string;
  units: number;
  courses: number;
  reg: PoolCourse[];
  carryover: boolean;
  feesPaid: boolean;
  submitted: boolean;
  submittedAt: string | null;
  cgpa: string;
  baseStatus: "approved" | "pending" | "not-submitted";
  flags: string[];
}

export interface HodCourse {
  code: string;
  title: string;
  level: string;
  units: number;
  lecturer: string;
}

export interface HodResult {
  code: string;
  title: string;
  level: string;
  lecturer: string;
  students: number;
  passRate: number;
  submittedAt: string;
  baseStatus: string;
}

export interface DeanDept {
  dept: string;
  hod: string;
  students: number;
  staff: number;
  results: string;
}

export interface DeanResult {
  code: string;
  dept: string;
  level: string;
  students: number;
  hodAt: string;
  baseStatus: string;
}

export interface ExamPublish {
  code: string;
  title: string;
  dept: string;
  level: string;
  students: number;
  senateAt: string;
  baseStatus: string;
}

export interface Transcript {
  id: string;
  name: string;
  initials: string;
  matric: string;
  destination: string;
  copies: number;
  paid: boolean;
  baseStatus: string;
}

export interface Payment {
  id: string;
  ref: string;
  name: string;
  matric: string;
  item: string;
  amount: number;
  channel: string;
  date: string;
  baseStatus: string;
}

export interface Debtor {
  id: string;
  name: string;
  initials: string;
  matric: string;
  level: string;
  owed: number;
  item: string;
}

export interface FeeStructureRow {
  level: string;
  fresh: number | null;
  returning: number | null;
}

export interface HostelApp {
  id: string;
  name: string;
  initials: string;
  matric: string;
  level: string;
  gender: string;
  hall: string;
  feesPaid: boolean;
  baseStatus: string;
}

export interface HostelStat {
  hall: string;
  gender: string;
  total: number;
  taken: number;
}

export interface Applicant {
  id: string;
  name: string;
  initials: string;
  jamb: string;
  programme: string;
  utme: number;
  oLevel: string;
  docs: string;
  baseStatus: string;
}

export interface UserRow {
  id: string;
  name: string;
  role: string;
  dept: string;
  last: string;
  baseStatus: string;
}

export interface SessionRow {
  name: string;
  state: string;
  reg: string;
  fees: string;
}

export interface AuditRow {
  who: string;
  action: string;
  time: string;
}

/** A 400L student on industrial attachment, as the HOD allocates supervisors. */
export interface SiwesStudent {
  id: string;
  name: string;
  matric: string;
  level: string;
  company: string;
  /** Supervisor before any HOD override; "Unassigned" until allocated. */
  baseSupervisor: string;
}

export type ServiceStatus = "operational" | "degraded" | "down";

export interface IctService {
  name: string;
  status: ServiceStatus;
  detail: string;
  note?: string;
}

export interface IctMetrics {
  uptime: string;
  activeNow: number;
  failedLogins24h: number;
  storagePct: number;
  apiLatency: string;
  dbConnections: string;
  lastBackup: string;
  backupSize: string;
}

/** The roles a staff member can sign in as, in login-picker order.
    `dean2` is intentionally absent: it is reachable only via the org model. */
export const ROLE_IDS: SignableRole[] = ["lecturer", "adviser", "hod", "dean", "exams", "bursary", "hostel", "registry", "admissions", "librarian", "clinic", "ict"];

export const ROLE_LABELS: Record<SignableRole, string> = {
  lecturer: "Lecturer", adviser: "Level Adviser", hod: "Head of Department", dean: "Dean · Computing",
  exams: "Exams & Records", bursary: "Bursary Officer", hostel: "Hostel Officer", registry: "Registry / Admissions",
  admissions: "Admissions Officer", librarian: "Librarian", clinic: "Medical Officer", ict: "ICT / Super Admin",
};

export const fmt = (n: number): string => "₦" + n.toLocaleString("en-NG");

const NAMES: string[] = [
  "Chukwuemeka Obi", "Aisha Bello", "Tobi Adeyemi", "Ngozi Eze", "Ibrahim Musa",
  "Fatima Sani", "Daniel Okoro", "Blessing Akpan", "Yusuf Lawal", "Chiamaka Nwankwo",
  "Samuel Ojo", "Hauwa Abubakar", "Emeka Nnaji", "Grace Effiong", "Abdul Yakubu",
  "Zainab Aliyu", "Peter Danladi", "Funke Adebayo", "Uche Okafor", "Maryam Garba",
  "Olumide Bankole", "Halima Suleiman", "Victor Agboola", "Rita Onyeka", "Bashir Mohammed",
  "Esther Udo", "Kelvin Asuquo", "Amina Idris", "Joshua Bamidele", "Patience Etim",
];
export const init = (n: string): string => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
const pick = (i: number): string => NAMES[i % NAMES.length];

// composable pools for generating large, varied rosters
const FIRST = ["Chinedu", "Aisha", "Tobi", "Ngozi", "Ibrahim", "Fatima", "Daniel", "Blessing", "Yusuf", "Chiamaka", "Samuel", "Hauwa", "Emeka", "Grace", "Abdul", "Zainab", "Peter", "Funke", "Uche", "Maryam", "Olumide", "Halima", "Victor", "Rita", "Bashir", "Esther", "Kelvin", "Amina", "Joshua", "Patience", "Nnamdi", "Khadija", "Segun", "Ifeoma", "Musa", "Bukola", "Chidi", "Rabiu", "Adaeze", "Tunde", "Suleiman", "Oluwaseun", "Comfort", "Gbenga", "Hadiza", "Obinna", "Folake", "Yakubu", "Chioma", "Aliyu"];
const SURNAME = ["Okonkwo", "Bello", "Adeyemi", "Eze", "Musa", "Sani", "Okoro", "Akpan", "Lawal", "Nwankwo", "Ojo", "Abubakar", "Nnaji", "Effiong", "Yakubu", "Aliyu", "Danladi", "Adebayo", "Okafor", "Garba", "Bankole", "Suleiman", "Agboola", "Onyeka", "Mohammed", "Udo", "Asuquo", "Idris", "Bamidele", "Etim", "Obi", "Ogunleye", "Balogun", "Chukwu", "Ibrahim", "Adamu", "Nwachukwu", "Oladipo", "Usman", "Eke"];

/** Deterministic name from an index — looks varied, stable across reloads. */
export const genName = (i: number): string => FIRST[(i * 7 + 3) % FIRST.length] + " " + SURNAME[(i * 13 + 5) % SURNAME.length];

// ---- people behind each role ----
export const PEOPLE: Record<RoleKey, Person> = {
  lecturer: STAFF as StaffProfile as Person,
  adviser: { name: "Dr. Chioma Madu", first: "Chioma", initials: "CM", title: "Level Adviser", role: "Senior Lecturer & 300L Adviser · Computer Science", staffId: "FUT/STF/CSC/0288", department: "Computer Science", faculty: "Faculty of Computing", email: "c.madu@futech.edu.ng", phone: "+234 803 221 7788", office: "CS Block, Rm 11", area: "Human–Computer Interaction" },
  hod: { name: "Prof. Kunle Adewale", first: "Kunle", initials: "KA", title: "Head of Department", role: "HOD & Senior Lecturer · Computer Science", staffId: "FUT/STF/CSC/0102", department: "Computer Science", faculty: "Faculty of Computing", email: "k.adewale@futech.edu.ng", phone: "+234 805 990 1122", office: "CS Block, Rm 02", area: "Systems & Networks" },
  dean: { name: "Prof. Adaeze Nwachukwu", first: "Adaeze", initials: "AN", title: "Dean of Faculty", role: "Dean · Faculty of Computing", staffId: "FUT/STF/COM/0007", department: "Dean's Office", faculty: "Faculty of Computing", email: "dean.computing@futech.edu.ng", phone: "+234 802 776 4400", office: "Faculty Block, Rm 1", area: "Artificial Intelligence" },
  exams: { name: "Mr. Sunday Eke", first: "Sunday", initials: "SE", title: "Exams & Records Officer", role: "Exams & Records", staffId: "FUT/STF/EXM/0451", department: "Exams & Records", faculty: "Registry", email: "s.eke@futech.edu.ng", phone: "+234 806 332 9087", office: "Records Hall, Rm 8", area: "Academic Records" },
  bursary: { name: "Mrs. Halima Bello", first: "Halima", initials: "HB", title: "Bursary Officer", role: "Bursary · Student Accounts", staffId: "FUT/STF/BUR/0319", department: "Bursary", faculty: "Finance", email: "h.bello@futech.edu.ng", phone: "+234 803 010 5566", office: "Bursary Block, Rm 4", area: "Student Accounts" },
  hostel: { name: "Mr. Tunde Afolabi", first: "Tunde", initials: "TA", title: "Hostel Officer", role: "Student Affairs · Accommodation", staffId: "FUT/STF/SAF/0277", department: "Student Affairs", faculty: "Student Affairs", email: "t.afolabi@futech.edu.ng", phone: "+234 805 447 2231", office: "Student Affairs, Rm 2", area: "Accommodation" },
  registry: { name: "Mrs. Patricia Okon", first: "Patricia", initials: "PO", title: "Asst. Registrar", role: "Registry · Admissions", staffId: "FUT/STF/REG/0061", department: "Registry", faculty: "Registry", email: "p.okon@futech.edu.ng", phone: "+234 802 668 1190", office: "Registry, Rm 12", area: "Admissions & Records" },
  ict: { name: "Engr. David Umeh", first: "David", initials: "DU", title: "ICT Administrator", role: "ICT · System Administrator", staffId: "FUT/STF/ICT/0015", department: "ICT Directorate", faculty: "ICT", email: "d.umeh@futech.edu.ng", phone: "+234 806 554 7781", office: "ICT Centre, Rm 1", area: "Systems Administration" },
  admissions: { name: "Mr. Sunday Eheri", first: "Sunday", initials: "SE", title: "Admissions Officer", role: "Registry · Admissions Office", staffId: "FUT/STF/ADM/0048", department: "Admissions", faculty: "Registry", email: "s.eheri@futech.edu.ng", phone: "+234 803 221 9087", office: "Registry Block, Rm 12", area: "Admissions" },
  dean2: { name: "Prof. Musa Danjuma", first: "Musa", initials: "MD", title: "Dean of Faculty", role: "Dean · Faculty of Engineering", staffId: "FUT/STF/ENG/0004", department: "Dean's Office", faculty: "Faculty of Engineering", email: "m.danjuma@futech.edu.ng", phone: "+234 805 770 1142", office: "Engineering Complex, Dean's Suite", area: "Faculty Administration" },
};

// ---- Level Adviser: 300L CSC advisees with registration submissions ----
// 300L CSC course pool the advisees register from
const ADV_COURSE_POOL: PoolCourse[] = [
  { code: "CSC 301", title: "Data Structures & Algorithms", units: 3, type: "Core" },
  { code: "CSC 303", title: "Operating Systems", units: 3, type: "Core" },
  { code: "CSC 305", title: "Database Management Systems", units: 3, type: "Core" },
  { code: "CSC 307", title: "Computer Architecture", units: 2, type: "Core" },
  { code: "CSC 309", title: "Object-Oriented Programming II", units: 3, type: "Core" },
  { code: "MTH 301", title: "Linear Algebra II", units: 3, type: "Core" },
  { code: "GST 301", title: "Entrepreneurship Studies", units: 2, type: "GST" },
  { code: "CSC 311", title: "Web Application Development", units: 2, type: "Elective" },
  { code: "CSC 313", title: "Human–Computer Interaction", units: 2, type: "Elective" },
];
const ADV_CARRYOVER: PoolCourse = { code: "CSC 299", title: "Discrete Mathematics (Carryover)", units: 3, type: "Carryover" };

export const ADVISEES: Advisee[] = [];
for (let i = 0; i < 140; i++) {
  const name = genName(i);
  const carryover = i % 5 === 0;
  const feesPaid = i % 7 !== 0;
  const submitted = i % 6 !== 0;
  // build a real registered-course list for this student
  const reg: PoolCourse[] = [];
  if (carryover) reg.push({ ...ADV_CARRYOVER });
  // always the 6 core/required, plus a rotating elective or two
  ADV_COURSE_POOL.slice(0, 6).forEach((c) => reg.push({ ...c }));
  if (i % 2 === 0) reg.push({ ...ADV_COURSE_POOL[6] }); // GST
  if (i % 3 !== 0) reg.push({ ...ADV_COURSE_POOL[7] }); // web dev elective
  if (i % 4 === 0) reg.push({ ...ADV_COURSE_POOL[8] }); // HCI elective
  const units = reg.reduce((s, c) => s + c.units, 0);
  ADVISEES.push({
    id: "adv" + i,
    matric: "FUT/2022/CSC/" + (10400 + i * 3),
    name, initials: init(name),
    units, courses: reg.length, reg, carryover, feesPaid,
    submitted, submittedAt: submitted ? ["2h ago", "Yesterday", "3 days ago", "5 days ago"][i % 4] : null,
    cgpa: (3.2 + ((i * 7) % 18) / 10).toFixed(2),
    baseStatus: submitted ? (i % 4 === 1 ? "approved" : "pending") : "not-submitted",
    flags: [carryover ? "Has carryover (CSC 299)" : null, !feesPaid ? "School fees not paid" : null, units > 24 ? "Over unit load" : null].filter((x): x is string => Boolean(x)),
  });
}

// ---- HOD: department course → lecturer assignment ----
export const STAFF_POOL: string[] = ["Dr. E. Bassey", "Prof. K. Adewale", "Dr. F. Okonkwo", "Dr. M. Sani", "Mr. T. Balogun", "Mrs. J. Eze", "Dr. P. Nwosu", "Dr. C. Madu", "Dr. A. Ibrahim", "Unassigned"];
export const HOD_COURSES: HodCourse[] = [
  { code: "CSC 301", title: "Data Structures & Algorithms", level: "300L", units: 3, lecturer: "Dr. E. Bassey" },
  { code: "CSC 303", title: "Operating Systems", level: "300L", units: 3, lecturer: "Prof. K. Adewale" },
  { code: "CSC 305", title: "Database Management Systems", level: "300L", units: 3, lecturer: "Dr. F. Okonkwo" },
  { code: "CSC 307", title: "Computer Architecture", level: "300L", units: 2, lecturer: "Dr. M. Sani" },
  { code: "CSC 205", title: "Data Communications", level: "200L", units: 2, lecturer: "Dr. F. Okonkwo" },
  { code: "CSC 411", title: "Big Data Analytics", level: "400L", units: 3, lecturer: "Dr. F. Okonkwo" },
  { code: "CSC 201", title: "Computer Programming I", level: "200L", units: 3, lecturer: "Mr. T. Balogun" },
  { code: "CSC 409", title: "Machine Learning", level: "400L", units: 3, lecturer: "Unassigned" },
];

// ---- HOD result-approval queue (results submitted by lecturers) ----
export const HOD_RESULTS: HodResult[] = [
  { code: "CSC 305", title: "Database Management Systems", level: "300L", lecturer: "Dr. F. Okonkwo", students: 14, passRate: 86, submittedAt: "Dec 16", baseStatus: "pending" },
  { code: "CSC 301", title: "Data Structures & Algorithms", level: "300L", lecturer: "Dr. E. Bassey", students: 38, passRate: 79, submittedAt: "Dec 15", baseStatus: "pending" },
  { code: "CSC 411", title: "Big Data Analytics", level: "400L", lecturer: "Dr. F. Okonkwo", students: 11, passRate: 91, submittedAt: "Dec 14", baseStatus: "pending" },
  { code: "CSC 205", title: "Data Communications", level: "200L", lecturer: "Dr. F. Okonkwo", students: 16, passRate: 75, submittedAt: "Dec 12", baseStatus: "approved" },
];

// ---- Dean: departments + faculty-level result approvals ----
export const DEAN_DEPTS: DeanDept[] = [
  { dept: "Computer Science", hod: "Prof. K. Adewale", students: 1240, staff: 28, results: "In review" },
  { dept: "Software Engineering", hod: "Dr. B. Idowu", students: 870, staff: 19, results: "Submitted" },
  { dept: "Information Technology", hod: "Dr. R. Hassan", students: 760, staff: 17, results: "Approved" },
  { dept: "Cyber Security", hod: "Dr. N. Achebe", students: 540, staff: 14, results: "In review" },
];
export const DEAN_RESULTS: DeanResult[] = [
  { code: "CSC 305", dept: "Computer Science", level: "300L", students: 14, hodAt: "Dec 17", baseStatus: "pending" },
  { code: "SEN 301", dept: "Software Engineering", level: "300L", students: 52, hodAt: "Dec 16", baseStatus: "pending" },
  { code: "ITC 201", dept: "Information Technology", level: "200L", students: 61, hodAt: "Dec 15", baseStatus: "approved" },
  { code: "CYB 401", dept: "Cyber Security", level: "400L", students: 33, hodAt: "Dec 16", baseStatus: "pending" },
];

// ---- Exams & Records: ready-to-publish + transcripts ----
export const EXAM_PUBLISH: ExamPublish[] = [
  { code: "ITC 201", title: "Web Technologies", dept: "Information Technology", level: "200L", students: 61, senateAt: "Dec 19", baseStatus: "ready" },
  { code: "CSC 205", title: "Data Communications", dept: "Computer Science", level: "200L", students: 16, senateAt: "Dec 18", baseStatus: "published" },
  { code: "SEN 301", title: "Software Architecture", dept: "Software Engineering", level: "300L", students: 52, senateAt: "Dec 19", baseStatus: "ready" },
];

export const TRANSCRIPTS: Transcript[] = [];
for (let i = 0; i < 46; i++) {
  const name = genName(i + 60);
  TRANSCRIPTS.push({
    id: "tr" + i, name, initials: init(name),
    matric: "FUT/" + (2016 + (i % 5)) + "/CSC/" + (9000 + i * 11),
    destination: ["University of Lagos", "MTN Nigeria", "Chevron", "Univ. of Toronto", "NYSC", "Shell Petroleum", "Univ. of Ibadan", "Andela"][i % 8],
    copies: 1 + (i % 3), paid: i % 4 !== 0,
    baseStatus: i % 3 === 0 ? "processing" : "pending",
  });
}

// ---- Bursary: payment verification + debtors ----
export const PAYMENTS: Payment[] = [];
const ITEMS = ["School Fees", "Acceptance Fee", "Hostel Fee", "Transcript", "SIWES Levy", "ID Card"];
const CHANNELS = ["Paystack", "Bank Transfer", "Remita", "USSD"];
for (let i = 0; i < 96; i++) {
  const name = genName(i + 120);
  const amt = [109000, 25000, 45000, 7500, 6000, 2000][i % 6];
  PAYMENTS.push({
    id: "pay" + i, ref: "TRX-" + (728100 + i * 137).toString(36).toUpperCase(),
    name, matric: "FUT/2022/CSC/" + (10500 + i * 4),
    item: ITEMS[i % 6], amount: amt, channel: CHANNELS[i % 4],
    date: "Dec " + (4 + i),
    baseStatus: i % 5 === 0 ? "flagged" : i % 3 === 0 ? "confirmed" : "pending",
  });
}

export const DEBTORS: Debtor[] = [];
for (let i = 0; i < 64; i++) {
  const name = genName(i + 200);
  DEBTORS.push({
    id: "deb" + i, name, initials: init(name),
    matric: "FUT/2022/CSC/" + (10700 + i * 5),
    level: ["100L", "200L", "300L", "400L"][i % 4],
    owed: [109000, 54500, 87500, 45000][i % 4],
    item: ["Full school fees", "Part payment balance", "School fees", "Hostel fee"][i % 4],
  });
}

export const FEE_STRUCTURE: FeeStructureRow[] = [
  { level: "100 Level", fresh: 134000, returning: null },
  { level: "200 Level", fresh: null, returning: 109000 },
  { level: "300 Level", fresh: null, returning: 109000 },
  { level: "400 Level", fresh: null, returning: 112500 },
];

// ---- Hostel Officer: applications + inventory (reuse DATA.HOSTELS) ----
export const HOSTEL_APPS: HostelApp[] = [];
for (let i = 0; i < 78; i++) {
  const name = genName(i + 280);
  HOSTEL_APPS.push({
    id: "ha" + i, name, initials: init(name),
    matric: "FUT/2022/CSC/" + (10800 + i * 3),
    level: ["100L", "200L", "300L", "400L"][i % 4],
    gender: i % 2 === 0 ? "Female" : "Male",
    hall: i % 2 === 0 ? "Queen Amina Hall" : "Saint's Hall",
    feesPaid: i % 6 !== 0,
    baseStatus: i % 4 === 1 ? "allocated" : "pending",
  });
}
export const HOSTEL_STATS: HostelStat[] = [
  { hall: "Queen Amina Hall", gender: "Female", total: 320, taken: 274 },
  { hall: "Flora Shaw Hall", gender: "Female", total: 240, taken: 188 },
  { hall: "Saint's Hall", gender: "Male", total: 400, taken: 351 },
  { hall: "Nnamdi Hall", gender: "Male", total: 360, taken: 360 },
];

// ---- Registry / Admissions: applicants ----
export const APPLICANTS: Applicant[] = [];
const APPLICANT_PROGRAMMES = ["B.Sc. Computer Science", "B.Eng. Software Engineering", "B.Sc. Cyber Security", "B.Sc. Information Technology"];
for (let i = 0; i < 12; i++) {
  const name = pick(i + 9);
  APPLICANTS.push({
    id: "app" + i, name, initials: init(name),
    jamb: (20419000 + i * 311) + "AF",
    programme: APPLICANT_PROGRAMMES[i % 4],
    utme: 198 + ((i * 17) % 90),
    oLevel: i % 5 === 0 ? "4 credits" : "5+ credits",
    docs: i % 7 === 0 ? "Incomplete" : "Complete",
    baseStatus: i % 4 === 2 ? "admitted" : "pending",
  });
}

/* ---- HOD: 400L students on industrial attachment ----
   Supervisor allocation mirrors ADVISEES: `baseSupervisor` is the seed the HOD
   can override via the store. Companies are drawn from the SIWES sample list. */
const SIWES_COMPANIES = [
  "Zenith Systems Ltd.", "NNPC ICT Directorate", "Interswitch Group",
  "Dangote Industries — IT Dept.", "MTN Nigeria", "Andela", "Flutterwave", "Chevron Nigeria",
];
export const SIWES_STUDENTS: SiwesStudent[] = [];
for (let i = 0; i < 44; i++) {
  const name = genName(i + 340);
  // every 4th student is left unallocated so the HOD screen has work to do
  const sup = i % 4 === 0 ? "Unassigned" : STAFF_POOL[i % (STAFF_POOL.length - 1)];
  SIWES_STUDENTS.push({
    id: "sw" + i,
    name,
    matric: "FUT/2021/CSC/" + (10200 + i * 7),
    level: "400L",
    company: SIWES_COMPANIES[i % SIWES_COMPANIES.length],
    baseSupervisor: sup,
  });
}

// ---- ICT / Super Admin: users + sessions ----
export const USERS: UserRow[] = (Object.keys(PEOPLE) as RoleKey[]).map((k, i) => ({
  id: "usr-" + k, name: PEOPLE[k].name, role: PEOPLE[k].title,
  dept: PEOPLE[k].department, last: ["2h ago", "1d ago", "5m ago", "3d ago", "just now", "1h ago", "yesterday", "4h ago"][i % 8],
  baseStatus: "active",
}));
USERS.push({ id: "usr-stu", name: "Adaeze N. Okeke", role: "Student", dept: "Computer Science", last: "10m ago", baseStatus: "active" });
USERS.push({ id: "usr-sus", name: "Idris Bala", role: "Student", dept: "Cyber Security", last: "12d ago", baseStatus: "suspended" });

export const SESSIONS: SessionRow[] = [
  { name: "2025/2026", state: "Active", reg: "Open", fees: "Open" },
  { name: "2024/2025", state: "Archived", reg: "Closed", fees: "Closed" },
  { name: "2023/2024", state: "Archived", reg: "Closed", fees: "Closed" },
];

export const AUDIT: AuditRow[] = [
  { who: "Dr. F. Okonkwo", action: "Submitted CSC 305 results", time: "2h ago" },
  { who: "Prof. K. Adewale", action: "Approved CSC 411 results", time: "5h ago" },
  { who: "Mrs. H. Bello", action: "Confirmed payment TRX-9F2A1", time: "Yesterday" },
  { who: "Mr. T. Afolabi", action: "Allocated bed A204 to FUT/2022/CSC/10428", time: "Yesterday" },
  { who: "System", action: "Nightly backup completed", time: "2 days ago" },
];

/* Platform health shown on the ICT dashboard. One service is deliberately
   degraded so the "All systems operational" branch is exercisable both ways. */
export const ICT_SERVICES: IctService[] = [
  { name: "Portal (web)", status: "operational", detail: "All regions responding" },
  { name: "Authentication", status: "operational", detail: "Session service healthy" },
  { name: "Payments (Paystack/Remita)", status: "degraded", detail: "Elevated latency", note: "Remita callbacks retrying" },
  { name: "Database (primary)", status: "operational", detail: "Replication lag < 1s" },
  { name: "File storage", status: "operational", detail: "1.2 TB of 2 TB used" },
  { name: "Email / notifications", status: "operational", detail: "Queue drained" },
];

export const ICT_METRICS: IctMetrics = {
  uptime: "99.94%",
  activeNow: 412,
  failedLogins24h: 7,
  storagePct: 61,
  apiLatency: "142 ms",
  dbConnections: "38 / 100",
  lastBackup: "02:00 today",
  backupSize: "84 GB",
};

export function notif(role: string): Notification[] {
  const m: Record<string, Notification[]> = {
    adviser: [{ id: "a1", icon: "book", tone: "warning", title: "11 registrations awaiting approval", body: "300L advisees have submitted course forms for review.", time: "1h ago", unread: true }],
    hod: [{ id: "h1", icon: "chart", tone: "warning", title: "3 result sheets to approve", body: "Lecturers have submitted results for your review.", time: "2h ago", unread: true }, { id: "h2", icon: "book", tone: "accent", title: "CSC 409 still unassigned", body: "Assign a lecturer before the semester begins.", time: "Yesterday", unread: true }],
    dean: [{ id: "d1", icon: "chart", tone: "warning", title: "Faculty result approvals pending", body: "3 departments awaiting your sign-off.", time: "3h ago", unread: true }],
    exams: [{ id: "e1", icon: "chart", tone: "accent", title: "2 result sheets ready to publish", body: "Senate-approved results can be released to students.", time: "1h ago", unread: true }, { id: "e2", icon: "doc", tone: "warning", title: "6 transcript requests", body: "Pending processing in the records queue.", time: "Yesterday", unread: true }],
    bursary: [{ id: "b1", icon: "wallet", tone: "warning", title: "8 payments to verify", body: "Unconfirmed transactions need manual verification.", time: "30m ago", unread: true }],
    hostel: [{ id: "ho1", icon: "bed", tone: "warning", title: "7 allocation requests", body: "Students have applied for bed spaces.", time: "1h ago", unread: true }],
    registry: [{ id: "r1", icon: "doc", tone: "warning", title: "9 applications to screen", body: "New admission applications awaiting review.", time: "2h ago", unread: true }],
    admissions: [{ id: "ad1", icon: "doc", tone: "warning", title: "Candidates awaiting screening", body: "Submitted applications need review and a decision.", time: "1h ago", unread: true }, { id: "ad2", icon: "barcode", tone: "accent", title: "JAMB batch ready to import", body: "A new JAMB candidate batch is available to preview.", time: "3h ago", unread: false }],
    ict: [{ id: "i1", icon: "shield", tone: "accent", title: "System healthy", body: "All services operational. Nightly backup OK.", time: "4h ago", unread: false }],
  };
  return m[role] || [];
}

/** Grouped namespace mirroring the old `window.ROLE_DATA` shape.
    Note: genName, SIWES_STUDENTS, ICT_METRICS and ICT_SERVICES were consumed by
    screens but never exported here — that is why those screens threw. */
export const ROLE_DATA = {
  fmt, init, genName, PEOPLE, notif,
  ADVISEES, STAFF_POOL, HOD_COURSES, HOD_RESULTS,
  DEAN_DEPTS, DEAN_RESULTS, EXAM_PUBLISH, TRANSCRIPTS,
  PAYMENTS, DEBTORS, FEE_STRUCTURE, HOSTEL_APPS, HOSTEL_STATS,
  APPLICANTS, USERS, SESSIONS, AUDIT,
  SIWES_STUDENTS, ICT_METRICS, ICT_SERVICES,
};
