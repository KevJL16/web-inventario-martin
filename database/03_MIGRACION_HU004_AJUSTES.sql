-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Migración HU-004 (Registro de mermas justificadas) para bases ya creadas
--
-- * Actualiza sp_RegistrarMovimiento: la bitácora guarda el SKU real y la observación
--   (motivo y justificación del ajuste).
-- * Actualiza sp_AjusteInventarioManual: folio único, validaciones de negocio y
--   resultado con el ajuste registrado.
-- * Concede a martin_app (si existe) permiso para ejecutarlo. El procedimiento escribe
--   en AjustesInventario, Productos, MovimientosInventario, Kardex y BitacoraAuditoria
--   por encadenamiento de propiedad, sin dar a martin_app permisos directos sobre ellas.
--
-- Ejecutar conectado a RepresentacionesMartinDB (local o Azure). Es re-ejecutable.
-- Las bases creadas con 01_ESQUEMA_Y_DATOS.sql actualizado ya incluyen este procedimiento.
-- ====================================================================================

IF DB_NAME() = 'master'
BEGIN
    RAISERROR('Estás conectado a master. Selecciona la base RepresentacionesMartinDB y vuelve a ejecutar.', 16, 1);
    SET NOEXEC ON;
END
GO

CREATE OR ALTER PROCEDURE sp_RegistrarMovimiento
    @IdProducto INT,
    @IdUsuario INT,
    @TipoMovimiento VARCHAR(30), -- 'ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA'
    @Cantidad INT,
    @CostoUnitario DECIMAL(12,2),
    @DocumentoReferencia VARCHAR(100),
    @Observacion VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar existencia y estado del producto
        DECLARE @StockActual INT, @StockNuevo INT, @NombreProducto VARCHAR(200), @CodigoSKU VARCHAR(50);
        SELECT @StockActual = StockActual, @NombreProducto = Nombre, @CodigoSKU = CodigoSKU
        FROM Productos WITH (UPDLOCK, HOLDLOCK)
        WHERE IdProducto = @IdProducto AND Activo = 1;

        IF @StockActual IS NULL
        BEGIN
            RAISERROR('El producto especificado no existe o está inactivo.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Determinar efecto sobre el stock
        IF @TipoMovimiento IN ('ENTRADA_COMPRA', 'AJUSTE_POSITIVO')
        BEGIN
            SET @StockNuevo = @StockActual + @Cantidad;
        END
        ELSE IF @TipoMovimiento IN ('SALIDA_VENTA', 'AJUSTE_NEGATIVO', 'MERMA')
        BEGIN
            IF @StockActual < @Cantidad
            BEGIN
                RAISERROR('Stock insuficiente para el producto %s. Disponible: %d, Solicitado: %d', 16, 1, @NombreProducto, @StockActual, @Cantidad);
                ROLLBACK TRANSACTION;
                RETURN;
            END
            SET @StockNuevo = @StockActual - @Cantidad;
        END
        ELSE
        BEGIN
            RAISERROR('Tipo de movimiento no reconocido.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 1. Actualizar Stock en Productos
        UPDATE Productos 
        SET StockActual = @StockNuevo,
            FechaUltimaActualizacion = SYSDATETIME()
        WHERE IdProducto = @IdProducto;

        -- 2. Insertar en MovimientosInventario
        DECLARE @IdMovimiento BIGINT;
        INSERT INTO MovimientosInventario (
            IdProducto, IdUsuario, TipoMovimiento, Cantidad, 
            StockAnterior, StockPosterior, CostoUnitario, DocumentoReferencia, Observacion, FechaMovimiento
        )
        VALUES (
            @IdProducto, @IdUsuario, @TipoMovimiento, @Cantidad, 
            @StockActual, @StockNuevo, @CostoUnitario, @DocumentoReferencia, @Observacion, SYSDATETIME()
        );
        SET @IdMovimiento = SCOPE_IDENTITY();

        -- 3. Calcular y Asentar en Kardex (Promedio Ponderado)
        DECLARE @CantEntrada INT = 0, @CostoEntrada DECIMAL(12,2) = 0, @TotEntrada DECIMAL(14,2) = 0;
        DECLARE @CantSalida INT = 0, @CostoSalida DECIMAL(12,2) = 0, @TotSalida DECIMAL(14,2) = 0;
        DECLARE @CostoPromedio DECIMAL(12,2), @TotalSaldo DECIMAL(14,2);

        IF @TipoMovimiento IN ('ENTRADA_COMPRA', 'AJUSTE_POSITIVO')
        BEGIN
            SET @CantEntrada = @Cantidad;
            SET @CostoEntrada = @CostoUnitario;
            SET @TotEntrada = @Cantidad * @CostoUnitario;
            SET @CostoPromedio = @CostoUnitario;
            SET @TotalSaldo = @StockNuevo * @CostoPromedio;
        END
        ELSE
        BEGIN
            SET @CantSalida = @Cantidad;
            SET @CostoSalida = @CostoUnitario;
            SET @TotSalida = @Cantidad * @CostoUnitario;
            SET @CostoPromedio = @CostoUnitario;
            SET @TotalSaldo = @StockNuevo * @CostoPromedio;
        END

        INSERT INTO Kardex (
            IdProducto, IdMovimiento, FechaRegistro, TipoOperacion, DocumentoReferencia,
            CantidadEntrada, CostoUnitarioEntrada, TotalEntrada,
            CantidadSalida, CostoUnitarioSalida, TotalSalida,
            CantidadSaldo, CostoUnitarioPromedio, TotalSaldo
        )
        VALUES (
            @IdProducto, @IdMovimiento, SYSDATETIME(), @TipoMovimiento, @DocumentoReferencia,
            @CantEntrada, @CostoEntrada, @TotEntrada,
            @CantSalida, @CostoSalida, @TotSalida,
            @StockNuevo, @CostoPromedio, @TotalSaldo
        );

        -- 4. Registrar en Bitácora de Auditoría (RF-22)
        INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion)
        VALUES (
            @IdUsuario, 
            'MOVIMIENTO_' + @TipoMovimiento, 
            'INVENTARIO', 
            -- SKU real (antes se escribía el IdProducto) y la observación, que en los ajustes contiene motivo y justificación (HU-004 CA-2)
            CONCAT('Producto: ', @NombreProducto, ' (SKU: ', @CodigoSKU, '), Cantidad: ', @Cantidad, ', Stock Anterior: ', @StockActual, ', Stock Nuevo: ', @StockNuevo, ', Doc: ', @DocumentoReferencia,
                   CASE WHEN LEN(ISNULL(@Observacion, '')) > 0 THEN CONCAT(' | ', @Observacion) ELSE '' END)
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AjusteInventarioManual
    @IdProducto INT,
    @IdUsuarioSolicitante INT,
    @IdUsuarioAprobador INT,
    @TipoAjuste VARCHAR(20), -- 'FALTANTE', 'SOBRANTE', 'MERMA_DANO'
    @CantidadAjuste INT,
    @MotivoJustificado VARCHAR(100),
    @DetalleJustificacion VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Validaciones de negocio (HU-004 / RF-20): los errores 5000x se devuelven al usuario
    IF @TipoAjuste IS NULL OR @TipoAjuste NOT IN ('FALTANTE', 'SOBRANTE', 'MERMA_DANO')
        THROW 50001, 'Tipo de ajuste no válido. Use FALTANTE, SOBRANTE o MERMA_DANO.', 1;
    IF @CantidadAjuste IS NULL OR @CantidadAjuste <= 0
        THROW 50002, 'La cantidad del ajuste debe ser mayor a 0.', 1;
    IF LEN(LTRIM(RTRIM(ISNULL(@MotivoJustificado, '')))) = 0
        THROW 50003, 'El motivo del ajuste es obligatorio.', 1;
    IF LEN(LTRIM(RTRIM(ISNULL(@DetalleJustificacion, '')))) = 0
        THROW 50004, 'La justificación técnica del ajuste es obligatoria.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StockActual INT, @CostoUnitario DECIMAL(12,2), @NuevoStockFisico INT;
        SELECT @StockActual = StockActual, @CostoUnitario = CostoCompra
        FROM Productos WITH (UPDLOCK, HOLDLOCK)
        WHERE IdProducto = @IdProducto AND Activo = 1;

        IF @StockActual IS NULL
            THROW 50005, 'El producto especificado no existe o está inactivo.', 1;

        IF @TipoAjuste IN ('FALTANTE', 'MERMA_DANO')
            SET @NuevoStockFisico = @StockActual - @CantidadAjuste;
        ELSE
            SET @NuevoStockFisico = @StockActual + @CantidadAjuste;

        IF @NuevoStockFisico < 0
        BEGIN
            DECLARE @MsgStock NVARCHAR(200) = CONCAT('No se puede descontar más del stock actual (', @StockActual, ' unid.).');
            THROW 50006, @MsgStock, 1;
        END

        -- Folio único derivado del Id: AJU-2026-00001 (el formato anterior por minuto podía repetirse)
        DECLARE @IdAjuste INT, @Folio VARCHAR(30);
        INSERT INTO AjustesInventario (
            NumeroAjuste, IdProducto, IdUsuarioSolicitante, IdUsuarioAprobador,
            TipoAjuste, CantidadAjuste, StockSistema, StockFisicoReal,
            MotivoJustificado, DetalleJustificacion, FechaAjuste
        )
        VALUES (
            CONCAT('TMP-', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 24)), @IdProducto, @IdUsuarioSolicitante, @IdUsuarioAprobador,
            @TipoAjuste, @CantidadAjuste, @StockActual, @NuevoStockFisico,
            LTRIM(RTRIM(@MotivoJustificado)), LTRIM(RTRIM(@DetalleJustificacion)), SYSDATETIME()
        );
        SET @IdAjuste = SCOPE_IDENTITY();
        SET @Folio = CONCAT('AJU-', YEAR(SYSDATETIME()), '-', RIGHT(CONCAT('00000', @IdAjuste), 5));
        UPDATE AjustesInventario SET NumeroAjuste = @Folio WHERE IdAjuste = @IdAjuste;

        -- Registrar movimiento correspondiente (actualiza stock, Kardex y bitácora)
        DECLARE @TipoMov VARCHAR(30);
        IF @TipoAjuste = 'SOBRANTE'
            SET @TipoMov = 'AJUSTE_POSITIVO';
        ELSE IF @TipoAjuste = 'MERMA_DANO'
            SET @TipoMov = 'MERMA';
        ELSE
            SET @TipoMov = 'AJUSTE_NEGATIVO';

        DECLARE @Observacion VARCHAR(500) = LEFT(CONCAT('[Ajuste] ', LTRIM(RTRIM(@MotivoJustificado)), ': ', LTRIM(RTRIM(@DetalleJustificacion))), 500);
        EXEC sp_RegistrarMovimiento
            @IdProducto = @IdProducto,
            @IdUsuario = @IdUsuarioAprobador,
            @TipoMovimiento = @TipoMov,
            @Cantidad = @CantidadAjuste,
            @CostoUnitario = @CostoUnitario,
            @DocumentoReferencia = @Folio,
            @Observacion = @Observacion;

        COMMIT TRANSACTION;

        SELECT @IdAjuste AS IdAjuste, @Folio AS NumeroAjuste, @StockActual AS StockAnterior, @NuevoStockFisico AS StockNuevo;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

IF USER_ID('martin_app') IS NOT NULL
BEGIN
    GRANT EXECUTE ON dbo.sp_AjusteInventarioManual TO martin_app;
    PRINT 'Permiso EXECUTE sobre sp_AjusteInventarioManual concedido a martin_app.';
END
GO

PRINT 'Migración HU-004 aplicada.';
GO
SET NOEXEC OFF;
GO
