// ============================================================================
// PRUEBAS DE API (HU-004) - POST/GET /api/ajustes contra el ambiente de pruebas
// Requisitos: npm run db:pruebas:reset y npm run server:pruebas
// Ejecución:  npm run test:api
// Al terminar verifica en la base que la bitácora registró cada ajuste (CA-2).
// Evidencia:  pruebas/evidencias/pc10/api-<fecha-hora>.json
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import sql from 'mssql';
import { dbConfig } from '../../server/config.js';

const API = (process.env.E2E_API_URL || 'http://localhost:5000') + '/api';
const PASSWORD = process.env.TEST_USER_PASSWORD;
if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run test:api (lee server/.env.pruebas).');
  process.exit(1);
}

async function call(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + pathname, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const login = async (correo) => (await call('/auth/login', { method: 'POST', body: { correo, password: PASSWORD } })).body.token;

const resultados = [];
function registrar(id, titulo, esperado, obtenido, ok) {
  resultados.push({ id, titulo, esperado, obtenido, estado: ok ? 'APROBADO' : 'FALLIDO' });
  console.log(`${ok ? '✅' : '❌'} ${id} ${titulo} — ${obtenido}`);
}

const almacen = await login('almacen@rep-martin.com');
const gerencia = await login('gerencia@rep-martin.com');
if (!almacen || !gerencia) {
  console.error('❌ No se pudo iniciar sesión con las cuentas de prueba. ¿Está corriendo npm run server:pruebas?');
  process.exit(1);
}

const productos = async () => (await call('/productos', { token: almacen })).body;
const stockDe = async (sku) => (await productos()).find((p) => p.sku === sku)?.stockActual;
const idDe = async (sku) => (await productos()).find((p) => p.sku === sku)?.id;

const SKU = 'MEL-VES-ROB-18';
const valido = {
  productoId: await idDe(SKU),
  tipoAjuste: 'MERMA_DANO',
  cantidad: 2,
  motivo: 'Tablero desportillado',
  detalle: 'Golpe de montacargas en la esquina durante la descarga'
};
const ajuste = (token, body) => call('/ajustes', { method: 'POST', token, body });
const folios = [];

// API-01 / API-02: registro válido y folio único en el mismo minuto (DEF-01)
const s0 = await stockDe(SKU);
const r1 = await ajuste(almacen, valido);
const s1 = await stockDe(SKU);
registrar('API-01', 'Merma válida por Encargado de Almacén', `201 y stock ${s0} → ${s0 - 2}`, `${r1.status}; ${r1.body.message}; stock ${s0} → ${s1}`, r1.status === 201 && s1 === s0 - 2);
folios.push(r1.body.adjustment?.numeroAjuste);

const r2 = await ajuste(almacen, valido);
folios.push(r2.body.adjustment?.numeroAjuste);
registrar('API-02', 'Dos mermas seguidas del mismo producto (folio único)', '201 y folios distintos', `${r2.status}; folios ${folios.join(' y ')}`, r2.status === 201 && folios[0] !== folios[1]);

// API-03 a API-07: validaciones (HU-004 CA-1 y CA-3)
const casos400 = [
  ['API-03', 'Justificación técnica vacía', { detalle: '   ' }, /obligatoria/],
  ['API-04', 'Justificación de menos de 10 caracteres', { detalle: 'roto' }, /al menos 10/],
  ['API-05', 'Cantidad 0', { cantidad: 0 }, /entero mayor a 0/],
  ['API-06', 'Descontar más que el stock (stock 1, pide 2)', { productoId: await idDe('HER-BIS-CAN-35') }, /No se puede descontar más/],
  ['API-07', 'Producto dado de baja', { productoId: 14 }, /no existe o está inactivo/]
];
for (const [id, titulo, cambios, patron] of casos400) {
  const r = await ajuste(almacen, { ...valido, ...cambios });
  registrar(id, titulo, '400 con mensaje de validación', `${r.status}; ${r.body.message}`, r.status === 400 && patron.test(r.body.message || ''));
}

// API-08 / API-09: control de acceso (HU-004 CA-4)
const r8 = await ajuste(gerencia, valido);
registrar('API-08', 'Rol Gerencia intenta registrar un ajuste', '403', `${r8.status}; ${r8.body.message}`, r8.status === 403);
const r9 = await call('/ajustes', { method: 'POST', body: valido });
registrar('API-09', 'Petición sin sesión', '401', `${r9.status}; ${r9.body.message}`, r9.status === 401);

// API-10: sobrante incrementa el stock
const s10 = await stockDe(SKU);
const r10 = await ajuste(almacen, { ...valido, tipoAjuste: 'SOBRANTE', cantidad: 5, motivo: 'Diferencia en conteo cíclico', detalle: 'Conteo físico encontró 5 planchas más' });
const s10b = await stockDe(SKU);
folios.push(r10.body.adjustment?.numeroAjuste);
registrar('API-10', 'Sobrante (+5) incrementa el stock', `201 y stock ${s10} → ${s10 + 5}`, `${r10.status}; stock ${s10} → ${s10b}`, r10.status === 201 && s10b === s10 + 5);

// API-11: historial consultable por Gerencia
const r11 = await call('/ajustes', { token: gerencia });
const enHistorial = folios.every((f) => r11.body.some?.((a) => a.numeroAjuste === f));
registrar('API-11', 'Gerencia consulta el historial de ajustes', '200 con los ajustes registrados', `${r11.status}; ${r11.body.length} ajustes; incluye ${folios.join(', ')}: ${enHistorial}`, r11.status === 200 && enHistorial);

// API-12: cada ajuste genera su asiento de Kardex
const kardex = (await call('/kardex', { token: almacen })).body;
const conKardex = folios.filter((f) => kardex.some((k) => k.comprobante === f));
registrar('API-12', 'Cada ajuste genera su asiento de Kardex', `${folios.length} asientos con folio AJU-`, `${conKardex.length} asientos: ${conKardex.join(', ')}`, conKardex.length === folios.length);

// API-13: la bitácora registra fecha, hora, cantidad, motivo y usuario (HU-004 CA-2)
// Se consulta la base directamente con una conexión propia del script.
// Si el SQL Server local solo acepta la conexión DAC (DB_POOL_MAX=1), se espera a que la API la libere
async function conectarBD() {
  for (let intento = 1; ; intento++) {
    try {
      return await new sql.ConnectionPool({ ...dbConfig, options: { ...dbConfig.options }, pool: { max: 1 } }).connect();
    } catch (err) {
      if (intento >= 12) throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
const pool = await conectarBD();
try {
  const filas = (await pool.request().query(`
    SELECT a.NumeroAjuste, a.MotivoJustificado, p.CodigoSKU, b.Accion, b.Descripcion, b.FechaHora, CONCAT(u.Nombres, ' ', u.Apellidos) AS Usuario
    FROM AjustesInventario a
    INNER JOIN Productos p ON a.IdProducto = p.IdProducto
    INNER JOIN BitacoraAuditoria b ON b.Descripcion LIKE CONCAT('%Doc: ', a.NumeroAjuste, ' |%')
    INNER JOIN Usuarios u ON b.IdUsuario = u.IdUsuario
    WHERE a.NumeroAjuste IN (${folios.map((f) => `'${String(f).replace(/'/g, "''")}'`).join(',')});
  `)).recordset;
  // La propia descripción de la bitácora debe contener la cantidad, el motivo y el SKU real
  const completas = filas.filter((f) => f.FechaHora && f.Usuario && /Cantidad: \d+/.test(f.Descripcion)
    && f.Descripcion.includes(f.MotivoJustificado) && f.Descripcion.includes(`SKU: ${f.CodigoSKU}`));
  registrar('API-13', 'La bitácora registra fecha, hora, cantidad, motivo y usuario', `${folios.length} registros completos`,
    `${completas.length} registros; ej.: ${filas[0] ? `${filas[0].Accion} por ${filas[0].Usuario} el ${filas[0].FechaHora.toISOString()} — ${filas[0].Descripcion}` : 'ninguno'}`,
    completas.length === folios.length);
} finally {
  await pool.close();
}

const out = path.resolve('pruebas', 'evidencias', 'pc10');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, `api-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
const resumen = {
  prueba: 'HU-004 API /api/ajustes',
  url: API,
  fecha: new Date().toISOString(),
  aprobados: resultados.filter((r) => r.estado === 'APROBADO').length,
  fallidos: resultados.filter((r) => r.estado === 'FALLIDO').length,
  casos: resultados
};
fs.writeFileSync(file, JSON.stringify(resumen, null, 2));
console.log(`📁 Evidencia: ${path.relative(process.cwd(), file)} — ${resumen.aprobados} aprobados, ${resumen.fallidos} fallidos`);
process.exit(resumen.fallidos ? 1 : 0);
