// ============================================================================
// MATRIZ ÚNICA DE ACCESO A LOS MÓDULOS (vistas) POR ROL
// La usan el menú lateral (Sidebar) y el enrutador de vistas (App). Antes cada
// uno tenía su propia copia, y ambas negaban a Gerencia la consulta de ajustes
// que exige el criterio CA-4 de la HU-004 (DEF-17).
// Ver un módulo no implica poder modificar: los permisos de escritura los
// controla cada vista y, sobre todo, la API (requireRole).
// ============================================================================

const ADMIN = 'Administrador';
const GERENCIA = 'Gerencia';
const ALMACEN = 'Encargado de Almacén';
const VENDEDOR = 'Vendedor';

export const MODULE_ROLES = Object.freeze({
  dashboard: [ADMIN, GERENCIA, ALMACEN],
  catalogo: [ADMIN, GERENCIA, ALMACEN, VENDEDOR],
  almacen: [ADMIN, GERENCIA, ALMACEN],
  quickstock: [ADMIN, ALMACEN, VENDEDOR],
  movimientos: [ADMIN, GERENCIA, ALMACEN, VENDEDOR],
  kardex: [ADMIN, GERENCIA, ALMACEN],
  // HU-004 CA-4: Administrador y Almacén registran; Gerencia solo consulta
  ajustes: [ADMIN, GERENCIA, ALMACEN],
  ordenes: [ADMIN, GERENCIA, ALMACEN],
  rotacion: [ADMIN, GERENCIA],
  reportes: [ADMIN, GERENCIA],
  cierre: [ADMIN, GERENCIA, ALMACEN],
  usuarios: [ADMIN],
  auditoria: [ADMIN, GERENCIA]
});

/** true si el rol puede abrir el módulo (los módulos desconocidos se niegan). */
export const canAccessModule = (moduleId, rol) =>
  (MODULE_ROLES[moduleId] || []).includes(rol);
