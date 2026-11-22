// ============================================================================
// PRUEBAS DE API DEL ROL VENDEDOR contra el ambiente de pruebas
// Requisitos: npm run db:pruebas:reset y npm run server:pruebas
// Ejecución:  npm run test:api:vendedor
// Comprueba que el Vendedor vende y consulta, pero no ve costos ni modifica
// stock por otras vías (compras, mermas, ajustes) y no rompe la jerarquía.
// Evidencia:  pruebas/evidencias/vendedor/api-<fecha-hora>.json
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

const API = (process.env.E2E_API_URL || 'http://localhost:5000') + '/api';
const PASSWORD = process.env.TEST_USER_PASSWORD;
if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run test:api:vendedor (lee server/.env.pruebas).');
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

const login = async (correo) => (await call('/auth/login', { method: 'POST', body: { correo, password: PASSWORD } })).body;

const resultados = [];
function registrar(id, titulo, esperado, obtenido, ok) {
  resultados.push({ id, titulo, esperado, obtenido, estado: ok ? 'APROBADO' : 'FALLIDO' });
  console.log(`${ok ? '✅' : '❌'} ${id} ${titulo} — ${obtenido}`);
}

const sesion = await login('vendedor@rep-martin.com');
const admin = (await login('administrador@rep-martin.com')).token;
const vendedor = sesion.token;
if (!vendedor || !admin) {
  console.error('❌ No se pudo iniciar sesión con las cuentas de prueba. ¿Está corriendo npm run server:pruebas y se reinició la base?');
  process.exit(1);
}

const SKU = 'MEL-PEL-BLA-18';
const stockDe = async (sku) => (await call('/productos', { token: admin })).body.find((p) => p.sku === sku)?.stockActual;
const movimiento = (token, tipo, cantidad = 1) =>
  call('/movimientos', { method: 'POST', token, body: { sku: SKU, tipo, cantidad, comprobante: `VEN-PRUEBA-${tipo}`, observacion: 'Prueba de rol Vendedor' } });

// VEN-01: inicio de sesión con el rol nuevo
registrar('VEN-01', 'Inicio de sesión del Vendedor', 'rol Vendedor', `rol ${sesion.user?.rolNombre}`, sesion.user?.rolNombre === 'Vendedor');

// VEN-02: el catálogo llega sin costo de compra
const prods = await call('/productos', { token: vendedor });
const sinCosto = Array.isArray(prods.body) && prods.body.length > 0 && prods.body.every((p) => !('costoCompra' in p) && p.precioVenta > 0);
registrar('VEN-02', 'Catálogo del Vendedor sin costo de compra', '200, precio de venta y sin costoCompra', `${prods.status}; ${prods.body.length} productos; sin costo: ${sinCosto}`, prods.status === 200 && sinCosto);

// VEN-03: los demás roles siguen recibiendo el costo
const prodsAdmin = await call('/productos', { token: admin });
registrar('VEN-03', 'El Administrador sigue viendo el costo', 'costoCompra presente', `costo presente: ${'costoCompra' in (prodsAdmin.body[0] || {})}`, 'costoCompra' in (prodsAdmin.body[0] || {}));

// VEN-04: registra una venta y descuenta stock
const s0 = await stockDe(SKU);
const venta = await movimiento(vendedor, 'SALIDA_VENTA', 2);
const s1 = await stockDe(SKU);
registrar('VEN-04', 'El Vendedor registra una venta', `200 y stock ${s0} → ${s0 - 2}`, `${venta.status}; stock ${s0} → ${s1}`, venta.status === 200 && s1 === s0 - 2);

// VEN-05 a VEN-08: no puede mover stock por otras vías
for (const [id, tipo] of [['VEN-05', 'ENTRADA_COMPRA'], ['VEN-06', 'MERMA'], ['VEN-07', 'AJUSTE_POSITIVO'], ['VEN-08', 'AJUSTE_NEGATIVO']]) {
  const antes = await stockDe(SKU);
  const r = await movimiento(vendedor, tipo, 1);
  const despues = await stockDe(SKU);
  registrar(id, `El Vendedor intenta registrar ${tipo}`, '403 y stock sin cambios', `${r.status}; stock ${antes} → ${despues}`, r.status === 403 && antes === despues);
}

// VEN-09: tampoco registra ajustes justificados (HU-004)
const aj = await call('/ajustes', { method: 'POST', token: vendedor, body: { productoId: 1, tipoAjuste: 'MERMA_DANO', cantidad: 1, motivo: 'Prueba', detalle: 'Intento de merma del Vendedor' } });
registrar('VEN-09', 'El Vendedor intenta registrar una merma justificada', '403', `${aj.status}; ${aj.body.message}`, aj.status === 403);

// VEN-10: consulta de movimientos limitada a ventas
const movs = await call('/movimientos', { token: vendedor });
const soloVentas = Array.isArray(movs.body) && movs.body.length > 0 && movs.body.every((m) => m.tipo === 'SALIDA_VENTA');
registrar('VEN-10', 'El Vendedor solo ve ventas en Movimientos', '200 y todas SALIDA_VENTA', `${movs.status}; ${movs.body.length} movimientos; solo ventas: ${soloVentas}`, movs.status === 200 && soloVentas);

// VEN-11 y VEN-12: sin Kardex valorizado ni historial de ajustes
const kardex = await call('/kardex', { token: vendedor });
registrar('VEN-11', 'El Vendedor consulta el Kardex', '403', `${kardex.status}`, kardex.status === 403);
const hist = await call('/ajustes', { token: vendedor });
registrar('VEN-12', 'El Vendedor consulta el historial de ajustes', '403', `${hist.status}`, hist.status === 403);

// VEN-13: alertas de stock bajo disponibles
const alertas = await call('/alertas', { token: vendedor });
registrar('VEN-13', 'El Vendedor consulta las alertas de stock bajo', '200', `${alertas.status}; ${alertas.body.length} alertas`, alertas.status === 200 && Array.isArray(alertas.body));

// VEN-14: no administra usuarios (jerarquía)
const usuarios = await call('/usuarios', { token: vendedor });
registrar('VEN-14', 'El Vendedor intenta listar usuarios', '403', `${usuarios.status}`, usuarios.status === 403);

// VEN-15: el rol aparece en el alta de usuarios con nivel 4
const roles = await call('/roles', { token: admin });
const rolVendedor = roles.body.find?.((r) => r.nombre === 'Vendedor');
registrar('VEN-15', 'El rol Vendedor está disponible con nivel 4', 'nivel 4', `nivel ${rolVendedor?.nivel}`, rolVendedor?.nivel === 4);

const out = path.resolve('pruebas', 'evidencias', process.env.EVIDENCIA_PC || 'vendedor');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, `api-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
const resumen = {
  prueba: 'Rol Vendedor - permisos en la API',
  url: API,
  fecha: new Date().toISOString(),
  aprobados: resultados.filter((r) => r.estado === 'APROBADO').length,
  fallidos: resultados.filter((r) => r.estado === 'FALLIDO').length,
  casos: resultados
};
fs.writeFileSync(file, JSON.stringify(resumen, null, 2));
console.log(`📁 Evidencia: ${path.relative(process.cwd(), file)} — ${resumen.aprobados} aprobados, ${resumen.fallidos} fallidos`);
process.exit(resumen.fallidos ? 1 : 0);
