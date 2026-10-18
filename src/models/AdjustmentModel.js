/**
 * MODELO: AdjustmentModel
 * Entidad de Ajuste de Inventario, Mermas y Conciliación Física (RF-20).
 */

export const AdjustmentTypes = {
  MERMA_DANO: 'MERMA_DANO',
  FALTANTE: 'FALTANTE',
  SOBRANTE: 'SOBRANTE'
};

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

  validate: (currentStock, type, qty, motivo) => {
    const errors = [];
    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) errors.push('La cantidad del ajuste debe ser mayor a 0.');
    if (!motivo || !motivo.trim()) errors.push('El motivo de justificación es obligatorio (RF-20).');

    if ((type === AdjustmentTypes.MERMA_DANO || type === AdjustmentTypes.FALTANTE) && currentStock < quantity) {
      errors.push(`No se puede descontar más del stock actual (${currentStock} unid.).`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
