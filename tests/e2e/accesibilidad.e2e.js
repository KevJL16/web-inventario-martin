// ============================================================================
// PRUEBAS DE ACCESIBILIDAD (PC 13) - HU-004 con axe-core dentro de Selenium
// Analiza cada pantalla del flujo de ajustes con las reglas WCAG 2.1 A/AA de
// axe-core y comprueba que el formulario se pueda usar solo con el teclado.
//
// Requisitos: los mismos que npm run test:e2e (base de pruebas, API y web).
// Ejecución:  npm run test:a11y          (HEADLESS=0 para ver el navegador)
// Evidencias: pruebas/evidencias/pc13/axe-<fecha-hora>/ (capturas y resultado.json)
// Un caso se aprueba solo si axe no reporta ninguna infracción.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, Key, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import AxeBuilder from '@axe-core/webdriverjs';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.TEST_USER_PASSWORD;
const TIMEOUT = 20000;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run test:a11y (lee server/.env.pruebas).');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.resolve('pruebas', 'evidencias', process.env.EVIDENCIA_PC || 'pc13', `axe-${stamp}`);
fs.mkdirSync(outDir, { recursive: true });

const resultados = [];
let paso = 0;
const byTestId = (id) => By.css(`[data-testid="${id}"]`);

async function captura(driver, nombre) {
  paso++;
  const file = `${String(paso).padStart(2, '0')}-${nombre}.png`;
  fs.writeFileSync(path.join(outDir, file), await driver.takeScreenshot(), 'base64');
  return file;
}

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

// Ejecuta axe-core en la página actual y resume las infracciones encontradas
async function analizar(driver) {
  // Esperar a que terminen las animaciones de entrada (fade-in): a mitad de la
  // transición la opacidad baja y axe reporta falsos problemas de contraste
  await driver.wait(() => driver.executeScript(
    "return document.getAnimations().every((a) => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity)"
  ), TIMEOUT, 'Las animaciones no terminaron');
  const r = await new AxeBuilder(driver).withTags(WCAG_TAGS).analyze();
  return {
    reglasEvaluadas: r.passes.length + r.violations.length + r.incomplete.length,
    aprobadas: r.passes.length,
    revisionManual: r.incomplete.map((v) => v.id),
    infracciones: r.violations.map((v) => ({
      regla: v.id,
      impacto: v.impact,
      wcag: v.tags.filter((t) => /^wcag\d/.test(t)),
      descripcion: v.help,
      elementos: v.nodes.length,
      nodos: v.nodes.map((n) => ({ selector: n.target.join(' '), mensaje: (n.any[0] || n.all[0] || n.none[0])?.message }))
    }))
  };
}

async function casoAxe(id, titulo, driver, nombreCaptura) {
  const inicio = Date.now();
  try {
    const axe = await analizar(driver);
    const evidencias = [await captura(driver, nombreCaptura)];
    const ok = axe.infracciones.length === 0;
    const detalle = ok
      ? `0 infracciones; ${axe.aprobadas} reglas aprobadas`
      : axe.infracciones.map((v) => `${v.regla} (${v.impacto}, ${v.elementos} elem.)`).join('; ');
    resultados.push({ id, titulo, tipo: 'axe-core', estado: ok ? 'APROBADO' : 'FALLIDO', detalle, axe, evidencias, ms: Date.now() - inicio });
    console.log(`${ok ? '✅' : '❌'} ${id} ${titulo} — ${detalle}`);
  } catch (err) {
    resultados.push({ id, titulo, tipo: 'axe-core', estado: 'FALLIDO', detalle: err.message, ms: Date.now() - inicio });
    console.log(`❌ ${id} ${titulo} — ${err.message}`);
  }
}

async function caso(id, titulo, fn) {
  const inicio = Date.now();
  const evidencias = [];
  try {
    const detalle = await fn(evidencias);
    resultados.push({ id, titulo, tipo: 'teclado', estado: 'APROBADO', detalle, evidencias, ms: Date.now() - inicio });
    console.log(`✅ ${id} ${titulo} — ${detalle}`);
  } catch (err) {
    resultados.push({ id, titulo, tipo: 'teclado', estado: 'FALLIDO', detalle: err.message, evidencias, ms: Date.now() - inicio });
    console.log(`❌ ${id} ${titulo} — ${err.message}`);
  }
}

async function iniciarSesion(driver, correo) {
  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
  await driver.findElement(By.css('input[type="email"]')).sendKeys(correo);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(PASSWORD);
  await driver.findElement(By.css('form button[type="submit"]')).click();
  const menu = await driver.wait(until.elementLocated(By.xpath('//aside//button[contains(normalize-space(.), "Ajustes y Mermas")]')), TIMEOUT);
  await menu.click();
  await driver.wait(async () => {
    const filas = await driver.findElements(byTestId('fila-ajuste'));
    return filas.length > 0 && /AJU-\d{4}-\d{5}/.test(await filas[0].getText());
  }, TIMEOUT, 'El historial de ajustes no se cargó');
}

async function cerrarSesion(driver) {
  await driver.findElement(By.css('button[title^="Cerrar Sesión"]')).click();
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
}

// Identifica el elemento con el foco: id, data-testid o texto del botón
const foco = (driver) => driver.executeScript(`
  const el = document.activeElement;
  return el.id || el.dataset.testid || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.tagName;
`);

const options = new edge.Options().addArguments('--window-size=1400,1000', '--lang=es-PE');
if (process.env.HEADLESS !== '0') options.addArguments('--headless=new');

const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();
const capabilities = await driver.getCapabilities();
console.log(`♿ HU-004 accesibilidad (axe-core, ${WCAG_TAGS.join(', ')}) en ${BASE_URL} con ${capabilities.getBrowserName()} ${capabilities.getBrowserVersion()}`);

try {
  // ACC-01: pantalla de inicio de sesión
  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
  await casoAxe('ACC-01', 'Pantalla de inicio de sesión', driver, 'login');

  // ACC-02: módulo Ajustes y Mermas con el historial cargado (Encargado de Almacén)
  await iniciarSesion(driver, 'almacen@rep-martin.com');
  await casoAxe('ACC-02', 'Módulo Ajustes y Mermas con historial (Almacén)', driver, 'modulo-ajustes');

  // ACC-03: formulario modal abierto
  await driver.findElement(byTestId('btn-registrar-ajuste')).click();
  await driver.wait(until.elementLocated(byTestId('ajuste-detalle')), TIMEOUT);
  await casoAxe('ACC-03', 'Formulario de acta de ajuste abierto', driver, 'formulario');

  // ACC-04: el error de validación se anuncia (role=alert) y la pantalla sigue siendo accesible
  await driver.findElement(byTestId('ajuste-cantidad')).sendKeys('1');
  await driver.findElement(byTestId('ajuste-detalle')).sendKeys('roto');
  await driver.findElement(byTestId('btn-asentar-ajuste')).click();
  const alerta = await driver.wait(until.elementLocated(byTestId('ajuste-error')), TIMEOUT);
  assert((await alerta.getAttribute('role')) === 'alert', 'El mensaje de error no tiene role="alert"');
  await casoAxe('ACC-04', 'Formulario con error de validación anunciado', driver, 'formulario-error');

  // ACC-05: uso del formulario solo con teclado
  await caso('ACC-05', 'Formulario operable con teclado (foco, orden y Escape)', async (ev) => {
    await driver.findElement(By.xpath('//form//button[normalize-space(.)="Cancelar"]')).click();
    await driver.wait(async () => (await driver.findElements(byTestId('ajuste-detalle'))).length === 0, TIMEOUT);

    // Abrir con el teclado desde el botón de registro
    const boton = await driver.findElement(byTestId('btn-registrar-ajuste'));
    await driver.executeScript('arguments[0].focus()', boton);
    await boton.sendKeys(Key.ENTER);
    await driver.wait(until.elementLocated(byTestId('ajuste-detalle')), TIMEOUT);

    // 1. Al abrir, el foco debe entrar al diálogo (WCAG 2.4.3)
    const dentro = await driver.executeScript('return !!document.activeElement.closest(\'[role="dialog"]\')');
    assert(dentro, `Al abrir el formulario el foco queda fuera del diálogo (en "${await foco(driver)}")`);

    // 2. Orden de tabulación lógico dentro del diálogo
    const esperado = ['ajuste-producto', 'ajuste-tipo', 'ajuste-cantidad', 'ajuste-motivo', 'ajuste-detalle', 'Cancelar', 'btn-asentar-ajuste'];
    // Se enfoca por script: un clic abriría la lista del select y consumiría el primer Tab
    await driver.executeScript('arguments[0].focus()', await driver.findElement(byTestId('ajuste-producto')));
    const recorrido = [await foco(driver)];
    for (let i = 1; i < esperado.length; i++) {
      await driver.switchTo().activeElement().sendKeys(Key.TAB);
      recorrido.push(await foco(driver));
    }
    ev.push(await captura(driver, 'teclado-orden'));
    assert(recorrido.join('>') === esperado.join('>'), `Orden de tabulación: ${recorrido.join(' > ')}`);

    // 3. El foco no escapa del diálogo modal al seguir tabulando (WCAG 2.4.3 / 2.1.2)
    await driver.switchTo().activeElement().sendKeys(Key.TAB);
    const sigueDentro = await driver.executeScript('return !!document.activeElement.closest(\'[role="dialog"]\')');
    assert(sigueDentro, `Tras el último botón el foco sale del diálogo (a "${await foco(driver)}")`);

    // 4. Escape cierra el diálogo y devuelve el foco al botón que lo abrió
    await driver.switchTo().activeElement().sendKeys(Key.ESCAPE);
    await driver.wait(async () => (await driver.findElements(byTestId('ajuste-detalle'))).length === 0, 3000)
      .catch(() => { throw new Error('Escape no cierra el formulario'); });
    const devuelto = await foco(driver);
    assert(devuelto === 'btn-registrar-ajuste', `Al cerrar, el foco va a "${devuelto}" y no al botón de registro`);
    return `Foco inicial dentro del diálogo; orden ${recorrido.join(' > ')}; foco atrapado; Escape cierra y devuelve el foco`;
  });

  // ACC-06: vista de consulta de Gerencia (sin botón de registro)
  // Si ACC-05 falló con el diálogo abierto, se cierra antes de salir
  const abierto = await driver.findElements(By.xpath('//form//button[normalize-space(.)="Cancelar"]'));
  if (abierto.length) await abierto[0].click();
  await cerrarSesion(driver);
  await iniciarSesion(driver, 'gerencia@rep-martin.com');
  await casoAxe('ACC-06', 'Historial de ajustes en modo consulta (Gerencia)', driver, 'gerencia-consulta');
} finally {
  await driver.quit();
}

const resumen = {
  prueba: 'HU-004 Accesibilidad (axe-core + teclado)',
  url: BASE_URL,
  navegador: `${capabilities.getBrowserName()} ${capabilities.getBrowserVersion()}`,
  motor: 'axe-core 4.14 vía @axe-core/webdriverjs',
  reglas: WCAG_TAGS,
  fecha: new Date().toISOString(),
  aprobados: resultados.filter((r) => r.estado === 'APROBADO').length,
  fallidos: resultados.filter((r) => r.estado === 'FALLIDO').length,
  casos: resultados
};
fs.writeFileSync(path.join(outDir, 'resultado.json'), JSON.stringify(resumen, null, 2));
console.log(`📁 Evidencias: ${path.relative(process.cwd(), outDir)} — ${resumen.aprobados} aprobados, ${resumen.fallidos} fallidos`);
process.exit(resumen.fallidos ? 1 : 0);
