import React, { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { filterAdjustments, toHistoryRow } from '../models/AdjustmentModel';
import { AjusteFormModal } from '../components/ajustes/AjusteFormModal';
import { AjustesHistorialTable } from '../components/ajustes/AjustesHistorialTable';
import { Plus, CheckCircle2, Search } from 'lucide-react';

// HU-004: Registro y justificación técnica de mermas
export const AjustesStockView = () => {
  const { products, adjustments, registerAdjustment } = useInventory();
  const { isGerencia } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const rows = useMemo(
    () => filterAdjustments(adjustments, searchTerm).map(toHistoryRow),
    [adjustments, searchTerm]
  );

  const openModal = () => {
    setSuccessMessage('');
    setModalOpen(true);
  };

  const handleRegister = async (datos) => {
    const res = await registerAdjustment(datos);
    if (res.success) {
      setModalOpen(false);
      setSuccessMessage(res.message);
    }
    return res;
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-semibold">Conciliación Físico vs Sistema</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Ajustes Manuales, Mermas y Roturas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Corrección de discrepancias de existencias mediante justificación obligatoria con impacto contable inmediato.
          </p>
        </div>

        {!isGerencia && (
          <button
            onClick={openModal}
            data-testid="btn-registrar-ajuste"
            className="px-4 py-2.5 rounded-xl bg-martin-orange-700 hover:bg-martin-orange-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Registrar Ajuste o Merma
          </button>
        )}
      </div>

      {successMessage && (
        <div
          data-testid="ajuste-exito"
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            data-testid="buscar-ajuste"
            aria-label="Buscar ajustes por folio, producto o motivo"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° Folio, producto o motivo de merma..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      <AjustesHistorialTable rows={rows} />

      {modalOpen && (
        <AjusteFormModal
          products={products}
          onRegister={handleRegister}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
