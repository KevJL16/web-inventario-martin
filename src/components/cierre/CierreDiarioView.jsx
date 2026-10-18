import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Download
} from 'lucide-react';

export const CierreDiarioView = () => {
  const { movements, products, closures, executeDailyClosure } = useInventory();
  const { currentUser, isGerencia } = useAuth();

  const [obs, setObs] = useState('');
  const [justClosed, setJustClosed] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMovements = movements.filter(m => m.fecha.startsWith(todayStr));

  const totalEntradas = todayMovements
    .filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo))
    .reduce((sum, m) => sum + m.cantidad, 0);

  const totalValorEntrada = todayMovements
    .filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo))
    .reduce((sum, m) => sum + m.total, 0);

  const totalSalidas = todayMovements
    .filter(m => m.tipo === 'SALIDA_VENTA')
    .reduce((sum, m) => sum + m.cantidad, 0);

  const totalValorSalida = todayMovements
    .filter(m => m.tipo === 'SALIDA_VENTA')
    .reduce((sum, m) => sum + m.total, 0);

  const totalMermas = todayMovements
    .filter(m => ['MERMA', 'AJUSTE_NEGATIVO'].includes(m.tipo))
    .reduce((sum, m) => sum + m.cantidad, 0);

  const activeProds = products.filter(p => p.activo);
  const stockFinalTotal = activeProds.reduce((sum, p) => sum + p.stockActual, 0);
  const valorizacionFinal = activeProds.reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);

  const isTodayAlreadyClosed = closures.some(c => c.fechaJornada === todayStr);

  const handleCloseDay = () => {
    if (window.confirm('¿Confirmas el cierre formal de la jornada del día de hoy? Se generará un certificado con firma digital inmutable.')) {
      const res = executeDailyClosure(obs);
      if (res.success) {
        setJustClosed(res.closure);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-19
            </span>
            <span className="text-xs text-slate-500 font-medium">Control de Fin de Jornada / Cuadre</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Consolidado y Cuadre de Cierre Diario de Movimientos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generación de acta de balance nocturno de entradas, salidas, mermas registradas y saldo físico final de tableros y planchas.
          </p>
        </div>

        <div>
          {isTodayAlreadyClosed ? (
            <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-300">
              <Lock className="w-4 h-4" /> Jornada de Hoy Cerrada
            </span>
          ) : !isGerencia ? (
            <button
              onClick={handleCloseDay}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-amber-400" /> Ejecutar Cierre de Jornada (RF-19)
            </button>
          ) : null}
        </div>
      </div>

      {/* Balance de la Jornada Actual */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Balance de Movimientos de Hoy: {todayStr}
            </h2>
            <p className="text-xs text-slate-500">
              Transacciones auditadas durante el turno: <span className="font-bold text-slate-800">{todayMovements.length}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isTodayAlreadyClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
          }`}>
            {isTodayAlreadyClosed ? 'CERRADO Y CERTIFICADO' : 'JORNADA EN CURSO'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Entradas por Compra
            </span>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              +{totalEntradas} <span className="text-xs font-medium text-emerald-800">unid.</span>
            </p>
            <p className="text-xs text-emerald-700 font-mono font-semibold mt-0.5">
              S/ {totalValorEntrada.toFixed(2)}
            </p>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Salidas por Venta
            </span>
            <p className="text-2xl font-black text-rose-950 mt-1">
              -{totalSalidas} <span className="text-xs font-medium text-rose-800">unid.</span>
            </p>
            <p className="text-xs text-rose-700 font-mono font-semibold mt-0.5">
              S/ {totalValorSalida.toFixed(2)}
            </p>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Mermas y Ajustes
            </span>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {totalMermas} <span className="text-xs font-medium text-amber-900">unid.</span>
            </p>
            <p className="text-xs text-amber-800 mt-0.5">Justificadas en RF-20</p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Stock Físico Final</span>
            <p className="text-2xl font-black text-white mt-1">
              {stockFinalTotal} <span className="text-xs font-medium text-slate-300">unid.</span>
            </p>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              S/ {valorizacionFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>

        </div>

        {!isTodayAlreadyClosed && !isGerencia && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Observaciones de Cierre / Novedades del Turno:
            </label>
            <textarea
              rows={2}
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Indique estado de patio, recepciones extraordinarias o novedades..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* Historial de Cierres Diarios Pasados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Libro de Cierres de Turno y Jornadas Auditoradas
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha Jornada</th>
                <th className="py-3 px-3">Responsable Cierre</th>
                <th className="py-3 px-3 text-center">Transacciones</th>
                <th className="py-3 px-3 text-right">Entradas (S/)</th>
                <th className="py-3 px-3 text-right">Salidas (S/)</th>
                <th className="py-3 px-3 text-right">Valor Final Stock</th>
                <th className="py-3 px-4">Certificado y Firma Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aún no se han ejecutado cierres de jornada guardados. Presione el botón "Ejecutar Cierre de Jornada" arriba para simularlo.
                  </td>
                </tr>
              ) : (
                closures.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {c.fechaJornada}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {c.responsable}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {c.totalTransacciones} mov.
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                      S/ {c.totalValorEntrada.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-700 font-semibold">
                      S/ {c.totalValorSalida.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      S/ {c.valorizacionFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[10px] text-slate-500 truncate max-w-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{c.firmaDigital}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
