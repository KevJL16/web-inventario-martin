import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { X, UserPlus, Key, Shield, CheckCircle2, Copy } from 'lucide-react';

export const UserModal = ({ isOpen, onClose }) => {
  const { roles, registerUser } = useAuth();
  const { logAction } = useInventory();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    rolId: '3' // Por defecto Almacén
  });

  const [createdResult, setCreatedResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.correo || !formData.telefono) {
      alert('Por favor complete todos los datos obligatorios.');
      return;
    }

    const res = registerUser(formData);
    if (res.success) {
      setCreatedResult(res);
      logAction('CREAR_USUARIO', 'SEGURIDAD', `Registro de nuevo usuario: ${res.user.nombres} ${res.user.apellidos} (${res.user.rolNombre})`);
    }
  };

  const handleClose = () => {
    setCreatedResult(null);
    setFormData({
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      direccion: '',
      rolId: '3'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-martin-green-500 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Registro de Nuevo Usuario</h3>
              <p className="text-xs text-slate-400">Generación automática de credenciales seguras</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {createdResult ? (
          /* Pantalla de Credenciales Generadas Automáticamente */
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-emerald-950">¡Usuario Creado Exitosamente!</h4>
              <p className="text-xs text-emerald-800 mt-1">
                Se han generado las credenciales iniciales de acceso para el nuevo colaborador.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans font-medium">Colaborador:</span>
                <span className="font-bold text-slate-900">{createdResult.user.nombres} {createdResult.user.apellidos}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans font-medium">Correo Corporativo:</span>
                <span className="font-bold text-slate-900">{createdResult.user.correo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans font-medium">Rol Asignado:</span>
                <span className="font-bold text-amber-700 font-sans">{createdResult.user.rolNombre}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-sans font-medium">Contraseña Temporal:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {createdResult.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Registro */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Ej. Luis Alberto"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={formData.apellidos}
                  onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Ej. Sánchez Morales"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Corporativo *</label>
              <input
                type="email"
                required
                value={formData.correo}
                onChange={e => setFormData({ ...formData, correo: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="colaborador@rep-martin.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Móvil *</label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="987 654 321"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rol Inicial (RBAC) *</label>
                <select
                  value={formData.rolId}
                  onChange={e => setFormData({ ...formData, rolId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Domiciliaria</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Av. Colonial 1230, Bellavista"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                El sistema generará una contraseña temporal aleatoria de alta seguridad que será mostrada al Administrador para su entrega al usuario.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-martin-green-500 hover:bg-martin-green-600 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Registrar Usuario
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
