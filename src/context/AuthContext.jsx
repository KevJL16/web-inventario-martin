import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiJson, getToken, setToken, UNAUTHORIZED_EVENT } from '../services/api';

const AuthContext = createContext();

// Claves de versiones anteriores que guardaban usuarios y contraseñas en el navegador
const LEGACY_STORAGE_KEYS = ['martin_users', 'martin_current_user', 'martin_is_authenticated', 'martin_reset_tokens'];

export const AuthProvider = ({ children }) => {
  // Usuario autenticado (null si no ha iniciado sesión)
  const [currentUser, setCurrentUser] = useState(null);
  // Mientras se valida un token guardado no se muestra el login
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch {
      // Almacenamiento no disponible
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
  }, []);

  // Restaurar la sesión validando el token con el servidor
  useEffect(() => {
    if (!getToken()) return;
    apiJson('/api/auth/me').then(({ ok, data }) => {
      if (ok && data.user) setCurrentUser(data.user);
      else logout();
      setAuthLoading(false);
    });
  }, [logout]);

  // Si el servidor rechaza el token (expirado o cuenta inactivada) se cierra la sesión
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const isAdmin = currentUser?.rolNombre === 'Administrador';

  const refreshUsers = useCallback(async () => {
    const { ok, data } = await apiJson('/api/usuarios');
    if (ok && Array.isArray(data)) setUsers(data);
  }, []);

  // Roles y lista de usuarios se cargan del servidor (la lista solo para Administrador)
  useEffect(() => {
    if (!currentUser) return;
    apiJson('/api/roles').then(({ ok, data }) => {
      if (ok && Array.isArray(data)) setRoles(data);
    });
    if (isAdmin) refreshUsers();
  }, [currentUser?.id, isAdmin, refreshUsers]);

  // Iniciar sesión con correo corporativo y contraseña
  const login = async (correo, password) => {
    if (!correo || !password) {
      return { success: false, message: 'Por favor ingrese su correo y contraseña.' };
    }

    const { ok, data } = await apiJson('/api/auth/login', {
      method: 'POST',
      body: { correo: String(correo).trim(), password: String(password) }
    });

    if (!ok || !data.token) {
      return { success: false, message: data.message || 'No se pudo iniciar sesión.' };
    }

    setToken(data.token);
    setCurrentUser(data.user);
    return { success: true, user: data.user };
  };

  // RF-01: Registro de usuarios; el servidor genera y hashea la contraseña temporal
  const registerUser = async (userData) => {
    const { ok, data } = await apiJson('/api/usuarios', { method: 'POST', body: userData });
    if (!ok) {
      return { success: false, message: data.message || 'No se pudo registrar el usuario.' };
    }
    setUsers(prev => [data.user, ...prev]);
    return { success: true, user: data.user, temporaryPassword: data.temporaryPassword };
  };

  // RF-21: Inactivación y baja lógica de usuarios
  const toggleUserStatus = async (userId, motivoBaja = '') => {
    const target = users.find(u => u.id === userId);
    if (!target) return false;
    if (currentUser.id === userId) {
      alert('No puedes inactivar tu propia cuenta activa de administrador.');
      return false;
    }

    const { ok, data } = await apiJson(`/api/usuarios/${userId}/estado`, {
      method: 'PATCH',
      body: { activo: !target.activo, motivoBaja }
    });
    if (!ok) {
      alert(data.message || 'No se pudo actualizar el estado del usuario.');
      return false;
    }
    setUsers(prev => prev.map(u => (u.id === userId ? data.user : u)));
    return true;
  };

  // RF-02: Recuperación de cuenta. El token se envía al correo, nunca al navegador.
  const requestPasswordReset = async (correo) => {
    const { ok, data } = await apiJson('/api/auth/password-reset/request', {
      method: 'POST',
      body: { correo }
    });
    return { success: ok, message: data.message };
  };

  const confirmPasswordReset = async (token, newPassword) => {
    const { ok, data } = await apiJson('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: { token, newPassword }
    });
    return { success: ok, message: data.message };
  };

  // Helper de permisos según RBAC (RF-03, RF-04).
  // Solo controla la interfaz: la autorización real se valida en el servidor.
  const canAccess = (requiredRole) => {
    if (!currentUser) return false;
    if (currentUser.rolNombre === 'Administrador') return true;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentUser.rolNombre);
    }
    return currentUser.rolNombre === requiredRole;
  };

  const isGerencia = currentUser?.rolNombre === 'Gerencia';
  const isAlmacenero = currentUser?.rolNombre === 'Encargado de Almacén';
  const isVendedor = currentUser?.rolNombre === 'Vendedor';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: Boolean(currentUser),
      authLoading,
      users,
      roles,
      login,
      logout,
      registerUser,
      toggleUserStatus,
      refreshUsers,
      requestPasswordReset,
      confirmPasswordReset,
      canAccess,
      isAdmin,
      isGerencia,
      isAlmacenero,
      isVendedor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
