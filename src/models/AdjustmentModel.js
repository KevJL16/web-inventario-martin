/**
 * MODELO: AdjustmentModel
 * Entidad de Ajuste de Inventario, Mermas y Conciliación Física (RF-20).
 */

export const AdjustmentTypes = {
  MERMA_DANO: 'MERMA_DANO',
  FALTANTE: 'FALTANTE',
  SOBRANTE: 'SOBRANTE'
};

// Debe coincidir con DETALLE_MIN de server/adjustmentRules.js
export const DETALLE_MIN = 10;

export const AdjustmentModel = {
  calculateNewStock: (currentStock, type, qty) => {
    const quantity = Number(qty);
    if (type === AdjustmentTypes.MERMA_DANO || type === AdjustmentTypes.FALTANTE) {
      return currentStock - quantity;
    }
    if (type === AdjustmentTypes.SOBRANTE) {
      return currentStock + quantity;
    }
    return currentStock;
  },

  // Validación previa en el navegador; el servidor vuelve a validar (server/adjustmentRules.js)
  validate: (currentStock, type, qty, motivo, detalle) => {
    const errors = [];
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity <= 0) errors.push('La cantidad del ajuste debe ser un número entero mayor a 0.');
    if (!Object.values(AdjustmentTypes).includes(type)) errors.push('Seleccione un tipo de ajuste válido.');
    if (!motivo || !motivo.trim()) errors.push('El motivo de justificación es obligatorio (RF-20).');
    if (detalle !== undefined) {
      const text = (detalle || '').trim();
      if (!text) errors.push('La justificación técnica es obligatoria.');
      else if (text.length < DETALLE_MIN) errors.push(`La justificación técnica debe tener al menos ${DETALLE_MIN} caracteres.`);
    }

    if ((type === AdjustmentTypes.MERMA_DANO || type === AdjustmentTypes.FALTANTE) && currentStock < quantity) {
      errors.push(`No se puede descontar más del stock actual (${currentStock} unid.).`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
