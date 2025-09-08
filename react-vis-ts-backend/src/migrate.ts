import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pool from './db.js';

async function run() {
  const dir = path.resolve(process.cwd(), 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`[migrate] running ${f}`);

    // split sugli statement (grezzo ma efficace per file semplici)
    const statements = sql
      .split(/;\s*$/m)          // separa sugli ';' a fine riga/blocco
      .flatMap(s => s.split(/;\s*\n/)) // cattura anche i ; con newline
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await pool.query(stmt);
    }
  }

  console.log('[migrate] done');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});