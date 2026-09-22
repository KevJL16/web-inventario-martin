import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
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
import { UserModal } from './UserModal';

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Gestión de Personal
            </span>
            <span className="text-xs text-slate-500 font-medium">Seguridad & Control de Acceso RBAC</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Administración de Usuarios y Perfiles de Acceso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Alta de colaboradores con credenciales automáticas, asignación de roles jerárquicos y gestión de bajas lógicas de colaboradores.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/20 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Registrar Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas de Resumen de Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Administrador</span>
            <p className="text-lg font-black text-slate-900">
              {users.filter(u => u.rolNombre === 'Administrador' && u.activo).length} activos
            </p>
            <p className="text-[10px] text-slate-400">Control total y seguridad</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Gerencia</span>
            <p className="text-lg font-black text-slate-900">
              {users.filter(u => u.rolNombre === 'Gerencia' && u.activo).length} activos
            </p>
            <p className="text-[10px] text-slate-400">Auditoría, reportes y finanzas</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Encargado de Almacén</span>
            <p className="text-lg font-black text-slate-900">
              {users.filter(u => u.rolNombre === 'Encargado de Almacén' && u.activo).length} activos
            </p>
            <p className="text-[10px] text-slate-400">Recepción, despacho y mermas</p>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Colaborador</th>
                <th className="py-3.5 px-3">Rol Jerárquico (RBAC)</th>
                <th className="py-3.5 px-3">Contacto Corporativo</th>
                <th className="py-3.5 px-3">Dirección</th>
                <th className="py-3.5 px-3 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50/80 ${!u.activo ? 'bg-slate-100/60 opacity-60' : ''}`}>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {u.nombres.charAt(0)}{u.apellidos.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">
                          {u.nombres} {u.apellidos}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Registrado: {new Date(u.fechaRegistro).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      u.rolNombre === 'Administrador'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : u.rolNombre === 'Gerencia'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {u.rolNombre}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.correo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.telefono}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                    {u.direccion || 'Sin dirección'}
                  </td>

                  {/* Estado y Baja Lógica */}
                  <td className="py-3.5 px-3 text-center">
                    {u.activo ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Inactivo (Baja)
                        </span>
                        {u.motivoBaja && (
                          <span className="text-[10px] text-slate-400 italic mt-0.5 max-w-[140px] truncate" title={u.motivoBaja}>
                            {u.motivoBaja}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {u.activo && (
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 transition-colors flex items-center gap-1"
                          title="Simular inicio de sesión con este usuario para evaluar permisos RBAC"
                        >
                          <UserCheck className="w-3 h-3" /> Simular Sesión
                        </button>
                      )}

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            u.activo
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.activo ? 'Dar de Baja' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
};
