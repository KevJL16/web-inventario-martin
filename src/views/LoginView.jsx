import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoMartin from '../assets/logo_martin.png';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Boxes
} from 'lucide-react';

export const LoginView = () => {
  const { login } = useAuth();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const res = login(usernameInput, passwordInput);
      if (!res.success) {
        setErrorMsg(res.message);
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-martin-green-500 selection:text-white">
      
      {/* Tarjeta Central de Login */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Encabezado Corporativo */}
        <div className="bg-slate-900 px-6 py-8 text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <div className="bg-white p-3 rounded-2xl shadow-md inline-flex items-center justify-center">
              <img 
                src={logoMartin} 
                alt="Representaciones Martín" 
                className="h-10 w-auto object-contain select-none"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = './logo_martin.png';
                }}
              />
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Control de Inventario & Almacén
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Representaciones Martín S.A.C.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-martin-orange-400 border border-slate-700">
            <Boxes className="w-3.5 h-3.5" /> Acceso al Sistema
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          
          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mensaje de Error */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo Usuario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Usuario o Correo Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Ingrese su usuario o correo"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-martin-green-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-martin-green-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-martin-green-500 hover:bg-martin-green-600 active:bg-martin-green-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mensaje Informativo: Olvido de Contraseña */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-left">
            <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                ¿Olvidó su contraseña?
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Si olvidó su contraseña, comuníquese con el <strong>Administrador de Sistemas</strong> para el restablecimiento de su acceso.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Pie de Página */}
      <footer className="mt-6 text-center text-xs text-slate-400">
        <p>© 2026 Representaciones Martín S.A.C. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
};
