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
  height FLOAT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE, 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS freelancers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE, 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  vat VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight FLOAT NOT NULL,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  goal ENUM('aumento_peso','perdita_peso','mantenimento','definizione','massa','altro') NOT NULL DEFAULT 'mantenimento',
  notes TEXT NULL,
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

/* =========================================================
   PROFILO PUBBLICO PROFESSIONISTI
   ========================================================= */
CREATE TABLE IF NOT EXISTS professional_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  freelancer_id INT NOT NULL UNIQUE,             -- 1 profilo per freelancer
  display_name VARCHAR(150) NOT NULL,            -- es. "Ruben Moretti"
  role ENUM('personal_trainer','nutrizionista') NOT NULL DEFAULT 'personal_trainer',
  city VARCHAR(120) NULL,
  price_per_hour DECIMAL(8,2) DEFAULT 0.00,
  specialties JSON DEFAULT (JSON_ARRAY()),       -- es. ["ipertrofia","dimagrimento"]
  languages JSON DEFAULT (JSON_ARRAY()),         -- es. ["IT","EN"]
  bio TEXT NULL,
  avatar_url VARCHAR(500) NULL,                  -- URL assoluto o /uploads/...
  verified TINYINT(1) NOT NULL DEFAULT 0,
  online TINYINT(1) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,     -- 0..5
  reviews_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_professional_profiles_freelancer
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE
);

/* =========================================================
   IMPOSTAZIONI UTENTE (preferenze personali)
   ========================================================= */
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,

  -- Copie "comode" per query/filtri
  theme         ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  locale        VARCHAR(10)                   NOT NULL DEFAULT 'it-IT',
  weight_unit   ENUM('kg','lb')               NOT NULL DEFAULT 'kg',
  height_unit   ENUM('cm','in')               NOT NULL DEFAULT 'cm',
  distance_unit ENUM('km','mi')               NOT NULL DEFAULT 'km',

  -- Facoltativi: se vuoi riflettere altre chiavi a livello colonna
  time_format   ENUM('24h','12h')             NOT NULL DEFAULT '24h',
  currency      ENUM('EUR','USD','GBP')       NOT NULL DEFAULT 'EUR',
  energy_unit   ENUM('kcal','kJ')             NOT NULL DEFAULT 'kcal',

  -- Preferenze strutturate (comode ma opzionali)
  notifications JSON DEFAULT (JSON_OBJECT('email', true, 'push', false, 'chat', true)),
  privacy       JSON DEFAULT (JSON_OBJECT('profileVisibility','public','showOnline', true)),
  accessibility JSON DEFAULT (JSON_OBJECT('reducedMotion', false, 'highContrast', false, 'fontScale', 100)),
  professional  JSON DEFAULT (JSON_OBJECT('isAvailableOnline', false, 'autoAcceptChat', false)),

  -- Fonte di verità completa
  settings      JSON NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
/* ===========================
   CHAT / MESSAGGI
   =========================== */
-- Conversazioni (thread)
CREATE TABLE IF NOT EXISTS chat_threads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partecipanti (2 nel tuo caso, ma aperta a N)
CREATE TABLE IF NOT EXISTS chat_participants (
  thread_id BIGINT UNSIGNED NOT NULL,
  user_id   INT NOT NULL,
  last_read_message_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (thread_id, user_id),
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)        ON DELETE CASCADE
);

-- Messaggi
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)        ON DELETE CASCADE
);

-- Per legare "utente X" e "professionista Y" ad un singolo thread
-- (evita duplicati quando clicchi 'Contatta' più volte)
CREATE TABLE IF NOT EXISTS chat_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_a INT NOT NULL,  -- ordiniamo min/max per unicità
  user_b INT NOT NULL,
  thread_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pair (user_a, user_b),
  FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
);
