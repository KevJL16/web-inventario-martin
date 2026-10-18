import React from 'react';
import { useAuth } from '../../context/AuthContext';
import logoMartin from '../../assets/logo_martin.png';
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
  ShieldAlert,
  X
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
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

  const handleItemClick = (id) => {
    setActiveTab(id);
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Telón de fondo oscuro (Backdrop) para móviles y tablets */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in transition-opacity cursor-pointer"
          onClick={() => setIsOpen && setIsOpen(false)}
          aria-label="Cerrar menú lateral"
        />
      )}

      {/* Contenedor del Sidebar: Fijo en escritorio, Desplegable (Drawer) en móviles */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-16 z-50 lg:z-20
        inset-y-0 left-0
        w-72 lg:w-64
        bg-white border-r border-slate-200/90
        flex flex-col justify-between shrink-0 shadow-2xl lg:shadow-xs
        h-full lg:h-[calc(100vh-4rem)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Cabecera exclusiva para móviles con Logo y botón de cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <img 
              src={logoMartin} 
              alt="Representaciones Martín" 
              className="h-7 w-auto object-contain bg-white rounded-lg p-1"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = './logo_martin.png';
              }}
            />
            <div>
              <span className="text-[10px] font-black tracking-widest text-martin-orange-400 uppercase block leading-none">
                Menú Principal
              </span>
              <span className="text-xs font-bold text-white tracking-tight">
                Representaciones Martín
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen && setIsOpen(false)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación con scroll independiente */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 py-1 mb-1">
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
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-martin-green-500 text-white shadow-sm shadow-martin-green-900/10 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer del Sidebar con info de Sesión */}
        <div className="p-3 m-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px] shrink-0">
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
    </>
  );
};
