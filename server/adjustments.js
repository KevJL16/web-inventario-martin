// ============================================================================
// AJUSTES DE INVENTARIO Y MERMAS JUSTIFICADAS (HU-004 / RF-20)
// El registro se delega en sp_AjusteInventarioManual, que en una transacción guarda
// el ajuste, actualiza el stock, genera el movimiento, el Kardex y la bitácora.
// ============================================================================

import { Router } from 'express';
import { getPool, sql } from './db.js';
import { requireRole } from './auth.js';
import { validateAdjustmentInput, ADJUSTMENT_ROLES } from './adjustmentRules.js';

// Errores de negocio lanzados con THROW 50001-50006 en sp_AjusteInventarioManual
// y el 50000 de RAISERROR en sp_RegistrarMovimiento (p. ej. stock insuficiente)
function businessErrorMessage(err) {
  const number = err?.number ?? err?.originalError?.info?.number;
  if (number >= 50000 && number <= 50099) return err.message;
  return null;
}

const ADJUSTMENT_COLUMNS = `
  a.IdAjuste AS id,
  a.NumeroAjuste AS numeroAjuste,
  a.IdProducto AS productoId,
  p.Nombre AS productoNombre,
  p.CodigoSKU AS sku,
  a.TipoAjuste AS tipoAjuste,
  a.CantidadAjuste AS cantidadAjustada,
  a.StockSistema AS stockTeorico,
  a.StockFisicoReal AS stockFisico,
  p.CostoCompra AS costoUnitario,
  CAST(a.CantidadAjuste * p.CostoCompra AS DECIMAL(14,2)) AS impactoEconomico,
  a.MotivoJustificado AS motivo,
  a.DetalleJustificacion AS detalle,
  CONCAT(u.Nombres, ' ', u.Apellidos) AS responsable,
  a.FechaAjuste AS fecha
`;

const ADJUSTMENT_FROM = `
  FROM AjustesInventario a
  INNER JOIN Productos p ON a.IdProducto = p.IdProducto
  INNER JOIN Usuarios u ON a.IdUsuarioSolicitante = u.IdUsuario
`;

const toNumberFields = (row) => ({
  ...row,
  costoUnitario: Number(row.costoUnitario),
  impactoEconomico: Number(row.impactoEconomico)
});

export const adjustmentsRouter = Router();

// Historial de ajustes (cualquier usuario con sesión)
adjustmentsRouter.get('/ajustes', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT TOP 200 ${ADJUSTMENT_COLUMNS} ${ADJUSTMENT_FROM}
      ORDER BY a.IdAjuste DESC;
    `);
    res.json(result.recordset.map(toNumberFields));
  } catch (err) {
    console.error('Error al listar ajustes:', err);
    res.status(500).json({ success: false, message: 'No se pudo obtener el historial de ajustes.' });
  }
});

// Registrar un ajuste o merma justificada (solo Administrador y Encargado de Almacén)
adjustmentsRouter.post('/ajustes', requireRole(...ADJUSTMENT_ROLES), async (req, res) => {
  const { isValid, errors, value } = validateAdjustmentInput(req.body);
  if (!isValid) {
    return res.status(400).json({ success: false, message: errors.join(' '), errors });
  }

  try {
    const p = await getPool();
    const result = await p.request()
      .input('IdProducto', sql.Int, value.productoId)
      .input('IdUsuarioSolicitante', sql.Int, req.user.id)
      // Quien registra con un rol autorizado también aprueba el ajuste
      .input('IdUsuarioAprobador', sql.Int, req.user.id)
      .input('TipoAjuste', sql.VarChar(20), value.tipoAjuste)
      .input('CantidadAjuste', sql.Int, value.cantidad)
      .input('MotivoJustificado', sql.VarChar(100), value.motivo)
      .input('DetalleJustificacion', sql.VarChar(500), value.detalle)
      .execute('sp_AjusteInventarioManual');

    const registered = result.recordset?.[0];
    const detail = await p.request()
      .input('id', sql.Int, registered.IdAjuste)
      .query(`SELECT ${ADJUSTMENT_COLUMNS} ${ADJUSTMENT_FROM} WHERE a.IdAjuste = @id;`);

    res.status(201).json({
      success: true,
      message: `Ajuste ${registered.NumeroAjuste} registrado. Stock: ${registered.StockAnterior} → ${registered.StockNuevo}.`,
      adjustment: toNumberFields(detail.recordset[0]),
      stockAnterior: registered.StockAnterior,
      stockNuevo: registered.StockNuevo
    });
  } catch (err) {
    const message = businessErrorMessage(err);
    if (message) {
      return res.status(400).json({ success: false, message });
    }
    console.error('Error al registrar ajuste:', err);
    res.status(500).json({ success: false, message: 'No se pudo registrar el ajuste.' });
  }
});
