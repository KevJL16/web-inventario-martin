import sql from 'mssql';
import { dbConfig } from './config.js';

// Azure SQL serverless se pausa sin uso: la primera conexión puede fallar con errores
// transitorios mientras la base se reactiva (~1 min). Se reintenta con espera creciente.
const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000];

// Números de error transitorios documentados para Azure SQL Database
const TRANSIENT_SQL_ERRORS = new Set([4060, 4221, 10928, 10929, 40143, 40197, 40501, 40613, 49918, 49919, 49920]);
const TRANSIENT_CODES = new Set(['ETIMEOUT', 'ESOCKET', 'ECONNRESET', 'ECONNCLOSED']);

function isTransient(err) {
  const number = err?.originalError?.info?.number ?? err?.number;
  return TRANSIENT_SQL_ERRORS.has(number) || TRANSIENT_CODES.has(err?.code);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectWithRetry() {
  for (let attempt = 0; ; attempt++) {
    const pool = new sql.ConnectionPool(dbConfig);
    try {
      await pool.connect();
      pool.on('error', (err) => {
        console.error('Error en el pool de SQL Server, se reconectará en la próxima petición:', err.message);
        poolPromise = null;
      });
      return pool;
    } catch (err) {
      await pool.close().catch(() => {});
      if (attempt >= RETRY_DELAYS_MS.length || !isTransient(err)) throw err;
      console.warn(`Conexión a SQL Server fallida (${err.code || err.message}); reintento ${attempt + 1} en ${RETRY_DELAYS_MS[attempt] / 1000}s...`);
      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }
}

// Las peticiones simultáneas comparten la misma conexión en curso; si falla, la siguiente vuelve a intentarlo
let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = connectWithRetry().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export { sql };
