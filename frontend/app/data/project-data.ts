/* Final-year project supervision — data model (500L).

   This module backs the HOD's project-supervision screen. It did not exist in
   the prototype even though `window.PROJECT_DATA` was read in three places, so
   those screens threw on render; the shapes here are reconstructed from how the
   screens consume them. */
import { STAFF_POOL, genName, init } from "./roles-data";

/** A 500L student needing a project supervisor. */
export interface Finalist {
  id: string;
  name: string;
  initials: string;
  matric: string;
  topic: string;
  /** Supervisor before any HOD override; "Unassigned" until allocated. */
  baseSupervisor: string;
}

/** A finalist supervised by the demo lecturer, who can clear them for defence. */
export interface Supervisee {
  id: string;
  name: string;
  initials: string;
  matric: string;
  topic: string;
}

const TOPICS = [
  "A Machine-Learning Approach to Predicting Student Attrition",
  "Design of a Low-Cost IoT Water-Quality Monitor",
  "Blockchain-Based Verification of Academic Transcripts",
  "Offline-First Mobile Learning for Rural Secondary Schools",
  "Automated Timetable Generation Using Genetic Algorithms",
  "Sentiment Analysis of Nigerian Political Discourse on Social Media",
  "A Recommender System for University Course Electives",
  "Intrusion Detection on Campus Networks Using Deep Learning",
  "Optimising Last-Mile Delivery Routing in Lagos",
  "A Yoruba-English Neural Machine Translation Model",
  "Fraud Detection in Mobile-Money Transactions",
  "Computer-Vision Attendance Capture from Lecture-Hall Footage",
];

/** The demo lecturer, whose supervisees appear on their own supervision screen. */
const DEMO_SUPERVISOR = "Dr. F. Okonkwo";

export const FINALISTS: Finalist[] = [];
for (let i = 0; i < 38; i++) {
  const name = genName(i + 420);
  // every 5th finalist is left unallocated so the HOD screen has work to do
  const sup = i % 5 === 0 ? "Unassigned" : STAFF_POOL[i % (STAFF_POOL.length - 1)];
  FINALISTS.push({
    id: "fin" + i,
    name,
    initials: init(name),
    matric: "FUT/2020/CSC/" + (9500 + i * 9),
    topic: TOPICS[i % TOPICS.length],
    baseSupervisor: sup,
  });
}

/** Finalists seeded to the demo lecturer — the ones they can clear for defence. */
export const SUPERVISEES: Supervisee[] = FINALISTS
  .filter((f) => f.baseSupervisor === DEMO_SUPERVISOR)
  .map(({ id, name, initials, matric, topic }) => ({ id, name, initials, matric, topic }));

/** Grouped namespace mirroring the `window.PROJECT_DATA` shape the screens expect. */
export const PROJECT_DATA = { FINALISTS, SUPERVISEES };
