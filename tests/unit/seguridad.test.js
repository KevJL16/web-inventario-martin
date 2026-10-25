// Pruebas unitarias de las utilidades de seguridad (server/passwords.js y src/utils/random.js)
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateTemporaryPassword,
  generateResetToken,
  hashResetToken,
  DUMMY_HASH
} from '../../server/passwords.js';
import { randomDigits } from '../../src/utils/random.js';

describe('Contraseñas (bcrypt)', () => {
  it('el hash no contiene la contraseña y se verifica correctamente', async () => {
    const hash = await hashPassword('Clave-Prueba-123');
    expect(hash).not.toContain('Clave-Prueba-123');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword('Clave-Prueba-123', hash)).toBe(true);
    expect(await verifyPassword('clave-prueba-123', hash)).toBe(false);
  });

  it('el hash ficticio no valida ninguna contraseña habitual', async () => {
    expect(await verifyPassword('', DUMMY_HASH)).toBe(false);
    expect(await verifyPassword('admin123', DUMMY_HASH)).toBe(false);
  });

  it('las contraseñas temporales tienen el formato esperado y no se repiten', () => {
    const muestras = new Set(Array.from({ length: 200 }, () => generateTemporaryPassword()));
    expect(muestras.size).toBe(200);
    for (const p of muestras) expect(p).toMatch(/^Mrt-[A-HJ-NP-Za-km-z2-9]{12}!$/);
  });
});

describe('Tokens de recuperación', () => {
  it('se guarda el SHA-256 del token, nunca el token', () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashResetToken(token));
    expect(tokenHash).not.toBe(token);
  });
});

describe('randomDigits (folios y códigos)', () => {
  it.each([1, 4, 10])('genera %i dígitos sin cero inicial', (n) => {
    for (let i = 0; i < 500; i++) {
      const d = randomDigits(n);
      expect(d).toHaveLength(n);
      expect(d).toMatch(/^[1-9]\d*$/);
    }
  });

  it('reparte los dígitos de forma aproximadamente uniforme', () => {
    const cuenta = Array(10).fill(0);
    for (let i = 0; i < 20000; i++) cuenta[Number(randomDigits(2)[1])]++;
    for (const c of cuenta) expect(c).toBeGreaterThan(1600); // esperado ~2000 por dígito
  });
});
