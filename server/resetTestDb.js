// ============================================================================
// REINICIO DE LA BASE DE DATOS DE PRUEBAS
// Uso: npm run db:pruebas:reset   (lee server/.env.pruebas)
//
// 1. Borra y vuelve a crear la base indicada en DB_NAME (debe terminar en _Pruebas).
// 2. Ejecuta database/01_ESQUEMA_Y_DATOS.sql y database/04_DATOS_PRUEBA.sql.
// 3. Asigna a las cuentas de prueba la contraseña TEST_USER_PASSWORD (hash bcrypt).
// Así cada ejecución de pruebas parte de los mismos datos conocidos.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';
import { dbConfig } from './config.js';
import { hashPassword, MIN_PASSWORD_LENGTH } from './passwords.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = ['database/01_ESQUEMA_Y_DATOS.sql', 'database/04_DATOS_PRUEBA.sql'];
const TEST_ACCOUNTS = ['administrador@rep-martin.com', 'gerencia@rep-martin.com', 'almacen@rep-martin.com'];

const dbName = dbConfig.database;
const testPassword = process.env.TEST_USER_PASSWORD || '';

if (!/_Pruebas$/.test(dbName) || !/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error(`❌ DB_NAME="${dbName}" no es una base de pruebas (debe terminar en _Pruebas). No se borró nada.`);
  process.exit(1);
}
if (testPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(`❌ Define TEST_USER_PASSWORD (mínimo ${MIN_PASSWORD_LENGTH} caracteres) en server/.env.pruebas.`);
  process.exit(1);
}

// Divide un script de SSMS en lotes separados por GO
const readBatches = (file) =>
  fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/^﻿/, '')
    .split(/^\s*GO\s*$/im)
    .filter((batch) => batch.trim());

async function withPool(database, fn) {
  // Una sola conexión física: SET NOEXEC y el contexto de cada lote se comportan como en SSMS
  // mssql modifica el objeto options que recibe: se copia para no contaminar otras conexiones
  const pool = await new sql.ConnectionPool({
    ...dbConfig,
    database,
    options: { ...dbConfig.options },
    pool: { max: 1, min: 1 }
  }).connect();
  try {
    return await fn(pool);
  } finally {
    await pool.close();
  }
}

try {
  console.log(`🧪 Reiniciando ${dbName} en ${dbConfig.server}:${dbConfig.port}...`);

  await withPool('master', (master) => master.request().batch(`
    IF DB_ID('${dbName}') IS NOT NULL
    BEGIN
      ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${dbName}];
    END
    CREATE DATABASE [${dbName}] COLLATE Modern_Spanish_CI_AS;
  `));
  // SQL Server tarda unos instantes en aceptar conexiones a una base recién creada
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await withPool(dbName, async (pool) => {
    for (const script of SCRIPTS) {
      let errors = 0;
      for (const batch of readBatches(script)) {
        try {
          await pool.request().batch(batch);
        } catch (err) {
          errors++;
          console.error(`   ⚠️  ${script}: ${err.message}`);
        }
      }
      if (errors) throw new Error(`${script} terminó con ${errors} error(es).`);
      console.log(`   ✅ ${script}`);
    }

    const hash = await hashPassword(testPassword);
    for (const correo of TEST_ACCOUNTS) {
      await pool.request()
        .input('correo', sql.VarChar, correo)
        .input('hash', sql.VarChar, hash)
        .query('UPDATE Usuarios SET PasswordHash = @hash, RequiereCambioPassword = 0 WHERE CorreoCorporativo = @correo;');
    }
    console.log(`   ✅ Contraseña de prueba asignada a ${TEST_ACCOUNTS.length} cuentas.`);

    const summary = (await pool.request().query(`
      SELECT (SELECT COUNT(*) FROM Productos) AS productos,
             (SELECT COUNT(*) FROM AjustesInventario) AS ajustes,
             (SELECT COUNT(*) FROM Usuarios) AS usuarios;
    `)).recordset[0];
    console.log(`🎉 ${dbName} lista: ${summary.productos} productos, ${summary.ajustes} ajustes, ${summary.usuarios} usuarios.`);
  });
  process.exit(0);
} catch (err) {
  console.error('❌ Error al reiniciar la base de pruebas:', err.message);
  process.exit(1);
}
