import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Zap,
  ArrowLeftRight,
  BookOpen,
  Sliders,
  Truck,
  TrendingUp,
  FileText,
  Clock,
  Users,
  ShieldAlert
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const rol = currentUser?.rolNombre || 'Administrador';

  // Configuración de elementos de menú con permisos según roles
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Ejecutivo',
      icon: LayoutDashboard,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén']
    },
    {
      id: 'catalogo',
      label: 'Catálogo de Productos',
      icon: Package,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén', 'Vendedor']
    },
    {
      id: 'almacen',
      label: 'Ubicaciones y Racks 2D',
      icon: MapPin,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén']
    },
    {
      id: 'quickstock',
      label: 'Consulta Rápida Stock',
      icon: Zap,
      roles: ['Administrador', 'Encargado de Almacén', 'Vendedor']
    },
    {
      id: 'movimientos',
      label: 'Historial Movimientos',
      icon: ArrowLeftRight,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén', 'Vendedor']
    },
    {
      id: 'kardex',
      label: 'Entradas y Salidas',
      icon: BookOpen,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén']
    },
    {
      id: 'ajustes',
      label: 'Ajustes y Mermas',
      icon: Sliders,
      roles: ['Administrador', 'Encargado de Almacén']
    },
    {
      id: 'ordenes',
      label: 'Proveedores y Compras',
      icon: Truck,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén']
    },
    {
      id: 'rotacion',
      label: 'Rotación ABC Demanda',
      icon: TrendingUp,
      roles: ['Administrador', 'Gerencia']
    },
    {
      id: 'reportes',
      label: 'Reportes y Valorizado',
      icon: FileText,
      roles: ['Administrador', 'Gerencia']
    },
    {
      id: 'cierre',
      label: 'Cierre Diario',
      icon: Clock,
      roles: ['Administrador', 'Gerencia', 'Encargado de Almacén']
    },
    {
      id: 'usuarios',
      label: 'Usuarios y Accesos',
      icon: Users,
      roles: ['Administrador']
    },
    {
      id: 'auditoria',
      label: 'Bitácora Auditoría',
      icon: ShieldAlert,
      roles: ['Administrador', 'Gerencia']
    }
  ];

  // Solo renderizar las opciones a las que el perfil actual tiene acceso
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(rol));

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-xs min-h-[calc(100vh-4rem)]">
      {/* Lista de Navegación */}
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 py-1 mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Módulos del Sistema
          </p>
        </div>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-martin-green-500 text-white shadow-sm shadow-martin-green-900/10'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer del Sidebar con info de Sesión */}
      <div className="p-3 m-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px]">
        <div className="flex items-center space-x-1.5 font-bold text-martin-green-700 mb-1">
          <span className="w-2 h-2 rounded-full bg-martin-green-500 animate-pulse"></span>
          <span>Sesión Activa</span>
        </div>
        <p className="text-slate-900 font-bold truncate">{currentUser?.nombres}</p>
        <p className="text-slate-500 text-[10px]">Rol: <span className="text-martin-orange-700 font-bold">{currentUser?.rolNombre}</span></p>
        <p className="text-[10px] text-slate-400 mt-1.5 border-t border-slate-200 pt-1.5">
          Control de Accesos
        </p>
      </div>
    </aside>
  );
};
