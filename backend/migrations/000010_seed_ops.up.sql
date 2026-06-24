INSERT INTO notifications (user_id, title, body, tone, read)
SELECT id, 'Welcome to the portal', 'Your account is active. Complete your course registration for the current session.', 'accent', false
FROM users WHERE identifier = 'FUT/2022/CSC/10428';

INSERT INTO support_tickets (student_id, subject, status)
SELECT id, 'Unable to download fee receipt', 'open'
FROM students WHERE matric_no = 'FUT/2022/CSC/10428';
