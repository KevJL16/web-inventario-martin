import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  MapPin,
  Layers,
  Weight,
  AlertTriangle,
  Info,
  Package,
  Building,
  CheckCircle2
} from 'lucide-react';

export const AlmacenUbicacionesView = () => {
  const { locations, products } = useInventory();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Extraer zonas únicas
  const zones = ['ALL', 'ZONA-A', 'ZONA-B', 'ZONA-C', 'ZONA-D', 'ZONA-E'];

  const filteredLocations = selectedZone === 'ALL'
    ? locations
    : locations.filter(l => l.zona === selectedZone);

  // Obtener productos de una ubicación
  const getProductsInLocation = (locId) => {
    return products.filter(p => p.ubicacionId === locId && p.activo);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-12
            </span>
            <span className="text-xs text-slate-500 font-medium">Distribución Física y Carga</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Ubicación Exacta de Mercadería Pesada en Almacén
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión topográfica de almacén para tableros voluminosos de melamina (2.15x2.44m), planchas drywall y pisos por Zona, Pasillo, Rack y Nivel.
          </p>
        </div>

        {/* Selector de Zona */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-amber-600" /> Filtrar Zona:
          </span>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="text-xs font-bold bg-white text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
          >
            <option value="ALL">Todo el Almacén</option>
            <option value="ZONA-A">Zona A (Melaminas / Tableros)</option>
            <option value="ZONA-B">Zona B (Drywall / Yeso)</option>
            <option value="ZONA-C">Zona C (Pisos / Molduras)</option>
            <option value="ZONA-D">Zona D (Herrajes Industriales)</option>
            <option value="ZONA-E">Zona E (Muebles Kit RTA)</option>
          </select>
        </div>
      </div>

      {/* Grid del Almacén 2D - Representación Visual de Racks y Carga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map(loc => {
          const prodsInLoc = getProductsInLocation(loc.id);
          const totalWeightCalculated = prodsInLoc.reduce((sum, p) => sum + (p.stockActual * p.pesoUnitarioKg), 0);
          const totalUnits = prodsInLoc.reduce((sum, p) => sum + p.stockActual, 0);
          const percentLoad = Math.min(100, Math.round((totalWeightCalculated / loc.capacidadKg) * 100));

          const isOverloaded = percentLoad > 85;
          const isSelected = selectedLocation?.id === loc.id;

          return (
            <div
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header de la Ubicación */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {loc.zona}
                  </span>
                  <h3 className="text-base font-black text-slate-900 font-mono mt-1">
                    {loc.codigo}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{loc.tipo}</p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    Pasillo {loc.pasillo}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Rack {loc.rack} • Nivel {loc.nivel}
                  </p>
                </div>
              </div>

              {/* Indicador de Carga Estructural (Kg) */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-slate-400" /> Carga Estructural:
                  </span>
                  <span className={`font-bold font-mono ${isOverloaded ? 'text-red-600' : 'text-slate-700'}`}>
                    {totalWeightCalculated.toLocaleString()} / {loc.capacidadKg.toLocaleString()} kg ({percentLoad}%)
                  </span>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverloaded ? 'bg-red-500' : percentLoad > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentLoad}%` }}
                  />
                </div>
              </div>

              {/* Artículos Almacenados */}
              <div className="mt-3.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-700">{totalUnits}</span> unidades físicas
                </span>
                <span className="text-[11px] font-semibold text-amber-700 hover:underline">
                  Ver detalle →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer / Panel Inferior de Detalle de Ubicación Seleccionada */}
      {selectedLocation && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500 text-slate-950">
                  {selectedLocation.codigo}
                </span>
                <h2 className="text-lg font-bold text-white">Detalle de Mercadería en Estantería</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedLocation.descripcion}</p>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Cerrar Panel ✕
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Nombre del Producto</th>
                  <th className="py-2.5 px-3">Dimensiones / Espesor</th>
                  <th className="py-2.5 px-3 text-center">Stock en Rack</th>
                  <th className="py-2.5 px-3 text-right">Peso Unitario</th>
                  <th className="py-2.5 px-3 text-right">Peso Total Estiba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {getProductsInLocation(selectedLocation.id).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                      Actualmente no hay artículos asignados a esta posición de estantería.
                    </td>
                  </tr>
                ) : (
                  getProductsInLocation(selectedLocation.id).map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">{prod.sku}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{prod.nombre}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {prod.dimensiones} • {prod.espesorMm ? `${prod.espesorMm}mm` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                        {prod.stockActual} {prod.unidadMedida}s
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {prod.pesoUnitarioKg} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                        {(prod.stockActual * prod.pesoUnitarioKg).toLocaleString()} kg
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
