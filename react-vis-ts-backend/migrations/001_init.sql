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

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  expire DATE NULL,
  goal ENUM('peso_costante','aumento_peso','perdita_peso','altro'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* tabella ponte tra scheda e esercizi */
CREATE TABLE IF NOT EXISTS schedule_exercise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedules_id INT NOT NULL,
  exercises_id INT NOT NULL,
  sets TINYINT NULL,
  reps TINYINT NULL,
  rest_seconds SMALLINT NULL,
  weight_value DECIMAL(6,2) NULL,
  FOREIGN KEY (exercises_id) REFERENCES exercises(id),
  FOREIGN KEY (schedules_id) REFERENCES schedules(id)
);

/* tabella ponte tra scheda clienti e professionisti */
CREATE TABLE IF NOT EXISTS freelancer_customer_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  customer_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
  vat VARCHAR(30) NOT NULL,
  UNIQUE KEY uq_triplet (schedule_id, customer_id, freelancer_id)
);