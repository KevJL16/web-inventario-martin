// ============================================================================
// ASIGNAR CONTRASEÑA A UN USUARIO (hash bcrypt)
// Uso: npm run set-password -- <correo> [nuevaContraseña]
// Si no se indica la contraseña, se genera una temporal segura y se muestra
// una sola vez; el usuario deberá cambiarla (RequiereCambioPassword = 1).
// ============================================================================

import { getPool, sql } from './db.js';
import { hashPassword, generateTemporaryPassword, MIN_PASSWORD_LENGTH } from './passwords.js';

const [correoArg, passwordArg] = process.argv.slice(2);

if (!correoArg) {
  console.error('Uso: npm run set-password -- <correo> [nuevaContraseña]');
  process.exit(1);
}

if (passwordArg && passwordArg.length < MIN_PASSWORD_LENGTH) {
  console.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  process.exit(1);
}

const correo = correoArg.trim().toLowerCase();
const password = passwordArg || generateTemporaryPassword();

try {
  const pool = await getPool();
  const result = await pool.request()
    .input('correo', sql.VarChar, correo)
    .input('hash', sql.VarChar, await hashPassword(password))
    .input('requiereCambio', sql.Bit, passwordArg ? 0 : 1)
    .query(`UPDATE Usuarios SET PasswordHash = @hash, RequiereCambioPassword = @requiereCambio
            WHERE LOWER(CorreoCorporativo) = @correo;`);

  if (result.rowsAffected[0] === 0) {
    console.error(`❌ No existe ningún usuario con el correo ${correo}.`);
    process.exit(1);
  }

  console.log(`✅ Contraseña actualizada para ${correo}.`);
  if (!passwordArg) {
    console.log(`   Contraseña temporal (se muestra solo esta vez): ${password}`);
  }
  await pool.close();
  process.exit(0);
} catch (err) {
  console.error('❌ Error al actualizar la contraseña:', err.message);
  process.exit(1);
}
