import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import {
  DashboardView,
  CatalogoView,
  AlmacenUbicacionesView,
  QuickStockView,
  MovimientosView,
  KardexView,
  AjustesStockView,
  ProveedoresView,
  RotacionABCView,
  ReportesView,
  CierreDiarioView,
  UsuariosView,
  AuditoriaLogsView,
  LoginView,
  VentaModal
} from './views';
import { ShieldAlert, Lock, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error detectado en aplicación:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Se detectó una discrepancia en tiempo de ejecución</h2>
            <p className="text-xs text-slate-400 mb-4">
              Detalle: {this.state.error?.message || 'Error no especificado'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold rounded-xl"
              >
                Recargar Página
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpiar Caché Local
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return currentUser?.rolNombre === 'Vendedor' ? 'catalogo' : 'dashboard';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [ventaModalOpen, setVentaModalOpen] = useState(false);

  // Restablecer vista inicial según el rol al cambiar de usuario o iniciar sesión
  React.useEffect(() => {
    if (currentUser?.rolNombre === 'Vendedor') {
      setActiveTab('catalogo');
    }
  }, [currentUser?.id, currentUser?.rolNombre]);

  // Si no ha iniciado sesión, mostrar la interfaz de Login
  if (!currentUser) {
    return <LoginView />;
  }

  const rol = currentUser?.rolNombre || 'Administrador';

  // Matriz de permisos para vistas
  const tabPermissions = {
    dashboard: ['Administrador', 'Gerencia', 'Encargado de Almacén'],
    catalogo: ['Administrador', 'Gerencia', 'Encargado de Almacén', 'Vendedor'],
    almacen: ['Administrador', 'Gerencia', 'Encargado de Almacén'],
    quickstock: ['Administrador', 'Encargado de Almacén', 'Vendedor'],
    movimientos: ['Administrador', 'Gerencia', 'Encargado de Almacén', 'Vendedor'],
    kardex: ['Administrador', 'Gerencia', 'Encargado de Almacén'],
    ajustes: ['Administrador', 'Encargado de Almacén'],
    ordenes: ['Administrador', 'Gerencia', 'Encargado de Almacén'],
    rotacion: ['Administrador', 'Gerencia'],
    reportes: ['Administrador', 'Gerencia'],
    cierre: ['Administrador', 'Gerencia', 'Encargado de Almacén'],
    usuarios: ['Administrador'],
    auditoria: ['Administrador', 'Gerencia']
  };

  const isAllowed = (tabPermissions[activeTab] || []).includes(rol);

  const renderContent = () => {
    if (!isAllowed) {
      return (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-lg mx-auto mt-12 shadow-xs animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-martin-orange-50 text-martin-orange-600 flex items-center justify-center mx-auto mb-4 border border-martin-orange-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Acceso Restringido</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tu perfil de <strong>{rol}</strong> no dispone de privilegios de acceso para este módulo.
          </p>
          <button
            onClick={() => setActiveTab(rol === 'Vendedor' ? 'catalogo' : 'dashboard')}
            className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Regresar al Inicio
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'catalogo':
        return <CatalogoView />;
      case 'almacen':
        return <AlmacenUbicacionesView />;
      case 'quickstock':
        return <QuickStockView />;
      case 'movimientos':
        return <MovimientosView />;
      case 'kardex':
        return <KardexView />;
      case 'ajustes':
        return <AjustesStockView />;
      case 'ordenes':
        return <ProveedoresView />;
      case 'rotacion':
        return <RotacionABCView />;
      case 'reportes':
        return <ReportesView />;
      case 'cierre':
        return <CierreDiarioView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'auditoria':
        return <AuditoriaLogsView />;
      default:
        return rol === 'Vendedor' ? <CatalogoView /> : <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-martin-green-500 selection:text-white">
      <Navbar
        setActiveTab={setActiveTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openVentaModal={() => setVentaModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Modal Global de Ventas / Despacho (RF-16) */}
      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InventoryProvider>
          <MainLayout />
        </InventoryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
