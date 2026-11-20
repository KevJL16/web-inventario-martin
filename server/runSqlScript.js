// ============================================================================
// EJECUTAR UN SCRIPT SQL DE database/ CONTRA LA BASE CONFIGURADA
// Uso:  npm run db:script -- database/05_ROL_VENDEDOR.sql        (server/.env)
//       npm run db:script:azure -- database/05_ROL_VENDEDOR.sql  (server/.env.azure)
// Divide el archivo en lotes por GO (como SSMS) y muestra los mensajes PRINT.
// Los scripts 05 y 06 necesitan un usuario administrador: martin_app no puede
// crear roles ni registrar ajustes con fecha propia.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';
import { dbConfig } from './config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archivo = process.argv[2];

if (!archivo) {
  console.error('Uso: npm run db:script -- database/<script>.sql');
  process.exit(1);
}

const ruta = path.resolve(root, archivo);
if (!ruta.startsWith(path.join(root, 'database')) || !ruta.endsWith('.sql') || !fs.existsSync(ruta)) {
  console.error(`❌ ${archivo} no es un script .sql de la carpeta database/.`);
  process.exit(1);
}

const lotes = fs.readFileSync(ruta, 'utf8')
  .replace(/^﻿/, '')
  .split(/^\s*GO\s*$/im)
  .filter((lote) => lote.trim());

console.log(`▶ ${path.relative(root, ruta)} en ${dbConfig.database} (${dbConfig.server}) como ${dbConfig.user}...`);

let pool;
try {
  // mssql modifica el objeto options que recibe: se copia
  pool = await new sql.ConnectionPool({
    ...dbConfig,
    options: { ...dbConfig.options },
    requestTimeout: 300000,
    pool: { max: 1, min: 1 }
  }).connect();

  for (const lote of lotes) {
    const request = pool.request();
    request.on('info', (info) => console.log(`   ${info.message}`));
    await request.batch(lote);
  }
  console.log('✅ Script ejecutado.');
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool?.close();
}
