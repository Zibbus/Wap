/* =========================================================
   SCHEDE PER user_marco: 1 scaduta + 1 attiva
   Usa gli esercizi dai tuoi seed (titoli esatti).
   ========================================================= */

-- 1) SCHEDA SCADUTA (expire < oggi)
INSERT INTO schedules (customer_id, freelancer_id, expire, goal)
SELECT c.id, NULL, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'altro'
FROM customers c
JOIN users u ON u.id = c.user_id
WHERE u.username = 'user_marco'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.customer_id = c.id AND s.expire < CURDATE()
  );

-- Giorni 1..3 per scheda scaduta
INSERT INTO days (schedule_id, day)
SELECT s.id, 1
FROM schedules s
JOIN customers c ON c.id = s.customer_id
JOIN users u ON u.id = c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=1);

INSERT INTO days (schedule_id, day)
SELECT s.id, 2
FROM schedules s
JOIN customers c ON c.id = s.customer_id
JOIN users u ON u.id = c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=2);

INSERT INTO days (schedule_id, day)
SELECT s.id, 3
FROM schedules s
JOIN customers c ON c.id = s.customer_id
JOIN users u ON u.id = c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=3);

-- Esercizi (SCADUTA)
-- Day 1: Petto + Dorso
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, notes)
SELECT d.id, (SELECT id FROM exercises WHERE title='Distensioni con bilanciere su panca piana'),
       1, 4, 8, 90, 'Tecnica controllata'
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=1
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Pulldown alla lat machine'),
       2, 4, 10, 90
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=1
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);

-- Day 2: Gambe + Addome
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value)
SELECT d.id, (SELECT id FROM exercises WHERE title='Squat'),
       1, 5, 5, 120, 80.00
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=2
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Crunch'),
       2, 3, 15, 45
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=2
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);

-- Day 3: Spalle + Braccia
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value)
SELECT d.id, (SELECT id FROM exercises WHERE title='Military Press'),
       1, 4, 10, 90, 20.00
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=3
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value)
SELECT d.id, (SELECT id FROM exercises WHERE title='Curl con bilanciere'),
       2, 3, 12, 60, 25.00
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire < CURDATE() AND d.day=3
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);




-- 2) SCHEDA ATTIVA (expire >= oggi)
INSERT INTO schedules (customer_id, freelancer_id, expire, goal)
SELECT c.id, NULL, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'peso_costante'
FROM customers c
JOIN users u ON u.id = c.user_id
WHERE u.username = 'user_marco'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.customer_id = c.id AND s.expire >= CURDATE()
  );

-- Giorni 1..3 per scheda attiva
INSERT INTO days (schedule_id, day)
SELECT s.id, 1
FROM schedules s
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=1);

INSERT INTO days (schedule_id, day)
SELECT s.id, 2
FROM schedules s
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=2);

INSERT INTO days (schedule_id, day)
SELECT s.id, 3
FROM schedules s
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE()
  AND NOT EXISTS (SELECT 1 FROM days d WHERE d.schedule_id=s.id AND d.day=3);

-- Esercizi (ATTIVA)
-- Day 1
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, notes)
SELECT d.id, (SELECT id FROM exercises WHERE title='Distensioni con bilanciere su panca piana'),
       1, 5, 5, 120, 'Ciclo forza'
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=1
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Pulldown alla lat machine'),
       2, 4, 8, 90
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=1
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);

-- Day 2
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value)
SELECT d.id, (SELECT id FROM exercises WHERE title='Squat'),
       1, 5, 3, 150, 90.00
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=2
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Crunch'),
       2, 4, 20, 45
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=2
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);

-- Day 3
INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Military Press'),
       1, 4, 8, 90
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=3
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=1);

INSERT INTO schedule_exercise (day_id, exercise_id, position, sets, reps, rest_seconds)
SELECT d.id, (SELECT id FROM exercises WHERE title='Curl con bilanciere'),
       2, 3, 10, 60
FROM days d
JOIN schedules s ON s.id=d.schedule_id
JOIN customers c ON c.id=s.customer_id
JOIN users u ON u.id=c.user_id
WHERE u.username='user_marco' AND s.expire >= CURDATE() AND d.day=3
  AND NOT EXISTS (SELECT 1 FROM schedule_exercise se WHERE se.day_id=d.id AND se.position=2);
