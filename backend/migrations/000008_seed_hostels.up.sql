INSERT INTO hostel_halls (name, gender) VALUES
  ('Nnamdi Azikiwe Hall', 'male'),
  ('Queen Amina Hall', 'female');

INSERT INTO hostel_rooms (hall_id, room_no, capacity, occupied)
SELECT id, 'A101', 4, 2 FROM hostel_halls WHERE name = 'Nnamdi Azikiwe Hall';

INSERT INTO hostel_beds (room_id, label, status)
SELECT r.id, b.label, b.status
FROM hostel_rooms r
CROSS JOIN (VALUES ('Bed 1', 'occupied'), ('Bed 2', 'occupied'), ('Bed 3', 'available'), ('Bed 4', 'available')) AS b(label, status)
WHERE r.room_no = 'A101';
