DELETE FROM notifications WHERE user_id = (SELECT id FROM users WHERE identifier = 'FUT/2022/CSC/10428');
DELETE FROM support_tickets WHERE student_id = (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428');
