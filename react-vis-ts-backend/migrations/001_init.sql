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