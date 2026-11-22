import React, { useMemo, useState } from 'react';
import { PieChart as PieIcon } from 'lucide-react';

// Paleta categórica validada (daltonismo y visión normal). Tres tonos tienen poco
// contraste con el fondo blanco, por eso la leyenda siempre muestra nombre y cifras.
const COLORES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const COLOR_OTROS = '#a8a7a1';
const MAX_PORCIONES = COLORES.length;

const formatoSoles = (n) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatoUnidades = (n) => `${n.toLocaleString('es-PE')} unid.`;

/**
 * Agrupa las ventas por producto y devuelve las porciones del gráfico:
 * los 5 productos con más ventas y el resto agrupado en "Otros productos".
 * metrica: 'unidades' (cantidad vendida) o 'soles' (importe de la venta).
 */
export function agruparVentasPorProducto(ventas, metrica = 'unidades') {
  const porProducto = new Map();
  for (const v of ventas) {
    if (v.tipo !== 'SALIDA_VENTA') continue;
    const clave = v.productoId ?? v.sku ?? v.productoNombre;
    const actual = porProducto.get(clave) || { clave, nombre: v.productoNombre || v.sku || 'Producto', unidades: 0, soles: 0 };
    actual.unidades += Number(v.cantidad) || 0;
    actual.soles += Number(v.total) || 0;
    porProducto.set(clave, actual);
  }

  const ordenados = [...porProducto.values()]
    .filter((p) => p[metrica] > 0)
    .sort((a, b) => b[metrica] - a[metrica] || a.nombre.localeCompare(b.nombre, 'es'));

  const principales = ordenados.slice(0, MAX_PORCIONES).map((p, i) => ({ ...p, color: COLORES[i] }));
  const resto = ordenados.slice(MAX_PORCIONES);
  if (resto.length > 0) {
    principales.push({
      clave: '__otros__',
      nombre: `Otros productos (${resto.length})`,
      unidades: resto.reduce((s, p) => s + p.unidades, 0),
      soles: resto.reduce((s, p) => s + p.soles, 0),
      color: COLOR_OTROS
    });
  }

  const total = principales.reduce((s, p) => s + p[metrica], 0);
  return { porciones: principales.map((p) => ({ ...p, porcentaje: total > 0 ? (p[metrica] / total) * 100 : 0 })), total };
}

// Trazo SVG de una porción del pastel entre dos ángulos (radianes, 0 = arriba)
function trazoPorcion(cx, cy, r, inicio, fin) {
  const punto = (a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x1, y1] = punto(inicio);
  const [x2, y2] = punto(fin);
  const arcoLargo = fin - inicio > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${arcoLargo} 1 ${x2} ${y2} Z`;
}

export const VentasPieChart = ({ ventas, periodoLabel }) => {
  const [metrica, setMetrica] = useState('unidades');
  const [activa, setActiva] = useState(null);

  const { porciones, total } = useMemo(() => agruparVentasPorProducto(ventas, metrica), [ventas, metrica]);
  const formato = metrica === 'soles' ? formatoSoles : formatoUnidades;
  const lider = porciones.find((p) => p.clave !== '__otros__');

  const SIZE = 180;
  const C = SIZE / 2;
  const R = SIZE / 2 - 4;
  let angulo = 0;
  const trazos = porciones.map((p) => {
    const inicio = angulo;
    const fin = angulo + (p.porcentaje / 100) * Math.PI * 2;
    angulo = fin;
    return { ...p, d: trazoPorcion(C, C, R, inicio, fin) };
  });

  const detalle = activa !== null ? porciones[activa] : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
        <h2 className="text-base font-bold text-slate-900">Productos más vendidos</h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono whitespace-nowrap">
          {periodoLabel}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">Participación de cada producto en las ventas del período</p>

      {/* Unidades vendidas o importe en soles */}
      <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4" role="group" aria-label="Medir las ventas por">
        {[
          { id: 'unidades', label: 'Unidades' },
          { id: 'soles', label: 'Soles (S/)' }
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={metrica === m.id}
            onClick={() => { setMetrica(m.id); setActiva(null); }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              metrica === m.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {porciones.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          <PieIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" aria-hidden="true" />
          <p className="text-xs font-semibold">No hay ventas en el período seleccionado ({periodoLabel}).</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={`Gráfico de pastel. El producto más vendido es ${lider?.nombre} con ${formato(lider?.[metrica] || 0)}, el ${Math.round(lider?.porcentaje || 0)} % del total.`}
              onMouseLeave={() => setActiva(null)}
            >
              {porciones.length === 1 ? (
                <circle cx={C} cy={C} r={R} fill={porciones[0].color} />
              ) : (
                trazos.map((t, i) => (
                  <path
                    key={t.clave}
                    d={t.d}
                    fill={t.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    opacity={activa === null || activa === i ? 1 : 0.35}
                    onMouseEnter={() => setActiva(i)}
                    style={{ transition: 'opacity 150ms' }}
                  >
                    <title>{`${t.nombre}: ${formato(t[metrica])} (${t.porcentaje.toFixed(1)} %)`}</title>
                  </path>
                ))
              )}
            </svg>
          </div>

          {/* Detalle de la porción señalada (o el total) */}
          <p className="text-center text-xs text-slate-600 mt-3 min-h-[2rem]" aria-live="polite">
            {detalle ? (
              <>
                <span className="font-bold text-slate-900">{detalle.nombre}</span>
                <br />
                {formato(detalle[metrica])} · {detalle.porcentaje.toFixed(1)} %
              </>
            ) : (
              <>
                Total vendido: <span className="font-bold text-slate-900">{formato(total)}</span>
              </>
            )}
          </p>

          {/* Leyenda con cifras: identifica cada porción sin depender del color */}
          <ul className="mt-3 space-y-1.5">
            {porciones.map((p, i) => (
              <li
                key={p.clave}
                tabIndex={0}
                onMouseEnter={() => setActiva(i)}
                onMouseLeave={() => setActiva(null)}
                onFocus={() => setActiva(i)}
                onBlur={() => setActiva(null)}
                className={`flex items-start gap-2 text-xs rounded-lg px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-martin-green-500 ${
                  activa === i ? 'bg-slate-50' : ''
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: p.color }} aria-hidden="true" />
                {/* Nombre completo arriba y cifras debajo: en columnas angostas no se corta el nombre */}
                <span className="flex-1 min-w-0">
                  <span className="block text-slate-700 leading-snug">{p.nombre}</span>
                  <span className="block font-mono text-[11px] text-slate-500">
                    <span className="font-bold text-slate-900">{formato(p[metrica])}</span> · {p.porcentaje.toFixed(1)} %
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
