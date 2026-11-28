// ============================================================================
// DEMO GUIADA PARA EL VIDEO - HU-004 Registro de mermas justificadas
// Recorre el caso de uso en Microsoft Edge (visible) a un ritmo cómodo para
// grabar la pantalla, con un letrero en cada paso. No guarda evidencias.
//
// Requisitos (ambiente de pruebas, ver README):
//   1. npm run db:pruebas:reset   (datos conocidos)
//   2. npm run server:pruebas     (API contra la base _Pruebas)
//   3. npm run dev                (web en http://localhost:3000)
// Ejecución:   npm run demo:video
// Ritmo:       DEMO_PAUSA=4000 npm run demo:video  (milisegundos entre pasos; por defecto 3000)
// Manual:      DEMO_MANUAL=1 npm run demo:video    (cada paso espera la tecla → o Av Pág en
//              Edge; sirve el control de presentaciones para narrar a su propio ritmo)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const USER = 'almacen@rep-martin.com';
const USER_GERENCIA = 'gerencia@rep-martin.com';
const PASSWORD = process.env.TEST_USER_PASSWORD;
const PAUSA = Number(process.env.DEMO_PAUSA || 3000);
const MANUAL = process.env.DEMO_MANUAL === '1';
const INICIO = Number(process.env.DEMO_INICIO || 6000); // margen para empezar a grabar
const TIMEOUT = 20000;
const SKU = 'MEL-VES-ROB-18';
const DETALLE = 'Plancha con la esquina desportillada al bajarla del rack A-P01-R01 con el montacargas; no se puede vender.';

if (!PASSWORD) {
  console.error('❌ Falta TEST_USER_PASSWORD. Ejecuta con: npm run demo:video (lee server/.env.pruebas).');
  process.exit(1);
}

const byTestId = (id) => By.css(`[data-testid="${id}"]`);
const esperar = (ms = PAUSA) => new Promise((r) => setTimeout(r, ms));
// DEMO_CAPTURAS=<carpeta> guarda una captura por paso (solo para revisar la demo)
let nFoto = 0;
async function foto(driver, nombre) {
  if (!process.env.DEMO_CAPTURAS) return;
  fs.mkdirSync(process.env.DEMO_CAPTURAS, { recursive: true });
  nFoto += 1;
  fs.writeFileSync(path.join(process.env.DEMO_CAPTURAS, `${String(nFoto).padStart(2, '0')}-${nombre}.png`), await driver.takeScreenshot(), 'base64');
}

// Final de cada paso: espera PAUSA o, en modo manual, la tecla → / Av Pág en Edge.
// Las teclas pulsadas mientras el script trabaja no cuentan.
async function pausa(driver, ms = PAUSA) {
  if (!MANUAL) return esperar(ms);
  const instalar = () => {
    if (!window.__demoTeclas) {
      window.__demoTeclas = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          e.stopPropagation();
          window.__demoAvanzar = true;
        }
      }, true);
    }
  };
  await driver.executeScript(`(${instalar})(); window.__demoAvanzar = false;`);
  // La página puede recargarse (cerrar sesión): se vuelve a instalar el escucha
  await driver.wait(() => driver.executeScript(`(${instalar})(); if (window.__demoAvanzar) { window.__demoAvanzar = false; return true; } return false;`), 0, undefined, 150);
}

// Letrero fijo en la parte inferior de la pantalla con el paso actual
async function letrero(driver, paso, titulo, detalle = '') {
  await driver.executeScript(([p, t, d]) => {
    let el = document.getElementById('demo-letrero');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-letrero';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;max-width:880px;width:calc(100% - 48px);background:rgba(15,23,42,.94);color:#fff;border-left:8px solid #00843D;border-radius:14px;padding:14px 22px;font-family:Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);pointer-events:none';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div style="font-size:13px;letter-spacing:3px;color:#FDBA74;font-weight:700">${p}</div><div style="font-size:24px;font-weight:700;margin-top:4px">${t}</div>${d ? `<div style="font-size:16px;color:#CBD5E1;margin-top:6px">${d}</div>` : ''}`;
  }, [paso, titulo, detalle]);
}

// Resalta un elemento con un borde naranja para dirigir la mirada
async function resaltar(driver, elemento) {
  await driver.executeScript((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.style.outline = '4px solid #E07A00';
    el.style.outlineOffset = '3px';
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 4000);
  }, elemento);
}

// Escribe como una persona, letra por letra
async function teclear(elemento, texto, ms = 35) {
  for (const letra of String(texto)) {
    await elemento.sendKeys(letra);
    await esperar(ms);
  }
}

async function iniciarSesion(driver, usuario) {
  const correo = await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
  await correo.clear();
  await teclear(correo, usuario, 45);
  const clave = await driver.findElement(By.css('input[type="password"]'));
  await clave.clear();
  await clave.sendKeys(PASSWORD);
  await esperar(800);
  await driver.findElement(By.css('form button[type="submit"]')).click();
}

async function abrirModulo(driver, nombre) {
  const boton = await driver.wait(until.elementLocated(By.xpath(`//aside//button[contains(normalize-space(.), "${nombre}")]`)), TIMEOUT);
  await resaltar(driver, boton);
  await esperar(1200);
  await boton.click();
}

async function seleccionarOpcion(driver, xpathSelect, textoInicial) {
  const opcion = await driver.findElement(By.xpath(`${xpathSelect}/option[starts-with(normalize-space(.), "${textoInicial}")]`));
  await opcion.click();
  return opcion.getText();
}

const options = new edge.Options().addArguments('--start-maximized', '--lang=es-PE');
const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();
let folio = null;

try {
  console.log(`🎬 Demo HU-004 en ${BASE_URL} (${MANUAL ? 'modo manual: en Edge pulsa → o Av Pág para pasar de paso' : `pausa ${PAUSA} ms`}).`);
  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
  if (!MANUAL && INICIO > 0) {
    console.log(`⏺  Tienes ${INICIO / 1000} s: haz clic en la ventana de Edge y empieza a grabar (Win+Alt+R).`);
    await esperar(INICIO);
  }
  await letrero(driver, 'DEMO · HU-004', 'Registro de mermas justificadas', 'Sistema de Control de Inventarios · Representaciones Martín · Equipo G04');
  await foto(driver, 'inicio');
  await pausa(driver, PAUSA + 2000);

  // 1. Inicio de sesión
  await letrero(driver, 'PASO 1 DE 7', 'Inicio de sesión como Encargado de Almacén', 'Cuenta de pruebas sobre la base de datos reiniciable');
  await esperar(1500);
  await iniciarSesion(driver, USER);
  await driver.wait(until.elementLocated(By.css('aside')), TIMEOUT);
  await pausa(driver);

  // 2. Módulo Ajustes y Mermas con el historial
  await letrero(driver, 'PASO 2 DE 7', 'Módulo Ajustes y Mermas', 'El historial muestra las actas registradas en SQL Server, cada una con su folio');
  await abrirModulo(driver, 'Ajustes y Mermas');
  await driver.wait(async () => {
    const filas = await driver.findElements(byTestId('fila-ajuste'));
    return filas.length > 0 && /AJU-\d{4}-\d{5}/.test(await filas[0].getText());
  }, TIMEOUT, 'El historial de ajustes no se cargó');
  await foto(driver, 'modulo');
  await pausa(driver);

  // 3. Acta con justificación demasiado corta: se rechaza
  await letrero(driver, 'PASO 3 DE 7', 'Validación: la justificación es obligatoria', 'Una justificación de menos de 10 caracteres se rechaza (CA-1)');
  const registrar = await driver.findElement(byTestId('btn-registrar-ajuste'));
  await resaltar(driver, registrar);
  await esperar(1200);
  await registrar.click();
  await driver.wait(until.elementLocated(byTestId('ajuste-detalle')), TIMEOUT);
  await esperar(1500);
  const textoProducto = await seleccionarOpcion(driver, '//select[@data-testid="ajuste-producto"]', `[${SKU}]`);
  const stockAntes = Number((textoProducto.match(/Stock actual: (\d+)/) || [])[1]);
  await esperar(1000);
  await driver.findElement(By.css('[data-testid="ajuste-tipo"] option[value="MERMA_DANO"]')).click();
  await esperar(800);
  const cantidad = await driver.findElement(byTestId('ajuste-cantidad'));
  await cantidad.clear();
  await teclear(cantidad, '2');
  const detalle = await driver.findElement(byTestId('ajuste-detalle'));
  await teclear(detalle, 'roto', 120);
  await esperar(1000);
  await driver.findElement(byTestId('btn-asentar-ajuste')).click();
  const error = await driver.wait(until.elementLocated(byTestId('ajuste-error')), TIMEOUT);
  await resaltar(driver, error);
  await esperar(700);
  await foto(driver, 'error');
  await pausa(driver, PAUSA + 1000);

  // 4. Acta correcta: se asienta con folio, stock y Kardex
  await letrero(driver, 'PASO 4 DE 7', 'Acta de merma justificada', 'La API valida rol, producto, cantidad y stock, y asienta ajuste, movimiento y Kardex en una transacción');
  await detalle.clear();
  await teclear(detalle, DETALLE, 25);
  await esperar(1200);
  await driver.findElement(byTestId('btn-asentar-ajuste')).click();
  const exito = await driver.wait(until.elementLocated(byTestId('ajuste-exito')), TIMEOUT);
  const mensaje = await exito.getText();
  folio = (mensaje.match(/AJU-\d{4}-\d{5}/) || [])[0];
  await resaltar(driver, exito);
  await letrero(driver, 'PASO 4 DE 7', `Folio ${folio || 'registrado'}: stock ${stockAntes} → ${stockAntes - 2}`, 'El acta queda en el historial y en la bitácora de auditoría (CA-2 y CA-5)');
  await foto(driver, 'exito');
  await esperar(MANUAL ? 2500 : PAUSA + 1500);
  const fila = await driver.findElement(byTestId('fila-ajuste'));
  await resaltar(driver, fila);
  await pausa(driver);

  // 5. Búsqueda del folio en el historial
  await letrero(driver, 'PASO 5 DE 7', 'Búsqueda del folio en el historial', 'Trazabilidad: quién, cuándo, cuánto y por qué');
  const buscar = await driver.findElement(byTestId('buscar-ajuste'));
  await resaltar(driver, buscar);
  await teclear(buscar, folio || 'AJU', 60);
  await pausa(driver, PAUSA + 500);
  await buscar.clear();
  await buscar.sendKeys(' ');
  await buscar.sendKeys('');
  await esperar(1000);

  // 6. Kardex del producto
  await letrero(driver, 'PASO 6 DE 7', 'Kardex del producto', 'La merma aparece como salida y el saldo coincide con el stock');
  await abrirModulo(driver, 'Entradas y Salidas');
  const xpathKardex = `//select[option[starts-with(normalize-space(.), "[${SKU}]")]]`;
  await driver.wait(until.elementLocated(By.xpath(xpathKardex)), TIMEOUT);
  await esperar(1000);
  await seleccionarOpcion(driver, xpathKardex, `[${SKU}]`);
  await esperar(1500);
  await foto(driver, 'kardex');
  await pausa(driver, PAUSA + 2000);

  // 7. Gerencia solo consulta
  await letrero(driver, 'PASO 7 DE 7', 'Gerencia solo consulta el historial', 'Permisos por rol: Gerencia no ve el botón para registrar ajustes (CA-4)');
  await driver.findElement(By.css('button[title^="Cerrar Sesión"]')).click();
  await esperar(1500);
  await iniciarSesion(driver, USER_GERENCIA);
  await abrirModulo(driver, 'Ajustes y Mermas');
  await driver.wait(async () => (await driver.findElements(byTestId('fila-ajuste'))).length > 0, TIMEOUT, 'Gerencia no ve el historial');
  const botones = (await driver.findElements(byTestId('btn-registrar-ajuste'))).length;
  await foto(driver, 'gerencia');
  await pausa(driver, PAUSA + 1500);

  await letrero(driver, 'FIN DE LA DEMO', 'HU-004 verificada en la aplicación', 'A continuación: las pruebas automatizadas (npm run demo:pruebas)');
  await pausa(driver, PAUSA + 2000);
  console.log(`✅ Demo terminada. Folio registrado: ${folio}; Gerencia ${botones === 0 ? 'sin' : 'CON'} botón de registro.`);
} catch (err) {
  console.error(`❌ La demo se detuvo: ${err.message}`);
  console.error('   Revisa que la API (npm run server:pruebas) y la web (npm run dev) estén abiertas y que la base esté reiniciada.');
  process.exitCode = 1;
} finally {
  await driver.quit();
}
