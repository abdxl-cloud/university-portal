/* Campus services: Library & Clinic data (student + staff). Reuses window.DATA. */
(function () {
  const fmt = (n) => "\u20a6" + n.toLocaleString("en-NG");
  const init = (n) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
  const NAMES = [
    "Chukwuemeka Obi", "Aisha Bello", "Tobi Adeyemi", "Ngozi Eze", "Ibrahim Musa",
    "Fatima Sani", "Daniel Okoro", "Blessing Akpan", "Yusuf Lawal", "Chiamaka Nwankwo",
    "Samuel Ojo", "Hauwa Abubakar", "Emeka Nnaji", "Grace Effiong", "Abdul Yakubu",
  ];

  /* ---------------- LIBRARY ---------------- */
  const BOOKS = [
    { id: "b1", title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest & Stein", cat: "Computer Science", year: 2009, copies: 6, available: 2, call: "QA76.6 .C66" },
    { id: "b2", title: "Database System Concepts", author: "Silberschatz, Korth & Sudarshan", cat: "Computer Science", year: 2019, copies: 5, available: 0, call: "QA76.9 .S55" },
    { id: "b3", title: "Operating System Concepts", author: "Silberschatz & Galvin", cat: "Computer Science", year: 2018, copies: 4, available: 3, call: "QA76.76 .S557" },
    { id: "b4", title: "Computer Networking: A Top-Down Approach", author: "Kurose & Ross", cat: "Computer Science", year: 2021, copies: 4, available: 1, call: "TK5105 .K88" },
    { id: "b5", title: "Artificial Intelligence: A Modern Approach", author: "Russell & Norvig", cat: "Computer Science", year: 2020, copies: 3, available: 0, call: "Q335 .R86" },
    { id: "b6", title: "Calculus: Early Transcendentals", author: "James Stewart", cat: "Mathematics", year: 2015, copies: 8, available: 5, call: "QA303 .S82" },
    { id: "b7", title: "Linear Algebra and Its Applications", author: "Gilbert Strang", cat: "Mathematics", year: 2016, copies: 5, available: 2, call: "QA184 .S77" },
    { id: "b8", title: "Engineering Mechanics: Dynamics", author: "Hibbeler", cat: "Engineering", year: 2017, copies: 4, available: 4, call: "TA352 .H53" },
    { id: "b9", title: "Clean Code", author: "Robert C. Martin", cat: "Computer Science", year: 2008, copies: 3, available: 1, call: "QA76.76 .M37" },
    { id: "b10", title: "The Pragmatic Programmer", author: "Hunt & Thomas", cat: "Computer Science", year: 2019, copies: 3, available: 0, call: "QA76.6 .H86" },
    { id: "b11", title: "Discrete Mathematics and Its Applications", author: "Kenneth Rosen", cat: "Mathematics", year: 2018, copies: 6, available: 3, call: "QA39 .R67" },
    { id: "b12", title: "Things Fall Apart", author: "Chinua Achebe", cat: "General", year: 1958, copies: 10, available: 7, call: "PR9387 .A3" },
  ];

  const ERESOURCES = [
    { name: "IEEE Xplore Digital Library", provider: "IEEE", desc: "Journals, conference papers & standards in computing and engineering.", icon: "flask" },
    { name: "ACM Digital Library", provider: "ACM", desc: "Full-text computing literature and proceedings.", icon: "bookOpen" },
    { name: "JSTOR", provider: "JSTOR", desc: "Academic journals across all disciplines.", icon: "book" },
    { name: "ScienceDirect", provider: "Elsevier", desc: "Peer-reviewed science & technology research.", icon: "flask" },
    { name: "FUTECH Institutional Repository", provider: "FUTECH", desc: "Past projects, theses & dissertations.", icon: "doc" },
  ];

  // student's current loans (seed). due dates relative to "now": one overdue.
  const MY_LOANS = [
    { id: "L1", bookId: "b3", title: "Operating System Concepts", author: "Silberschatz & Galvin", borrowed: "Nov 24, 2025", due: "Dec 8, 2025", overdue: false, renewed: false },
    { id: "L2", bookId: "b6", title: "Calculus: Early Transcendentals", author: "James Stewart", borrowed: "Nov 10, 2025", due: "Nov 24, 2025", overdue: true, renewed: false },
  ];
  const FINE_PER_DAY = 50;
  const OVERDUE_DAYS = 12; // for the overdue loan

  /* ---------------- CLINIC ---------------- */
  const SERVICES = [
    { id: "gp", name: "General Consultation", icon: "stethoscope", desc: "See a doctor for general health concerns.", dur: "20 min" },
    { id: "dental", name: "Dental Care", icon: "heart", desc: "Routine dental check-ups and treatment.", dur: "30 min" },
    { id: "eye", name: "Eye / Optical", icon: "heart", desc: "Vision tests and eye examinations.", dur: "25 min" },
    { id: "lab", name: "Laboratory Test", icon: "flask", desc: "Blood, malaria, and routine lab tests.", dur: "15 min" },
    { id: "mh", name: "Mental Health & Counselling", icon: "heart", desc: "Confidential counselling and support.", dur: "45 min" },
    { id: "immun", name: "Immunization", icon: "pill", desc: "Vaccinations and boosters.", dur: "15 min" },
  ];
  const SLOTS = ["8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00"];

  const MEDICAL = {
    bloodGroup: "O+", genotype: "AA", height: "168 cm", weight: "61 kg",
    allergies: "Penicillin", emergencyName: "Mrs. N. Okeke (Mother)", emergencyPhone: "+234 803 555 0188",
    nhis: "Active", lastVisit: "Oct 2, 2025",
  };
  const MY_APPOINTMENTS = [
    { id: "AP1", service: "General Consultation", date: "Dec 9, 2025", time: "9:30", status: "confirmed", doctor: "Dr. A. Bello" },
  ];
  const VISITS = [
    { date: "Oct 2, 2025", service: "General Consultation", doctor: "Dr. A. Bello", notes: "Malaria: prescribed ACT, advised rest & fluids." },
    { date: "Aug 18, 2025", service: "Laboratory Test", doctor: "Lab Unit", notes: "Malaria parasite test: positive (mild)." },
    { date: "Feb 11, 2025", service: "Immunization", doctor: "Nurse F. Udo", notes: "Hepatitis B booster administered." },
  ];
  const PRESCRIPTIONS = [
    { date: "Oct 2, 2025", drug: "Artemether/Lumefantrine", dosage: "80/480mg: twice daily, 3 days", doctor: "Dr. A. Bello" },
    { date: "Oct 2, 2025", drug: "Paracetamol", dosage: "1g: three times daily, 5 days", doctor: "Dr. A. Bello" },
  ];
  const LABS = [
    { date: "Aug 18, 2025", test: "Malaria Parasite (MP)", result: "Positive (+)", status: "Reviewed" },
    { date: "Aug 18, 2025", test: "Full Blood Count", result: "Within range", status: "Reviewed" },
  ];

  /* ---------------- STAFF: LIBRARIAN ---------------- */
  const LIB_LOANS = [];
  for (let i = 0; i < 10; i++) {
    const name = NAMES[i % NAMES.length];
    const overdue = i % 4 === 0;
    LIB_LOANS.push({
      id: "ll" + i, student: name, initials: init(name),
      matric: "FUT/2022/CSC/" + (10500 + i * 6),
      book: BOOKS[(i * 3) % BOOKS.length].title,
      borrowed: "Nov " + (8 + i), due: "Dec " + (1 + i),
      overdue, fine: overdue ? (i + 2) * FINE_PER_DAY * 2 : 0,
      baseStatus: "on-loan",
    });
  }
  const LIB_RESERVATIONS = [];
  for (let i = 0; i < 5; i++) {
    const name = NAMES[(i + 5) % NAMES.length];
    LIB_RESERVATIONS.push({
      id: "lr" + i, student: name, initials: init(name),
      matric: "FUT/2022/CSC/" + (10600 + i * 4),
      book: BOOKS.filter((b) => b.available === 0)[i % 3] ? BOOKS.filter((b) => b.available === 0)[i % 3].title : BOOKS[i].title,
      since: "Dec " + (2 + i), baseStatus: "waiting",
    });
  }
  const LIB_STATS = { titles: 24800, copies: 41200, members: 16540 };

  /* Collections: how a school librarian organises the shelf */
  const LIB_COLLECTIONS = [
    { id: "new", name: "New Arrivals", icon: "spark", desc: "Recently catalogued items, on display for 30 days.", seed: ["b4", "b9"] },
    { id: "reserve", name: "Course Reserves", icon: "book", desc: "High-demand textbooks held for short 3-day loans.", seed: ["b1", "b2", "b3", "b5"] },
    { id: "reference", name: "Reference Only", icon: "info", desc: "Non-circulating: consult within the library.", seed: ["b11", "b7"] },
    { id: "fiction", name: "Fiction & Leisure", icon: "bookOpen", desc: "Novels and general reading.", seed: ["b12"] },
    { id: "theses", name: "Projects & Theses", icon: "doc", desc: "Past student projects and dissertations.", seed: [] },
  ];

  /* Mock ISBN lookup: what the barcode scanner "resolves" to.
     Backend would hit a real bibliographic API; here we fake the auto-populate. */
  const ISBN_DB = {
    "9780134685991": { title: "Effective Java", author: "Joshua Bloch", publisher: "Addison-Wesley", year: 2018, cat: "Computer Science", call: "QA76.73.J38 B56", pages: 412 },
    "9781449373320": { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", publisher: "O'Reilly Media", year: 2017, cat: "Computer Science", call: "QA76.9.D3 K54", pages: 616 },
    "9780262035613": { title: "Deep Learning", author: "Goodfellow, Bengio & Courville", publisher: "MIT Press", year: 2016, cat: "Computer Science", call: "Q325.5 .G66", pages: 800 },
    "9780387310732": { title: "Pattern Recognition and Machine Learning", author: "Christopher M. Bishop", publisher: "Springer", year: 2006, cat: "Computer Science", call: "Q327 .B57", pages: 738 },
    "9780393609394": { title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", publisher: "W. W. Norton", year: 2017, cat: "General", call: "QB43.3 .T97", pages: 222 },
    "9780743273565": { title: "The Great Gatsby", author: "F. Scott Fitzgerald", publisher: "Scribner", year: 2004, cat: "Fiction", call: "PS3511.I9 G7", pages: 180 },
    "9781118063330": { title: "Fundamentals of Heat and Mass Transfer", author: "Incropera & DeWitt", publisher: "Wiley", year: 2011, cat: "Engineering", call: "QC320 .I45", pages: 1048 },
    "9780198739838": { title: "The Oxford Handbook of Nigerian Politics", author: "Levan & Ukata (eds.)", publisher: "Oxford University Press", year: 2018, cat: "General", call: "JQ3096 .O94", pages: 880 },
  };
  const SAMPLE_SCANS = ["9780134685991", "9781449373320", "9780393609394", "9780743273565"];
  const LIB_CATEGORIES = ["Computer Science", "Mathematics", "Engineering", "General", "Fiction", "Science", "Reference"];

  /* ---------------- STAFF: CLINIC ---------------- */
  const CLINIC_QUEUE = [];
  for (let i = 0; i < 10; i++) {
    const name = NAMES[(i + 2) % NAMES.length];
    CLINIC_QUEUE.push({
      id: "cq" + i, student: name, initials: init(name),
      matric: "FUT/2022/CSC/" + (10700 + i * 5),
      service: SERVICES[i % SERVICES.length].name,
      date: i < 6 ? "Today" : "Tomorrow",
      time: SLOTS[i % SLOTS.length],
      baseStatus: i % 3 === 0 ? "confirmed" : "pending",
    });
  }
  const DRUGS = [
    { name: "Artemether/Lumefantrine", stock: 18, unit: "packs", level: "low" },
    { name: "Paracetamol 500mg", stock: 240, unit: "tablets", level: "ok" },
    { name: "Amoxicillin 500mg", stock: 64, unit: "capsules", level: "ok" },
    { name: "ORS Sachets", stock: 9, unit: "sachets", level: "low" },
    { name: "Ibuprofen 400mg", stock: 0, unit: "tablets", level: "out" },
    { name: "Vitamin C 1000mg", stock: 180, unit: "tablets", level: "ok" },
    { name: "Hydrocortisone Cream", stock: 12, unit: "tubes", level: "ok" },
    { name: "Malaria RDT Kits", stock: 6, unit: "kits", level: "low" },
  ];
  const CLINIC_STATS = { today: CLINIC_QUEUE.filter((c) => c.date === "Today").length, patients: 1280, visitsWeek: 214 };

  const PEOPLE = {
    librarian: { name: "Mrs. Grace Eze", first: "Grace", initials: "GE", title: "University Librarian", role: "Library · Circulation Desk", staffId: "FUT/STF/LIB/0044", department: "University Library", faculty: "Library Services", email: "g.eze@futech.edu.ng", phone: "+234 803 778 2210", office: "Main Library, Desk 1", area: "Library & Information Science" },
    clinic: { name: "Dr. Ahmed Bello", first: "Ahmed", initials: "AB", title: "Chief Medical Officer", role: "Health Services · Clinic", staffId: "FUT/STF/MED/0009", department: "Health Services", faculty: "Medical Centre", email: "a.bello@futech.edu.ng", phone: "+234 805 220 9911", office: "Medical Centre, Rm 1", area: "Family Medicine" },
  };
  const NOTIF = {
    librarian: [{ id: "lib1", icon: "bookOpen", tone: "warning", title: "3 books overdue today", body: "Overdue loans are accruing fines: follow up with borrowers.", time: "1h ago", unread: true }, { id: "lib2", icon: "book", tone: "accent", title: "5 reservations waiting", body: "Returned copies are ready to be issued to the next in line.", time: "Yesterday", unread: true }],
    clinic: [{ id: "cl1", icon: "heart", tone: "warning", title: "6 appointments today", body: "Patients are waiting to be seen at the medical centre.", time: "30m ago", unread: true }, { id: "cl2", icon: "pill", tone: "danger", title: "Ibuprofen out of stock", body: "Pharmacy inventory needs restocking.", time: "2h ago", unread: true }],
  };

  window.CAMPUS_DATA = {
    fmt, init, BOOKS, ERESOURCES, MY_LOANS, FINE_PER_DAY, OVERDUE_DAYS,
    SERVICES, SLOTS, MEDICAL, MY_APPOINTMENTS, VISITS, PRESCRIPTIONS, LABS,
    LIB_LOANS, LIB_RESERVATIONS, LIB_STATS, LIB_COLLECTIONS, ISBN_DB, SAMPLE_SCANS, LIB_CATEGORIES,
    CLINIC_QUEUE, DRUGS, CLINIC_STATS,
    PEOPLE, NOTIF,
    bookById: (id) => BOOKS.find((b) => b.id === id),
    nextDays: (n) => {
      const out = []; const base = new Date(2025, 11, 9);
      for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() + i); out.push({ key: "d" + i, label: d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" }) }); }
      return out;
    },
  };
})();
