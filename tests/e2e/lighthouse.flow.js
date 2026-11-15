// ============================================================================
// LIGHTHOUSE (PC 13) - Flujo de usuario de HU-004 en Microsoft Edge
// Mide las categorías Accesibilidad y Buenas prácticas en cada paso del flujo:
//   1. Navegación: pantalla de inicio de sesión
//   2. Instantánea: módulo Ajustes y Mermas con el historial (Encargado de Almacén)
//   3. Instantánea: formulario de acta de ajuste abierto
//   4. Instantánea: formulario con error de validación
// No se mide Rendimiento: la web corre con el servidor de desarrollo de Vite,
// cuyos tiempos no representan la versión publicada.
//
// Requisitos: los mismos que npm run test:e2e (base de pruebas, API y web).
// Ejecución:  npm run test:lighthouse
// Evidencias: pruebas/evidencias/pc13/lighthouse-<fecha-hora>/ (informe HTML y resumen.json)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { startFlow } from 'lighthouse';
import { Builder } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.TEST_USER_PASSWORD;
const TIMEOUT = 20000;

if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run test:lighthouse (lee server/.env.pruebas).');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.resolve('pruebas', 'evidencias', process.env.EVIDENCIA_PC || 'pc13', `lighthouse-${stamp}`);
fs.mkdirSync(outDir, { recursive: true });

const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility', 'best-practices'],
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1400, height: 1000, deviceScaleFactor: 1, disabled: false },
    locale: 'es'
  }
};

// Edge se abre con msedgedriver (igual que las pruebas Selenium) y Lighthouse se conecta
// por DevTools: en este equipo Edge no arranca lanzado directamente por puppeteer
const options = new edge.Options().addArguments('--window-size=1400,1000', '--lang=es-PE');
if (process.env.HEADLESS !== '0') options.addArguments('--headless=new');
const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();
const debuggerAddress = (await driver.getCapabilities()).get('ms:edgeOptions').debuggerAddress;
const browser = await puppeteer.connect({ browserURL: 'http://' + debuggerAddress, defaultViewport: { width: 1400, height: 1000 } });
const page = (await browser.pages())[0] || await browser.newPage();
const version = await browser.version();
console.log(`💡 Lighthouse (flujo HU-004) en ${BASE_URL} con ${version}`);

const esperarHistorial = () => page.waitForFunction(() => {
  const fila = document.querySelector('[data-testid="fila-ajuste"]');
  return fila && /AJU-\d{4}-\d{5}/.test(fila.textContent);
}, { timeout: TIMEOUT });
const esperarAnimaciones = () => page.waitForFunction(
  () => document.getAnimations().every((a) => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity),
  { timeout: TIMEOUT }
);

try {
  const flow = await startFlow(page, { name: 'HU-004 Ajustes y mermas', config });

  // 1. Inicio de sesión (navegación completa)
  await flow.navigate(BASE_URL, { name: 'Inicio de sesión' });

  // 2. Módulo Ajustes y Mermas
  await page.type('input[type="email"]', 'almacen@rep-martin.com');
  await page.type('input[type="password"]', PASSWORD);
  await page.click('form button[type="submit"]');
  const menu = await page.waitForSelector('xpath/.//aside//button[contains(normalize-space(.), "Ajustes y Mermas")]', { timeout: TIMEOUT });
  await menu.click();
  await esperarHistorial();
  await esperarAnimaciones();
  await flow.snapshot({ name: 'Módulo Ajustes y Mermas' });

  // 3. Formulario abierto
  await page.click('[data-testid="btn-registrar-ajuste"]');
  await page.waitForSelector('[data-testid="ajuste-detalle"]', { timeout: TIMEOUT });
  await esperarAnimaciones();
  await flow.snapshot({ name: 'Formulario de acta abierto' });

  // 4. Error de validación (justificación demasiado corta)
  await page.type('[data-testid="ajuste-cantidad"]', '1');
  await page.type('[data-testid="ajuste-detalle"]', 'roto');
  await page.click('[data-testid="btn-asentar-ajuste"]');
  await page.waitForSelector('[data-testid="ajuste-error"]', { timeout: TIMEOUT });
  await esperarAnimaciones();
  await flow.snapshot({ name: 'Formulario con error de validación' });

  const flowResult = await flow.createFlowResult();
  fs.writeFileSync(path.join(outDir, 'informe-lighthouse.html'), await flow.generateReport());

  const pasos = flowResult.steps.map((s) => {
    const lhr = s.lhr;
    const puntaje = (id) => (lhr.categories[id]?.score == null ? null : Math.round(lhr.categories[id].score * 100));
    // Auditorías de accesibilidad con puntaje < 1 (las que bajan la nota)
    const fallidas = lhr.categories.accessibility.auditRefs
      .map((ref) => lhr.audits[ref.id])
      .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
      .map((a) => ({ id: a.id, titulo: a.title }));
    return {
      paso: s.name,
      modo: lhr.gatherMode,
      accesibilidad: puntaje('accessibility'),
      buenasPracticas: puntaje('best-practices'),
      auditoriasAccesibilidadFallidas: fallidas
    };
  });

  const resumen = {
    prueba: 'HU-004 Lighthouse (flujo de usuario)',
    url: BASE_URL,
    navegador: version,
    lighthouse: flowResult.steps[0].lhr.lighthouseVersion,
    fecha: new Date().toISOString(),
    pasos
  };
  fs.writeFileSync(path.join(outDir, 'resumen.json'), JSON.stringify(resumen, null, 2));
  for (const p of pasos) {
    const extra = p.auditoriasAccesibilidadFallidas.map((a) => a.id).join(', ');
    console.log(`${p.accesibilidad === 100 ? '✅' : '⚠️'} ${p.paso} (${p.modo}) — Accesibilidad ${p.accesibilidad}, Buenas prácticas ${p.buenasPracticas}${extra ? ` — revisar: ${extra}` : ''}`);
  }
  console.log(`📁 Evidencias: ${path.relative(process.cwd(), outDir)}`);
} finally {
  await browser.disconnect();
  await driver.quit();
}
