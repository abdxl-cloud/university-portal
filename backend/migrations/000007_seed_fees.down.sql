DELETE FROM payments WHERE invoice_id IN (
  SELECT id FROM invoices WHERE student_id = (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428')
);
DELETE FROM invoices WHERE student_id = (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428');
DELETE FROM fee_items WHERE code IN ('tuition', 'medical', 'library', 'ict');
