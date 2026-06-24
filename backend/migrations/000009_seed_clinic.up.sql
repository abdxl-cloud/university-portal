INSERT INTO patient_records (student_id, blood_group, genotype, allergies, emergency_no)
SELECT id, 'O+', 'AA', 'Penicillin', '+2348030000000'
FROM students WHERE matric_no = 'FUT/2022/CSC/10428';

INSERT INTO pharmacy_items (name, stock, unit, status) VALUES
  ('Paracetamol 500mg', 240, 'tablets', 'ok'),
  ('Amoxicillin 250mg', 18, 'capsules', 'low'),
  ('ORS Sachets', 0, 'sachets', 'out');

INSERT INTO prescriptions (patient_id, drug, dosage, doctor_id)
SELECT pr.id, 'Paracetamol 500mg', '1 tablet twice daily for 3 days',
       (SELECT id FROM staff_profiles WHERE staff_no = 'FUT/STF/MED/0009')
FROM patient_records pr
JOIN students s ON s.id = pr.student_id
WHERE s.matric_no = 'FUT/2022/CSC/10428';
