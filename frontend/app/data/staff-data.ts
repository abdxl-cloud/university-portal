/* Staff / lecturer portal data */
import type { Notification } from "../types";

export interface StaffProfile {
  name: string;
  first: string;
  initials: string;
  title: string;
  staffId: string;
  department: string;
  faculty: string;
  email: string;
  phone: string;
  office: string;
  role: string;
  area: string;
  session: string;
  semester: string;
}

export interface StaffCourse {
  code: string;
  title: string;
  units: number;
  level: string;
  venue: string;
  day: string;
}

/** A course the lecturer teaches on the side; carries a start time. */
export interface CourseMeta extends StaffCourse {
  start: string;
}

/** One student's row on a course roster. `exam` is null until the lecturer enters it. */
export interface RosterEntry {
  matric: string;
  name: string;
  /** Continuous assessment, out of 30. */
  ca: number;
  /** Exam score out of 70, or null when not yet entered. */
  exam: number | null;
}

export interface Material {
  name: string;
  type: string;
  size: string;
  date: string;
}

export interface Assignment {
  id: string;
  title: string;
  due: string;
  points: number;
}

export interface Post {
  who: string;
  time: string;
  body: string;
}

export interface CourseContent {
  materials: Material[];
  assignments: Assignment[];
  posts: Post[];
}

export type SubmissionStatus = "submitted" | "missing";

export interface Submission {
  matric: string;
  name: string;
  status: SubmissionStatus;
  /** When it was turned in, or null when missing. */
  at: string | null;
  fileName: string | null;
}

/** assignmentId -> one row per rostered student. */
export type CourseSubmissions = Record<string, Submission[]>;

/** Where a course's results sit in the approval chain. */
export type ResultStatus = "draft" | "submitted" | "approved";

export interface Lecture {
  day: string;
  start: string;
  span: number;
  code: string;
  room: string;
}

export interface StaffTimetable {
  days: string[];
  periods: string[];
  lectures: Lecture[];
}

export const STAFF: StaffProfile = {
  name: "Dr. Florence Okonkwo",
  first: "Florence",
  initials: "FO",
  title: "Lecturer I",
  staffId: "FUT/STF/CSC/0391",
  department: "Computer Science",
  faculty: "Faculty of Computing",
  email: "f.okonkwo@futech.edu.ng",
  phone: "+234 806 411 0937",
  office: "CS Block, Rm 21",
  role: "Lecturer I · Exams & Records Officer",
  area: "Databases & Data Engineering",
  session: "2025/2026",
  semester: "First Semester",
};

// Courses this lecturer is assigned this semester
export const STAFF_COURSES: StaffCourse[] = [
  { code: "CSC 305", title: "Database Management Systems", units: 3, level: "300 Level", venue: "Lab 2", day: "Tuesday & Friday" },
  { code: "CSC 205", title: "Data Communications", units: 2, level: "200 Level", venue: "LH 3", day: "Monday" },
  { code: "CSC 411", title: "Big Data Analytics", units: 3, level: "400 Level", venue: "ICT Lab", day: "Thursday" },
];

// Name pool for generated rosters
const NAMES: string[] = [
  "Chukwuemeka Obi", "Aisha Bello", "Tobi Adeyemi", "Ngozi Eze", "Ibrahim Musa",
  "Fatima Sani", "Daniel Okoro", "Blessing Akpan", "Yusuf Lawal", "Chiamaka Nwankwo",
  "Samuel Ojo", "Hauwa Abubakar", "Emeka Nnaji", "Grace Effiong", "Abdul Yakubu",
  "Zainab Aliyu", "Peter Danladi", "Funke Adebayo", "Uche Okafor", "Maryam Garba",
  "Olumide Bankole", "Halima Suleiman", "Victor Agboola", "Rita Onyeka", "Bashir Mohammed",
  "Esther Udo", "Kelvin Asuquo", "Amina Idris", "Joshua Bamidele", "Patience Etim",
  "Suleiman Bello", "Joy Nwosu", "Femi Alabi", "Khadija Umar", "Henry Eke",
  "Comfort Bassey", "Aliyu Tanko", "Stella Maduka", "Ifeanyi Okeke", "Lydia Anejo",
];

function matricFor(level: string, i: number): string {
  const yr = ({ "100 Level": "2025", "200 Level": "2024", "300 Level": "2022", "400 Level": "2021" } as Record<string, string>)[level] || "2023";
  return "FUT/" + yr + "/CSC/" + (10000 + level.charCodeAt(0) * 7 + i).toString().slice(0, 5);
}

// Build a roster for a course. CA (out of 30) is pre-recorded; exam (out of 70) is blank
// for CSC 305 (the lecturer's active grading task) and pre-filled for the others.
function buildRoster(code: string, level: string, count: number, examFilled: boolean): RosterEntry[] {
  const roster: RosterEntry[] = [];
  for (let i = 0; i < count; i++) {
    const name = NAMES[(code.charCodeAt(2) * 3 + i) % NAMES.length];
    const ca = examFilled ? 18 + ((i * 7 + code.charCodeAt(4)) % 12) : 16 + ((i * 5 + 3) % 14); // 16–29
    const exam = examFilled ? 28 + ((i * 11 + code.charCodeAt(5)) % 40) : null; // 28–67
    roster.push({ matric: matricFor(level, i), name, ca, exam });
  }
  return roster;
}

export const ROSTERS: Record<string, RosterEntry[]> = {
  "CSC 305": buildRoster("CSC 305", "300 Level", 14, false), // active: exams to enter
  "CSC 205": buildRoster("CSC 205", "200 Level", 16, true),
  "CSC 411": buildRoster("CSC 411", "400 Level", 11, true),
  "CSC 313": buildRoster("CSC 313", "300 Level", 23, false),
  "CSC 303": buildRoster("CSC 303", "300 Level", 38, false),
};

export const ENROLLED: Record<string, number> = {
  "CSC 305": ROSTERS["CSC 305"].length,
  "CSC 205": ROSTERS["CSC 205"].length,
  "CSC 411": ROSTERS["CSC 411"].length,
  "CSC 313": ROSTERS["CSC 313"].length,
  "CSC 303": ROSTERS["CSC 303"].length,
};

// course metadata for the "extra course" a Level Adviser / HOD teaches on the side
// (kept OUT of STAFF_COURSES so it never appears in Dr. Okonkwo's own "My Courses" list)
export const COURSE_META: Record<string, CourseMeta> = {
  "CSC 313": { code: "CSC 313", title: "Human–Computer Interaction", units: 2, level: "300 Level", venue: "LH 2", day: "Wednesday", start: "14:00" },
  "CSC 303": { code: "CSC 303", title: "Operating Systems", units: 3, level: "300 Level", venue: "LH 2", day: "Wednesday & Friday", start: "10:00" },
};

// Default result-approval status per course
export const RESULT_STATUS: Record<string, ResultStatus> = { "CSC 305": "draft", "CSC 205": "approved", "CSC 411": "submitted" };

// Class content per course (lecturer-authored). Mirrors student classFor shape.
export const STAFF_CONTENT: Record<string, CourseContent> = {
  "CSC 305": {
    materials: [
      { name: "Wk 1 — Relational Model & ER Design.pdf", type: "PDF", size: "2.4 MB", date: "Oct 6" },
      { name: "Wk 3 — Normalisation (1NF–BCNF).pdf", type: "PDF", size: "1.9 MB", date: "Oct 20" },
      { name: "SQL Lab Pack.zip", type: "ZIP", size: "5.1 MB", date: "Oct 22" },
    ],
    assignments: [
      { id: "a305-1", title: "Assignment 1 — ER diagram for a library", due: "Oct 25, 2025", points: 20 },
      { id: "a305-2", title: "Lab 2 — Normalise the orders schema", due: "Nov 8, 2025", points: 30 },
    ],
    posts: [
      { who: "Dr. Florence Okonkwo", time: "Oct 22, 2025", body: "SQL Lab Pack uploaded. Bring your laptops to Lab 2 on Friday — we'll work through joins and subqueries together." },
    ],
  },
  "CSC 205": {
    materials: [{ name: "Data Comms — Course Outline.pdf", type: "PDF", size: "0.8 MB", date: "Sep 30" }],
    assignments: [{ id: "a205-1", title: "Assignment 1 — Encoding schemes", due: "Oct 18, 2025", points: 20 }],
    posts: [],
  },
  "CSC 411": {
    materials: [{ name: "Intro to MapReduce.pptx", type: "PPTX", size: "3.3 MB", date: "Oct 10" }],
    assignments: [{ id: "a411-1", title: "Project proposal — analytics pipeline", due: "Nov 1, 2025", points: 40 }],
    posts: [],
  },
};

// Per-assignment submission seed (who has turned in). Grades live in the store.
function seedSubmissions(code: string): CourseSubmissions {
  const roster = ROSTERS[code];
  const content = STAFF_CONTENT[code];
  const map: CourseSubmissions = {};
  content.assignments.forEach((a) => {
    map[a.id] = roster.map((stu, i) => {
      // ~70% submitted, of which some pre-graded for the closed courses
      const submitted = (i * 3 + a.id.charCodeAt(5)) % 10 < 7;
      return {
        matric: stu.matric, name: stu.name,
        status: submitted ? "submitted" : "missing",
        at: submitted ? "Oct " + (15 + (i % 12)) : null,
        fileName: submitted ? "submission_" + stu.matric.slice(-4) + ".pdf" : null,
      };
    });
  });
  return map;
}

export const STAFF_SUBMISSIONS: Record<string, CourseSubmissions> = {
  "CSC 305": seedSubmissions("CSC 305"),
  "CSC 205": seedSubmissions("CSC 205"),
  "CSC 411": seedSubmissions("CSC 411"),
};

// Lecturer teaching timetable
export const STAFF_TIMETABLE: StaffTimetable = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periods: ["8:00", "10:00", "12:00", "14:00", "16:00"],
  lectures: [
    { day: "Monday", start: "10:00", span: 1, code: "CSC 205", room: "LH 3" },
    { day: "Tuesday", start: "10:00", span: 2, code: "CSC 305", room: "Lab 2" },
    { day: "Thursday", start: "14:00", span: 2, code: "CSC 411", room: "ICT Lab" },
    { day: "Friday", start: "8:00", span: 2, code: "CSC 305", room: "Lab 2" },
  ],
};

export const STAFF_NOTIFICATIONS: Notification[] = [
  { id: "sn1", icon: "doc", tone: "warning", title: "12 new submissions to grade", body: "Assignment 1 (CSC 305) — submissions are in. Grade before results submission.", time: "1h ago", unread: true },
  { id: "sn2", icon: "chart", tone: "accent", title: "Result submission window open", body: "Submit CSC 305 results to the HOD before December 19.", time: "Yesterday", unread: true },
  { id: "sn3", icon: "book", tone: "neutral", title: "CSC 205 results approved", body: "The HOD approved your CSC 205 results. They are now visible to students.", time: "3 days ago", unread: false },
];

export const staffContentFor = (code: string): CourseContent =>
  STAFF_CONTENT[code] || { materials: [], assignments: [], posts: [] };

/** Grouped namespace mirroring the old `window.STAFF_DATA` shape. */
export const STAFF_DATA = {
  STAFF, STAFF_COURSES, ROSTERS, ENROLLED, RESULT_STATUS, COURSE_META,
  STAFF_CONTENT, STAFF_SUBMISSIONS, STAFF_TIMETABLE, STAFF_NOTIFICATIONS,
  staffContentFor,
};
