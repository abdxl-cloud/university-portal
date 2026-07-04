/* Canonical organisational model — the single source of truth for
   Faculty → Department → Programme. Everything faculty-scoped derives from here. */
(function () {
  // Faculties, each owning departments; departments own programmes.
  const FACULTIES = [
    {
      id: "computing", name: "Faculty of Computing", short: "Computing",
      dean: { name: "Prof. Adaeze Nwachukwu", initials: "AN" },
      departments: [
        { id: "csc", name: "Computer Science", code: "CSC", hod: "Prof. Kunle Adewale", students: 1240, staff: 28,
          programmes: [{ id: "csc", name: "B.Sc. Computer Science" }] },
        { id: "sen", name: "Software Engineering", code: "SEN", hod: "Dr. B. Idowu", students: 870, staff: 19,
          programmes: [{ id: "sen", name: "B.Sc. Software Engineering" }] },
        { id: "itc", name: "Information Technology", code: "ITC", hod: "Dr. R. Hassan", students: 760, staff: 17,
          programmes: [{ id: "itc", name: "B.Sc. Information Technology" }] },
        { id: "cyb", name: "Cyber Security", code: "CYB", hod: "Dr. N. Achebe", students: 540, staff: 14,
          programmes: [{ id: "cyb", name: "B.Sc. Cyber Security" }] },
      ],
    },
    {
      id: "engineering", name: "Faculty of Engineering", short: "Engineering",
      dean: { name: "Prof. Musa Danjuma", initials: "MD" },
      departments: [
        { id: "eee", name: "Electrical/Electronic Engineering", code: "EEE", hod: "Prof. G. Okeke", students: 980, staff: 24,
          programmes: [{ id: "eee", name: "B.Eng. Electrical/Electronic Engineering" }] },
        { id: "mee", name: "Mechanical Engineering", code: "MEE", hod: "Dr. S. Bello", students: 910, staff: 22,
          programmes: [{ id: "mee", name: "B.Eng. Mechanical Engineering" }] },
        { id: "civ", name: "Civil Engineering", code: "CIV", hod: "Dr. P. Eze", students: 1020, staff: 25,
          programmes: [{ id: "civ", name: "B.Eng. Civil Engineering" }] },
        { id: "che", name: "Chemical Engineering", code: "CHE", hod: "Dr. A. Sani", students: 640, staff: 16,
          programmes: [{ id: "che", name: "B.Eng. Chemical Engineering" }] },
      ],
    },
    {
      id: "envsci", name: "Faculty of Environmental Sciences", short: "Environmental Sciences",
      dean: { name: "Prof. Ngozi Bassey", initials: "NB" },
      departments: [
        { id: "arc", name: "Architecture", code: "ARC", hod: "Dr. T. Lawal", students: 480, staff: 15,
          programmes: [{ id: "arc", name: "B.Sc. Architecture" }] },
        { id: "qts", name: "Quantity Surveying", code: "QTS", hod: "Dr. M. Udo", students: 360, staff: 11,
          programmes: [{ id: "qts", name: "B.Sc. Quantity Surveying" }] },
      ],
    },
    {
      id: "lifesci", name: "Faculty of Life Sciences", short: "Life Sciences",
      dean: { name: "Prof. Funke Adeleke", initials: "FA" },
      departments: [
        { id: "bch", name: "Biochemistry", code: "BCH", hod: "Dr. C. Nwosu", students: 520, staff: 14,
          programmes: [{ id: "bch", name: "B.Sc. Biochemistry" }] },
        { id: "mcb", name: "Microbiology", code: "MCB", hod: "Dr. H. Garba", students: 470, staff: 13,
          programmes: [{ id: "mcb", name: "B.Sc. Microbiology" }] },
      ],
    },
  ];

  // ---- indexes & lookups ----
  const _deptIndex = {};   // deptId -> { ...dept, facultyId, facultyName }
  const _facByDept = {};   // deptId -> faculty
  const _facById = {};     // facultyId -> faculty
  FACULTIES.forEach((f) => {
    _facById[f.id] = f;
    f.departments.forEach((d) => {
      _deptIndex[d.id] = Object.assign({}, d, { facultyId: f.id, facultyName: f.name, facultyShort: f.short });
      _facByDept[d.id] = f;
    });
  });

  const facultyById = (id) => _facById[id] || null;
  const deptById = (id) => _deptIndex[id] || null;
  const facultyOfDept = (deptId) => _facByDept[deptId] || null;
  // resolve a faculty from a department NAME or id, OR a faculty name/short (handles legacy string data)
  const facultyOf = (key) => {
    if (!key) return null;
    if (_facByDept[key]) return _facByDept[key];
    if (_facById[key]) return _facById[key];
    const lower = String(key).toLowerCase();
    // match a faculty by full name or short name
    for (const f of FACULTIES) {
      if (f.name.toLowerCase() === lower || f.short.toLowerCase() === lower || ("faculty of " + f.short.toLowerCase()) === lower) return f;
    }
    // match by department name or code
    for (const f of FACULTIES) {
      for (const d of f.departments) {
        if (d.name.toLowerCase() === lower || d.code.toLowerCase() === lower) return f;
      }
    }
    return null;
  };
  const facultyNameOf = (deptKey) => { const f = facultyOf(deptKey); return f ? f.name : null; };
  const departmentsOf = (facultyId) => (_facById[facultyId] ? _facById[facultyId].departments : []);
  const allDepartments = () => Object.values(_deptIndex);

  window.ORG = {
    FACULTIES, facultyById, deptById, facultyOfDept, facultyOf, facultyNameOf, departmentsOf, allDepartments,
    DEAN_FACULTY: { dean: "computing", dean2: "engineering" }, // which faculty each dean role maps to
  };
})();
