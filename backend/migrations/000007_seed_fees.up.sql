-- Seed fee items and a pending invoice (with line items) for the demo student.

INSERT INTO fee_items (code, label, amount_kobo, currency, required) VALUES
  ('tuition', 'Tuition', 85000, 'NGN', true),
  ('medical', 'Medical / Health Services', 4000, 'NGN', true),
  ('library', 'Library & E-Resources', 3500, 'NGN', true),
  ('ict', 'ICT Levy', 6000, 'NGN', true);

WITH inv AS (
  INSERT INTO invoices (student_id, session_id, total_kobo, currency, status, issued_at)
  SELECT (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428'),
         (SELECT id FROM academic_sessions WHERE name = '2024/2025'),
         98500, 'NGN', 'pending', now() - interval '10 days'
  RETURNING id
)
INSERT INTO invoice_items (invoice_id, fee_item_id, amount_kobo, currency)
SELECT inv.id, fi.id, fi.amount_kobo, fi.currency
FROM inv CROSS JOIN fee_items fi;
