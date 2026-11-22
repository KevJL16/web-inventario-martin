// ============================================================================
// REGLAS DE ACCESO POR ROL QUE COMPARTEN EL NAVEGADOR Y LA API
// Módulo puro, sin dependencias de base de datos, Express ni React.
// Jerarquía: 1 Administrador > 2 Gerencia > 3 Encargado de Almacén > 4 Vendedor.
// El Vendedor consulta el catálogo y registra ventas; no modifica productos,
// no ve costos de compra ni registra compras, mermas o ajustes.
// ============================================================================

export const ADMIN_ROLE = 'Administrador';
export const GERENCIA_ROLE = 'Gerencia';
export const ALMACEN_ROLE = 'Encargado de Almacén';
export const VENDEDOR_ROLE = 'Vendedor';

// Roles que registran ventas (salida por venta)
export const SALES_ROLES = Object.freeze([ADMIN_ROLE, VENDEDOR_ROLE]);

// Roles que consultan el historial de ajustes y mermas (HU-004)
export const ADJUSTMENT_VIEW_ROLES = Object.freeze([ADMIN_ROLE, GERENCIA_ROLE, ALMACEN_ROLE]);

/** true si el rol solo trabaja con ventas (no ve compras, mermas ni ajustes). */
export const isSalesOnly = (rol) => rol === VENDEDOR_ROLE;

/** true si al rol se le debe ocultar el costo de compra y la valorización a costo. */
export const hideCostsFor = (rol) => rol === VENDEDOR_ROLE;

/** true si el rol puede registrar ventas. */
export const canSell = (rol) => SALES_ROLES.includes(rol);

/**
 * true si el rol puede registrar un movimiento del tipo indicado.
 * El Vendedor solo registra ventas; los demás roles conservan sus permisos.
 */
export const canRegisterMovement = (rol, tipo) => {
  if (!rol) return false;
  if (isSalesOnly(rol)) return tipo === 'SALIDA_VENTA';
  return true;
};
