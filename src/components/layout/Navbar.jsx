import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import logoMartin from '../../assets/logo_martin.png';
import { 
  Bell, 
  Shield, 
  AlertTriangle, 
  RotateCcw, 
  Package, 
  ChevronDown, 
  KeyRound, 
  ShoppingCart, 
  CheckCircle2, 
  LogOut 
} from 'lucide-react';

export const Navbar = ({ setActiveTab, openAuthModal, openVentaModal }) => {
  const { currentUser, switchUser, users, logout } = useAuth();
  const { lowStockAlerts, resetDemoData, isDbConnected, dbInfo } = useInventory();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Oficial Representaciones Martín */}
          <div 
            className="flex items-center space-x-3 cursor-pointer py-1" 
            onClick={() => setActiveTab('dashboard')}
            title="Representaciones Martín - Ir al Dashboard"
          >
            <img 
              src={logoMartin} 
              alt="Representaciones Martín Logo" 
              className="h-9 w-auto object-contain select-none"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = './logo_martin.png';
              }}
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <span className="text-[10px] font-black tracking-widest text-martin-orange-600 uppercase block leading-none">
                Maderas & Construcción
              </span>
              <span className="text-xs font-bold text-slate-600 tracking-tight">
                Control de Inventario
              </span>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center space-x-3">
            
            {/* Botón Principal: Registrar Venta / Despacho (Solo Administrador y Vendedor) */}
            {['Administrador', 'Vendedor'].includes(currentUser?.rolNombre) && (
              <button
                onClick={openVentaModal}
                className="px-3.5 py-2 bg-martin-green-500 hover:bg-martin-green-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
                title="Registrar una salida por venta o despacho inmediato"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Venta</span>
              </button>
            )}

            {/* Indicador de Estado de Conexión a Base de Datos SQL Server */}
            <div className="hidden lg:flex items-center">
              {isDbConnected ? (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs cursor-help"
                  title={`Conectado en vivo a Microsoft SQL Server (RepresentacionesMartinDB en puerto 1434). ${dbInfo?.TotalProductos ? `Catálogo: ${dbInfo.TotalProductos} productos.` : ''}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>SQL Server: <strong className="text-emerald-700 font-black">Conectado</strong></span>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs cursor-help"
                  title="Modo Local (LocalStorage). Para conectar con tu SQL Server en tiempo real, ejecuta 'npm run server' en una terminal."
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Modo Local <strong className="text-[10px] text-amber-600 font-bold">(Inicia: npm run server)</strong></span>
                </div>
              )}
            </div>

            {/* Centro de Alertas de Reabastecimiento (RF-09, RF-10) */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
                title="Alertas de Reabastecimiento"
              >
                <Bell className="w-5 h-5" />
                {lowStockAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-martin-orange-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {lowStockAlerts.length}
                  </span>
                )}
              </button>

              {/* Menú Flotante de Alertas */}
              {showAlerts && (
                <div className="absolute right-0 mt-2 w-96 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-martin-orange-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Alertas Stock Crítico ({lowStockAlerts.length})</span>
                    </div>
                    <span className="text-[10px] bg-martin-orange-500/30 text-martin-orange-300 font-black px-2 py-0.5 rounded">
                      Urgente
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {lowStockAlerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-martin-green-500 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Todos los niveles de inventario están saludables.</p>
                      </div>
                    ) : (
                      lowStockAlerts.map(prod => (
                        <div key={prod.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="pr-2">
                              <p className="text-xs font-bold text-slate-900 leading-snug">{prod.nombre}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                SKU: <span className="font-mono font-bold text-slate-700">{prod.sku}</span> | Rack: <span className="font-bold text-martin-green-700">{prod.ubicacionCodigo}</span>
                              </p>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                              {prod.stockActual === 0 ? 'AGOTADO' : `${prod.stockActual} / Mín ${prod.stockMinimo}`}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              Prov: <span className="font-medium text-slate-700">{prod.proveedorNombre}</span>
                            </span>
                            <button
                              onClick={() => {
                                setShowAlerts(false);
                                setActiveTab('ordenes');
                              }}
                              className="text-[11px] font-bold text-martin-orange-600 hover:text-martin-orange-700 underline"
                            >
                              Reordenar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowAlerts(false);
                        setActiveTab('catalogo');
                      }}
                      className="text-xs text-martin-green-700 hover:text-martin-green-800 font-bold"
                    >
                      Ver Catálogo Completo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil del Usuario Activo */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2.5 p-1 pl-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.nombres?.split(' ')[0]} {currentUser?.apellidos?.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-bold text-martin-green-700">
                    {currentUser?.rolNombre}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-martin-green-50 border border-martin-green-200 text-martin-green-700 flex items-center justify-center font-bold text-xs">
                  {currentUser?.nombres?.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Menú desplegable de usuario */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in divide-y divide-slate-100">
                  <div className="p-3.5 bg-slate-50">
                    <p className="text-xs font-bold text-slate-900">{currentUser?.nombres} {currentUser?.apellidos}</p>
                    <p className="text-[11px] text-slate-500">{currentUser?.correo}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-martin-green-100 text-martin-green-800">
                      <Shield className="w-3 h-3" /> Nivel: {currentUser?.rolNombre}
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        resetDemoData();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" /> Restablecer Datos Iniciales
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Rápido de Salir / Cerrar Sesión */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
              title="Cerrar Sesión y volver a la pantalla de Login"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
