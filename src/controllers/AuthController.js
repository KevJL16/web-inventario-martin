/**
 * CONTROLADOR: AuthController
 * Capa de Lógica de Autenticación, Simulación de Roles y Recuperación de Cuenta (RF-01..04).
 */

import { UserModel, UserRoles } from '../models/UserModel.js';

export const AuthController = {
  /**
   * Cambia el usuario activo para simulación de roles
   */
  switchUser: (userId, users, setCurrentUser) => {
    const user = users.find(u => u.id === Number(userId));
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Usuario no encontrado' };
  },

  /**
   * RF-02: Solicitar token temporal de restablecimiento
   */
  requestPasswordReset: (email, users) => {
    const user = users.find(u => u.correo.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return { success: false, message: 'No existe ninguna cuenta corporativa registrada con ese correo.' };
    }

    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    return {
      success: true,
      token,
      expiresAt,
      message: `Enlace de seguridad generado con éxito para ${user.correo}. Token temporal: ${token}`
    };
  },

  /**
   * RF-01: Registrar nuevo usuario corporativo
   */
  registerUser: (userData, users, setUsers) => {
    const validation = UserModel.validate(userData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const emailExists = users.some(u => u.correo.toLowerCase() === userData.correo.toLowerCase().trim());
    if (emailExists) {
      return { success: false, message: 'El correo corporativo ya se encuentra en uso por otro colaborador.' };
    }

    const newUser = {
      id: Date.now(),
      nombres: userData.nombres.trim(),
      apellidos: userData.apellidos.trim(),
      correo: userData.correo.trim().toLowerCase(),
      telefono: userData.telefono?.trim() || '987654321',
      direccion: userData.direccion?.trim() || 'Sede Central',
      rolNombre: userData.rolNombre,
      activo: true,
      creadoEn: new Date().toISOString()
    };

    setUsers(prev => [newUser, ...prev]);
    return { success: true, user: newUser };
  }
};
