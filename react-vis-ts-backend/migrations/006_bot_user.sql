-- 006_bot_user.sql
START TRANSACTION;

-- 1) app_settings (idempotente)
CREATE TABLE IF NOT EXISTS app_settings (
  k VARCHAR(64) PRIMARY KEY,
  v VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2) Aggiungi colonna users.is_bot (idempotente, via INFORMATION_SCHEMA)
SET @has_is_bot := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='is_bot'
);
SET @ddl_is_bot := IF(@has_is_bot=0,
  'ALTER TABLE users ADD COLUMN is_bot TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE sb FROM @ddl_is_bot; EXECUTE sb; DEALLOCATE PREPARE sb;

-- 3) Utente bot (se non esiste)
INSERT INTO users (username, password, type, email, is_bot)
SELECT 'myfit-bot',
       '$2b$10$3xN8nOGcLxJ9r0i2j3LwA.O6rWJZgDNP1DqSaq/5F2k9c7o4gJq5S',
       'professionista',
       'bot@myfit.local',
       1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'myfit-bot');

-- 4) Se già esiste, assicurati sia marcato bot
UPDATE users SET is_bot = 1 WHERE username = 'myfit-bot';

-- 5) Salva BOT_USER_ID in app_settings
REPLACE INTO app_settings (k, v)
SELECT 'BOT_USER_ID', CAST(id AS CHAR)
FROM users WHERE username = 'myfit-bot' LIMIT 1;

COMMIT;
