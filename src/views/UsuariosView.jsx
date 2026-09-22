import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { UserModal } from '../components/usuarios/UserModal';

export const UsuariosView = () => {
  const { users, toggleUserStatus, switchUser, currentUser } = useAuth();
  const { logAction } = useInventory();
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggleStatus = (user) => {
    if (user.id === currentUser.id) {
      alert('No puedes suspender tu propia cuenta activa de administrador.');
      return;
    }

    if (user.activo) {
      const motivo = window.prompt(`Ingrese el motivo formal de la baja lógica para ${user.nombres} ${user.apellidos}:`, 'Cese de contrato laboral / Fin de actividades');
      if (motivo !== null) {
        toggleUserStatus(user.id, motivo);
        logAction('BAJA_USUARIO', 'SEGURIDAD', `Inactivación (baja lógica) de ${user.nombres} ${user.apellidos}. Motivo: ${motivo}`);
      }
    } else {
      if (window.confirm(`¿Desea reactivar el acceso al sistema para ${user.nombres} ${user.apellidos}?`)) {
        toggleUserStatus(user.id);
        logAction('REACTIVAR_USUARIO', 'SEGURIDAD', `Reactivación de acceso para ${user.nombres} ${user.apellidos}`);
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
              Gestión de Personal
            </span>
            <span className="text-xs text-slate-500 font-medium">Seguridad & Control RBAC</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Usuarios, Roles y Permisos de Acceso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Alta de colaboradores con credenciales automáticas, asignación de perfiles (Administrador, Gerencia, Almacenero, Vendedor) e inactivación lógica.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Registrar Nuevo Colaborador
        </button>
      </div>

      {/* Lista de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div
            key={u.id}
            className={`p-5 rounded-2xl border transition-all bg-white shadow-xs space-y-4 ${
              !u.activo ? 'opacity-60 bg-slate-50/50 border-dashed border-slate-300' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-martin-green-50 text-martin-green-700 border border-martin-green-200 flex items-center justify-center font-bold text-sm">
                  {u.nombres.charAt(0)}{u.apellidos.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{u.nombres} {u.apellidos}</h3>
                  <span className="text-[10px] font-bold text-martin-orange-700 bg-martin-orange-50 px-2 py-0.5 rounded-full border border-martin-orange-200 mt-0.5 inline-block">
                    {u.rolNombre}
                  </span>
                </div>
              </div>

              {u.activo ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-martin-green-700 bg-martin-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Activo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Inactivo
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {u.correo}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {u.telefono}</p>
              <p className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {u.direccion}</p>
            </div>

            {!u.activo && u.motivoBaja && (
              <div className="p-2.5 bg-red-50 rounded-xl text-[11px] text-red-700 border border-red-200">
                <strong>Motivo de baja:</strong> {u.motivoBaja}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => switchUser(u.id)}
                disabled={!u.activo}
                className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <UserCheck className="w-3.5 h-3.5 text-martin-green-600" /> Simular Sesión
              </button>

              <button
                onClick={() => handleToggleStatus(u)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                  u.activo
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-martin-green-700 hover:bg-martin-green-50'
                }`}
              >
                {u.activo ? 'Dar de Baja' : 'Reactivar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Alta Usuario */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
};
