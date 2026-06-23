DELETE FROM results WHERE student_id = (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428');
DELETE FROM courses WHERE code IN ('CSC 301', 'CSC 303', 'CSC 305');
DELETE FROM staff_profiles WHERE staff_no IN (
  'FUT/STF/CSC/0391', 'FUT/STF/CSC/0102', 'FUT/STF/BUR/0319', 'FUT/STF/LIB/0044', 'FUT/STF/MED/0009'
);
