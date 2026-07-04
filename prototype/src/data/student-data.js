/* FUTECH Student Portal — mock data store */
(function () {
  const STUDENT = {
    name: "Adaeze N. Okeke",
    first: "Adaeze",
    matric: "FUT/2022/CSC/10428",
    jamb: "20419283AF",
    programme: "B.Sc. Computer Science",
    department: "Computer Science",
    faculty: "Faculty of Computing",
    level: "300 Level",
    session: "2025/2026",
    semester: "First Semester",
    entryMode: "UTME",
    standing: "Good Standing",
    cgpa: 4.21,
    email: "adaeze.okeke@st.futech.edu.ng",
    phone: "+234 803 555 0142",
    gender: "Female",
    initials: "AO",
  };

  // Fee structure for the session
  const FEES = {
    session: "2025/2026",
    items: [
      { id: "tuition", label: "Tuition & Faculty Charges", amount: 87500, required: true },
      { id: "dept", label: "Departmental Dues (CSC)", amount: 5000, required: true },
      { id: "ict", label: "ICT & Portal Maintenance", amount: 7500, required: true },
      { id: "medical", label: "Medical / Health Services", amount: 4000, required: true },
      { id: "library", label: "Library & E-Resources", amount: 3500, required: true },
      { id: "sug", label: "Students' Union Dues", amount: 1500, required: true },
    ],
    invoiceNo: "INV-2526-104280",
    dueDate: "Oct 31, 2025",
  };

  // On-demand charges & services a student can pay for any time.
  // `once: true` items can only be paid once per session (show as Paid afterwards).
  const CHARGES = [
    { id: "siwes", label: "SIWES / Industrial Training", amount: 6000, icon: "building", group: "Academic", once: true,
      desc: "Mandatory industrial-attachment levy for 300 level. Required before IT placement." },
    { id: "handouts", label: "Course Handouts & Materials", amount: 4500, icon: "book", group: "Academic", once: true,
      desc: "Departmental handout and lab-manual bundle for the semester." },
    { id: "late-reg", label: "Late Registration Penalty", amount: 5000, icon: "clock", group: "Penalties", once: true,
      desc: "Charged when course registration is completed after the official deadline." },
    { id: "transcript", label: "Official Transcript", amount: 7500, icon: "doc", group: "Documents",
      desc: "Certified academic record sent to any institution or employer. Per copy." },
    { id: "id-card", label: "ID Card Replacement", amount: 2000, icon: "user", group: "Documents",
      desc: "Replace a lost, damaged or expired student identity card." },
    { id: "exam-card", label: "Exam Docket Reprint", amount: 1000, icon: "print", group: "Documents",
      desc: "Reprint your examination card / docket for the semester." },
  ];

  // Payments already on record from previous sessions (for history continuity)
  const PAYMENT_HISTORY = [
    { id: "h1", label: "School Fees", amount: 96500, ref: "PAY-9KX2A1", date: "12 Oct 2024", method: "Debit card", category: "Obligatory", session: "2024/2025" },
    { id: "h2", label: "Acceptance Fee", amount: 25000, ref: "PAY-3MB7QER", date: "02 Sep 2022", method: "Bank transfer", category: "Obligatory", session: "2022/2023" },
    { id: "h3", label: "Hostel Fee — Flora Shaw Hall", amount: 38000, ref: "HST-7720KL", date: "15 Oct 2024", method: "USSD", category: "Accommodation", session: "2024/2025" },
  ];

  // Courses available for registration this semester (300L CSC, 1st sem)
  const COURSES = [
    { code: "CSC 301", title: "Data Structures & Algorithms", units: 3, type: "Core", lecturer: "Dr. E. Bassey", venue: "LH 1", prereq: ["CSC 201", "CSC 299"], desc: "Abstract data types, algorithm analysis (Big-O), trees, graphs, hashing, sorting and searching. Weekly lab in C++." },
    { code: "CSC 303", title: "Operating Systems", units: 3, type: "Core", lecturer: "Prof. K. Adewale", venue: "LH 2", prereq: ["CSC 205"], desc: "Processes, threads, scheduling, memory management, file systems and concurrency, with Linux case studies." },
    { code: "CSC 305", title: "Database Management Systems", units: 3, type: "Core", lecturer: "Dr. F. Okonkwo", venue: "Lab 2", prereq: ["CSC 204"], desc: "Relational model, ER design, normalisation, SQL, transactions and indexing. Project on a real schema." },
    { code: "CSC 307", title: "Computer Architecture", units: 2, type: "Core", lecturer: "Dr. M. Sani", venue: "LH 3", prereq: ["CSC 206"], desc: "Digital logic, CPU datapath, pipelining, memory hierarchy and assembly-level programming." },
    { code: "CSC 309", title: "Object-Oriented Programming II", units: 3, type: "Core", lecturer: "Mr. T. Balogun", venue: "Lab 1", prereq: ["CSC 202"], desc: "Advanced OOP in Java: generics, collections, exceptions, design patterns and unit testing." },
    { code: "CSC 311", title: "Web Application Development", units: 2, type: "Elective", lecturer: "Mrs. J. Eze", venue: "Lab 3", prereq: ["CSC 201"], desc: "Full-stack fundamentals: HTML/CSS/JS, REST APIs, and a deployed semester project." },
    { code: "MTH 301", title: "Linear Algebra II", units: 3, type: "Core", lecturer: "Dr. P. Nwosu", venue: "LH 4", prereq: ["MTH 201", "MTH 202"], desc: "Vector spaces, linear transformations, eigenvalues, diagonalisation and applications." },
    { code: "GST 301", title: "Entrepreneurship Studies", units: 2, type: "GST", lecturer: "Dr. R. Lawal", venue: "Audit.", prereq: [], desc: "Opportunity identification, business modelling, finance basics and a venture pitch." },
    { code: "CSC 299", title: "Discrete Mathematics (Carryover)", units: 3, type: "Carryover", lecturer: "Dr. A. Ibrahim", carryover: true, venue: "LH 1", prereq: [], desc: "Logic, sets, relations, combinatorics and graph theory. Carried over from 200 level." },
    { code: "CSC 313", title: "Human–Computer Interaction", units: 2, type: "Elective", lecturer: "Dr. C. Madu", venue: "LH 2", prereq: ["CSC 299"], desc: "Usability principles, interaction design, prototyping and user evaluation methods." },
  ];

  // Map of course code -> full title, for showing prerequisite names anywhere
  const COURSE_TITLES = {
    "CSC 201": "Computer Programming I", "CSC 202": "Computer Programming II",
    "CSC 203": "Discrete Structures", "CSC 204": "Systems Analysis & Design",
    "CSC 205": "Data Communications", "CSC 206": "Digital Logic Design",
    "CSC 299": "Discrete Mathematics", "MTH 201": "Calculus I", "MTH 202": "Calculus II",
  };

  // Lecturer directory (keyed by display name)
  const LECTURERS = {
    "Dr. E. Bassey": { title: "Senior Lecturer", office: "CS Block, Rm 14", email: "e.bassey@futech.edu.ng", hours: "Tue & Thu, 10am–12pm", area: "Algorithms & Complexity" },
    "Prof. K. Adewale": { title: "Professor", office: "CS Block, Rm 02", email: "k.adewale@futech.edu.ng", hours: "Mon, 2–4pm", area: "Systems & Networks" },
    "Dr. F. Okonkwo": { title: "Lecturer I", office: "CS Block, Rm 21", email: "f.okonkwo@futech.edu.ng", hours: "Wed, 11am–1pm", area: "Databases & Data Engineering" },
    "Dr. M. Sani": { title: "Lecturer I", office: "CS Block, Rm 18", email: "m.sani@futech.edu.ng", hours: "Thu, 9–11am", area: "Computer Architecture" },
    "Mr. T. Balogun": { title: "Lecturer II", office: "CS Block, Rm 27", email: "t.balogun@futech.edu.ng", hours: "Fri, 1–3pm", area: "Software Engineering" },
    "Mrs. J. Eze": { title: "Lecturer II", office: "CS Block, Rm 30", email: "j.eze@futech.edu.ng", hours: "Tue, 12–2pm", area: "Web & Mobile Computing" },
    "Dr. P. Nwosu": { title: "Senior Lecturer", office: "Maths Block, Rm 09", email: "p.nwosu@futech.edu.ng", hours: "Wed, 10am–12pm", area: "Applied Mathematics" },
    "Dr. R. Lawal": { title: "Lecturer I", office: "GST Centre, Rm 05", email: "r.lawal@futech.edu.ng", hours: "Mon, 11am–1pm", area: "Entrepreneurship" },
    "Dr. A. Ibrahim": { title: "Lecturer I", office: "CS Block, Rm 16", email: "a.ibrahim@futech.edu.ng", hours: "Thu, 2–4pm", area: "Discrete Mathematics" },
    "Dr. C. Madu": { title: "Senior Lecturer · 300L Adviser", office: "CS Block, Rm 11", email: "c.madu@futech.edu.ng", hours: "Mon & Wed, 3–5pm", area: "Human–Computer Interaction" },
  };

  // Venue directory
  const VENUES = {
    "LH 1": { name: "Lecture Hall 1", building: "Faculty of Computing", capacity: 200, facilities: "Projector, PA system, AC" },
    "LH 2": { name: "Lecture Hall 2", building: "Faculty of Computing", capacity: 180, facilities: "Projector, PA system" },
    "LH 3": { name: "Lecture Hall 3", building: "Central Block", capacity: 150, facilities: "Projector, whiteboard" },
    "LH 4": { name: "Lecture Hall 4", building: "Maths Block", capacity: 120, facilities: "Projector, whiteboard" },
    "Lab 1": { name: "Computing Lab 1", building: "ICT Centre", capacity: 60, facilities: "60 workstations, AC" },
    "Lab 2": { name: "Computing Lab 2", building: "ICT Centre", capacity: 60, facilities: "60 workstations, DB servers" },
    "Lab 3": { name: "Computing Lab 3", building: "ICT Centre", capacity: 50, facilities: "50 workstations, AC" },
    "Audit.": { name: "Main Auditorium", building: "Convocation Arena", capacity: 1200, facilities: "Stage, PA, projection" },
    "Exam Hall A": { name: "Examination Hall A", building: "Exams Complex", capacity: 400, facilities: "CCTV, numbered seating" },
    "Exam Hall B": { name: "Examination Hall B", building: "Exams Complex", capacity: 400, facilities: "CCTV, numbered seating" },
    "ICT Lab": { name: "ICT Examination Lab", building: "ICT Centre", capacity: 120, facilities: "CBT workstations, CCTV" },
  };

  // Hostel inventory
  const HOSTELS = [
    {
      id: "queen-amina",
      name: "Queen Amina Hall",
      gender: "Female",
      desc: "Newly renovated · 24/7 power · borehole water",
      pricePerBed: 45000,
      blocks: [
        { id: "A", rooms: makeRooms("A", 8, [2, 0, 4, 1, 3, 0, 2, 4]) },
        { id: "B", rooms: makeRooms("B", 8, [0, 1, 0, 4, 2, 3, 0, 1]) },
      ],
    },
    {
      id: "flora-shaw",
      name: "Flora Shaw Hall",
      gender: "Female",
      desc: "Standard rooms · study lounge · close to lecture halls",
      pricePerBed: 38000,
      blocks: [
        { id: "C", rooms: makeRooms("C", 6, [4, 4, 0, 2, 4, 1]) },
        { id: "D", rooms: makeRooms("D", 6, [1, 0, 3, 4, 0, 2]) },
      ],
    },
  ];

  // each room: 4 bed spaces, `free` = number of vacant beds
  function makeRooms(block, count, freeArr) {
    const rooms = [];
    for (let i = 0; i < count; i++) {
      const num = block + (200 + (i + 1));
      const free = freeArr[i];
      rooms.push({
        id: num,
        number: num,
        capacity: 4,
        free: free,
        beds: Array.from({ length: 4 }, (_, b) => ({
          id: num + "-" + (b + 1),
          label: "Bed " + (b + 1),
          taken: b >= free, // first `free` beds are vacant
        })),
      });
    }
    return rooms;
  }

  // Results — past semesters (released), current pending
  const RESULTS = [
    {
      session: "2024/2025", semester: "Second Semester", level: "200 Level",
      gpa: 4.33, released: true,
      courses: [
        { code: "CSC 202", title: "Computer Programming II", units: 3, score: 78, grade: "A", gp: 5 },
        { code: "CSC 204", title: "Systems Analysis & Design", units: 3, score: 71, grade: "A", gp: 5 },
        { code: "CSC 206", title: "Digital Logic Design", units: 2, score: 64, grade: "B", gp: 4 },
        { code: "MTH 202", title: "Calculus II", units: 3, score: 58, grade: "C", gp: 3 },
        { code: "GST 202", title: "Peace & Conflict Resolution", units: 2, score: 81, grade: "A", gp: 5 },
        { code: "CSC 299", title: "Discrete Mathematics", units: 3, score: 38, grade: "F", gp: 0 },
      ],
    },
    {
      session: "2024/2025", semester: "First Semester", level: "200 Level",
      gpa: 4.10, released: true,
      courses: [
        { code: "CSC 201", title: "Computer Programming I", units: 3, score: 74, grade: "A", gp: 5 },
        { code: "CSC 203", title: "Discrete Structures", units: 3, score: 69, grade: "B", gp: 4 },
        { code: "CSC 205", title: "Data Communications", units: 2, score: 66, grade: "B", gp: 4 },
        { code: "MTH 201", title: "Calculus I", units: 3, score: 61, grade: "B", gp: 4 },
        { code: "GST 201", title: "Use of English II", units: 2, score: 70, grade: "A", gp: 5 },
      ],
    },
    {
      session: "2023/2024", semester: "Second Semester", level: "100 Level",
      gpa: 3.90, released: true,
      courses: [
        { code: "CSC 102", title: "Intro to Computing II", units: 3, score: 72, grade: "A", gp: 5 },
        { code: "MTH 102", title: "Elementary Mathematics II", units: 3, score: 60, grade: "B", gp: 4 },
        { code: "PHY 102", title: "General Physics II", units: 3, score: 55, grade: "C", gp: 3 },
        { code: "GST 102", title: "Use of English I", units: 2, score: 76, grade: "A", gp: 5 },
        { code: "CHM 102", title: "General Chemistry II", units: 2, score: 58, grade: "C", gp: 3 },
      ],
    },
    {
      session: "2023/2024", semester: "First Semester", level: "100 Level",
      gpa: 3.74, released: true,
      courses: [
        { code: "CSC 101", title: "Intro to Computing I", units: 3, score: 68, grade: "B", gp: 4 },
        { code: "MTH 101", title: "Elementary Mathematics I", units: 3, score: 57, grade: "C", gp: 3 },
        { code: "PHY 101", title: "General Physics I", units: 3, score: 52, grade: "C", gp: 3 },
        { code: "GST 101", title: "Communication in English", units: 2, score: 71, grade: "A", gp: 5 },
        { code: "CHM 101", title: "General Chemistry I", units: 2, score: 63, grade: "B", gp: 4 },
      ],
    },
  ];

  // Lecture timetable (Mon–Fri). slots keyed by day -> array
  const TIMETABLE = {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    periods: ["8:00", "10:00", "12:00", "14:00", "16:00"],
    lectures: [
      { day: "Monday", start: "8:00", span: 2, code: "CSC 301", room: "LH 1", color: "a" },
      { day: "Monday", start: "12:00", span: 1, code: "GST 301", room: "Audit.", color: "b" },
      { day: "Tuesday", start: "10:00", span: 2, code: "CSC 305", room: "Lab 2", color: "c" },
      { day: "Tuesday", start: "16:00", span: 1, code: "CSC 311", room: "Lab 3", color: "d" },
      { day: "Wednesday", start: "8:00", span: 1, code: "MTH 301", room: "LH 4", color: "e" },
      { day: "Wednesday", start: "12:00", span: 2, code: "CSC 303", room: "LH 2", color: "a" },
      { day: "Thursday", start: "10:00", span: 1, code: "CSC 307", room: "LH 3", color: "f" },
      { day: "Thursday", start: "14:00", span: 2, code: "CSC 309", room: "Lab 1", color: "c" },
      { day: "Friday", start: "8:00", span: 2, code: "CSC 305", room: "Lab 2", color: "c" },
      { day: "Friday", start: "14:00", span: 1, code: "GST 301", room: "Audit.", color: "b" },
    ],
    exams: [
      { date: "Mon · Dec 8", code: "CSC 301", title: "Data Structures & Algorithms", time: "9:00 – 12:00", venue: "Exam Hall A", seat: "A-114" },
      { date: "Wed · Dec 10", code: "CSC 303", title: "Operating Systems", time: "9:00 – 12:00", venue: "Exam Hall B", seat: "B-052" },
      { date: "Fri · Dec 12", code: "MTH 301", title: "Linear Algebra II", time: "13:00 – 15:00", venue: "Exam Hall A", seat: "A-114" },
      { date: "Mon · Dec 15", code: "CSC 305", title: "Database Management Systems", time: "9:00 – 12:00", venue: "ICT Lab", seat: "L-019" },
      { date: "Wed · Dec 17", code: "CSC 309", title: "OOP II", time: "9:00 – 11:00", venue: "Exam Hall B", seat: "B-052" },
    ],
  };

  const ANNOUNCEMENTS = [
    { tag: "Bursary", tone: "accent", title: "2025/2026 school fees portal now open", body: "Payment closes October 31. Late payment attracts a ₦5,000 penalty.", time: "2h ago" },
    { tag: "Registration", tone: "warning", title: "Course registration deadline extended", body: "Level advisers will review submissions until November 7.", time: "Yesterday" },
    { tag: "Hostel", tone: "success", title: "Female hostel allocation opens Monday", body: "Only students who have paid school fees are eligible to apply.", time: "2 days ago" },
    { tag: "Exams", tone: "neutral", title: "First semester exam timetable published", body: "Check the Timetable tab for your personalised exam schedule.", time: "4 days ago" },
  ];

  const GPA_HISTORY = [
    { term: "100L · 1st", gpa: 3.78 },
    { term: "100L · 2nd", gpa: 3.95 },
    { term: "200L · 1st", gpa: 4.10 },
    { term: "200L · 2nd", gpa: 4.33 },
  ];

  const NOTIFICATIONS = [
    { id: "n1", icon: "wallet", tone: "accent", title: "School fees window closes soon", body: "Pay your 2025/2026 fees before October 31 to avoid a ₦5,000 penalty.", time: "2h ago", unread: true },
    { id: "n2", icon: "book", tone: "warning", title: "Course registration deadline extended", body: "Level advisers will review submissions until November 7.", time: "Yesterday", unread: true },
    { id: "n3", icon: "bed", tone: "success", title: "Female hostel allocation now open", body: "You are eligible — secure a bed space in Queen Amina or Flora Shaw Hall.", time: "2 days ago", unread: true },
    { id: "n4", icon: "calendar", tone: "neutral", title: "Exam timetable published", body: "Your first-semester exam schedule is ready. Add it to your calendar.", time: "4 days ago", unread: false },
    { id: "n5", icon: "chart", tone: "neutral", title: "200L second-semester results released", body: "Your GPA for the period is 4.33. View the full breakdown.", time: "1 week ago", unread: false },
  ];

  // ===== Classes / LMS content (keyed by course code) =====
  // Each approved course becomes an interactive class space.
  const CLASS_CONTENT = {
    "CSC 301": {
      stream: [
        { who: "Dr. E. Bassey", time: "2 days ago", body: "Reminder: bring your laptops for Friday's lab on balanced trees. We'll implement AVL rotations together." },
        { who: "Dr. E. Bassey", time: "1 week ago", body: "Welcome to Data Structures & Algorithms! Read chapters 1–2 of the handout before our first class. Office hours are Tue & Thu, 10am–12pm." },
      ],
      materials: [
        { name: "Course outline & grading.pdf", type: "PDF", size: "180 KB", date: "Oct 1" },
        { name: "Week 1 — Complexity & Big-O.pdf", type: "PDF", size: "1.2 MB", date: "Oct 6" },
        { name: "Week 2 — Linked lists & stacks.pdf", type: "PDF", size: "2.4 MB", date: "Oct 13" },
        { name: "Lab 1 starter code.zip", type: "ZIP", size: "44 KB", date: "Oct 13" },
        { name: "Trees & graphs (slides).pptx", type: "PPTX", size: "5.1 MB", date: "Oct 20" },
      ],
      assignments: [
        { id: "csc301-a1", title: "Assignment 1 — Big-O analysis", due: "Oct 18, 2025", points: 20, instructions: "Analyse the time and space complexity of the five algorithms in the handout. Submit a single PDF with your derivations.", seed: "graded", grade: 17, feedback: "Solid work. Q4 should be O(n log n), not O(n²) — review the merge step." },
        { id: "csc301-a2", title: "Lab 2 — Implement a stack & queue", due: "Nov 1, 2025", points: 15, instructions: "Implement a stack and queue from scratch in C++ with unit tests. Submit your .zip.", seed: "submitted" },
        { id: "csc301-a3", title: "Assignment 3 — Binary search trees", due: "Nov 22, 2025", points: 25, instructions: "Implement a BST with insert, delete and in-order traversal. Include a short report on balancing.", seed: "open" },
      ],
    },
    "CSC 303": {
      stream: [
        { who: "Prof. K. Adewale", time: "3 days ago", body: "The scheduling simulation assignment is now posted. Start early — the deadline will not be extended." },
        { who: "Prof. K. Adewale", time: "2 weeks ago", body: "Install a Linux VM (Ubuntu 22.04 recommended) before next week. We'll be writing shell-level programs." },
      ],
      materials: [
        { name: "Syllabus — Operating Systems.pdf", type: "PDF", size: "210 KB", date: "Oct 2" },
        { name: "Processes & threads.pdf", type: "PDF", size: "1.8 MB", date: "Oct 9" },
        { name: "CPU scheduling (slides).pptx", type: "PPTX", size: "4.3 MB", date: "Oct 16" },
      ],
      assignments: [
        { id: "csc303-a1", title: "Assignment 1 — Process scheduling sim", due: "Oct 25, 2025", points: 30, instructions: "Build a simulator comparing FCFS, SJF and Round Robin. Report average waiting and turnaround times.", seed: "open" },
        { id: "csc303-a2", title: "Reading response — Deadlocks", due: "Nov 8, 2025", points: 10, instructions: "One-page response to the Coffman conditions reading.", seed: "open" },
      ],
    },
    "CSC 305": {
      stream: [
        { who: "Dr. F. Okonkwo", time: "Yesterday", body: "Great turnout at today's lab. Remember your ER diagrams are due before we start normalisation next week." },
        { who: "Dr. F. Okonkwo", time: "1 week ago", body: "Install PostgreSQL 16 and pgAdmin. The class project will use a real e-commerce schema." },
      ],
      materials: [
        { name: "DBMS course pack.pdf", type: "PDF", size: "320 KB", date: "Oct 3" },
        { name: "Relational model & ER design.pdf", type: "PDF", size: "2.1 MB", date: "Oct 10" },
        { name: "SQL cheat sheet.pdf", type: "PDF", size: "90 KB", date: "Oct 10" },
        { name: "Sample database.sql", type: "SQL", size: "62 KB", date: "Oct 17" },
      ],
      assignments: [
        { id: "csc305-a1", title: "ER diagram — Library system", due: "Oct 20, 2025", points: 20, instructions: "Design an ER diagram for a university library. Submit as PDF.", seed: "graded", grade: 19, feedback: "Excellent. Consider a weak entity for loan instances." },
        { id: "csc305-a2", title: "SQL query set", due: "Nov 5, 2025", points: 20, instructions: "Write the 12 SQL queries against the sample database.", seed: "open" },
        { id: "csc305-a3", title: "Project — Normalised schema", due: "Dec 1, 2025", points: 35, instructions: "Submit a 3NF schema for your chosen domain with justification.", seed: "open" },
      ],
    },
  };

  function classFor(code) {
    if (CLASS_CONTENT[code]) return CLASS_CONTENT[code];
    return {
      stream: [{ who: "Course lecturer", time: "This week", body: "Welcome to " + code + ". Materials and assignments will be posted here through the semester." }],
      materials: [{ name: code + " — Course outline.pdf", type: "PDF", size: "160 KB", date: "Oct 1" }],
      assignments: [{ id: code.toLowerCase().replace(/\s/g, "") + "-a1", title: "Assignment 1", due: "Nov 15, 2025", points: 20, instructions: "Details will be provided in class.", seed: "open" }],
    };
  }

  const NEWS = [
    { kind: "News", title: "FUTECH ranked top 5 for engineering research in the region", date: "May 28, 2026" },
    { kind: "Event", title: "10th Convocation Ceremony — registration now open", date: "Jun 14, 2026" },
    { kind: "Admissions", title: "2026/2027 UTME admission screening dates announced", date: "May 20, 2026" },
  ];

  window.DATA = {
    STUDENT, FEES, CHARGES, PAYMENT_HISTORY, COURSES, COURSE_TITLES, HOSTELS, RESULTS, TIMETABLE, ANNOUNCEMENTS, NEWS, GPA_HISTORY, LECTURERS, VENUES, NOTIFICATIONS,
    CLASS_CONTENT, classFor,
    // set of course codes the student has already passed (grade !== F across released results)
    passedCourses: () => {
      const s = new Set();
      RESULTS.forEach((r) => r.courses.forEach((c) => { if (c.grade !== "F") s.add(c.code); }));
      return s;
    },
    courseName: (code) => COURSE_TITLES[code] || code,
    fmt: (n) => "\u20a6" + n.toLocaleString("en-NG"),
  };
})();
