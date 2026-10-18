import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const AuditoriaLogsView = () => {
  const { auditLogs } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === 'ALL' || log.modulo === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-22
            </span>
            <span className="text-xs text-slate-500 font-medium">Seguridad & Trazabilidad Forense</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bitácora de Auditoría de Acciones del Sistema (Event Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo inalterable de operaciones críticas, altas de catálogo, ajustes de stock, modificaciones de usuarios y cierres de jornada.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{auditLogs.length} Eventos Inmutables Registrados</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o detalle del log..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Módulo:
          </span>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">Todos los módulos</option>
            <option value="SEGURIDAD">Seguridad & Acceso</option>
            <option value="CATALOGO">Catálogo de Productos</option>
            <option value="INVENTARIO">Movimientos & Kardex</option>
            <option value="ALMACEN">Almacén & Mermas</option>
            <option value="ORDENES">Órdenes de Compra</option>
            <option value="CIERRE">Cierre Diario</option>
            <option value="ANALITICA">Analítica ABC</option>
          </select>
        </div>
      </div>

      {/* Tabla de Bitácora */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-sans">
              <tr>
                <th className="py-3.5 px-4">Fecha / Sello Tiempo</th>
                <th className="py-3.5 px-3">Colaborador / Rol</th>
                <th className="py-3.5 px-3">Módulo</th>
                <th className="py-3.5 px-3">Acción Registrada</th>
                <th className="py-3.5 px-4 font-sans">Detalle Descriptivo del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.fecha).toLocaleDateString('es-PE')} {new Date(log.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-3 font-sans">
                    <p className="font-bold text-slate-800">{log.usuario}</p>
                    <span className="text-[10px] text-amber-700 font-semibold">{log.rol}</span>
                  </td>
                  <td className="py-3.5 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.modulo}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    {log.accion}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-700 max-w-md">
                    {log.descripcion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
