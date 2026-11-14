/**
 * MODELO: AdjustmentModel
 * Entidad de Ajuste de Inventario, Mermas y Conciliación Física (RF-20 / HU-004).
 * Las reglas de validación vienen de shared/adjustmentRules.js, las mismas que usa
 * la API, para que el navegador y el servidor acepten y rechacen lo mismo.
 */

import {
  ADJUSTMENT_TYPES,
  DETALLE_MIN,
  validateAdjustmentInput,
  validateStockAvailability,
  calculateNewStock
} from '../../shared/adjustmentRules.js';

export { DETALLE_MIN };

export const AdjustmentTypes = Object.freeze(
  Object.fromEntries(ADJUSTMENT_TYPES.map((tipo) => [tipo, tipo]))
);

const finiteOrNull = (value) => (Number.isFinite(value) ? value : null);

export const AdjustmentModel = {
  calculateNewStock,

  /**
   * Validación previa en el navegador. Recibe el producto seleccionado (o null)
   * y los campos del formulario; devuelve { isValid, errors }.
   */
  validate: ({ producto, tipoAjuste, cantidad, motivo, detalle }) => {
    const { errors, value } = validateAdjustmentInput({
      productoId: producto?.id,
      tipoAjuste,
      cantidad,
      motivo,
      detalle
    });

    if (producto) {
      const stockError = validateStockAvailability(producto.stockActual, value.tipoAjuste, value.cantidad);
      if (stockError) errors.push(stockError);
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Convierte un ajuste recibido de la API en la fila que muestra el historial.
 * Si falta un dato devuelve null en ese campo (la vista muestra "—"):
 * nunca se inventan SKU, costos, responsables ni fechas (DEF-16).
 */
export function toHistoryRow(adjustment) {
  const a = adjustment || {};
  const cantidad = Number(a.cantidadAjustada ?? a.cantidad);
  const costo = Number(a.costoUnitario);
  const impactoApi = a.impactoEconomico == null ? NaN : Number(a.impactoEconomico);
  const impacto = Number.isFinite(impactoApi)
    ? impactoApi
    : (Number.isFinite(cantidad) && Number.isFinite(costo) ? cantidad * costo : NaN);
  const fecha = a.fecha ? new Date(a.fecha) : null;

  return {
    id: a.id ?? a.numeroAjuste ?? null,
    folio: a.numeroAjuste || null,
    fecha: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
    producto: a.productoNombre || null,
    sku: a.sku || null,
    tipo: a.tipoAjuste || a.tipo || null,
    cantidad: finiteOrNull(cantidad),
    impacto: finiteOrNull(impacto),
    motivo: a.motivo || null,
    detalle: a.detalle || null,
    responsable: a.responsable || a.solicitante || null
  };
}

/** Filtra el historial por folio, producto o motivo (sin distinguir mayúsculas). */
export function filterAdjustments(adjustments, term) {
  const list = Array.isArray(adjustments) ? adjustments : [];
  const query = String(term ?? '').trim().toLowerCase();
  if (!query) return list;
  return list.filter((a) =>
    [a?.productoNombre, a?.numeroAjuste, a?.motivo].some((field) =>
      String(field ?? '').toLowerCase().includes(query)
    )
  );
}
