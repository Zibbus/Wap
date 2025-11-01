/*
Credenziali di esempio (solo dev/demo):
- Utente:          username = user_marco   | password = P@ssw0rdMarco!
- Professionista:  username = pro_sara     | password = P@ssw0rdSara!
*/

/* ====== UTENTI (type = 'utente') ====== */
INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'user_marco', 'P@ssw0rdMarco!', 'Marco', 'Rossi', '1990-04-12', 'M', 'utente', 'marco.rossi@example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='user_marco');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'user_luca', 'P@ssw0rdLuca!', 'Luca', 'Bianchi', '1988-11-03', 'M', 'utente', 'luca.bianchi@example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='user_luca');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'user_lucia', 'P@ssw0rdLucia!', 'Lucia', 'Verdi', '1993-06-21', 'F', 'utente', 'lucia.verdi@example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='user_lucia');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'user_giulia', 'P@ssw0rdGiulia!', 'Giulia', 'Neri', '1996-02-15', 'F', 'utente', 'giulia.neri@example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='user_giulia');

/* ====== CLIENTI collegati ====== */
INSERT INTO customers (user_id, weight, height)
SELECT u.id, 78.5, 180
FROM users u
WHERE u.username='user_marco'
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id = u.id);

INSERT INTO customers (user_id, weight, height)
SELECT u.id, 82.0, 177
FROM users u
WHERE u.username='user_luca'
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id = u.id);

INSERT INTO customers (user_id, weight, height)
SELECT u.id, 62.4, 168
FROM users u
WHERE u.username='user_lucia'
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id = u.id);

INSERT INTO customers (user_id, weight, height)
SELECT u.id, 56.7, 165
FROM users u
WHERE u.username='user_giulia'
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id = u.id);

/* ====== PROFESSIONISTI (type = 'professionista') ====== */
INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'pro_sara', 'P@ssw0rdSara!', 'Sara', 'Galli', '1987-09-10', 'F', 'professionista', 'sara.galli@studiofit.example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='pro_sara');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'pro_elena', 'P@ssw0rdElena!', 'Elena', 'Riva', '1991-12-28', 'F', 'professionista', 'elena.riva@nutriwell.example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='pro_elena');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'pro_andrea', 'P@ssw0rdAndrea!', 'Andrea', 'Colombo', '1985-03-05', 'M', 'professionista', 'andrea.colombo@proshape.example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='pro_andrea');

INSERT INTO users (username, password, first_name, last_name, dob, sex, type, email)
SELECT 'pro_pietro', 'P@ssw0rdPietro!', 'Pietro', 'Ricci', '1989-07-19', 'M', 'professionista', 'pietro.ricci@performlab.example.com'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='pro_pietro');

/* ====== FREELANCERS collegati ====== */
INSERT INTO freelancers (user_id, vat)
SELECT u.id, 'IT12345678901'
FROM users u
WHERE u.username='pro_sara'
  AND NOT EXISTS (SELECT 1 FROM freelancers f WHERE f.user_id = u.id);

INSERT INTO freelancers (user_id, vat)
SELECT u.id, 'IT23456789012'
FROM users u
WHERE u.username='pro_elena'
  AND NOT EXISTS (SELECT 1 FROM freelancers f WHERE f.user_id = u.id);

INSERT INTO freelancers (user_id, vat)
SELECT u.id, 'IT34567890123'
FROM users u
WHERE u.username='pro_andrea'
  AND NOT EXISTS (SELECT 1 FROM freelancers f WHERE f.user_id = u.id);

INSERT INTO freelancers (user_id, vat)
SELECT u.id, 'IT45678901234'
FROM users u
WHERE u.username='pro_pietro'
  AND NOT EXISTS (SELECT 1 FROM freelancers f WHERE f.user_id = u.id);
