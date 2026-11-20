-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- DATOS DE DEMOSTRACIÓN (ficticios): {{RESUMEN}}
--
-- Archivo generado por database/herramientas/generarDatosDemo.mjs: no editar a mano.
--
-- * Parte del stock actual de cada producto y avanza en orden cronológico: no vende más
--   de lo disponible y, cuando un producto baja del mínimo, registra una compra de
--   reposición dos días después. Los últimos días quedan sin reponer, para que haya
--   alertas de stock bajo.
-- * Cada operación actualiza Productos, MovimientosInventario y Kardex; las mermas y
--   ajustes también AjustesInventario (folio AJU-AAAA-NNNNN).
-- * Crea la cuenta vendedor2@rep-martin.com (sin contraseña utilizable).
--
-- Requisitos: ejecutar antes 05_ROL_VENDEDOR.sql y hacerlo con un usuario administrador
-- (martin_app no tiene permisos suficientes). Un solo lote, sin GO.
-- No se ejecuta en bases de pruebas (_Pruebas) ni dos veces en la misma base.
-- ====================================================================================

IF DB_NAME() = 'master'
BEGIN
    RAISERROR('Estás conectado a master. Selecciona la base RepresentacionesMartinDB y vuelve a ejecutar.', 16, 1);
    RETURN;
END
IF DB_NAME() LIKE '%[_]Pruebas'
BEGIN
    RAISERROR('Los datos de demostración no se cargan en la base de pruebas: las pruebas automáticas esperan datos exactos.', 16, 1);
    RETURN;
END
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Vendedor')
BEGIN
    RAISERROR('Falta el rol Vendedor. Ejecuta primero database/05_ROL_VENDEDOR.sql.', 16, 1);
    RETURN;
END
IF EXISTS (SELECT 1 FROM BitacoraAuditoria WHERE Accion = 'DATOS_DEMO_CARGADOS')
BEGIN
    PRINT 'Los datos de demostración ya estaban cargados en esta base. No se hizo ningún cambio.';
    RETURN;
END

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Segunda cuenta de vendedor, para ver ventas de varias personas
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE CorreoCorporativo = 'vendedor2@rep-martin.com')
    INSERT INTO Usuarios (IdRol, Nombres, Apellidos, CorreoCorporativo, Telefono, Direccion, PasswordHash, RequiereCambioPassword, Activo)
    SELECT IdRol, 'Diego Alonso', 'Huamán Torres', 'vendedor2@rep-martin.com', '983562147', 'Jr. Huancavelica 815, Cercado de Lima', 'HASH_VENDEDOR2_2026', 0, 1
    FROM Roles WHERE NombreRol = 'Vendedor';

DECLARE @IdAdmin INT = (SELECT IdUsuario FROM Usuarios WHERE CorreoCorporativo = 'administrador@rep-martin.com');
DECLARE @IdAlmacen INT = (SELECT IdUsuario FROM Usuarios WHERE CorreoCorporativo = 'almacen@rep-martin.com');
DECLARE @IdVend1 INT = (SELECT IdUsuario FROM Usuarios WHERE CorreoCorporativo = 'vendedor@rep-martin.com');
DECLARE @IdVend2 INT = (SELECT IdUsuario FROM Usuarios WHERE CorreoCorporativo = 'vendedor2@rep-martin.com');
IF @IdAdmin IS NULL OR @IdAlmacen IS NULL OR @IdVend1 IS NULL OR @IdVend2 IS NULL
BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('Faltan cuentas base (administrador@, almacen@ o vendedor@). Ejecuta 05_ROL_VENDEDOR.sql.', 16, 1);
    RETURN;
END

-- Las fechas se generan en hora de Lima. En Azure SQL el reloj está en UTC (+5 h),
-- así que se guarda la hora UTC equivalente; en un SQL Server local de Lima el desfase es 0.
DECLARE @Ahora DATETIME2 = SYSDATETIME();
DECLARE @AhoraLima DATETIME2 = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'SA Pacific Standard Time' AS DATETIME2);
DECLARE @Desfase INT = DATEDIFF(minute, @AhoraLima, @Ahora);
DECLARE @HoyLima DATE = CAST(@AhoraLima AS DATE);

CREATE TABLE #Eventos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Dia INT NULL,               -- días antes de hoy
    Minuto INT NULL,            -- minuto del día (hora de Lima)
    Fecha DATETIME2 NULL,       -- fecha y hora que se guarda
    Sku VARCHAR(50) NOT NULL,
    Tipo VARCHAR(20) NOT NULL,  -- VENTA, VENTA_GRANDE, COMPRA, MERMA_DANO, FALTANTE, SOBRANTE
    Cantidad INT NOT NULL,
    Usuario CHAR(1) NOT NULL,   -- A administrador, L almacén, V vendedor, W vendedor2
    Doc VARCHAR(100) NULL,
    Obs VARCHAR(500) NULL,
    Motivo VARCHAR(100) NULL,
    Procesado BIT NOT NULL DEFAULT 0
);

{{EVENTOS}}

UPDATE #Eventos
SET Fecha = DATEADD(minute, Minuto + @Desfase, CAST(DATEADD(day, -Dia, @HoyLima) AS DATETIME2));
-- Nada en el futuro: las ventas de "hoy" posteriores a la hora actual pasan a minutos antes
UPDATE #Eventos SET Fecha = DATEADD(minute, -(5 + Id % 90), @Ahora) WHERE Fecha > @Ahora;

DECLARE @Id INT, @Fecha DATETIME2, @Sku VARCHAR(50), @Tipo VARCHAR(20), @Cant INT, @U CHAR(1),
        @Doc VARCHAR(100), @Obs VARCHAR(500), @Motivo VARCHAR(100);
DECLARE @IdProd INT, @Stock INT, @Costo DECIMAL(12,2), @Precio DECIMAL(12,2), @Min INT, @Max INT,
        @IdUser INT, @IdMov BIGINT, @Nuevo INT, @TipoMov VARCHAR(30), @IdAjuste INT, @Folio VARCHAR(30),
        @Entra BIT, @FechaCompra DATETIME2;
DECLARE @Ventas INT = 0, @Compras INT = 0, @Ajustes INT = 0;

WHILE 1 = 1
BEGIN
    SET @Id = NULL;
    SELECT TOP 1 @Id = Id, @Fecha = Fecha, @Sku = Sku, @Tipo = Tipo, @Cant = Cantidad, @U = Usuario,
                 @Doc = Doc, @Obs = Obs, @Motivo = Motivo
    FROM #Eventos WHERE Procesado = 0 ORDER BY Fecha, Id;
    IF @Id IS NULL BREAK;
    UPDATE #Eventos SET Procesado = 1 WHERE Id = @Id;

    SET @IdProd = NULL;
    SELECT @IdProd = IdProducto, @Stock = StockActual, @Costo = CostoCompra, @Precio = PrecioVenta,
           @Min = StockMinimo, @Max = StockMaximo
    FROM Productos WHERE CodigoSKU = @Sku AND Activo = 1;
    IF @IdProd IS NULL CONTINUE;

    SET @IdUser = CASE @U WHEN 'A' THEN @IdAdmin WHEN 'L' THEN @IdAlmacen WHEN 'V' THEN @IdVend1 ELSE @IdVend2 END;

    -- Pedido grande: deja el producto en dos tercios de su stock mínimo
    IF @Tipo = 'VENTA_GRANDE'
        SELECT @Cant = @Stock - (@Min * 2) / 3, @Tipo = 'VENTA';

    IF @Tipo = 'VENTA'
    BEGIN
        IF @Cant > @Stock SET @Cant = @Stock;          -- se vende lo disponible
        IF @Cant <= 0 CONTINUE;
        SET @Nuevo = @Stock - @Cant;
        SET @TipoMov = 'SALIDA_VENTA';
        SET @Entra = 0;
    END
    ELSE IF @Tipo = 'COMPRA'
    BEGIN
        SET @Cant = @Max - @Stock;                     -- reposición hasta el stock máximo
        IF @Cant <= 0 CONTINUE;
        SET @Nuevo = @Stock + @Cant;
        SET @TipoMov = 'ENTRADA_COMPRA';
        SET @Entra = 1;
    END
    ELSE
    BEGIN
        SET @Entra = CASE WHEN @Tipo = 'SOBRANTE' THEN 1 ELSE 0 END;
        IF @Entra = 0 AND @Cant > @Stock SET @Cant = @Stock;
        IF @Cant <= 0 CONTINUE;
        SET @Nuevo = CASE WHEN @Entra = 1 THEN @Stock + @Cant ELSE @Stock - @Cant END;
        SET @TipoMov = CASE @Tipo WHEN 'MERMA_DANO' THEN 'MERMA' WHEN 'FALTANTE' THEN 'AJUSTE_NEGATIVO' ELSE 'AJUSTE_POSITIVO' END;

        -- Ajuste justificado: lo solicita Almacén y lo aprueba el Administrador (HU-004)
        INSERT INTO AjustesInventario (NumeroAjuste, IdProducto, IdUsuarioSolicitante, IdUsuarioAprobador, TipoAjuste,
                                       CantidadAjuste, StockSistema, StockFisicoReal, MotivoJustificado, DetalleJustificacion, FechaAjuste)
        VALUES (CONCAT('TMP-', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 24)), @IdProd, @IdAlmacen, @IdAdmin, @Tipo,
                @Cant, @Stock, @Nuevo, @Motivo, @Obs, @Fecha);
        SET @IdAjuste = SCOPE_IDENTITY();
        SET @Folio = CONCAT('AJU-', YEAR(@Fecha), '-', RIGHT(CONCAT('00000', @IdAjuste), 5));
        UPDATE AjustesInventario SET NumeroAjuste = @Folio WHERE IdAjuste = @IdAjuste;
        SET @Doc = @Folio;
        SET @Obs = LEFT(CONCAT('[Ajuste] ', @Motivo, ': ', @Obs), 500);
        SET @Ajustes += 1;
    END

    IF @Tipo = 'COMPRA'
        SET @Doc = CONCAT('FAC-E001-', RIGHT(CONCAT('000000', 4500 + @Id), 6));

    -- Las ventas guardan el precio de venta (como la aplicación); compras y ajustes, el costo
    INSERT INTO MovimientosInventario (IdProducto, IdUsuario, TipoMovimiento, Cantidad, StockAnterior, StockPosterior,
                                       CostoUnitario, DocumentoReferencia, Observacion, FechaMovimiento)
    VALUES (@IdProd, @IdUser, @TipoMov, @Cant, @Stock, @Nuevo,
            CASE WHEN @TipoMov = 'SALIDA_VENTA' THEN @Precio ELSE @Costo END, @Doc, @Obs, @Fecha);
    SET @IdMov = SCOPE_IDENTITY();

    -- Kardex valorizado al costo de compra
    INSERT INTO Kardex (IdProducto, IdMovimiento, FechaRegistro, TipoOperacion, DocumentoReferencia,
                        CantidadEntrada, CostoUnitarioEntrada, TotalEntrada,
                        CantidadSalida, CostoUnitarioSalida, TotalSalida,
                        CantidadSaldo, CostoUnitarioPromedio, TotalSaldo)
    VALUES (@IdProd, @IdMov, @Fecha, @TipoMov, @Doc,
            CASE WHEN @Entra = 1 THEN @Cant ELSE 0 END, CASE WHEN @Entra = 1 THEN @Costo ELSE 0 END, CASE WHEN @Entra = 1 THEN @Cant * @Costo ELSE 0 END,
            CASE WHEN @Entra = 0 THEN @Cant ELSE 0 END, CASE WHEN @Entra = 0 THEN @Costo ELSE 0 END, CASE WHEN @Entra = 0 THEN @Cant * @Costo ELSE 0 END,
            @Nuevo, @Costo, @Nuevo * @Costo);

    UPDATE Productos SET StockActual = @Nuevo, FechaUltimaActualizacion = @Fecha WHERE IdProducto = @IdProd;

    IF @TipoMov = 'SALIDA_VENTA' SET @Ventas += 1;
    IF @TipoMov = 'ENTRADA_COMPRA' SET @Compras += 1;

    -- Bajo el mínimo: compra de reposición dos días después a las 9:00 (hora de Lima),
    -- salvo que caiga en el último día (así quedan alertas de stock bajo para la demo)
    IF @Entra = 0 AND @Nuevo <= @Min
       AND NOT EXISTS (SELECT 1 FROM #Eventos WHERE Procesado = 0 AND Sku = @Sku AND Tipo = 'COMPRA')
    BEGIN
        SET @FechaCompra = DATEADD(minute, @Desfase + 9 * 60 + @Id % 50,
                                   CAST(DATEADD(day, 2, CAST(DATEADD(minute, -@Desfase, @Fecha) AS DATE)) AS DATETIME2));
        IF @FechaCompra < DATEADD(day, -1, @Ahora)
            INSERT INTO #Eventos (Fecha, Sku, Tipo, Cantidad, Usuario, Doc, Obs)
            VALUES (@FechaCompra, @Sku, 'COMPRA', 0, 'L', NULL, 'Reposición de stock: recepción de mercadería del proveedor principal.');
    END
END

INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion)
VALUES (@IdAdmin, 'DATOS_DEMO_CARGADOS', 'SISTEMA',
        CONCAT('Datos ficticios de demostración: ', @Ventas, ' ventas, ', @Compras, ' compras de reposición y ', @Ajustes, ' mermas o ajustes.'));

COMMIT TRANSACTION;
DROP TABLE #Eventos;

-- Recalcular la clasificación ABC con las nuevas ventas (RF-15)
EXEC sp_CalcularRotacionABC;

PRINT CONCAT('Datos de demostración cargados: ', @Ventas, ' ventas, ', @Compras, ' compras y ', @Ajustes, ' mermas o ajustes.');
