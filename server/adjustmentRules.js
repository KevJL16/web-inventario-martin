// ============================================================================
// REGLAS DE AJUSTES PARA LA API (HU-004 / RF-20)
// Las reglas de negocio viven en shared/adjustmentRules.js (fuente única que
// también usa el navegador). Aquí solo se agrega lo propio del servidor.
// ============================================================================

export {
  ADJUSTMENT_TYPES,
  ADJUSTMENT_ROLES,
  DECREASING_TYPES,
  MOTIVO_MAX,
  DETALLE_MIN,
  DETALLE_MAX,
  CANTIDAD_MAX,
  validateAdjustmentInput,
  validateStockAvailability,
  calculateNewStock
} from '../shared/adjustmentRules.js';

// Rango de errores de negocio: THROW 50001-50006 en sp_AjusteInventarioManual
// y RAISERROR 50000 en sp_RegistrarMovimiento (p. ej. stock insuficiente)
export const BUSINESS_ERROR_MIN = 50000;
export const BUSINESS_ERROR_MAX = 50099;

/**
 * Devuelve el mensaje de un error de negocio de SQL Server para mostrarlo al
 * usuario, o null si es un error técnico (que no debe exponerse).
 */
export function businessErrorMessage(err) {
  const number = err?.number ?? err?.originalError?.info?.number;
  if (Number.isInteger(number) && number >= BUSINESS_ERROR_MIN && number <= BUSINESS_ERROR_MAX) {
    return err.message;
  }
  return null;
}
