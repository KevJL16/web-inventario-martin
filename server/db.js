import sql from 'mssql';
import { dbConfig } from './config.js';

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

export { sql };
