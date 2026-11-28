// ============================================================================
// EJECUCIÓN DE LAS PRUEBAS PARA EL VIDEO
// Corre una tras otra las suites automatizadas con un encabezado grande antes
// de cada una, para grabarlas en la terminal. Selenium y axe se ven en Edge.
//
// Requisitos: npm run server:pruebas y npm run dev abiertos en otras terminales.
// Ejecución:  npm run demo:pruebas
// Opciones:   DEMO_LIGHTHOUSE=1  agrega el flujo de Lighthouse (tarda ~1 min)
//             DEMO_PAUSA=4000    milisegundos de pausa entre suites (por defecto 3000)
//             DEMO_MANUAL=1      cada suite empieza al pulsar Enter (para narrar a su ritmo)
// ============================================================================

import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const PAUSA = Number(process.env.DEMO_PAUSA || 3000);
const MANUAL = process.env.DEMO_MANUAL === '1';
const esperar = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const VERDE = '\x1b[32m'; const ROJO = '\x1b[31m'; const NARANJA = '\x1b[33m'; const NEGRITA = '\x1b[1m'; const FIN = '\x1b[0m';

const suites = [
  { nombre: 'Reinicio de la base de datos de pruebas', cmd: 'npm run db:pruebas:reset', detalle: 'Datos conocidos para que cada ejecución sea repetible' },
  { nombre: 'Pruebas unitarias (Vitest)', cmd: 'npm test', detalle: 'Reglas de la HU-004, modelos, permisos por rol y seguridad' },
  { nombre: 'Pruebas de API', cmd: 'npm run test:api', detalle: 'Peticiones reales a /api/ajustes contra la base de pruebas' },
  { nombre: 'Prueba funcional con Selenium WebDriver', cmd: 'npm run test:e2e', detalle: 'Edge recorre el flujo como un usuario real', env: { HEADLESS: '0' } },
  { nombre: 'Accesibilidad con axe-core', cmd: 'npm run test:a11y', detalle: 'Reglas WCAG 2.1 A y AA en cada pantalla de la HU-004', env: { HEADLESS: '0' } }
];
if (process.env.DEMO_LIGHTHOUSE === '1') {
  suites.push({ nombre: 'Flujo de usuario de Lighthouse', cmd: 'npm run test:lighthouse', detalle: 'Accesibilidad y buenas prácticas en 4 pasos' });
}

// En modo manual espera Enter; la interfaz se cierra antes de lanzar la suite
async function continuar(texto) {
  if (!MANUAL) return esperar(PAUSA);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await rl.question(texto);
  rl.close();
}

const resultados = [];
for (const [i, s] of suites.entries()) {
  console.log(`\n${NARANJA}${'═'.repeat(72)}${FIN}`);
  console.log(`${NEGRITA}  ${i + 1}/${suites.length}  ${s.nombre}${FIN}`);
  console.log(`  ${s.detalle}`);
  console.log(`  ${VERDE}> ${s.cmd}${FIN}`);
  console.log(`${NARANJA}${'═'.repeat(72)}${FIN}\n`);
  await continuar(`  ${NARANJA}Enter para ejecutar…${FIN}`);
  const inicio = Date.now();
  const r = spawnSync(s.cmd, { shell: true, stdio: 'inherit', env: { ...process.env, ...(s.env || {}) } });
  resultados.push({ ...s, ok: r.status === 0, seg: ((Date.now() - inicio) / 1000).toFixed(1) });
  esperar(PAUSA);
}

console.log(`\n${NEGRITA}Resumen de la ejecución${FIN}`);
for (const r of resultados) {
  console.log(`  ${r.ok ? `${VERDE}✔ APROBADA` : `${ROJO}✘ FALLIDA `}${FIN}  ${r.nombre.padEnd(44)} ${r.seg} s`);
}
const fallidas = resultados.filter((r) => !r.ok).length;
console.log(fallidas ? `\n${ROJO}${fallidas} suite(s) con fallos.${FIN}` : `\n${VERDE}${NEGRITA}Todas las suites aprobadas.${FIN}`);
process.exit(fallidas ? 1 : 0);
