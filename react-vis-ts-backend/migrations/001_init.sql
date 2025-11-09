-- ==========
-- DATABASE
-- ==========
CREATE DATABASE IF NOT EXISTS myfit;
USE myfit;

-- ==========
-- UTENTI
-- ==========
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(32)  NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  first_name   VARCHAR(100) NULL,
  last_name    VARCHAR(100) NULL,
  dob          DATE         NULL,
  sex          ENUM('M','F','O') NULL,
  type         ENUM('utente','professionista') DEFAULT 'utente',
  email        VARCHAR(150) NULL,
  avatar_url   VARCHAR(500) NULL,
  height       FLOAT        NULL,
  is_bot       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice: users.email
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'users'
        AND index_name   = 'idx_users_email'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD INDEX `idx_users_email` (`email`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Indice: users.username
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'users'
        AND index_name   = 'idx_users_username'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD INDEX `idx_users_username` (`username`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Indice: users.is_bot
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'users'
        AND index_name   = 'idx_users_is_bot'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD INDEX `idx_users_is_bot` (`is_bot`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS customers (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS freelancers (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  vat     VARCHAR(30) NOT NULL,
  CONSTRAINT fk_freelancers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weight_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  weight      FLOAT NOT NULL,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_weight_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========
-- ALLENAMENTO
-- ==========
CREATE TABLE IF NOT EXISTS muscle_groups (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('spalle','petto','dorso','addome','gambe','braccia','total_body')
);

CREATE TABLE IF NOT EXISTS exercises (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  musclegroups_id INT NOT NULL,
  title           VARCHAR(120) NOT NULL,
  weight_required VARCHAR(1) NOT NULL DEFAULT 'n',
  CONSTRAINT fk_exercises_mg FOREIGN KEY (musclegroups_id) REFERENCES muscle_groups(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT NOT NULL,
  freelancer_id INT NULL,
  expire        DATE NULL,
  goal          ENUM('peso_costante','aumento_peso','perdita_peso','altro'),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedules_customer   FOREIGN KEY (customer_id)   REFERENCES customers(id)   ON DELETE CASCADE,
  CONSTRAINT fk_schedules_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS days (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  day         TINYINT NOT NULL CHECK (day BETWEEN 1 AND 7),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_days_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_exercise (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  day_id       INT NOT NULL,
  exercise_id  INT NOT NULL,
  position     INT DEFAULT 1,
  sets         TINYINT,
  reps         TINYINT,
  rest_seconds SMALLINT,
  weight_value DECIMAL(6,2),
  notes        TEXT,
  CONSTRAINT fk_sched_ex_day FOREIGN KEY (day_id)      REFERENCES days(id)       ON DELETE CASCADE,
  CONSTRAINT fk_sched_ex_ex  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ==========
-- NUTRIZIONE
-- ==========
CREATE TABLE IF NOT EXISTS foods (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  default_unit     ENUM('g','ml','pcs','cup','tbsp','tsp','slice') DEFAULT 'g',
  kcal_per_100     DECIMAL(8,2)  DEFAULT NULL,
  protein_per_100  DECIMAL(8,2)  DEFAULT NULL,
  carbs_per_100    DECIMAL(8,2)  DEFAULT NULL,
  fat_per_100      DECIMAL(8,2)  DEFAULT NULL,
  UNIQUE KEY uq_foods_name (name)
);

CREATE TABLE IF NOT EXISTS nutrition_plans (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT NOT NULL,
  freelancer_id  INT NULL,
  expire         DATE NOT NULL,
  goal           ENUM('aumento_peso','perdita_peso','mantenimento','definizione','massa','altro') NOT NULL DEFAULT 'mantenimento',
  notes          TEXT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_np_customer   FOREIGN KEY (customer_id)   REFERENCES customers(id)   ON DELETE CASCADE,
  CONSTRAINT fk_np_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS nutrition_days (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  plan_id    INT NOT NULL,
  day        TINYINT NOT NULL CHECK (day BETWEEN 1 AND 7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan_day (plan_id, day),
  CONSTRAINT fk_nd_plan FOREIGN KEY (plan_id) REFERENCES nutrition_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nutrition_meals (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  day_id     INT NOT NULL,
  position   TINYINT NOT NULL DEFAULT 1,
  name       VARCHAR(80) NOT NULL,
  notes      TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_day_position (day_id, position),
  CONSTRAINT fk_nm_day FOREIGN KEY (day_id) REFERENCES nutrition_days(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nutrition_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  meal_id     INT NOT NULL,
  position    TINYINT NOT NULL DEFAULT 1,
  food_id     INT NULL,
  description VARCHAR(200) DEFAULT NULL,
  qty         DECIMAL(8,2) DEFAULT NULL,
  unit        ENUM('g','ml','pcs','cup','tbsp','tsp','slice') DEFAULT 'g',
  kcal        INT UNSIGNED DEFAULT NULL,
  protein_g   DECIMAL(6,2) DEFAULT NULL,
  carbs_g     DECIMAL(6,2) DEFAULT NULL,
  fat_g       DECIMAL(6,2) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_meal_position (meal_id, position),
  CONSTRAINT fk_ni_meal FOREIGN KEY (meal_id) REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  CONSTRAINT fk_ni_food FOREIGN KEY (food_id)  REFERENCES foods(id)          ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS nutrition_day_targets (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  day_id            INT NOT NULL,
  kcal_target       INT UNSIGNED     DEFAULT NULL,
  protein_g_target  DECIMAL(6,2)     DEFAULT NULL,
  carbs_g_target    DECIMAL(6,2)     DEFAULT NULL,
  fat_g_target      DECIMAL(6,2)     DEFAULT NULL,
  fiber_g_target    DECIMAL(6,2)     DEFAULT NULL,
  water_ml_target   INT UNSIGNED     DEFAULT NULL,
  UNIQUE KEY uq_day_target (day_id),
  CONSTRAINT fk_ndt_day FOREIGN KEY (day_id) REFERENCES nutrition_days(id) ON DELETE CASCADE
);

-- ==========
-- PROFILI PROFESSIONISTI
-- ==========
CREATE TABLE IF NOT EXISTS professional_profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  freelancer_id   INT NOT NULL UNIQUE,
  display_name    VARCHAR(150) NOT NULL,
  role            ENUM('personal_trainer','nutrizionista') NOT NULL DEFAULT 'personal_trainer',
  city            VARCHAR(120) NULL,
  price_per_hour  DECIMAL(8,2) DEFAULT 0.00,
  specialties     JSON DEFAULT (JSON_ARRAY()),
  languages       JSON DEFAULT (JSON_ARRAY()),
  bio             TEXT NULL,
  avatar_url      VARCHAR(500) NULL,
  verified        TINYINT(1) NOT NULL DEFAULT 0,
  online          TINYINT(1) NOT NULL DEFAULT 0,
  rating          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  reviews_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pp_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE
);

-- ==========
-- USER SETTINGS
-- ==========
CREATE TABLE IF NOT EXISTS user_settings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  theme           ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  locale          VARCHAR(10)                   NOT NULL DEFAULT 'it-IT',
  weight_unit     ENUM('kg','lb')               NOT NULL DEFAULT 'kg',
  height_unit     ENUM('cm','in')               NOT NULL DEFAULT 'cm',
  distance_unit   ENUM('km','mi')               NOT NULL DEFAULT 'km',
  time_format     ENUM('24h','12h')             NOT NULL DEFAULT '24h',
  currency        ENUM('EUR','USD','GBP')       NOT NULL DEFAULT 'EUR',
  energy_unit     ENUM('kcal','kJ')             NOT NULL DEFAULT 'kcal',
  notifications   JSON DEFAULT (JSON_OBJECT('email', true, 'push', false, 'chat', true)),
  privacy         JSON DEFAULT (JSON_OBJECT('profileVisibility','public','showOnline', true)),
  accessibility   JSON DEFAULT (JSON_OBJECT('reducedMotion', false, 'highContrast', false, 'fontScale', 100)),
  professional    JSON DEFAULT (JSON_OBJECT('isAvailableOnline', false, 'autoAcceptChat', false)),
  settings        JSON NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========
-- ASSISTENTE / SETTINGS (facoltativo ma utile)
-- ==========
CREATE TABLE IF NOT EXISTS app_settings (
  k           VARCHAR(64) PRIMARY KEY,
  v           VARCHAR(255) NOT NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_folders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_af_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========
-- CHAT / MESSAGGI
-- ==========
CREATE TABLE IF NOT EXISTS chat_threads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_participants (
  thread_id BIGINT UNSIGNED NOT NULL,
  user_id   INT NOT NULL,
  last_read_message_id BIGINT UNSIGNED NULL DEFAULT 0,
  PRIMARY KEY (thread_id, user_id),
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)        ON DELETE CASCADE
);

-- Indici chat_participants
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_participants'
        AND index_name   = 'idx_cp_user_thread'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_participants` ADD INDEX `idx_cp_user_thread` (`user_id`,`thread_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_participants'
        AND index_name   = 'idx_cp_thread_user'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_participants` ADD INDEX `idx_cp_thread_user` (`thread_id`,`user_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_participants'
        AND index_name   = 'idx_cp_last_read'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_participants` ADD INDEX `idx_cp_last_read` (`last_read_message_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)        ON DELETE CASCADE
);

-- Indici chat_messages
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_messages'
        AND index_name   = 'idx_cm_thread_id'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_messages` ADD INDEX `idx_cm_thread_id` (`thread_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_messages'
        AND index_name   = 'idx_cm_thread_id_id'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_messages` ADD INDEX `idx_cm_thread_id_id` (`thread_id`,`id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_messages'
        AND index_name   = 'idx_cm_sender_id'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_messages` ADD INDEX `idx_cm_sender_id` (`sender_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS chat_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_a INT NOT NULL,
  user_b INT NOT NULL,
  thread_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pair (user_a, user_b),
  FOREIGN KEY (user_a)    REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (user_b)    REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime VARCHAR(100) NULL,
  filename VARCHAR(255) NULL,
  size INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
);

-- Indice chat_attachments.message_id
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'chat_attachments'
        AND index_name   = 'idx_ca_message_id'
    ),
    'SELECT 1',
    'ALTER TABLE `chat_attachments` ADD INDEX `idx_ca_message_id` (`message_id`)'
  )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ==========
-- VIEW
-- ==========
CREATE OR REPLACE VIEW v_chat_last_message AS
SELECT m.thread_id, MAX(m.id) AS last_message_id
FROM chat_messages m
GROUP BY m.thread_id;

CREATE OR REPLACE VIEW v_chat_unread_per_user_thread AS
SELECT
  cp.user_id,
  t.id AS thread_id,
  COUNT(m.id) AS unread
FROM chat_threads t
JOIN chat_participants cp
  ON cp.thread_id = t.id
LEFT JOIN chat_messages m
  ON m.thread_id = t.id
 AND m.id > COALESCE(cp.last_read_message_id, 0)
 AND m.sender_id <> cp.user_id
GROUP BY cp.user_id, t.id;

-- ==========
-- BACKFILL (A = tutto letto / B = tutto non letto)
-- ==========
UPDATE chat_participants cp
LEFT JOIN (
  SELECT thread_id, MAX(id) AS max_id
  FROM chat_messages
  GROUP BY thread_id
) lm ON lm.thread_id = cp.thread_id
SET cp.last_read_message_id = COALESCE(lm.max_id, 0)
WHERE COALESCE(cp.last_read_message_id, 0) = 0;

-- -- Alternativa:
-- -- UPDATE chat_participants SET last_read_message_id = 0;
