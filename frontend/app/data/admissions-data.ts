/* Admissions & fresh-student onboarding — data model */
import type { Tone } from "../types";

/* ---- candidate lifecycle states ---- */
export type CandidateState =
  | "jamb_imported"
  | "draft"
  | "awaiting_payment"
  | "submitted"
  | "under_review"
  | "queried"
  | "screened"
  | "ineligible"
  | "recommended"
  | "caps_pending"
  | "admitted"
  | "accepted"
  | "clearance_pending"
  | "enrolled";

/** Sentinel marking the pool row that mirrors the live demo candidate. */
export const LIVE_CANDIDATE = "__live__";

/** A pool row is either a fixed state or the sentinel deferring to the live candidate. */
export type PoolState = CandidateState | typeof LIVE_CANDIDATE;

export interface StateMeta {
  label: string;
  tone: Tone;
  step: number;
  blurb: string;
}

export interface Programme {
  id: string;
  name: string;
  faculty: string;
  cutoff: number;
  quota: number;
  applied: number;
  subjects: string[];
}

export interface DocType {
  id: string;
  name: string;
  note: string;
}

/** A clearance item. `auto` names a store flag that ticks the item automatically. */
export interface ClearanceItem {
  id: string;
  unit: string;
  label: string;
  note: string;
  auto?: string;
}

export interface Candidate {
  jamb: string;
  name: string;
  first: string;
  initials: string;
  score: number;
  programme: string;
  gender: string;
  state: string;
  lga: string;
  dob: string;
  email: string;
  phone: string;
  subjects: Record<string, number>;
}

/** Why an imported record needs attention. */
export type CandidateFlag = "score_below_cutoff" | "doc_missing";

export interface PoolCandidate {
  id: string;
  jamb: string;
  name: string;
  score: number;
  prog: string;
  state: PoolState;
  gender: string;
  origin: string;
  flags: CandidateFlag[];
  query?: string;
}

export type ImportIssue = "below_cutoff" | "duplicate" | "incomplete_name";

export interface ImportRow {
  jamb: string;
  name: string;
  score: number;
  prog: string;
  gender: string;
  origin: string;
  issues: ImportIssue[];
}

export const fmt = (n: number | string): string => "₦" + Number(n).toLocaleString("en-NG");

// order is used for progress; not strictly linear (queried/ineligible branch)
export const STATES: Record<CandidateState, StateMeta> = {
  jamb_imported:     { label: "JAMB Imported",   tone: "neutral", step: 0, blurb: "Your record was imported from JAMB. Activate your account to begin your application." },
  draft:             { label: "Draft",            tone: "neutral", step: 1, blurb: "Your application is in progress. Complete all steps and submit before the deadline." },
  awaiting_payment:  { label: "Awaiting Payment", tone: "warning", step: 2, blurb: "Pay the screening fee to submit your application." },
  submitted:         { label: "Submitted",        tone: "accent",  step: 3, blurb: "Your application has been submitted and is queued for screening." },
  under_review:      { label: "Under Review",      tone: "accent",  step: 4, blurb: "The admissions office is reviewing your application and documents." },
  queried:           { label: "Queried",          tone: "warning", step: 4, blurb: "An officer needs you to correct something. See the query below and respond." },
  screened:          { label: "Screened",          tone: "accent",  step: 5, blurb: "Screening is complete. Your eligibility decision is being finalised." },
  ineligible:        { label: "Not Eligible",      tone: "danger",  step: 5, blurb: "Unfortunately you did not meet the requirements for your chosen programme." },
  recommended:       { label: "Recommended",       tone: "success", step: 6, blurb: "You have been recommended for admission, pending CAPS approval." },
  caps_pending:      { label: "CAPS Pending",      tone: "warning", step: 7, blurb: "Accept your admission on the JAMB CAPS portal to confirm your place." },
  admitted:          { label: "Admitted",          tone: "success", step: 8, blurb: "Congratulations! You have been offered admission. Accept your offer to proceed." },
  accepted:          { label: "Offer Accepted",    tone: "success", step: 9, blurb: "You have accepted your offer. Pay the acceptance fee and begin clearance." },
  clearance_pending: { label: "Clearance",         tone: "warning", step: 10, blurb: "Complete your fresh-student clearance checklist to be enrolled." },
  enrolled:          { label: "Enrolled",          tone: "success", step: 11, blurb: "Welcome to FUTECH! You are now a registered student." },
};

export const STATE_ORDER: CandidateState[] = ["jamb_imported", "draft", "awaiting_payment", "submitted", "under_review", "screened", "recommended", "caps_pending", "admitted", "accepted", "clearance_pending", "enrolled"];

/* ---- programmes with quota + cutoff ---- */
export const PROGRAMMES: Programme[] = [
  { id: "csc", name: "Computer Science", faculty: "Computing", cutoff: 240, quota: 120, applied: 318, subjects: ["Mathematics", "Physics", "English Language"] },
  { id: "eee", name: "Electrical/Electronic Engineering", faculty: "Engineering", cutoff: 230, quota: 100, applied: 214, subjects: ["Mathematics", "Physics", "Chemistry"] },
  { id: "arc", name: "Architecture", faculty: "Environmental Sciences", cutoff: 220, quota: 60, applied: 98, subjects: ["Mathematics", "Physics", "Geography"] },
  { id: "mee", name: "Mechanical Engineering", faculty: "Engineering", cutoff: 215, quota: 90, applied: 142, subjects: ["Mathematics", "Physics", "Chemistry"] },
  { id: "bch", name: "Biochemistry", faculty: "Life Sciences", cutoff: 200, quota: 80, applied: 121, subjects: ["Biology", "Chemistry", "Physics"] },
];
export const progById = (id: string): Programme | undefined => PROGRAMMES.find((p) => p.id === id);

/* ---- O'Level grading ---- */
export const OLEVEL_GRADES: string[] = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];
export const OLEVEL_SUBJECTS: string[] = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics", "Geography", "Economics", "Technical Drawing", "Agricultural Science"];

/* ---- required documents ---- */
export const DOC_TYPES: DocType[] = [
  { id: "olevel", name: "O'Level Result (WAEC/NECO)", note: "Statement of result or certificate" },
  { id: "jamb", name: "JAMB Result Slip", note: "Original UTME result slip" },
  { id: "birth", name: "Birth Certificate / Age Declaration", note: "Issued by NPC or court" },
  { id: "origin", name: "Certificate of Origin (LGA)", note: "Indigene certificate" },
  { id: "passport", name: "Passport Photograph", note: "Recent, white background" },
];

/* ---- fees ---- */
export const SCREENING_FEE = 2500;
export const ACCEPTANCE_FEE = 25000;

/* ---- fresh-student clearance checklist ---- */
export const CLEARANCE: ClearanceItem[] = [
  { id: "docs", unit: "Registry", label: "Document verification", note: "Originals checked against uploads" },
  { id: "medical", unit: "Health Centre", label: "Medical examination", note: "Fitness screening at the clinic" },
  { id: "acceptance", unit: "Bursary", label: "Acceptance fee confirmed", note: "Payment reflected", auto: "acceptancePaid" },
  { id: "biometric", unit: "ICT", label: "Biometric capture", note: "Fingerprint & photo for ID card" },
  { id: "matric", unit: "Registry", label: "Matriculation number issued", note: "Generated after clearance" },
];

/* ---- the live demo candidate (imported from JAMB) ---- */
export const ME: Candidate = {
  jamb: "20419283AF",
  name: "Chinonso Daniel Eze",
  first: "Chinonso",
  initials: "CE",
  score: 268,
  programme: "csc",
  gender: "Male",
  state: "Anambra",
  lga: "Idemili North",
  dob: "2007-03-14",
  email: "chinonso.eze@example.com",
  phone: "+234 802 411 7723",
  subjects: { Mathematics: 62, Physics: 70, "English Language": 58, Chemistry: 78 },
};

/* ---- staff side: pool of imported JAMB candidates in various states ---- */
// validation flags model real import problems
export const POOL: PoolCandidate[] = [
  { id: "c1", jamb: "20418800AA", name: "Aisha Mohammed Bello", score: 251, prog: "csc", state: "submitted", gender: "Female", origin: "Kano", flags: [] },
  { id: "c2", jamb: "20410233BC", name: "Tunde Akinyemi Olu", score: 238, prog: "eee", state: "under_review", gender: "Male", origin: "Oyo", flags: [] },
  { id: "c3", jamb: "20455190DZ", name: "Grace Effiong Udo", score: 274, prog: "csc", state: "recommended", gender: "Female", origin: "Akwa Ibom", flags: [] },
  { id: "c4", jamb: "20433271EF", name: "Ibrahim Sani Lawal", score: 209, prog: "csc", state: "queried", gender: "Male", origin: "Kaduna", flags: ["score_below_cutoff"], query: "Your UTME score (209) is below the 240 cutoff for Computer Science. Consider change of course." },
  { id: "c5", jamb: "20419283AF", name: "Chinonso Daniel Eze", score: 268, prog: "csc", state: LIVE_CANDIDATE, gender: "Male", origin: "Anambra", flags: [] },
  { id: "c6", jamb: "20422145GH", name: "Fatima Abdullahi", score: 256, prog: "arc", state: "admitted", gender: "Female", origin: "Niger", flags: [] },
  { id: "c7", jamb: "20467012JK", name: "Emeka Obiora Nwankwo", score: 198, prog: "bch", state: "ineligible", gender: "Male", origin: "Enugu", flags: ["score_below_cutoff"] },
  { id: "c8", jamb: "20488333LM", name: "Blessing Yakubu", score: 263, prog: "mee", state: "under_review", gender: "Female", origin: "Plateau", flags: ["doc_missing"] },
];

// scale the pool with generated candidates so screening review has realistic volume
(function seedPool() {
  const F = ["Chinedu", "Aisha", "Tobi", "Ngozi", "Ibrahim", "Fatima", "Daniel", "Blessing", "Yusuf", "Chiamaka", "Samuel", "Hauwa", "Emeka", "Grace", "Abdul", "Zainab", "Peter", "Funke", "Uche", "Maryam", "Olumide", "Halima", "Victor", "Rita", "Bashir", "Esther", "Kelvin", "Amina", "Joshua", "Patience", "Nnamdi", "Khadija", "Segun", "Ifeoma", "Musa", "Bukola", "Chidi", "Rabiu", "Adaeze", "Tunde"];
  const S = ["Okonkwo", "Bello", "Adeyemi", "Eze", "Musa", "Sani", "Okoro", "Akpan", "Lawal", "Nwankwo", "Ojo", "Abubakar", "Effiong", "Yakubu", "Aliyu", "Adebayo", "Okafor", "Garba", "Suleiman", "Mohammed", "Udo", "Idris", "Bamidele", "Obi", "Balogun", "Chukwu", "Adamu", "Oladipo", "Usman", "Eke"];
  const ORIGINS = ["Lagos", "Kano", "Oyo", "Rivers", "Kaduna", "Anambra", "Enugu", "Delta", "Niger", "Plateau", "Imo", "Ogun", "Borno", "Ondo", "Edo", "Sokoto", "Benue", "Kwara"];
  const progIds = PROGRAMMES.map((p) => p.id);
  const states: PoolState[] = ["submitted", "submitted", "under_review", "under_review", "queried", "screened", "recommended", "admitted", "accepted", "ineligible", "clearance_pending"];
  for (let i = 0; i < 72; i++) {
    const prog = progIds[(i * 7 + 2) % progIds.length];
    // prog comes from PROGRAMMES, so this lookup always resolves.
    const cutoff = PROGRAMMES.find((p) => p.id === prog)!.cutoff;
    const score = 180 + ((i * 13 + 5) % 110);
    let state = states[(i * 5 + 1) % states.length];
    const flags: CandidateFlag[] = [];
    if (score < cutoff) {
      flags.push("score_below_cutoff");
      if (state === "admitted" || state === "recommended" || state === "accepted") state = "queried";
    }
    if (i % 11 === 0) flags.push("doc_missing");
    POOL.push({
      id: "g" + i,
      jamb: "204" + (10000 + i * 137).toString().slice(0, 5) + "XY".charAt(i % 2) + "Z",
      name: F[(i * 3 + 1) % F.length] + " " + S[(i * 7 + 4) % S.length],
      score, prog, state, gender: i % 2 ? "Female" : "Male",
      origin: ORIGINS[(i * 5) % ORIGINS.length], flags,
      query: flags.includes("score_below_cutoff") && state === "queried" ? "Your UTME score (" + score + ") is below the " + cutoff + " cutoff. Consider change of course." : undefined,
    });
  }
})();

/* ---- raw JAMB import batch (preview before importing) ---- */
export const IMPORT_BATCH: ImportRow[] = [
  { jamb: "20491020NP", name: "Samuel Adewale Cole", score: 281, prog: "csc", gender: "Male", origin: "Ogun", issues: [] },
  { jamb: "20492881QR", name: "Halima Usman", score: 244, prog: "eee", gender: "Female", origin: "Sokoto", issues: [] },
  { jamb: "20493772ST", name: "David Okafor", score: 233, prog: "csc", gender: "Male", origin: "Imo", issues: ["below_cutoff"] },
  { jamb: "20494663UV", name: "Ngozi Okeke", score: 259, prog: "arc", gender: "Female", origin: "Anambra", issues: [] },
  { jamb: "20410233BC", name: "Tunde Akinyemi Olu", score: 238, prog: "eee", gender: "Male", origin: "Oyo", issues: ["duplicate"] },
  { jamb: "20495554WX", name: "Yusuf —", score: 271, prog: "mee", gender: "Male", origin: "Bauchi", issues: ["incomplete_name"] },
  { jamb: "20496445YZ", name: "Chiamaka Eze", score: 248, prog: "bch", gender: "Female", origin: "Ebonyi", issues: [] },
];

export const IMPORT_ISSUE_LABELS: Record<ImportIssue | CandidateFlag, { label: string; tone: Tone }> = {
  below_cutoff: { label: "Below cutoff", tone: "warning" },
  duplicate: { label: "Duplicate record", tone: "danger" },
  incomplete_name: { label: "Incomplete name", tone: "warning" },
  doc_missing: { label: "Document missing", tone: "warning" },
  score_below_cutoff: { label: "Below cutoff", tone: "warning" },
};

/** Grouped namespace mirroring the old `window.ADM` shape. */
export const ADM = {
  fmt, STATES, STATE_ORDER, PROGRAMMES, progById, OLEVEL_GRADES, OLEVEL_SUBJECTS,
  DOC_TYPES, SCREENING_FEE, ACCEPTANCE_FEE, CLEARANCE, ME, POOL, IMPORT_BATCH, IMPORT_ISSUE_LABELS,
};
