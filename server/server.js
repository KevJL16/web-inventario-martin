import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: '127.0.0.1',
  port: 1434,
  user: 'martin_user',
  password: 'Martin2026!',
  database: 'RepresentacionesMartinDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 1. Endpoint de verificación de estado de conexión a SQL Server
app.get('/api/status', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
        DB_NAME() AS DatabaseName,
        @@VERSION AS SqlVersion,
        (SELECT COUNT(*) FROM Productos WHERE Activo = 1) AS TotalProductos,
        (SELECT COUNT(*) FROM Kardex) AS TotalKardex,
        (SELECT COUNT(*) FROM MovimientosInventario) AS TotalMovimientos,
        (SELECT COUNT(*) FROM vw_AlertasReabastecimiento) AS TotalAlertas
    `);

    res.json({
      connected: true,
      message: 'Conectado exitosamente a SQL Server (SSMS)',
      data: result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      message: 'Error al conectar con SQL Server',
      error: error.message
    });
  }
});

// 2. Endpoint para consultar productos mapeados desde SQL Server
app.get('/api/productos', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
        p.IdProducto AS id,
        p.CodigoSKU AS sku,
        p.CodigoBarras AS codigoBarras,
        p.Nombre AS nombre,
        p.Descripcion AS descripcion,
        p.IdCategoria AS categoriaId,
        ISNULL(c.Nombre, 'Tableros de Melamina') AS categoriaNombre,
        p.Marca AS marca,
        p.EspesorMm AS espesorMm,
        p.Dimensiones AS dimensiones,
        p.UnidadMedida AS unidadMedida,
        p.PesoUnitarioKg AS pesoUnitarioKg,
        p.PrecioVenta AS precioVenta,
        p.CostoCompra AS costoCompra,
        p.StockActual AS stockActual,
        p.StockMinimo AS stockMinimo,
        p.StockMaximo AS stockMaximo,
        p.IdUbicacion AS ubicacionId,
        ISNULL(u.CodigoUbicacion, 'ZONA-A-P-01-R-01-N-1') AS ubicacionCodigo,
        p.ClasificacionABC AS clasificacionABC,
        ISNULL(pp.IdProveedor, 1) AS proveedorId,
        ISNULL(prov.RazonSocial, 'Arauco Perú S.A.C.') AS proveedorNombre,
        p.Activo AS activo
      FROM Productos p
      LEFT JOIN Categorias c ON p.IdCategoria = c.IdCategoria
      LEFT JOIN UbicacionesAlmacen u ON p.IdUbicacion = u.IdUbicacion
      LEFT JOIN ProductoProveedores pp ON p.IdProducto = pp.IdProducto AND pp.EsProveedorPrincipal = 1
      LEFT JOIN Proveedores prov ON pp.IdProveedor = prov.IdProveedor
      WHERE p.Activo = 1
      ORDER BY p.IdProducto;
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint para consultar movimientos desde SQL Server
app.get('/api/movimientos', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
        m.IdMovimiento AS id,
        m.IdProducto AS productoId,
        p.Nombre AS productoNombre,
        p.CodigoSKU AS sku,
        m.TipoMovimiento AS tipo,
        m.Cantidad AS cantidad,
        m.StockAnterior AS stockAnterior,
        m.StockPosterior AS stockPosterior,
        m.CostoUnitario AS costoUnitario,
        m.CostoTotal AS total,
        m.DocumentoReferencia AS comprobante,
        m.IdUsuario AS usuarioId,
        ISNULL(u.Nombres + ' ' + u.Apellidos, 'Administrador') AS usuarioNombre,
        m.FechaMovimiento AS fecha,
        m.Observacion AS observacion
      FROM MovimientosInventario m
      INNER JOIN Productos p ON m.IdProducto = p.IdProducto
      LEFT JOIN Usuarios u ON m.IdUsuario = u.IdUsuario
      ORDER BY m.IdMovimiento DESC;
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Endpoint para consultar alertas de reabastecimiento en vivo
app.get('/api/alertas', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM vw_AlertasReabastecimiento;');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Endpoint para consultar Kardex desde SQL Server
app.get('/api/kardex', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
        k.IdKardex AS id,
        k.IdProducto AS productoId,
        k.FechaRegistro AS fecha,
        k.TipoOperacion AS tipoOperacion,
        k.DocumentoReferencia AS comprobante,
        k.CantidadEntrada AS cantEntrada,
        k.CostoUnitarioEntrada AS costoUnitEntrada,
        k.TotalEntrada AS totalEntrada,
        k.CantidadSalida AS cantSalida,
        k.CostoUnitarioSalida AS costoUnitSalida,
        k.TotalSalida AS totalSalida,
        k.CantidadSaldo AS cantSaldo,
        k.CostoUnitarioPromedio AS costoPromedio,
        k.TotalSaldo AS totalSaldo
      FROM Kardex k
      ORDER BY k.IdKardex DESC;
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Endpoint para registrar un movimiento en SQL Server en tiempo real (RF-16 y RF-17)
app.post('/api/movimientos', async (req, res) => {
  try {
    const { sku, tipo, cantidad, costoUnitario, comprobante, observacion, usuarioId } = req.body;
    const p = await getPool();

    // 1. Buscar producto por SKU
    const prodRes = await p.request()
      .input('sku', sql.VarChar, String(sku))
      .query('SELECT TOP 1 IdProducto, StockActual, CostoCompra, PrecioVenta, Nombre FROM Productos WHERE CodigoSKU = @sku;');

    if (prodRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: `Producto con SKU '${sku}' no encontrado en SQL Server` });
    }

    const prod = prodRes.recordset[0];
    const qty = Number(cantidad);
    const cost = Number(costoUnitario || prod.CostoCompra);
    const stockAnterior = prod.StockActual;
    let stockPosterior = stockAnterior;

    const esEntrada = ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(tipo);
    const esSalida = ['SALIDA_VENTA', 'AJUSTE_NEGATIVO', 'MERMA'].includes(tipo);

    if (esEntrada) {
      stockPosterior = stockAnterior + qty;
    } else if (esSalida) {
      if (stockAnterior < qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuficiente en SQL Server para '${prod.Nombre}'. Disponible: ${stockAnterior}, Solicitado: ${qty}` 
        });
      }
      stockPosterior = stockAnterior - qty;
    }

    // Transacción atómica en SQL Server
    const transaction = new sql.Transaction(p);
    await transaction.begin();

    try {
      // a. Actualizar Stock en Productos
      await transaction.request()
        .input('stockPosterior', sql.Int, stockPosterior)
        .input('idProd', sql.Int, prod.IdProducto)
        .query('UPDATE Productos SET StockActual = @stockPosterior, FechaUltimaActualizacion = SYSDATETIME() WHERE IdProducto = @idProd;');

      // b. Insertar en MovimientosInventario
      const movRes = await transaction.request()
        .input('idProd', sql.Int, prod.IdProducto)
        .input('idUser', sql.Int, Number(usuarioId) || 1)
        .input('tipo', sql.VarChar, tipo)
        .input('cantidad', sql.Int, qty)
        .input('stockAnt', sql.Int, stockAnterior)
        .input('stockPost', sql.Int, stockPosterior)
        .input('costoUnit', sql.Decimal(12, 2), cost)
        .input('docRef', sql.VarChar, comprobante || `MOV-${Date.now().toString().slice(-6)}`)
        .input('obs', sql.VarChar, observacion || '')
        .query(`
          INSERT INTO MovimientosInventario (IdProducto, IdUsuario, TipoMovimiento, Cantidad, StockAnterior, StockPosterior, CostoUnitario, DocumentoReferencia, Observacion)
          OUTPUT INSERTED.IdMovimiento
          VALUES (@idProd, @idUser, @tipo, @cantidad, @stockAnt, @stockPost, @costoUnit, @docRef, @obs);
        `);

      const idMovimiento = movRes.recordset[0].IdMovimiento;

      // c. Insertar en Kardex
      await transaction.request()
        .input('idProd', sql.Int, prod.IdProducto)
        .input('idMov', sql.BigInt, idMovimiento)
        .input('tipoOp', sql.VarChar, tipo)
        .input('docRef', sql.VarChar, comprobante || `MOV-${Date.now().toString().slice(-6)}`)
        .input('cantEnt', sql.Int, esEntrada ? qty : 0)
        .input('costoEnt', sql.Decimal(12, 2), esEntrada ? cost : 0)
        .input('totalEnt', sql.Decimal(14, 2), esEntrada ? (qty * cost) : 0)
        .input('cantSal', sql.Int, esSalida ? qty : 0)
        .input('costoSal', sql.Decimal(12, 2), esSalida ? cost : 0)
        .input('totalSal', sql.Decimal(14, 2), esSalida ? (qty * cost) : 0)
        .input('saldo', sql.Int, stockPosterior)
        .input('costoProm', sql.Decimal(12, 2), cost)
        .input('totalSaldo', sql.Decimal(14, 2), stockPosterior * cost)
        .query(`
          INSERT INTO Kardex (IdProducto, IdMovimiento, TipoOperacion, DocumentoReferencia, CantidadEntrada, CostoUnitarioEntrada, TotalEntrada, CantidadSalida, CostoUnitarioSalida, TotalSalida, CantidadSaldo, CostoUnitarioPromedio, TotalSaldo)
          VALUES (@idProd, @idMov, @tipoOp, @docRef, @cantEnt, @costoEnt, @totalEnt, @cantSal, @costoSal, @totalSal, @saldo, @costoProm, @totalSaldo);
        `);

      await transaction.commit();

      res.json({
        success: true,
        message: 'Movimiento asentado con éxito en SQL Server (SSMS)',
        idMovimiento,
        stockAnterior,
        stockPosterior
      });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (error) {
    console.error('Error al registrar movimiento en SQL Server:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API de Base de Datos ejecutándose en http://localhost:${PORT}`);
  console.log(`🔗 Conectado con SQL Server RepresentacionesMartinDB en puerto 1434.`);
});
