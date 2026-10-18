// ============================================================================
// UTILIDADES DE CONTRASEÑAS Y TOKENS (bcrypt + crypto)
// ============================================================================

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Hash válido de una contraseña aleatoria: se compara contra él cuando el
// usuario no existe para que el tiempo de respuesta no revele qué correos existen.
export const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

// Contraseña temporal criptográficamente segura (sin caracteres ambiguos)
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTemporaryPassword(length = 12) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  }
  return `Mrt-${result}!`;
}

// Token de restablecimiento: se entrega el valor en claro y en la BD solo se guarda su SHA-256
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashResetToken(token) };
}

export const hashResetToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');
