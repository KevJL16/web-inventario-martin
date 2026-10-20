/**
 * UTILIDAD: Números aleatorios criptográficamente seguros (Web Crypto API)
 * Reemplaza Math.random(), cuyo resultado es predecible.
 */

/**
 * Cadena de `length` dígitos aleatorios; el primero nunca es 0
 * (equivale a un entero uniforme entre 10^(length-1) y 10^length - 1).
 */
export function randomDigits(length) {
  let result = '';
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      // Se descartan 250..255 para que cada dígito tenga la misma probabilidad
      if (byte >= 250) continue;
      const digit = byte % 10;
      if (result.length === 0 && digit === 0) continue;
      result += digit;
      if (result.length === length) break;
    }
  }
  return result;
}
