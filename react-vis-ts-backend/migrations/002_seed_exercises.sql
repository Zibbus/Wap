-- Allunga il titolo per contenere nomi lunghi (safe anche su re-run)
ALTER TABLE exercises MODIFY title VARCHAR(120) NOT NULL;

-- Assicurati di avere tutti i gruppi muscolari
-- (idempotente: inserisce solo se non già presenti)
INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'spalle') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='spalle');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'dorso') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='dorso');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'gambe') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='gambe');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'petto') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='petto');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'braccia') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='braccia');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'addome') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='addome');

INSERT INTO muscle_groups (type)
SELECT * FROM (SELECT 'total_body') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups WHERE type='total_body');

-- =========================
-- SPALLE
-- =========================
INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Military Press', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Military Press');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate laterali', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate laterali');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lento Avanti con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lento Avanti con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lento Avanti con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lento Avanti con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate laterali ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate laterali ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Shoulder press', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Shoulder press');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lento Dietro con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lento Dietro con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate frontali', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate frontali');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate frontali ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate frontali ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate frontali con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate frontali con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Crossover ai cavi inverso', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Crossover ai cavi inverso');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate a 90 gradi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate a 90 gradi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate a 90 gradi ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate a 90 gradi ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore verticale con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore verticale con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore verticale con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore verticale con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Shrug con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Shrug con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Shrug con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Shrug con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Shrug al multipower', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Shrug al multipower');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate frontali con manubrio da seduto', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate frontali con manubrio da seduto');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate laterali con manubrio da seduto', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate laterali con manubrio da seduto');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Panca piana presa inversa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Panca piana presa inversa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Arnold press', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Arnold press');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Alzate frontali con corda', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='spalle' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Alzate frontali con corda');

-- =========================
-- DORSO
-- =========================
INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Stacchi da terra', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Stacchi da terra');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Trazioni alla sbarra (chin up)', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Trazioni alla sbarra (chin up)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore con manubrio');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore ai cavi (unilaterale o bilaterale)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore ai cavi (unilaterale o bilaterale)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pulldown alla lat machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pulldown alla lat machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pulldown alla lat machine presa inversa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pulldown alla lat machine presa inversa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pulldown alla lat machine con triangolo', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pulldown alla lat machine con triangolo');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pulldown alla lat machine con trazibar', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pulldown alla lat machine con trazibar');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pullover con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pullover con manubrio');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pullover ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pullover ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lateral Pulley (orizzontale o inclinato)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lateral Pulley (orizzontale o inclinato)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lateral Pulley presa larga', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lateral Pulley presa larga');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lateral Pulley con trazybar', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lateral Pulley con trazybar');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lateral Pulley con maniglia unilaterale', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lateral Pulley con maniglia unilaterale');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Lat machine con maniglia', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Lat machine con maniglia');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Iperestensioni alla panca romana', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Iperestensioni alla panca romana');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore su panca inclinata con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore su panca inclinata con manubrio');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore su panca inclinata con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore su panca inclinata con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Trazioni alla sbarra presa inversa (chin up)', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Trazioni alla sbarra presa inversa (chin up)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore con bilanciere presa inversa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore con bilanciere presa inversa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Rematore al multipower', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Rematore al multipower');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Goodmorning con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Goodmorning con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Dorsy Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Dorsy Machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Nautilus Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='dorso' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Nautilus Machine');

-- =========================
-- GAMBE
-- =========================
INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Squat');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pressa 45 gradi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pressa 45 gradi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pressa Orizzontale', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pressa Orizzontale');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pressa Verticale', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pressa Verticale');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Leg Extension', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Leg Extension');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Leg Curl', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Leg Curl');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Stacchi da terra gambe tese', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Stacchi da terra gambe tese');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Stacchi da terra gambe tese con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Stacchi da terra gambe tese con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Standing leg curl', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Standing leg curl');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Sitting leg curl', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Sitting leg curl');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Affondi frontali (con manubri)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Affondi frontali (con manubri)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Affondi laterali (con manubri)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Affondi laterali (con manubri)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Affondi rumeni (al multipower)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Affondi rumeni (al multipower)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Squat Bulgaro', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Squat Bulgaro');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Front Squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Front Squat');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Hack Squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Hack Squat');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Slanci posteriori della gamba', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Slanci posteriori della gamba');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Gluteus Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Gluteus Machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Adductor Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Adductor Machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Abductor Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Abductor Machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Ponte per glutei', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Ponte per glutei');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Slanci laterali della gamba', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Slanci laterali della gamba');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Calf raises in piedi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Calf raises in piedi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Calf raises seduto', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Calf raises seduto');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Calf raises alla leg press', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Calf raises alla leg press');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Calf raises alla multipower', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Calf raises alla multipower');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Squat al multipower', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Squat al multipower');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Hack Squat con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Hack Squat con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Affondi frontali con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Affondi frontali con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Affondi laterali con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Affondi laterali con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Jefferson squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Jefferson squat');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Stacchi da terra con trap bar', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Stacchi da terra con trap bar');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Sissy Squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Sissy Squat');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Sumo Squat', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='gambe' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Sumo Squat');

-- =========================
-- PETTO
-- =========================
INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con bilanciere su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con bilanciere su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con bilanciere su panca piana', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con bilanciere su panca piana');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con bilanciere su panca reclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con bilanciere su panca reclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con manubri su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con manubri su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con manubri su panca piana', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con manubri su panca piana');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni con manubri su panca reclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni con manubri su panca reclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Dip alle parallele per i pettorali', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Dip alle parallele per i pettorali');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Chest Press', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Chest Press');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Chest Press Incline', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Chest Press Incline');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pectoral Machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pectoral Machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci con manubri su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci con manubri su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci con manubri su panca piana', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci con manubri su panca piana');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci con manubri su panca reclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci con manubri su panca reclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci con manubri around the world', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci con manubri around the world');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Piegamenti sulle braccia', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Piegamenti sulle braccia');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci ai cavi su panca piana', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci ai cavi su panca piana');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci ai cavi su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci ai cavi su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni su panca inclinata alla smith machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni su panca inclinata alla smith machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni su panca piana alla smith machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni su panca piana alla smith machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Distensioni su panca reclinata alla smith machine', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Distensioni su panca reclinata alla smith machine');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Croci ai cavi dal basso', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Croci ai cavi dal basso');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Chest press per il petto basso', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='petto' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Chest press per il petto basso');

-- =========================
-- BRACCIA (Bicipiti + Tricipiti)
-- =========================
INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl a martello', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl a martello');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con bilanciere alla panca Scott', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con bilanciere alla panca Scott');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con manubri alla panca Scott', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con manubri alla panca Scott');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con manubri su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con manubri su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Bicipiti alla macchina (arm curl)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Bicipiti alla macchina (arm curl)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Spider curl con bilanciere', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Spider curl con bilanciere');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Spider curl con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Spider curl con manubrio');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl ai cavi unilaterali e bilaterali', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl ai cavi unilaterali e bilaterali');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con bilanciere presa inversa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con bilanciere presa inversa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl di concentrazione con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl di concentrazione con manubrio');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl di concentrazione ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl di concentrazione ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con corda', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con corda');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl a martello frontali', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl a martello frontali');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl ai cavi da sdraiato', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl ai cavi da sdraiato');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl ai cavi sopra la testa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl ai cavi sopra la testa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Curl con bilanciere alla panca Scott presa inversa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Curl con bilanciere alla panca Scott presa inversa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'French Press (o skull crusher)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='French Press (o skull crusher)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'French Press con manubri', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='French Press con manubri');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pushdown ai cavi', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pushdown ai cavi');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Pushdown ai cavi con corda', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Pushdown ai cavi con corda');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Estensioni con corda sopra la testa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Estensioni con corda sopra la testa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Estensioni con manubrio sopra la testa', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Estensioni con manubrio sopra la testa');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Dip alle parallele per i tricipiti', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Dip alle parallele per i tricipiti');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Dip tra panche per i tricipiti', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Dip tra panche per i tricipiti');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Spinte inverse ai cavi (unilaterali o bilaterali)', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Spinte inverse ai cavi (unilaterali o bilaterali)');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Panca presa stretta', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Panca presa stretta');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Panca presa stretta al multipower', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Panca presa stretta al multipower');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Flessioni presa stretta per i tricipiti', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Flessioni presa stretta per i tricipiti');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Estensioni sopra la testa ai cavi da seduto', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Estensioni sopra la testa ai cavi da seduto');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'French press su panca inclinata', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='French press su panca inclinata');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'French press verticale', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='French press verticale');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Macchina per i dip', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Macchina per i dip');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Estensioni con manubrio busto flesso', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Estensioni con manubrio busto flesso');

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Press per i tricipiti sopra la testa con manubrio', mg.id, 'y' FROM muscle_groups mg
WHERE mg.type='braccia' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Press per i tricipiti sopra la testa con manubrio');

-- =========================
-- ADDOME
-- =========================

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Crunch', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Crunch' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Crunch inverso', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Crunch inverso' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Sit-up', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Sit-up' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Plank', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Plank' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Side Plank', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Side Plank' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'L-sit', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='L-sit' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Barchetta', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Barchetta' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Leg Raise', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Leg Raise' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'Dragon Flag', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='Dragon Flag' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 'AB Wheel Roller', mg.id, 'n' FROM muscle_groups mg
WHERE mg.type='addome' AND NOT EXISTS (SELECT 1 FROM exercises e WHERE e.title='AB Wheel Roller' AND e.musclegroups_id=mg.id);

INSERT INTO exercises (title, musclegroups_id, weight_required)
SELECT 
    CONCAT(title, ' - con peso') AS title,
    musclegroups_id,
    'y' AS weight_required
FROM exercises
WHERE weight_required = 'n';