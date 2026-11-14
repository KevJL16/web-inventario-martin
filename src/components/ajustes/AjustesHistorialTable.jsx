import React from 'react';
import { TIPO_BADGE_CLASSES } from './ajustesConfig';

const SIN_DATO = '—';

const formatearFecha = (fecha) =>
  fecha
    ? `${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
    : SIN_DATO;

const formatearSoles = (monto) => (monto == null ? SIN_DATO : `S/ ${monto.toFixed(2)}`);

/**
 * Historial de ajustes y mermas. Recibe filas ya normalizadas con toHistoryRow
 * (src/models/AdjustmentModel.js); los datos faltantes se muestran como "—".
 */
export const AjustesHistorialTable = ({ rows }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[750px]">
        <caption className="sr-only">Historial de ajustes de inventario y mermas registradas</caption>
        <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
          <tr>
            <th scope="col" className="py-3 px-4">Folio Ajuste</th>
            <th scope="col" className="py-3 px-3">Fecha</th>
            <th scope="col" className="py-3 px-3">Artículo / SKU</th>
            <th scope="col" className="py-3 px-3 text-center">Tipo Ajuste</th>
            <th scope="col" className="py-3 px-3 text-center">Cant. Ajustada</th>
            <th scope="col" className="py-3 px-3 text-right">Impacto Costo</th>
            <th scope="col" className="py-3 px-4">Motivo y Justificación Técnica</th>
            <th scope="col" className="py-3 px-4">Responsable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">
                No se han registrado actas de ajuste o mermas con estos criterios.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id ?? index} data-testid="fila-ajuste" className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.folio ?? SIN_DATO}</td>
                <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{formatearFecha(row.fecha)}</td>
                <td className="py-3 px-3">
                  <p className="font-bold text-slate-900">{row.producto ?? 'Producto sin nombre'}</p>
                  <p className="text-[10px] font-mono text-slate-500 font-bold">{row.sku ?? SIN_DATO}</p>
                </td>
                <td className="py-3 px-3 text-center">
                  {row.tipo ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${TIPO_BADGE_CLASSES[row.tipo] || 'bg-slate-100 text-slate-700'}`}>
                      {row.tipo.replace(/_/g, ' ')}
                    </span>
                  ) : SIN_DATO}
                </td>
                <td className="py-3 px-3 text-center font-bold font-mono">
                  {row.cantidad == null ? SIN_DATO : `${row.cantidad} unid.`}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatearSoles(row.impacto)}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-800">{row.motivo ?? 'Sin motivo'}</p>
                  {row.detalle && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">"{row.detalle}"</p>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{row.responsable ?? SIN_DATO}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
