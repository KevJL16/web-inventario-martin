import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-martin-green-700 bg-martin-green-50 px-2.5 py-0.5 rounded-full border border-martin-green-200">
              Arqueo y Cierre Diario
            </span>
            <span className="text-xs text-slate-500 font-medium">Conciliación Nocturna de Almacén</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cierre Diario de Transacciones de Almacén
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidado obligatorio de compras recibidas, ventas despachadas, mermas del día y firma de conformidad.
          </p>
        </div>

        {!isTodayAlreadyClosed && !isGerencia && (
          <button
            onClick={handleCloseDay}
            className="px-5 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Lock className="w-4 h-4" /> Ejecutar Cierre de Jornada
          </button>
        )}
      </div>

      {/* Balance de la Jornada Actual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Entradas de Hoy</span>
          <p className="text-2xl font-black text-martin-green-700 mt-1">+{totalEntradas} unid.</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">S/ {totalValorEntrada.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Ventas / Salidas Hoy</span>
          <p className="text-2xl font-black text-martin-orange-600 mt-1">-{totalSalidas} unid.</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">S/ {totalValorSalida.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Mermas / Daños</span>
          <p className="text-2xl font-black text-red-600 mt-1">-{totalMermas} unid.</p>
          <p className="text-xs text-slate-500 mt-0.5">Reportadas en patio</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Saldo Final Almacén</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stockFinalTotal} unid.</p>
          <p className="text-xs text-martin-green-700 font-mono font-bold mt-0.5">S/ {valorizacionFinal.toFixed(2)}</p>
        </div>
      </div>

      {/* Observaciones de Cierre */}
      {!isTodayAlreadyClosed && !isGerencia && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Observaciones de Fin de Jornada (Conformidad de Conteo):
          </label>
          <textarea
            rows={2}
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Indicar novedades en estiba, camiones pendientes de descarga o precintos de seguridad..."
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none"
          />
        </div>
      )}

      {/* Historial de Cierres Diarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800 text-sm">
          Actas y Certificados de Cierre Archivados
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha Jornada</th>
                <th className="py-3 px-3">Responsable</th>
                <th className="py-3 px-3 text-center">Transacciones</th>
                <th className="py-3 px-3 text-center">Entradas</th>
                <th className="py-3 px-3 text-center">Salidas</th>
                <th className="py-3 px-3 text-right">Saldo Final Valorizado</th>
                <th className="py-3 px-4 font-mono">Firma Digital Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {closures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                    No se han registrado cierres diarios formales hasta el momento.
                  </td>
                </tr>
              ) : (
                closures.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 font-sans">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.fechaJornada}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{c.responsable}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{c.totalTransacciones}</td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono text-martin-green-700">+{c.totalEntradas}</td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono text-martin-orange-600">-{c.totalSalidas}</td>
                    <td className="py-3.5 px-3 text-right font-black font-mono text-slate-900">
                      S/ {c.valorizacionFinal.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 truncate max-w-xs">
                      {c.firmaDigital}
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
