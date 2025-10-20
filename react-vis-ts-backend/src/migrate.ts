import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise'; // 👈 usiamo direttamente mysql2/promise

async function run() {
  // 🔹 Crea una connessione SENZA specificare il database
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true // 👈 utile se ci sono più comandi in un file
  });

  // 🔹 Directory dove si trovano le migrazioni
  const dir = path.resolve(process.cwd(), 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`[migrate] running ${f}`);

    // 🔹 Esegui tutto il file in blocco (dato che abbiamo abilitato multipleStatements)
    await pool.query(sql);
  }

  console.log('[migrate] done');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
