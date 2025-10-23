CREATE DATABASE IF NOT EXISTS myfit;

use myfit;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  dob DATE NULL,
  sex ENUM('M','F','O') NULL,
  type ENUM('utente','professionista') DEFAULT 'utente',
  email VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE, 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  weight FLOAT NULL,
  height FLOAT NULL
);

CREATE TABLE IF NOT EXISTS freelancers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE, 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  vat VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS muscle_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('spalle','petto','dorso','addome','gambe','braccia','total_body')
);

CREATE TABLE IF NOT EXISTS exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  musclegroups_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  weight_required VARCHAR(1) NOT NULL DEFAULT 'n',
  FOREIGN KEY (musclegroups_id) REFERENCES muscle_groups(id)  
);

/* Scheda creata dal cliente o dal professionista */
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  freelancer_id INT NULL, -- se NULL vuol dire che il cliente si è creato la scheda da solo
  expire DATE NULL,
  goal ENUM('peso_costante','aumento_peso','perdita_peso','altro'),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  day TINYINT NOT NULL CHECK (day BETWEEN 1 AND 7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* tabella ponte tra scheda e esercizi */
CREATE TABLE IF NOT EXISTS schedule_exercise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_id INT NOT NULL,
  exercise_id INT NOT NULL,
  position INT DEFAULT 1,           -- ordine nel giorno
  sets TINYINT,
  reps TINYINT,
  rest_seconds SMALLINT,
  weight_value DECIMAL(6,2),
  notes TEXT,
  FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

/* PARTE NUTRIZIONALE */
-- ------------------------------------------------------
-- Master alimenti (facoltativo ma utile per riuso/ricerca)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  default_unit ENUM('g','ml','pcs','cup','tbsp','tsp','slice') DEFAULT 'g',
  kcal_per_100 DECIMAL(8,2) DEFAULT NULL,
  protein_per_100 DECIMAL(8,2) DEFAULT NULL,
  carbs_per_100 DECIMAL(8,2) DEFAULT NULL,
  fat_per_100 DECIMAL(8,2) DEFAULT NULL,
  UNIQUE KEY uq_foods_name (name)
);

-- ------------------------------------------------------
-- PIANO NUTRIZIONALE (testa) — simile a schedules
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  freelancer_id INT NULL, -- chi l'ha creato (se presente)
  expire DATE NOT NULL,
  goal ENUM('peso_costante','aumento_peso','perdita_peso','mantenimento','definizione','massa','altro') NOT NULL DEFAULT 'mantenimento',
  notes TEXT NULL,
  status ENUM('draft','active','expired') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)  REFERENCES customers(id)   ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE SET NULL
);

-- ------------------------------------------------------
-- GIORNI DEL PIANO — simile a days (con CHECK 1..7)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  day TINYINT NOT NULL CHECK (day BETWEEN 1 AND 7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan_day (plan_id, day),
  FOREIGN KEY (plan_id) REFERENCES nutrition_plans(id) ON DELETE CASCADE
);

-- ------------------------------------------------------
-- PASTI DEL GIORNO (ordine con position)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_id INT NOT NULL,
  position TINYINT NOT NULL DEFAULT 1, -- ordine nel giorno
  name VARCHAR(80) NOT NULL,           -- es: Colazione / Spuntino / Pranzo / Cena
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_day_position (day_id, position),
  FOREIGN KEY (day_id) REFERENCES nutrition_days(id) ON DELETE CASCADE
);

-- ------------------------------------------------------
-- RIGHE ALIMENTI/ITEMS PER PASTO (ordine con position)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meal_id INT NOT NULL,
  position TINYINT NOT NULL DEFAULT 1,   -- ordine nel pasto
  food_id INT NULL,                      -- opzionale: link a foods
  description VARCHAR(200) DEFAULT NULL, -- opzionale: testo libero
  qty DECIMAL(8,2) DEFAULT NULL,         -- quantità
  unit ENUM('g','ml','pcs','cup','tbsp','tsp','slice') DEFAULT 'g',
  -- Valori nutrizionali per questa riga (scelti o calcolati lato backend)
  kcal INT UNSIGNED DEFAULT NULL,
  protein_g DECIMAL(6,2) DEFAULT NULL,
  carbs_g DECIMAL(6,2) DEFAULT NULL,
  fat_g DECIMAL(6,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_meal_position (meal_id, position),
  FOREIGN KEY (meal_id) REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id)  REFERENCES foods(id)          ON DELETE SET NULL
);

-- ------------------------------------------------------
-- (Opzionale) Target macro giornalieri
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_day_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_id INT NOT NULL,
  kcal_target INT UNSIGNED DEFAULT NULL,
  protein_g_target DECIMAL(6,2) DEFAULT NULL,
  carbs_g_target DECIMAL(6,2) DEFAULT NULL,
  fat_g_target DECIMAL(6,2) DEFAULT NULL,
  fiber_g_target DECIMAL(6,2) DEFAULT NULL,
  water_ml_target INT UNSIGNED DEFAULT NULL,
  UNIQUE KEY uq_day_target (day_id),
  FOREIGN KEY (day_id) REFERENCES nutrition_days(id) ON DELETE CASCADE
);
