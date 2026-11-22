// ============================================================================
// GENERADOR DE DATOS DE DEMOSTRACIÓN (ventas, compras y mermas ficticias)
// Uso: node database/herramientas/generarDatosDemo.mjs
// Escribe database/06_DATOS_DEMO.sql. La semilla es fija: siempre genera el mismo
// script. Las cantidades son orientativas: el script SQL las ajusta al stock real
// de cada base (no vende más de lo que hay y repone cuando se baja del mínimo).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIAS = 90;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(root, '06_DATOS_DEMO.sql');

// Generador pseudoaleatorio con semilla (mulberry32)
let semilla = 20261119;
const azar = () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = semilla;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const elegirPonderado = (lista) => {
  const total = lista.reduce((s, x) => s + x.peso, 0);
  let r = azar() * total;
  for (const x of lista) { r -= x.peso; if (r <= 0) return x; }
  return lista[lista.length - 1];
};

// Popularidad y cantidad típica por venta de cada producto del catálogo semilla
const PRODUCTOS = [
  { sku: 'MEL-PEL-BLA-18', peso: 18, min: 2, max: 10 },
  { sku: 'DRY-GYP-STD-12', peso: 16, min: 5, max: 24 },
  { sku: 'MEL-VES-ROB-18', peso: 14, min: 1, max: 8 },
  { sku: 'HER-DUC-TEL-45', peso: 12, min: 4, max: 16 },
  { sku: 'DRY-VOL-RH-12', peso: 9, min: 2, max: 10 },
  { sku: 'MEL-PEL-CAR-15', peso: 8, min: 1, max: 5 },
  { sku: 'HER-DUC-BIS-110', peso: 8, min: 1, max: 5 },
  { sku: 'PIS-KAI-ROB-08', peso: 7, min: 2, max: 8 },
  { sku: 'MDF-MAS-TRU-18', peso: 6, min: 1, max: 4 },
  { sku: 'PIS-SPC-VIN-05', peso: 5, min: 2, max: 6 },
  { sku: 'MUE-MOD-DES-01', peso: 3, min: 1, max: 2 }
];

// Clientes ficticios
const CLIENTES = [
  'Público General', 'Público General', 'Público General',
  'Carpintería Los Andes', 'Constructora Pacífico Sur S.A.C.', 'Muebles Rivera E.I.R.L.',
  'Taller de Melamina El Roble', 'Inversiones Drywall Lima S.A.C.', 'Arq. Valeria Campos',
  'Decoraciones Huamán', 'Cocinas y Closets Quispe', 'Remodelaciones Santa Rosa',
  'Ebanistería Flores', 'Proyectos Interiores Delgado S.A.C.'
];

// Vendedor que atiende: V = vendedor@, W = vendedor2@, A = administrador@
const VENDEDORES = [
  { u: 'V', peso: 45 }, { u: 'W', peso: 40 }, { u: 'A', peso: 15 }
];

// Mermas y ajustes de conteo (los registra Almacén y los aprueba el Administrador)
const MERMAS = [
  { sku: 'MEL-PEL-BLA-18', tipo: 'MERMA_DANO', motivo: 'Tablero desportillado en descarga', detalle: 'Dos esquinas rotas al bajar el lote del camión del proveedor.' },
  { sku: 'MEL-VES-ROB-18', tipo: 'MERMA_DANO', motivo: 'Golpe de montacargas', detalle: 'Plancha con hundimiento en la cara principal tras maniobra en el rack.' },
  { sku: 'DRY-GYP-STD-12', tipo: 'MERMA_DANO', motivo: 'Humedad en drywall', detalle: 'Planchas con manchas de humedad por filtración en la zona B.' },
  { sku: 'DRY-VOL-RH-12', tipo: 'MERMA_DANO', motivo: 'Cartón rasgado', detalle: 'Cartón rasgado en el borde al apilar las planchas sin separadores.' },
  { sku: 'PIS-KAI-ROB-08', tipo: 'MERMA_DANO', motivo: 'Caja aplastada', detalle: 'Caja aplastada con tablillas quebradas en el sistema de clic.' },
  { sku: 'MDF-MAS-TRU-18', tipo: 'MERMA_DANO', motivo: 'Tablero alabeado', detalle: 'Tablero deformado por almacenamiento vertical prolongado.' },
  { sku: 'DRY-GYP-STD-12', tipo: 'MERMA_DANO', motivo: 'Rotura en traslado interno', detalle: 'Plancha partida al moverla del patio de recepción al rack.' },
  { sku: 'MEL-PEL-CAR-15', tipo: 'MERMA_DANO', motivo: 'Rayado en superficie', detalle: 'Rayones profundos en la cara melamínica, no apto para venta.' },
  { sku: 'HER-DUC-TEL-45', tipo: 'FALTANTE', motivo: 'Diferencia en conteo cíclico', detalle: 'El conteo físico del rack D encontró menos pares que el sistema.' },
  { sku: 'HER-DUC-BIS-110', tipo: 'FALTANTE', motivo: 'Diferencia en conteo cíclico', detalle: 'Faltan bolsas respecto al sistema en el conteo semanal.' },
  { sku: 'PIS-SPC-VIN-05', tipo: 'FALTANTE', motivo: 'Diferencia en conteo cíclico', detalle: 'Conteo mensual con una caja menos que el registro del sistema.' },
  { sku: 'MEL-PEL-BLA-18', tipo: 'FALTANTE', motivo: 'Despacho sin registrar', detalle: 'Se detectó una plancha despachada sin comprobante en el conteo.' },
  { sku: 'HER-DUC-TEL-45', tipo: 'SOBRANTE', motivo: 'Sobrante en conteo físico', detalle: 'Se encontraron pares adicionales mal ubicados en el rack D.' },
  { sku: 'DRY-GYP-STD-12', tipo: 'SOBRANTE', motivo: 'Recepción no registrada', detalle: 'Planchas de un lote anterior que no se registraron al recibir.' },
  { sku: 'MEL-VES-ROB-18', tipo: 'MERMA_DANO', motivo: 'Tablero desportillado en descarga', detalle: 'Borde desportillado detectado durante la inspección del lote.' },
  { sku: 'PIS-KAI-ROB-08', tipo: 'MERMA_DANO', motivo: 'Humedad en empaque', detalle: 'Caja con humedad que hinchó las tablillas del piso laminado.' }
];

const eventos = [];
let boleta = 1200;
let factura = 3400;

for (let dia = DIAS; dia >= 0; dia--) {
  // dia = días antes de hoy (0 = hoy). El día de la semana es aproximado: sirve solo para variar el volumen
  const diaSemana = (dia + 3) % 7; // 0 = domingo
  let ventas = diaSemana === 0 ? entre(0, 1) : diaSemana === 6 ? entre(3, 6) : entre(4, 8);
  // Ligera tendencia al alza en las semanas recientes
  if (dia < 30 && azar() < 0.4) ventas += 1;
  if (dia === 0) ventas = 3;

  for (let i = 0; i < ventas; i++) {
    const prod = elegirPonderado(PRODUCTOS);
    const cliente = elegir(CLIENTES);
    const esFactura = cliente !== 'Público General' && azar() < 0.7;
    const doc = esFactura
      ? `FAC-F001-${String(++factura).padStart(6, '0')}`
      : `BV-B001-${String(++boleta).padStart(6, '0')}`;
    const minuto = dia === 0 ? entre(8 * 60 + 30, 11 * 60) : entre(8 * 60 + 30, 18 * 60 + 30);
    eventos.push({
      dia, minuto, sku: prod.sku, tipo: 'VENTA', cantidad: entre(prod.min, prod.max),
      usuario: elegirPonderado(VENDEDORES).u, doc, obs: `Venta a cliente: ${cliente}.`, motivo: null
    });
  }
}

// Pedidos grandes de obra en los últimos días: dejan el producto bajo su stock mínimo
// y sin reponer, para que el sistema muestre alertas de reabastecimiento
[
  { sku: 'DRY-VOL-RH-12', dia: 2, cliente: 'Constructora Pacífico Sur S.A.C.' },
  { sku: 'PIS-SPC-VIN-05', dia: 1, cliente: 'Proyectos Interiores Delgado S.A.C.' },
  { sku: 'MDF-MAS-TRU-18', dia: 1, cliente: 'Muebles Rivera E.I.R.L.' }
].forEach((p) => {
  eventos.push({
    dia: p.dia, minuto: entre(10 * 60, 16 * 60), sku: p.sku, tipo: 'VENTA_GRANDE', cantidad: 0,
    usuario: elegirPonderado(VENDEDORES).u, doc: `FAC-F001-${String(++factura).padStart(6, '0')}`,
    obs: `Venta a cliente: ${p.cliente}. Pedido para obra.`, motivo: null
  });
});

// Mermas repartidas en el período (ninguna hoy)
MERMAS.forEach((m, i) => {
  const dia = Math.max(1, Math.round(DIAS - (i + 0.5) * (DIAS / MERMAS.length)) + entre(-2, 2));
  eventos.push({
    dia, minuto: entre(7 * 60 + 30, 17 * 60), sku: m.sku, tipo: m.tipo,
    cantidad: m.tipo === 'SOBRANTE' ? entre(1, 4) : m.sku.startsWith('HER') ? entre(2, 6) : entre(1, 3),
    usuario: 'L', doc: null, obs: m.detalle, motivo: m.motivo
  });
});

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const filas = eventos.map((e) =>
  `(${e.dia}, ${e.minuto}, ${q(e.sku)}, ${q(e.tipo)}, ${e.cantidad}, ${q(e.usuario)}, ${q(e.doc)}, ${q(e.obs)}, ${q(e.motivo)})`
);
const bloques = [];
for (let i = 0; i < filas.length; i += 400) {
  bloques.push(`INSERT INTO #Eventos (Dia, Minuto, Sku, Tipo, Cantidad, Usuario, Doc, Obs, Motivo) VALUES\n${filas.slice(i, i + 400).join(',\n')};`);
}

const ventasTotales = eventos.filter((e) => e.tipo === 'VENTA').length;
const plantilla = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'plantillaDatosDemo.sql'), 'utf8');
const sqlFinal = plantilla
  .replace('{{EVENTOS}}', bloques.join('\n\n'))
  .replace('{{RESUMEN}}', `${ventasTotales} ventas y ${MERMAS.length} mermas o ajustes en ${DIAS} días`);

fs.writeFileSync(salida, '﻿' + sqlFinal.replace(/\r?\n/g, '\r\n'));
console.log(`06_DATOS_DEMO.sql generado: ${ventasTotales} ventas y ${MERMAS.length} mermas o ajustes en ${DIAS} días.`);
