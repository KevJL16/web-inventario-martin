-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Datos adicionales SOLO para la base de pruebas (RepresentacionesMartinDB_Pruebas)
-- Los carga automáticamente: npm run db:pruebas:reset
-- Cubren casos de prueba que los datos semilla no permiten ejecutar.
-- ====================================================================================

IF DB_NAME() NOT LIKE '%[_]Pruebas'
BEGIN
    RAISERROR('Este script solo se ejecuta en una base de pruebas (nombre terminado en _Pruebas).', 16, 1);
    SET NOEXEC ON;
END
GO

INSERT INTO Productos (IdCategoria, IdUbicacion, CodigoSKU, CodigoBarras, Nombre, Descripcion, Marca, EspesorMm, Dimensiones, UnidadMedida, PesoUnitarioKg, PrecioVenta, CostoCompra, StockActual, StockMinimo, StockMaximo, ClasificacionABC, Activo)
VALUES
-- CP-11: producto bajo el stock mínimo (stock 10 < mínimo 15)
(2, 4, 'DRY-PER-ACE-89', '7751234009001', 'Perfil de Acero Galvanizado Parante 89mm x 3m', 'Perfil estructural para tabiquería drywall (dato de prueba)', 'Gyplac', 0.45, '0.089 x 3.00 m', 'Unidad', 2.80, 18.50, 12.40, 10, 15, 200, 'B', 1),
-- HU-004 / CP de borde: producto con stock 1 (descontar 2 debe rechazarse)
(5, 8, 'HER-BIS-CAN-35', '7751234009002', 'Bisagra Cangrejo Cierre Suave 35mm (Par)', 'Bisagra para puertas de mueble (dato de prueba)', 'Hettich', NULL, '35 mm', 'Par', 0.15, 9.90, 5.20, 1, 5, 300, 'C', 1),
-- CP-15 / HU-004: producto dado de baja (no admite ajustes)
(5, 9, 'HER-PEG-EXT-01', '7751234009003', 'Pegamento Extra (Descontinuado)', 'Producto inactivo para pruebas de baja lógica', 'Genérico', NULL, '1 L', 'Unidad', 1.10, 25.00, 15.00, 30, 5, 100, 'C', 0);
GO

PRINT 'Datos de prueba cargados.';
GO
SET NOEXEC OFF;
GO
