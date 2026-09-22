import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-martin-green-700 bg-martin-green-50 px-2.5 py-0.5 rounded-full border border-martin-green-200">
              Bitácora de Auditoría
            </span>
            <span className="text-xs text-slate-500 font-medium">Trazabilidad Forense Inmutable</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bitácora de Auditoría y Eventos del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo forense de operaciones críticas: ventas, altas de catálogo, ajustes de existencias y accesos de colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-martin-green-50 text-martin-green-800 border border-martin-green-200 px-4 py-2 rounded-xl text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-martin-green-600" />
          <span>{auditLogs.length} Eventos Auditados</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o glosa de evento..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Módulo:
          </span>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none text-slate-700"
          >
            <option value="ALL">Todos los módulos ({auditLogs.length})</option>
            <option value="VENTAS">Ventas</option>
            <option value="INVENTARIO">Inventario / Movimientos</option>
            <option value="CATALOGO">Catálogo</option>
            <option value="ORDENES">Órdenes de Compra</option>
            <option value="CIERRE">Cierre Diario</option>
            <option value="SEGURIDAD">Seguridad / Usuarios</option>
            <option value="ANALITICA">Analítica ABC</option>
          </select>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-3">Módulo</th>
                <th className="py-3 px-3">Acción Registrada</th>
                <th className="py-3 px-4">Descripción del Suceso</th>
                <th className="py-3 px-4">Usuario Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No se encontraron eventos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.fecha).toLocaleDateString('es-PE')} {new Date(log.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-martin-green-700">
                      {log.accion}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {log.descripcion}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{log.usuario}</p>
                      <p className="text-[10px] text-martin-orange-700 font-bold">{log.rol}</p>
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
