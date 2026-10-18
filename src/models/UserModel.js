/**
 * MODELO: UserModel
 * Entidad Usuario y verificación de roles y permisos RBAC (RF-01, RF-03, RF-04).
 */

export const UserRoles = {
  ADMIN: 'Administrador',
  GERENCIA: 'Gerencia',
  ALMACEN: 'Encargado de Almacén'
};

export const ModulePermissions = {
  dashboard: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  catalogo: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  almacen: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  quickstock: [UserRoles.ADMIN, UserRoles.ALMACEN],
  movimientos: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  kardex: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  ajustes: [UserRoles.ADMIN, UserRoles.ALMACEN],
  ordenes: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  rotacion: [UserRoles.ADMIN, UserRoles.GERENCIA],
  reportes: [UserRoles.ADMIN, UserRoles.GERENCIA],
  cierre: [UserRoles.ADMIN, UserRoles.GERENCIA, UserRoles.ALMACEN],
  usuarios: [UserRoles.ADMIN],
  auditoria: [UserRoles.ADMIN, UserRoles.GERENCIA]
};

export const UserModel = {
  /**
   * Valida si un rol tiene permiso para ver un módulo determinado
   */
  canAccessModule: (roleName, moduleId) => {
    const allowedRoles = ModulePermissions[moduleId];
    if (!allowedRoles) return true;
    return allowedRoles.includes(roleName);
  },

  /**
   * Valida los datos requeridos para registrar o editar un usuario
   */
  validate: (data) => {
    const errors = [];
    if (!data.nombres || !data.nombres.trim()) errors.push('Los nombres son obligatorios.');
    if (!data.apellidos || !data.apellidos.trim()) errors.push('Los apellidos son obligatorios.');
    if (!data.correo || !data.correo.includes('@')) errors.push('Ingrese un correo electrónico corporativo válido.');
    if (!data.rolNombre) errors.push('Debe asignar un rol válido.');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
