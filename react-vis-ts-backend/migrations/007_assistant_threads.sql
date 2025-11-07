-- 007_assistant_threads.sql
-- Multi-thread per il bot + cartelle

START TRANSACTION;

-- 0) Safety: se per qualche motivo 006 non ha creato app_settings, creala ora
CREATE TABLE IF NOT EXISTS app_settings (
  k VARCHAR(64) PRIMARY KEY,
  v VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 1) Cartelle per i thread dell'assistente
CREATE TABLE IF NOT EXISTS assistant_folders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_name (user_id, name),
  KEY idx_user (user_id)
) ENGINE=InnoDB;

-- 2) Aggiunte a chat_threads
SET @has_is_bot_thread := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND COLUMN_NAME='is_bot_thread'
);
SET @ddl1 := IF(@has_is_bot_thread=0,
  'ALTER TABLE chat_threads ADD COLUMN is_bot_thread TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE s1 FROM @ddl1; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @has_owner_user_id := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND COLUMN_NAME='owner_user_id'
);
SET @ddl2 := IF(@has_owner_user_id=0,
  'ALTER TABLE chat_threads ADD COLUMN owner_user_id INT NULL',
  'SELECT 1'
);
PREPARE s2 FROM @ddl2; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @has_title := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND COLUMN_NAME='title'
);
SET @ddl3 := IF(@has_title=0,
  'ALTER TABLE chat_threads ADD COLUMN title VARCHAR(120) NULL',
  'SELECT 1'
);
PREPARE s3 FROM @ddl3; EXECUTE s3; DEALLOCATE PREPARE s3;

SET @has_folder_id := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND COLUMN_NAME='folder_id'
);
SET @ddl4 := IF(@has_folder_id=0,
  'ALTER TABLE chat_threads ADD COLUMN folder_id INT NULL',
  'SELECT 1'
);
PREPARE s4 FROM @ddl4; EXECUTE s4; DEALLOCATE PREPARE s4;

-- 2b) Indici (condizionali)
SET @has_idx1 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND INDEX_NAME='idx_threads_is_bot_owner'
);
SET @ddl_idx1 := IF(@has_idx1=0,
  'CREATE INDEX idx_threads_is_bot_owner ON chat_threads(is_bot_thread, owner_user_id)',
  'SELECT 1'
);
PREPARE si1 FROM @ddl_idx1; EXECUTE si1; DEALLOCATE PREPARE si1;

SET @has_idx2 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='chat_threads' AND INDEX_NAME='idx_threads_folder'
);
SET @ddl_idx2 := IF(@has_idx2=0,
  'CREATE INDEX idx_threads_folder ON chat_threads(folder_id)',
  'SELECT 1'
);
PREPARE si2 FROM @ddl_idx2; EXECUTE si2; DEALLOCATE PREPARE si2;

-- 3) Flagga i thread 1:1 umano<->bot come is_bot_thread, setta owner_user_id=umano
UPDATE chat_threads t
JOIN (
  SELECT p1.thread_id, 
         MAX(CASE WHEN u1.is_bot=1 THEN p1.user_id END) AS bot_id,
         MAX(CASE WHEN u1.is_bot=0 THEN p1.user_id END) AS human_id,
         COUNT(*) AS n_participants
  FROM chat_participants p1
  JOIN users u1 ON u1.id = p1.user_id
  GROUP BY p1.thread_id
) map ON map.thread_id = t.id
SET t.is_bot_thread = IF(map.bot_id IS NOT NULL AND map.human_id IS NOT NULL AND map.n_participants=2, 1, t.is_bot_thread),
    t.owner_user_id = IF(t.is_bot_thread=1 AND t.owner_user_id IS NULL, map.human_id, t.owner_user_id);

COMMIT;