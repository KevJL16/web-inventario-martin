// ============================================================================
// PRUEBA FUNCIONAL AUTOMATIZADA (PC 8) - HU-004 Registro de mermas justificadas
// Selenium WebDriver + Microsoft Edge
//
// Requisitos (ambiente de pruebas, ver README):
//   1. npm run db:pruebas:reset   (datos conocidos)
//   2. npm run server:pruebas     (API contra la base _Pruebas)
//   3. npm run dev                (web en http://localhost:3000)
// Ejecución:   npm run test:e2e         (HEADLESS=0 para ver el navegador)
// Evidencias:  pruebas/evidencias/pc08/<fecha-hora>/ (capturas y resultado.json)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const USER = 'almacen@rep-martin.com';
const PASSWORD = process.env.TEST_USER_PASSWORD;
const TIMEOUT = 20000;

// Datos de prueba (cargados por database/01_ESQUEMA_Y_DATOS.sql y 04_DATOS_PRUEBA.sql)
const DATOS = {
  merma: {
    sku: 'MEL-VES-ROB-18',
    tipo: 'MERMA_DANO',
    cantidad: 2,
    detalle: 'Prueba automatizada: esquina desportillada por montacargas en el rack A-P01-R01'
  },
  detalleCorto: 'roto',
  stockUno: { sku: 'HER-BIS-CAN-35', cantidad: 2 }
};

if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run test:e2e (lee server/.env.pruebas).');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.resolve('pruebas', 'evidencias', 'pc08', stamp);
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

async function caso(id, titulo, fn) {
  const inicio = Date.now();
  const evidencias = [];
  try {
    const detalle = await fn(evidencias);
    resultados.push({ id, titulo, estado: 'APROBADO', detalle, evidencias, ms: Date.now() - inicio });
    console.log(`✅ ${id} ${titulo} — ${detalle}`);
  } catch (err) {
    resultados.push({ id, titulo, estado: 'FALLIDO', detalle: err.message, evidencias, ms: Date.now() - inicio });
    console.log(`❌ ${id} ${titulo} — ${err.message}`);
  }
}

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

// Selecciona en el <select> de producto la opción cuyo texto empieza por [SKU] y devuelve su stock
async function seleccionarProducto(driver, sku) {
  const option = await driver.findElement(By.xpath(`//select[@data-testid="ajuste-producto"]/option[starts-with(normalize-space(.), "[${sku}]")]`));
  const texto = await option.getText();
  await option.click();
  const stock = Number((texto.match(/Stock actual: (\d+)/) || [])[1]);
  assert(Number.isInteger(stock), `No se pudo leer el stock de ${sku}`);
  return stock;
}

async function abrirFormulario(driver) {
  await driver.findElement(byTestId('btn-registrar-ajuste')).click();
  await driver.wait(until.elementLocated(byTestId('ajuste-detalle')), TIMEOUT);
}

async function cerrarFormulario(driver) {
  await driver.findElement(By.xpath('//form//button[normalize-space(.)="Cancelar"]')).click();
  await driver.wait(async () => (await driver.findElements(byTestId('ajuste-detalle'))).length === 0, TIMEOUT);
}

async function escribir(driver, testId, valor) {
  const el = await driver.findElement(byTestId(testId));
  await el.clear();
  await el.sendKeys(String(valor));
}

const options = new edge.Options().addArguments('--window-size=1400,1000', '--lang=es-PE');
if (process.env.HEADLESS !== '0') options.addArguments('--headless=new');

const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();
const capabilities = await driver.getCapabilities();
console.log(`🧪 HU-004 E2E en ${BASE_URL} con ${capabilities.getBrowserName()} ${capabilities.getBrowserVersion()}`);

try {
  await caso('CPF-01', 'Registrar una merma justificada (flujo principal)', async (ev) => {
    // 1. Iniciar sesión como Encargado de Almacén
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
    ev.push(await captura(driver, 'login'));
    await driver.findElement(By.css('input[type="email"]')).sendKeys(USER);
    await driver.findElement(By.css('input[type="password"]')).sendKeys(PASSWORD);
    await driver.findElement(By.css('form button[type="submit"]')).click();

    // 2. Abrir el módulo Ajustes y Mermas
    const menu = await driver.wait(until.elementLocated(By.xpath('//aside//button[contains(normalize-space(.), "Ajustes y Mermas")]')), TIMEOUT);
    await menu.click();
    await driver.wait(until.elementLocated(byTestId('btn-registrar-ajuste')), TIMEOUT);
    // Esperar a que el historial se cargue desde la base de datos (folios AJU-AAAA-NNNNN)
    await driver.wait(async () => {
      const filas = await driver.findElements(byTestId('fila-ajuste'));
      return filas.length > 0 && /AJU-\d{4}-\d{5}/.test(await filas[0].getText());
    }, TIMEOUT, 'El historial de ajustes no se cargó desde la base de datos');
    const filasAntes = (await driver.findElements(byTestId('fila-ajuste'))).length;
    ev.push(await captura(driver, 'modulo-ajustes'));

    // 3. Completar el acta de merma
    await abrirFormulario(driver);
    const stockAntes = await seleccionarProducto(driver, DATOS.merma.sku);
    await driver.findElement(By.css(`[data-testid="ajuste-tipo"] option[value="${DATOS.merma.tipo}"]`)).click();
    await escribir(driver, 'ajuste-cantidad', DATOS.merma.cantidad);
    await escribir(driver, 'ajuste-detalle', DATOS.merma.detalle);
    ev.push(await captura(driver, 'formulario-merma'));

    // 4. Registrar y verificar el resultado
    await driver.findElement(byTestId('btn-asentar-ajuste')).click();
    const exito = await driver.wait(until.elementLocated(byTestId('ajuste-exito')), TIMEOUT);
    const mensaje = await exito.getText();
    const stockEsperado = stockAntes - DATOS.merma.cantidad;
    assert(/AJU-\d{4}-\d{5}/.test(mensaje), `El mensaje no contiene un folio: "${mensaje}"`);
    assert(mensaje.includes(`${stockAntes} → ${stockEsperado}`), `Stock esperado ${stockAntes} → ${stockEsperado}; mensaje: "${mensaje}"`);

    await driver.wait(async () => (await driver.findElements(byTestId('fila-ajuste'))).length === filasAntes + 1, TIMEOUT, 'El historial no muestra el nuevo ajuste');
    const fila = await driver.findElement(byTestId('fila-ajuste')).getText();
    const folio = mensaje.match(/AJU-\d{4}-\d{5}/)[0];
    assert(fila.includes(folio) && fila.includes(DATOS.merma.sku), `La primera fila no corresponde al ajuste ${folio}: "${fila.slice(0, 120)}"`);
    ev.push(await captura(driver, 'merma-registrada'));
    return `${folio} registrado; stock ${stockAntes} → ${stockEsperado}; historial ${filasAntes} → ${filasAntes + 1} filas`;
  });

  await caso('CPF-02', 'Rechazar una justificación técnica demasiado corta', async (ev) => {
    await abrirFormulario(driver);
    await seleccionarProducto(driver, DATOS.merma.sku);
    await escribir(driver, 'ajuste-detalle', DATOS.detalleCorto);
    const filasAntes = (await driver.findElements(byTestId('fila-ajuste'))).length;
    await driver.findElement(byTestId('btn-asentar-ajuste')).click();
    const error = await driver.wait(until.elementLocated(byTestId('ajuste-error')), TIMEOUT);
    const texto = await error.getText();
    ev.push(await captura(driver, 'error-justificacion-corta'));
    assert(/al menos 10 caracteres/.test(texto), `Mensaje inesperado: "${texto}"`);
    await cerrarFormulario(driver);
    assert((await driver.findElements(byTestId('fila-ajuste'))).length === filasAntes, 'Se registró un ajuste que debía rechazarse');
    return `Mensaje mostrado: "${texto}"`;
  });

  await caso('CPF-03', 'Impedir descontar más que el stock disponible', async (ev) => {
    await abrirFormulario(driver);
    const stock = await seleccionarProducto(driver, DATOS.stockUno.sku);
    await escribir(driver, 'ajuste-cantidad', DATOS.stockUno.cantidad);
    await escribir(driver, 'ajuste-detalle', DATOS.merma.detalle);
    await driver.findElement(byTestId('btn-asentar-ajuste')).click();
    const error = await driver.wait(until.elementLocated(byTestId('ajuste-error')), TIMEOUT);
    const texto = await error.getText();
    ev.push(await captura(driver, 'error-stock-insuficiente'));
    assert(texto.includes(`No se puede descontar más del stock actual (${stock} unid.)`), `Mensaje inesperado: "${texto}"`);
    await cerrarFormulario(driver);
    return `Stock ${stock}, solicitado ${DATOS.stockUno.cantidad}: "${texto}"`;
  });
} finally {
  await driver.quit();
}

const resumen = {
  prueba: 'HU-004 Registro de mermas justificadas',
  herramienta: `Selenium WebDriver ${JSON.parse(fs.readFileSync('node_modules/selenium-webdriver/package.json', 'utf8')).version} + ${capabilities.getBrowserName()} ${capabilities.getBrowserVersion()}`,
  url: BASE_URL,
  usuario: USER,
  fecha: new Date().toISOString(),
  aprobados: resultados.filter((r) => r.estado === 'APROBADO').length,
  fallidos: resultados.filter((r) => r.estado === 'FALLIDO').length,
  casos: resultados
};
fs.writeFileSync(path.join(outDir, 'resultado.json'), JSON.stringify(resumen, null, 2));
console.log(`📁 Evidencias: ${path.relative(process.cwd(), outDir)} — ${resumen.aprobados} aprobados, ${resumen.fallidos} fallidos`);
process.exit(resumen.fallidos ? 1 : 0);
