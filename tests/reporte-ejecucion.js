// ============================================================================
// REPORTE DE EJECUCIÓN (equivalente a Testomat.io) - HU-004
// Reúne la última evidencia de cada suite (unitarias, API, Selenium, axe-core y
// Lighthouse) en un único HTML. Solo lee archivos de pruebas/evidencias: no
// ejecuta pruebas ni escribe resultados a mano.
// Ejecución: npm run reporte   ->  pruebas/reporte/reporte-ejecucion.html
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

const EV = path.resolve('pruebas', 'evidencias');
const OUT = path.resolve('pruebas', 'reporte');

// Último archivo (por nombre con fecha) que cumpla el patrón dentro de las carpetas indicadas
function ultimo(carpetas, patron) {
  const hallados = [];
  for (const c of carpetas) {
    const dir = path.join(EV, c);
    if (!fs.existsSync(dir)) continue;
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = entrada.isDirectory() ? path.join(c, entrada.name, 'resultado.json') : path.join(c, entrada.name);
      if (patron.test(ruta.replace(/\\/g, '/')) && fs.existsSync(path.join(EV, ruta))) hallados.push(ruta);
    }
  }
  hallados.sort((a, b) => path.basename(path.dirname(a)).concat(path.basename(a)).localeCompare(path.basename(path.dirname(b)).concat(path.basename(b))));
  const elegido = hallados.at(-1);
  return elegido ? { ruta: elegido.replace(/\\/g, '/'), datos: JSON.parse(fs.readFileSync(path.join(EV, elegido), 'utf8')) } : null;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const suites = [];

// Unitarias: la salida de texto de Vitest con cobertura
const vitestTxt = ['pc12/vitest-cobertura.txt', 'pc11/linea-base-vitest-cobertura.txt'].find((f) => fs.existsSync(path.join(EV, f)));
if (vitestTxt) {
  const txt = fs.readFileSync(path.join(EV, vitestTxt), 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const casos = [...txt.matchAll(/✓ tests\/unit\/(\S+) \((\d+) tests?\)/g)].map((m) => ({ id: m[1], titulo: `${m[2]} pruebas`, estado: 'APROBADO', detalle: '' }));
  const total = txt.match(/Tests\s+(\d+) passed/);
  const cob = txt.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
  suites.push({ nombre: 'Unitarias (Vitest)', evidencia: vitestTxt, casos,
    resumen: `${total?.[1] ?? '?'} pruebas aprobadas · cobertura líneas ${cob?.[4]} %, ramas ${cob?.[2]} %, funciones ${cob?.[3]} %` });
}

const api = ultimo(['pc12', 'pc10'], /api-.*\.json$/);
if (api) suites.push({ nombre: 'API (/api/ajustes)', evidencia: api.ruta, casos: api.datos.casos.map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado, detalle: c.obtenido })) });

const e2e = ultimo(['pc13', 'pc12', 'pc08'], /^pc\d+\/\d{4}-.*\/resultado\.json$/);
if (e2e) suites.push({ nombre: 'Funcionales (Selenium + Edge)', evidencia: e2e.ruta, casos: e2e.datos.casos });

const axe = ultimo(['pc13'], /axe-.*\/resultado\.json$/);
if (axe) suites.push({ nombre: 'Accesibilidad (axe-core + teclado)', evidencia: axe.ruta, casos: axe.datos.casos });

// Lighthouse guarda resumen.json (no resultado.json): se busca la última carpeta lighthouse-*
{
  const dir = path.join(EV, 'pc13');
  const carpetas = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => d.startsWith('lighthouse-')).sort() : [];
  const ult = carpetas.at(-1);
  if (ult) {
    const datos = JSON.parse(fs.readFileSync(path.join(dir, ult, 'resumen.json'), 'utf8'));
    suites.push({ nombre: `Lighthouse ${datos.lighthouse}`, evidencia: `pc13/${ult}/informe-lighthouse.html`,
      casos: datos.pasos.map((p) => ({ id: p.modo === 'navigation' ? 'Navegación' : 'Instantánea', titulo: p.paso,
        estado: p.accesibilidad === 100 && p.buenasPracticas >= 90 ? 'APROBADO' : 'FALLIDO', detalle: `Accesibilidad ${p.accesibilidad} · Buenas prácticas ${p.buenasPracticas}` })) });
  }
}

const total = suites.reduce((n, s) => n + s.casos.length, 0);
const ok = suites.reduce((n, s) => n + s.casos.filter((c) => c.estado === 'APROBADO').length, 0);
const filas = (s) => s.casos.map((c) => `<tr class="${c.estado === 'APROBADO' ? 'ok' : 'ko'}"><td>${esc(c.id)}</td><td>${esc(c.titulo)}</td><td>${c.estado === 'APROBADO' ? '✔ Aprobado' : '✘ Fallido'}</td><td>${esc(c.detalle)}</td></tr>`).join('');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte de ejecución HU-004</title>
<style>
body{font:14px/1.5 system-ui,Segoe UI,Arial,sans-serif;margin:24px;color:#0f172a;background:#fff}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 6px}p.sub{color:#475569;margin:0 0 16px}
.kpi{display:flex;gap:12px;flex-wrap:wrap}.kpi div{border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;min-width:140px}
.kpi b{display:block;font-size:22px}table{border-collapse:collapse;width:100%;margin-top:6px}
th,td{border:1px solid #cbd5e1;padding:5px 8px;text-align:left;vertical-align:top;font-size:13px}th{background:#1e293b;color:#fff}
tr.ok td:nth-child(3){color:#166534;font-weight:600}tr.ko td:nth-child(3){color:#b91c1c;font-weight:600}
small{color:#475569}code{font-size:12px}
</style></head><body>
<h1>Reporte de ejecución – HU-004 Registro de mermas justificadas</h1>
<p class="sub">Representaciones Martín S.A.C. · Generado ${esc(new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }))} desde <code>pruebas/evidencias</code> (última evidencia de cada suite).</p>
<div class="kpi"><div><b>${suites.length}</b>suites</div><div><b>${total}</b>casos / archivos</div><div><b>${ok}</b>aprobados</div><div><b>${total - ok}</b>fallidos</div><div><b>${total ? ((ok / total) * 100).toFixed(1) : 0} %</b>aprobación</div></div>
${suites.map((s) => `<h2>${esc(s.nombre)}</h2><small>Evidencia: <code>pruebas/evidencias/${esc(s.evidencia)}</code>${s.resumen ? ` · ${esc(s.resumen)}` : ''}</small>
<table><thead><tr><th>ID</th><th>Caso</th><th>Estado</th><th>Resultado obtenido</th></tr></thead><tbody>${filas(s)}</tbody></table>`).join('\n')}
</body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'reporte-ejecucion.html');
fs.writeFileSync(file, html);
console.log(`📊 ${path.relative(process.cwd(), file)} — ${suites.length} suites, ${ok}/${total} aprobados`);
for (const s of suites) console.log(`   ${s.nombre}: ${s.casos.filter((c) => c.estado === 'APROBADO').length}/${s.casos.length} (${s.evidencia})`);
