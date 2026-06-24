DELETE FROM prescriptions WHERE patient_id IN (
  SELECT pr.id FROM patient_records pr JOIN students s ON s.id = pr.student_id
  WHERE s.matric_no = 'FUT/2022/CSC/10428'
);
DELETE FROM patient_records WHERE student_id = (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428');
DELETE FROM pharmacy_items WHERE name IN ('Paracetamol 500mg', 'Amoxicillin 250mg', 'ORS Sachets');
