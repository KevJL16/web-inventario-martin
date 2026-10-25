// ============================================================================
// CONFIGURACIÓN DEL SERVIDOR (variables de entorno)
// Los valores sensibles se leen de server/.env (no versionado).
// Copia server/.env.example a server/.env y completa los valores.
// ============================================================================

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');

try {
  process.loadEnvFile(envPath);
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
  // Sin archivo .env: se usan las variables ya definidas en el entorno.
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    const where = process.env.VERCEL
      ? `las Environment Variables del proyecto en Vercel (entorno ${process.env.VERCEL_ENV}) y vuelve a desplegar`
      : 'server/.env (ver server/.env.example)';
    throw new Error(`Falta la variable de entorno ${name}. Revisa ${where}.`);
  }
  return value;
}

export const PORT = Number(process.env.PORT) || 5000;
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Origen del frontend autorizado por CORS (Vite usa el puerto 3000)
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

export const JWT_SECRET = required('JWT_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const dbConfig = {
  server: process.env.DB_SERVER || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 1433,
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  // Azure SQL serverless puede tardar en reactivarse tras una pausa
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 30000,
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS) || 30000,
  // Máximo de conexiones simultáneas del pool (por defecto 10 de mssql)
  pool: { max: Number(process.env.DB_POOL_MAX) || 10, min: 0 },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    // Las fechas se guardan con SYSDATETIME(): en Azure es UTC (true); un SQL Server
    // local guarda la hora local y debe usar DB_USE_UTC=false para no desfasarlas
    useUTC: process.env.DB_USE_UTC !== 'false',
    enableArithAbort: true
  }
};
