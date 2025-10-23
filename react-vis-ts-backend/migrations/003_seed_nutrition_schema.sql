
-- =========================================
-- CEREALI / DERIVATI / PANE / RISO / PASTA
-- =========================================

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100)
SELECT 'Pasta di semola (cruda)', 'g', 353, 10.9, 79.1, 1.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pasta di semola (cruda)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pasta di semola (bollita)', 'g', 137, 4.7, 30.3, 0.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pasta di semola (bollita)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Riso brillato (crudo)', 'g', 332, 6.7, 80.4, 0.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Riso brillato (crudo)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Riso brillato (bollito)', 'g', 100, 2.0, 24.2, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Riso brillato (bollito)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Riso integrale (crudo)', 'g', 337, 7.5, 77.4, 1.9 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Riso integrale (crudo)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Riso integrale (bollito)', 'g', 111, 2.5, 25.5, 0.6 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Riso integrale (bollito)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pane comune', 'g', 265, 8.5, 55.0, 1.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pane comune');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pane integrale', 'g', 252, 9.0, 49.0, 2.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pane integrale');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fette biscottate', 'g', 400, 10.0, 80.0, 5.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fette biscottate');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Avena (fiocchi)', 'g', 372, 13.5, 60.0, 7.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Avena (fiocchi)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Corn flakes', 'g', 372, 7.0, 84.0, 0.9 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Corn flakes');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Gallette di riso', 'g', 387, 8.0, 82.0, 3.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Gallette di riso');

-- ==================
-- PATATE / AMIDI
-- ==================
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Patate (crude)', 'g', 77, 2.0, 17.0, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Patate (crude)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Patate (bollite)', 'g', 86, 1.7, 20.0, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Patate (bollite)');

-- =========
-- LEGUMI
-- =========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Lenticchie (secche)', 'g', 329, 24.0, 54.0, 1.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Lenticchie (secche)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Lenticchie (bollite)', 'g', 92, 6.9, 16.3, 0.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Lenticchie (bollite)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fagioli borlotti (secchi)', 'g', 335, 23.0, 60.0, 1.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fagioli borlotti (secchi)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fagioli borlotti (bolliti)', 'g', 69, 5.7, 11.2, 0.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fagioli borlotti (bolliti)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fagioli cannellini (bolliti)', 'g', 91, 8.0, 14.9, 0.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fagioli cannellini (bolliti)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Ceci (secchi)', 'g', 364, 20.0, 61.0, 6.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Ceci (secchi)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Ceci (bolliti)', 'g', 120, 7.0, 18.9, 2.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Ceci (bolliti)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Piselli (freschi)', 'g', 81, 5.4, 14.0, 0.4 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Piselli (freschi)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Piselli (surgelati, cotti)', 'g', 68, 5.4, 11.0, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Piselli (surgelati, cotti)');

-- =========
-- VERDURE
-- =========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Insalata (lattuga)', 'g', 15, 1.4, 2.9, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Insalata (lattuga)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pomodoro', 'g', 17, 1.0, 3.0, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pomodoro');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Carote (crude)', 'g', 35, 1.1, 7.6, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Carote (crude)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Zucchine (crude)', 'g', 11, 1.3, 1.4, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Zucchine (crude)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Peperoni', 'g', 31, 1.0, 6.0, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Peperoni');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Melanzane', 'g', 24, 1.0, 4.6, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Melanzane');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Spinaci (crudi)', 'g', 31, 3.4, 0.6, 0.7 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Spinaci (crudi)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Broccoli', 'g', 34, 3.0, 5.0, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Broccoli');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Cavolfiore', 'g', 25, 2.0, 5.0, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Cavolfiore');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Cipolla', 'g', 40, 1.1, 9.3, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Cipolla');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Finocchio', 'g', 31, 1.2, 7.3, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Finocchio');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Asparagi', 'g', 24, 2.7, 2.1, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Asparagi');

-- ======
-- FRUTTA
-- ======
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Mela', 'g', 52, 0.3, 14.0, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Mela');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pera', 'g', 57, 0.4, 15.0, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pera');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Arancia', 'g', 47, 0.9, 12.0, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Arancia');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Mandarino', 'g', 53, 0.8, 13.3, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Mandarino');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Banana', 'g', 89, 1.1, 23.0, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Banana');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fragole', 'g', 32, 0.7, 7.7, 0.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fragole');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Kiwi', 'g', 61, 1.1, 15.0, 0.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Kiwi');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Ananas (polpa)', 'g', 50, 0.5, 13.1, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Ananas (polpa)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Uva', 'g', 69, 0.7, 18.0, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Uva');

-- =====================
-- FRUTTA SECCA / SEMI
-- =====================
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Mandorle', 'g', 579, 21.0, 22.0, 50.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Mandorle');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Nocciole', 'g', 628, 15.0, 17.0, 61.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Nocciole');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Noci', 'g', 654, 15.0, 14.0, 65.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Noci');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Pistacchi', 'g', 562, 20.0, 28.0, 45.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Pistacchi');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Anacardi', 'g', 553, 18.0, 30.0, 44.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Anacardi');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Semi di zucca', 'g', 559, 30.0, 11.0, 49.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Semi di zucca');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Semi di girasole', 'g', 584, 20.8, 20.0, 51.5 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Semi di girasole');

-- ==========
-- LATTE&CO
-- ==========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Latte vaccino intero', 'g', 64, 3.3, 4.8, 3.6 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Latte vaccino intero');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Latte vaccino parzialmente scremato', 'g', 46, 3.4, 4.8, 1.6 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Latte vaccino parzialmente scremato');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Yogurt bianco intero', 'g', 61, 3.5, 4.7, 3.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Yogurt bianco intero');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Yogurt bianco magro', 'g', 36, 3.8, 5.0, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Yogurt bianco magro');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Ricotta vaccina', 'g', 174, 11.0, 3.0, 13.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Ricotta vaccina');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Mozzarella vaccina', 'g', 253, 18.0, 2.0, 19.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Mozzarella vaccina');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Parmigiano Reggiano', 'g', 402, 33.0, 0.0, 29.7 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Parmigiano Reggiano');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Grana Padano', 'g', 398, 33.0, 0.0, 28.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Grana Padano');

-- ==========
-- CARNI
-- ==========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Petto di pollo (crudo)', 'g', 110, 23.0, 0.0, 1.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Petto di pollo (crudo)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Petto di pollo (cotto)', 'g', 165, 31.0, 0.0, 3.6 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Petto di pollo (cotto)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Tacchino (fesa)', 'g', 104, 24.0, 0.0, 1.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Tacchino (fesa)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Manzo magro', 'g', 176, 26.0, 0.0, 8.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Manzo magro');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Vitello magro', 'g', 150, 21.0, 0.0, 7.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Vitello magro');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Maiale (lonza)', 'g', 157, 21.0, 0.0, 8.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Maiale (lonza)');

-- =====
-- PESCE
-- =====
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Merluzzo', 'g', 82, 18.0, 0.0, 0.7 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Merluzzo');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Salmone', 'g', 208, 20.0, 0.0, 13.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Salmone');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Tonno (fresco)', 'g', 144, 23.0, 0.0, 5.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Tonno (fresco)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Tonno in scatola (sgocciolato, olio)', 'g', 190, 26.0, 0.0, 8.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Tonno in scatola (sgocciolato, olio)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Orata', 'g', 143, 20.0, 0.0, 6.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Orata');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Spigola', 'g', 124, 21.0, 0.0, 4.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Spigola');

-- =====
-- UOVA
-- =====
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Uovo intero', 'g', 143, 12.6, 0.7, 9.9 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Uovo intero');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Albume', 'g', 52, 11.0, 0.7, 0.2 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Albume');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Tuorlo', 'g', 322, 16.0, 3.6, 27.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Tuorlo');

-- ======
-- OLI / GRASSI / CONDIMENTI
-- ======
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Olio extravergine di oliva', 'g', 884, 0.0, 0.0, 100.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Olio extravergine di oliva');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Burro', 'g', 717, 0.9, 0.1, 81.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Burro');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Margarina', 'g', 717, 0.2, 0.7, 81.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Margarina');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Maionese', 'g', 680, 1.0, 1.0, 75.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Maionese');

-- ==========
-- LATTICINI “FRESCHI” AGGIUNTIVI
-- ==========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Formaggio spalmabile light', 'g', 160, 9.0, 4.0, 12.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Formaggio spalmabile light');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Fiocchi di latte', 'g', 98, 11.0, 3.4, 4.3 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Fiocchi di latte');

-- ==========
-- BEVANDE
-- ==========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Acqua naturale', 'ml', 0, 0.0, 0.0, 0.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Acqua naturale');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Succhi di frutta (medio)', 'ml', 45, 0.2, 10.5, 0.1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Succhi di frutta (medio)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Bibita zuccherata (cola)', 'ml', 42, 0.0, 10.6, 0.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Bibita zuccherata (cola)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Latte di soia', 'ml', 45, 3.0, 3.0, 2.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Latte di soia');

-- ==========
-- DOLCI / VARI
-- ==========
INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Biscotti secchi', 'g', 430, 8.0, 75.0, 10.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Biscotti secchi');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Cioccolato fondente (70%)', 'g', 598, 7.8, 46.0, 42.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Cioccolato fondente (70%)');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Miele', 'g', 304, 0.3, 82.0, 0.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Miele');

INSERT INTO foods (name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100) SELECT 'Zucchero', 'g', 387, 0.0, 100.0, 0.0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name='Zucchero');
