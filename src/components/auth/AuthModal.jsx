import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { KeyRound, Mail, CheckCircle2, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const { logAction } = useInventory();

  const [step, setStep] = useState('REQUEST'); // 'REQUEST' or 'CONFIRM'
  const [correo, setCorreo] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedInfo, setGeneratedInfo] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleRequestToken = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = requestPasswordReset(correo);

    if (res.success) {
      setGeneratedInfo(res);
      setTokenInput(res.token); // Auto-llenar para facilidad de prueba
      setStep('CONFIRM');
      logAction('SOLICITUD_RESET_PASSWORD', 'SEGURIDAD', `Token de seguridad temporal generado para: ${correo}`);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleConfirmReset = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener como mínimo 6 caracteres.');
      return;
    }

    const res = confirmPasswordReset(tokenInput, newPassword);
    if (res.success) {
      setSuccessMessage(res.message);
      logAction('PASSWORD_RESTABLECIDO', 'SEGURIDAD', `Restablecimiento exitoso de contraseña mediante token de seguridad.`);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleResetState = () => {
    setStep('REQUEST');
    setCorreo('');
    setTokenInput('');
    setNewPassword('');
    setGeneratedInfo(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-martin-green-500 flex items-center justify-center text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Recuperación de Cuenta</h3>
              <p className="text-xs text-slate-400">Token temporal de seguridad vía correo</p>
            </div>
          </div>
          <button onClick={handleResetState} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6">
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">¡Contraseña Actualizada!</h4>
              <p className="text-xs text-slate-500">
                Tu clave ha sido restablecida de forma segura. Ya puedes acceder con tus nuevas credenciales.
              </p>
              <button
                onClick={handleResetState}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Cerrar y Continuar
              </button>
            </div>
          ) : step === 'REQUEST' ? (
            /* Paso 1: Ingresar correo */
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingresa tu correo corporativo registrado en <strong>Representaciones Martín</strong>. El sistema emitirá un token de seguridad temporal para que puedas generar una nueva contraseña.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Corporativo *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    placeholder="ej: almacen@rep-martin.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Cuentas de prueba: <span className="font-mono text-slate-600">administrador@rep-martin.com</span> o <span className="font-mono text-slate-600">almacen@rep-martin.com</span>
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetState}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-martin-green-500 hover:bg-martin-green-600 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  Solicitar Token <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Paso 2: Validar Token y Crear Nueva Contraseña */
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold">Token de Seguridad Emitido:</p>
                <p className="font-mono font-bold text-amber-950 text-sm mt-0.5">{generatedInfo?.token}</p>
                <p className="text-[10px] text-amber-700 mt-1">Válido por 30 minutos (Simulado en entorno web)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Token Temporal de Seguridad *</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  className="w-full font-mono font-bold text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña de Acceso *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  className="text-xs text-slate-500 hover:underline"
                >
                  ← Cambiar correo
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Confirmar Cambio de Clave
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
