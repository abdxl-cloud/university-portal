DELETE FROM hostel_beds WHERE room_id IN (
  SELECT r.id FROM hostel_rooms r JOIN hostel_halls h ON h.id = r.hall_id
  WHERE h.name IN ('Nnamdi Azikiwe Hall', 'Queen Amina Hall')
);
DELETE FROM hostel_rooms WHERE hall_id IN (
  SELECT id FROM hostel_halls WHERE name IN ('Nnamdi Azikiwe Hall', 'Queen Amina Hall')
);
DELETE FROM hostel_applications WHERE hall_id IN (
  SELECT id FROM hostel_halls WHERE name IN ('Nnamdi Azikiwe Hall', 'Queen Amina Hall')
);
DELETE FROM hostel_halls WHERE name IN ('Nnamdi Azikiwe Hall', 'Queen Amina Hall');
