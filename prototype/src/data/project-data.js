/* Final-year project / thesis supervision: data model. Level-gated (400L). */
(function () {
  // the five standard chapters of a B.Sc. project report
  const CHAPTERS = [
    { n: 1, title: "Introduction" },
    { n: 2, title: "Literature Review" },
    { n: 3, title: "Methodology & System Design" },
    { n: 4, title: "Implementation & Results" },
    { n: 5, title: "Summary, Conclusion & Recommendations" },
  ];

  const TOPIC_POOL = [
    "A Machine-Learning Model for Predicting Student Dropout Risk",
    "Design of a Campus Navigation App Using Indoor Positioning",
    "Blockchain-Based Verification of Academic Certificates",
    "An IoT Framework for Smart Hostel Energy Monitoring",
    "Automated Timetable Generation Using Genetic Algorithms",
    "A USSD Payment Gateway for Low-Connectivity Environments",
    "Sentiment Analysis of Student Feedback Using NLP",
    "An Offline-First Health Records System for Campus Clinics",
  ];

  // seeded supervisees for the demo lecturer (Dr. Florence Okonkwo).
  // stage: how far the seeded student has progressed (used as rstate fallback).
  //   topicStatus: none | pending | returned | approved
  //   chAppr: chapters already approved; chPend: chapter currently submitted (0 = none)
  const names = ["Ibrahim Musa", "Ngozi Eze", "Tobi Adeyemi", "Fatima Sani", "Daniel Okoro", "Blessing Akpan", "Yusuf Lawal"];
  const init = (n) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
  const SUPERVISEES = names.map((name, i) => ({
    id: "prj" + i,
    name, initials: init(name),
    matric: "FUT/2021/CSC/" + (10430 + i * 7),
    topic: TOPIC_POOL[i % TOPIC_POOL.length],
    abstract: "This project investigates " + TOPIC_POOL[i % TOPIC_POOL.length].toLowerCase().replace(/^a |^an |^the /, "") + ", with a prototype implementation and evaluation against a baseline.",
    topicStatus: i === 5 ? "pending" : i === 6 ? "none" : "approved",
    chAppr: i === 5 || i === 6 ? 0 : Math.max(0, 4 - i),
    chPend: i === 0 || i === 5 || i === 6 ? 0 : (i % 3 === 1 ? Math.max(1, 5 - i) : 0),
    logPending: i % 3 === 0 ? 1 : 0,
  }));

  // finalists for HOD supervisor allocation (the whole 400L set)
  const FIRST = ["Nnamdi", "Khadija", "Segun", "Ifeoma", "Musa", "Bukola", "Chidi", "Rabiu", "Adaeze", "Tunde", "Suleiman", "Oluwaseun", "Comfort", "Gbenga", "Hadiza", "Obinna", "Folake", "Yakubu", "Chioma", "Aliyu", "Emeka", "Grace", "Abdul", "Zainab"];
  const SURNAME = ["Okonkwo", "Bello", "Adeyemi", "Eze", "Musa", "Sani", "Okoro", "Akpan", "Lawal", "Nwankwo", "Ojo", "Abubakar", "Nnaji", "Effiong", "Yakubu", "Aliyu", "Danladi", "Adebayo", "Okafor", "Garba", "Bankole", "Suleiman", "Agboola", "Onyeka"];
  const FINALISTS = [];
  for (let i = 0; i < 34; i++) {
    const name = FIRST[(i * 5 + 2) % FIRST.length] + " " + SURNAME[(i * 11 + 3) % SURNAME.length];
    FINALISTS.push({
      id: "fin" + i,
      name, initials: init(name),
      matric: "FUT/2021/CSC/" + (10430 + i * 7),
      cgpa: (2.4 + ((i * 13) % 23) / 10).toFixed(2),
      baseSupervisor: i % 4 === 3 ? "Unassigned" : ["Dr. F. Okonkwo", "Dr. E. Bassey", "Prof. K. Adewale", "Dr. M. Sani", "Mrs. J. Eze", "Dr. C. Madu"][i % 6],
    });
  }

  window.PROJECT_DATA = { CHAPTERS, TOPIC_POOL, SUPERVISEES, FINALISTS };
})();
