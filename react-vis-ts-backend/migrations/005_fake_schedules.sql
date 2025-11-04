/* =========================================================
   SCHEDE DI ALLENAMENTO PER user_marco: 1 scaduta + 1 attiva
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

/* =========================================================
   NUTRITION DEMO PLANS (idempotenti)
   Requisiti:
   - esistono users: user_marco, user_lucia, pro_elena
   - tabella foods popolata (vedi tuo script)
   ========================================================= */

/* -----------------------------
   PIANO DEMO #1 — user_marco
   ----------------------------- */
-- Testa piano (freelancer = pro_elena)
INSERT INTO nutrition_plans (customer_id, freelancer_id, expire, goal, notes)
SELECT  c.id,
        f.id,                          -- freelancer: pro_elena
        '2025-12-31',
        'mantenimento',
        'DEMO PLAN • MARCO BASE'
FROM customers c
JOIN users u ON u.id = c.user_id AND u.username = 'user_marco'
LEFT JOIN users uf ON uf.username = 'pro_elena'
LEFT JOIN freelancers f ON f.user_id = uf.id
WHERE NOT EXISTS (
  SELECT 1 FROM nutrition_plans np
  WHERE np.customer_id = c.id AND np.notes = 'DEMO PLAN • MARCO BASE'
);

-- Giorni 1..7
INSERT INTO nutrition_days (plan_id, day)
SELECT np.id, d.day
FROM nutrition_plans np
JOIN customers c ON c.id = np.customer_id
JOIN users u ON u.id = c.user_id AND u.username = 'user_marco'
JOIN (
  SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
) AS d
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (
    SELECT 1 FROM nutrition_days nd WHERE nd.plan_id = np.id AND nd.day = d.day
  );

-- Pasti standard (per tutti i 7 giorni)
-- position: 1=Colazione, 2=Merenda, 3=Pranzo, 4=Spuntino, 5=Cena
INSERT INTO nutrition_meals (day_id, position, name)
SELECT nd.id, v.pos, v.name
FROM nutrition_plans np
JOIN nutrition_days nd ON nd.plan_id = np.id
JOIN (
  SELECT 1 AS pos, 'Colazione' AS name UNION ALL
  SELECT 2, 'Merenda'           UNION ALL
  SELECT 3, 'Pranzo'            UNION ALL
  SELECT 4, 'Spuntino'          UNION ALL
  SELECT 5, 'Cena'
) v
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (
    SELECT 1 FROM nutrition_meals nm
    WHERE nm.day_id = nd.id AND nm.position = v.pos
  );

-- ========================
-- RIGHE ESEMPIO (DAY 1)
-- ========================
-- Nota: calcolo macro da foods (g/ml => per100 * qty/100)
-- Colazione (pos 1): Latte p.s. 250ml, Corn flakes 40g, Banana 120g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 250, 'ml',
       ROUND(f.kcal_per_100 * 2.5),
       ROUND(f.protein_per_100 * 2.5, 2),
       ROUND(f.carbs_per_100   * 2.5, 2),
       ROUND(f.fat_per_100     * 2.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Latte vaccino parzialmente scremato'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 40, 'g',
       ROUND(f.kcal_per_100 * 0.4),
       ROUND(f.protein_per_100 * 0.4, 2),
       ROUND(f.carbs_per_100   * 0.4, 2),
       ROUND(f.fat_per_100     * 0.4, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Corn flakes'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 120, 'g',
       ROUND(f.kcal_per_100 * 1.2),
       ROUND(f.protein_per_100 * 1.2, 2),
       ROUND(f.carbs_per_100   * 1.2, 2),
       ROUND(f.fat_per_100     * 1.2, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Banana'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);

-- Merenda (pos 2): Yogurt magro 125g + Mandorle 15g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 125, 'g',
       ROUND(f.kcal_per_100 * 1.25),
       ROUND(f.protein_per_100 * 1.25, 2),
       ROUND(f.carbs_per_100   * 1.25, 2),
       ROUND(f.fat_per_100     * 1.25, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 2
JOIN foods f ON f.name = 'Yogurt bianco magro'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 15, 'g',
       ROUND(f.kcal_per_100 * 0.15),
       ROUND(f.protein_per_100 * 0.15, 2),
       ROUND(f.carbs_per_100   * 0.15, 2),
       ROUND(f.fat_per_100     * 0.15, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 2
JOIN foods f ON f.name = 'Mandorle'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

-- Pranzo (pos 3): Pasta bollita 100g + Petto di pollo cotto 150g + Olio EVO 10g + Insalata 100g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 100, 'g',
       ROUND(f.kcal_per_100),
       ROUND(f.protein_per_100, 2),
       ROUND(f.carbs_per_100,   2),
       ROUND(f.fat_per_100,     2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Pasta di semola (bollita)'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Petto di pollo (cotto)'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 10, 'g',
       ROUND(f.kcal_per_100 * 0.10),
       ROUND(f.protein_per_100 * 0.10, 2),
       ROUND(f.carbs_per_100   * 0.10, 2),
       ROUND(f.fat_per_100     * 0.10, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Olio extravergine di oliva'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 4, f.id, NULL, 100, 'g',
       ROUND(f.kcal_per_100 * 1.0),
       ROUND(f.protein_per_100 * 1.0, 2),
       ROUND(f.carbs_per_100   * 1.0, 2),
       ROUND(f.fat_per_100     * 1.0, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Insalata (lattuga)'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 4);

-- Spuntino (pos 4): Mela 150g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 4
JOIN foods f ON f.name = 'Mela'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

-- Cena (pos 5): Riso bollito 120g + Tonno in scatola 100g + Olio EVO 10g + Broccoli 150g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 120, 'g',
       ROUND(f.kcal_per_100 * 1.2),
       ROUND(f.protein_per_100 * 1.2, 2),
       ROUND(f.carbs_per_100   * 1.2, 2),
       ROUND(f.fat_per_100     * 1.2, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Riso brillato (bollito)'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 100, 'g',
       ROUND(f.kcal_per_100 * 1.0),
       ROUND(f.protein_per_100 * 1.0, 2),
       ROUND(f.carbs_per_100   * 1.0, 2),
       ROUND(f.fat_per_100     * 1.0, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Tonno in scatola (sgocciolato, olio)'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 10, 'g',
       ROUND(f.kcal_per_100 * 0.10),
       ROUND(f.protein_per_100 * 0.10, 2),
       ROUND(f.carbs_per_100   * 0.10, 2),
       ROUND(f.fat_per_100     * 0.10, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Olio extravergine di oliva'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 4, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Broccoli'
WHERE np.notes = 'DEMO PLAN • MARCO BASE'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 4);


/* -----------------------------
   PIANO DEMO #2 — user_marco (SCADUTO)
   ----------------------------- */
-- Testa piano (self, senza freelancer) — data nel passato
INSERT INTO nutrition_plans (customer_id, freelancer_id, expire, goal, notes)
SELECT  c.id,
        NULL,
        '2025-10-31',                    -- <<< scaduto
        'perdita_peso',
        'DEMO PLAN • MARCO CUT (EXPIRED)'
FROM customers c
JOIN users u ON u.id = c.user_id AND u.username = 'user_marco'
WHERE NOT EXISTS (
  SELECT 1 FROM nutrition_plans np
  WHERE np.customer_id = c.id AND np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
);

-- Giorni 1..7
INSERT INTO nutrition_days (plan_id, day)
SELECT np.id, d.day
FROM nutrition_plans np
JOIN customers c ON c.id = np.customer_id
JOIN users u ON u.id = c.user_id AND u.username = 'user_marco'
JOIN (
  SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
) AS d
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (
    SELECT 1 FROM nutrition_days nd WHERE nd.plan_id = np.id AND nd.day = d.day
  );

-- Pasti standard (per tutti i 7 giorni)
INSERT INTO nutrition_meals (day_id, position, name)
SELECT nd.id, v.pos, v.name
FROM nutrition_plans np
JOIN nutrition_days nd ON nd.plan_id = np.id
JOIN (
  SELECT 1 AS pos, 'Colazione' AS name UNION ALL
  SELECT 2, 'Merenda'           UNION ALL
  SELECT 3, 'Pranzo'            UNION ALL
  SELECT 4, 'Spuntino'          UNION ALL
  SELECT 5, 'Cena'
) v
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (
    SELECT 1 FROM nutrition_meals nm
    WHERE nm.day_id = nd.id AND nm.position = v.pos
  );

-- ========================
-- RIGHE ESEMPIO (DAY 1) — versione “cut” leggera
-- ========================

-- Colazione: Fiocchi di latte 150g + Fette biscottate 30g + Miele 10g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Fiocchi di latte'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 30, 'g',
       ROUND(f.kcal_per_100 * 0.3),
       ROUND(f.protein_per_100 * 0.3, 2),
       ROUND(f.carbs_per_100   * 0.3, 2),
       ROUND(f.fat_per_100     * 0.3, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Fette biscottate'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 10, 'g',
       ROUND(f.kcal_per_100 * 0.10),
       ROUND(f.protein_per_100 * 0.10, 2),
       ROUND(f.carbs_per_100   * 0.10, 2),
       ROUND(f.fat_per_100     * 0.10, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 1
JOIN foods f ON f.name = 'Miele'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);

-- Pranzo: Riso integrale (bollito) 100g + Tacchino (fesa) 150g + Zucchine 150g + Olio EVO 10g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 100, 'g',
       ROUND(f.kcal_per_100 * 1.0),
       ROUND(f.protein_per_100 * 1.0, 2),
       ROUND(f.carbs_per_100   * 1.0, 2),
       ROUND(f.fat_per_100     * 1.0, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Riso integrale (bollito)'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Tacchino (fesa)'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 150, 'g',
       ROUND(f.kcal_per_100 * 1.5),
       ROUND(f.protein_per_100 * 1.5, 2),
       ROUND(f.carbs_per_100   * 1.5, 2),
       ROUND(f.fat_per_100     * 1.5, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Zucchine (crude)'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 4, f.id, NULL, 10, 'g',
       ROUND(f.kcal_per_100 * 0.10),
       ROUND(f.protein_per_100 * 0.10, 2),
       ROUND(f.carbs_per_100   * 0.10, 2),
       ROUND(f.fat_per_100     * 0.10, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 3
JOIN foods f ON f.name = 'Olio extravergine di oliva'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 4);

-- Cena: Merluzzo 160g + Patate bollite 200g + Insalata 80g
INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 1, f.id, NULL, 160, 'g',
       ROUND(f.kcal_per_100 * 1.6),
       ROUND(f.protein_per_100 * 1.6, 2),
       ROUND(f.carbs_per_100   * 1.6, 2),
       ROUND(f.fat_per_100     * 1.6, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Merluzzo'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 1);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 2, f.id, NULL, 200, 'g',
       ROUND(f.kcal_per_100 * 2.0),
       ROUND(f.protein_per_100 * 2.0, 2),
       ROUND(f.carbs_per_100   * 2.0, 2),
       ROUND(f.fat_per_100     * 2.0, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Patate (bollite)'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 2);

INSERT INTO nutrition_items (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
SELECT nm.id, 3, f.id, NULL, 80, 'g',
       ROUND(f.kcal_per_100 * 0.8),
       ROUND(f.protein_per_100 * 0.8, 2),
       ROUND(f.carbs_per_100   * 0.8, 2),
       ROUND(f.fat_per_100     * 0.8, 2)
FROM nutrition_plans np
JOIN nutrition_days nd  ON nd.plan_id = np.id AND nd.day = 1
JOIN nutrition_meals nm ON nm.day_id  = nd.id  AND nm.position = 5
JOIN foods f ON f.name = 'Insalata (lattuga)'
WHERE np.notes = 'DEMO PLAN • MARCO CUT (EXPIRED)'
  AND NOT EXISTS (SELECT 1 FROM nutrition_items ni WHERE ni.meal_id = nm.id AND ni.position = 3);
