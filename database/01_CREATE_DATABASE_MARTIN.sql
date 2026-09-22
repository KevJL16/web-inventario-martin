-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Script DDL / DML para SQL Server Management Studio (SSMS)
-- Rubro: Maderero, Tableros de Melamina, Drywall, Pisos Laminados/Vinílicos y Muebles
-- Cobertura de Requerimientos Funcionales: RF-01 al RF-22
-- ====================================================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'RepresentacionesMartinDB')
BEGIN
    ALTER DATABASE RepresentacionesMartinDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE RepresentacionesMartinDB;
END
GO

CREATE DATABASE RepresentacionesMartinDB
COLLATE Modern_Spanish_CI_AS;
GO

USE RepresentacionesMartinDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ====================================================================================
-- 1. TABLAS DE SEGURIDAD, ROLES Y ACCESO (RF-01, RF-02, RF-03, RF-04, RF-21, RF-22)
-- ====================================================================================

-- RF-03 / RF-04: Gestión de Roles y Control de Acceso (RBAC)
CREATE TABLE Roles (
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL UNIQUE,
    Descripcion VARCHAR(200) NOT NULL,
    NivelJerarquico INT NOT NULL, -- 1: Administrador, 2: Gerencia, 3: Encargado de Almacén
    PermisosJSON NVARCHAR(MAX) NULL, -- Permisos granulares serializados
    FechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    Activo BIT DEFAULT 1
);
GO

-- RF-01, RF-21: Registro de Usuarios y Baja Lógica
CREATE TABLE Usuarios (
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    IdRol INT NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    CorreoCorporativo VARCHAR(150) NOT NULL UNIQUE,
    Telefono VARCHAR(20) NOT NULL,
    Direccion VARCHAR(250) NULL,
    PasswordHash VARCHAR(256) NOT NULL,
    RequiereCambioPassword BIT DEFAULT 1,
    Activo BIT DEFAULT 1, -- RF-21: Inactivación y baja lógica
    MotivoBaja VARCHAR(250) NULL,
    FechaBaja DATETIME2 NULL,
    FechaRegistro DATETIME2 DEFAULT SYSDATETIME(),
    UltimoAcceso DATETIME2 NULL,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (IdRol) REFERENCES Roles(IdRol)
);
GO

-- RF-02: Recuperación y Restablecimiento de Cuenta mediante Token
CREATE TABLE PasswordResets (
    IdReset INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL,
    TokenSeguridad VARCHAR(100) NOT NULL UNIQUE,
    FechaExpiracion DATETIME2 NOT NULL,
    Usado BIT DEFAULT 0,
    FechaUso DATETIME2 NULL,
    IpSolicitud VARCHAR(45) NULL,
    FechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_PasswordResets_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);
GO

-- RF-22: Bitácora de Auditoría de Acciones del Sistema (Logs Inmutables)
CREATE TABLE BitacoraAuditoria (
    IdLog BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NULL,
    Accion VARCHAR(50) NOT NULL, -- LOGIN, CREAR_PRODUCTO, AJUSTE_STOCK, CIERRE_DIARIO, etc.
    Modulo VARCHAR(50) NOT NULL, -- SEGURIDAD, CATALOGO, ALMACEN, KARDEX, ORDENES
    Descripcion NVARCHAR(MAX) NOT NULL,
    DatosAnteriores NVARCHAR(MAX) NULL,
    DatosNuevos NVARCHAR(MAX) NULL,
    DireccionIP VARCHAR(45) DEFAULT '127.0.0.1',
    FechaHora DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_BitacoraAuditoria_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);
GO

-- ====================================================================================
-- 2. TABLAS MAESTRAS DE CATÁLOGO Y ALMACÉN (RF-05, RF-06, RF-07, RF-08, RF-12)
-- ====================================================================================

-- Categorías especializadas del negocio maderero y acabados
CREATE TABLE Categorias (
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL UNIQUE,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(250) NULL,
    Activo BIT DEFAULT 1
);
GO

-- RF-12: Asignar y consultar ubicación física de mercadería pesada (Zona, Pasillo, Rack, Nivel)
CREATE TABLE UbicacionesAlmacen (
    IdUbicacion INT IDENTITY(1,1) PRIMARY KEY,
    Zona VARCHAR(20) NOT NULL,         -- Zona A: Melaminas y Tableros, Zona B: Drywall, Zona C: Pisos, Zona D: Herrajes
    Pasillo VARCHAR(10) NOT NULL,      -- P-01, P-02, P-03...
    Rack VARCHAR(10) NOT NULL,         -- R-01, R-02...
    Nivel VARCHAR(10) NOT NULL,        -- N-1 (Nivel suelo pesado), N-2 (Intermedio), N-3 (Superior liviano)
    CodigoUbicacion AS (Zona + '-' + Pasillo + '-' + Rack + '-' + Nivel) PERSISTED,
    CapacidadCargaKg DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
    CargaActualKg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    TipoMercaderia VARCHAR(50) NOT NULL, -- 'Tableros Melamina', 'Planchas Drywall', 'Pisos y Molduras', 'Herrajes'
    Activo BIT DEFAULT 1,
    CONSTRAINT UQ_Ubicacion_Fisica UNIQUE (Zona, Pasillo, Rack, Nivel)
);
GO

-- RF-13: Proveedores de la cadena de suministro
CREATE TABLE Proveedores (
    IdProveedor INT IDENTITY(1,1) PRIMARY KEY,
    RUC CHAR(11) NOT NULL UNIQUE,
    RazonSocial VARCHAR(150) NOT NULL,
    NombreComercial VARCHAR(100) NULL,
    ContactoPrincipal VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20) NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Direccion VARCHAR(250) NOT NULL,
    Ciudad VARCHAR(80) DEFAULT 'Lima',
    CalificacionEstrellas INT DEFAULT 5 CHECK (CalificacionEstrellas BETWEEN 1 AND 5),
    Activo BIT DEFAULT 1,
    FechaRegistro DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- RF-05, RF-06, RF-07, RF-08, RF-09, RF-10: Catálogo Maestro de Productos
CREATE TABLE Productos (
    IdProducto INT IDENTITY(1,1) PRIMARY KEY,
    IdCategoria INT NOT NULL,
    IdUbicacion INT NOT NULL,
    CodigoSKU VARCHAR(50) NOT NULL UNIQUE,
    CodigoBarras VARCHAR(50) NOT NULL UNIQUE,
    Nombre VARCHAR(200) NOT NULL,
    Descripcion VARCHAR(500) NULL,
    Marca VARCHAR(100) NOT NULL, -- Pelíkano, Vesto, Masisa, Gyplac, Volcán, Masisa, Ducasse
    EspesorMm DECIMAL(5,2) NULL, -- 15mm, 18mm, 5.5mm, 1/2 pulgada (12.7mm)
    Dimensiones VARCHAR(100) NULL, -- '2.15 x 2.44 m', '1.22 x 2.44 m', '1.20 x 0.19 m'
    UnidadMedida VARCHAR(30) NOT NULL, -- 'Plancha', 'M2', 'Unidad', 'Caja', 'Paquete'
    PesoUnitarioKg DECIMAL(8,2) NOT NULL DEFAULT 15.00,
    PrecioVenta DECIMAL(12,2) NOT NULL CHECK (PrecioVenta >= 0),
    CostoCompra DECIMAL(12,2) NOT NULL CHECK (CostoCompra >= 0),
    StockActual INT NOT NULL DEFAULT 0 CHECK (StockActual >= 0),
    StockMinimo INT NOT NULL DEFAULT 10 CHECK (StockMinimo >= 0), -- RF-09: Punto de pedido
    StockMaximo INT NOT NULL DEFAULT 150,
    ClasificacionABC CHAR(1) DEFAULT 'B' CHECK (ClasificacionABC IN ('A', 'B', 'C')), -- RF-15
    Activo BIT DEFAULT 1, -- RF-07: Baja lógica de producto
    FechaRegistro DATETIME2 DEFAULT SYSDATETIME(),
    FechaUltimaActualizacion DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT CK_Productos_Stock CHECK (StockMaximo >= StockMinimo),
    CONSTRAINT FK_Productos_Categorias FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria),
    CONSTRAINT FK_Productos_Ubicaciones FOREIGN KEY (IdUbicacion) REFERENCES UbicacionesAlmacen(IdUbicacion)
);
GO

-- Relación Producto-Proveedor con precios de compra pactados
CREATE TABLE ProductoProveedores (
    IdProducto INT NOT NULL,
    IdProveedor INT NOT NULL,
    CostoPactado DECIMAL(12,2) NOT NULL,
    CodigoArticuloProveedor VARCHAR(50) NULL,
    DiasEntregaEstimados INT DEFAULT 3,
    EsProveedorPrincipal BIT DEFAULT 1,
    PRIMARY KEY (IdProducto, IdProveedor),
    CONSTRAINT FK_PP_Productos FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto),
    CONSTRAINT FK_PP_Proveedores FOREIGN KEY (IdProveedor) REFERENCES Proveedores(IdProveedor)
);
GO

-- ====================================================================================
-- 3. ÓRDENES DE COMPRA Y CADENA DE SUMINISTRO (RF-13)
-- ====================================================================================

CREATE TABLE OrdenesCompra (
    IdOrdenCompra INT IDENTITY(1,1) PRIMARY KEY,
    NumeroOrden VARCHAR(30) NOT NULL UNIQUE, -- 'OC-2026-0001'
    IdProveedor INT NOT NULL,
    IdUsuarioSolicitante INT NOT NULL,
    IdUsuarioAprobador INT NULL,
    FechaEmision DATETIME2 DEFAULT SYSDATETIME(),
    FechaEsperada DATE NOT NULL,
    FechaRecepcion DATETIME2 NULL,
    Estado VARCHAR(30) NOT NULL DEFAULT 'Borrador' 
        CHECK (Estado IN ('Borrador', 'Solicitada', 'Aprobada', 'Recepcionada', 'Cancelada')),
    TotalBruto DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    IGV DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    TotalNeto DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    Observaciones VARCHAR(500) NULL,
    CONSTRAINT FK_OC_Proveedores FOREIGN KEY (IdProveedor) REFERENCES Proveedores(IdProveedor),
    CONSTRAINT FK_OC_UsuarioSol FOREIGN KEY (IdUsuarioSolicitante) REFERENCES Usuarios(IdUsuario),
    CONSTRAINT FK_OC_UsuarioAprob FOREIGN KEY (IdUsuarioAprobador) REFERENCES Usuarios(IdUsuario)
);
GO

CREATE TABLE DetalleOrdenesCompra (
    IdDetalleOC INT IDENTITY(1,1) PRIMARY KEY,
    IdOrdenCompra INT NOT NULL,
    IdProducto INT NOT NULL,
    CantidadSolicitada INT NOT NULL CHECK (CantidadSolicitada > 0),
    CantidadRecibida INT NOT NULL DEFAULT 0 CHECK (CantidadRecibida >= 0),
    CostoUnitario DECIMAL(12,2) NOT NULL CHECK (CostoUnitario >= 0),
    Subtotal AS (CantidadSolicitada * CostoUnitario) PERSISTED,
    CONSTRAINT FK_DetOC_Ordenes FOREIGN KEY (IdOrdenCompra) REFERENCES OrdenesCompra(IdOrdenCompra),
    CONSTRAINT FK_DetOC_Productos FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto)
);
GO

-- ====================================================================================
-- 4. MOVIMIENTOS, KARDEX, AJUSTES Y CIERRES (RF-16, RF-17, RF-19, RF-20)
-- ====================================================================================

-- RF-16: Captura y Trazabilidad en Tiempo Real de Movimientos
CREATE TABLE MovimientosInventario (
    IdMovimiento BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdProducto INT NOT NULL,
    IdUsuario INT NOT NULL,
    TipoMovimiento VARCHAR(30) NOT NULL 
        CHECK (TipoMovimiento IN ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA', 'TRASLADO')),
    Cantidad INT NOT NULL CHECK (Cantidad > 0),
    StockAnterior INT NOT NULL,
    StockPosterior INT NOT NULL,
    CostoUnitario DECIMAL(12,2) NOT NULL,
    CostoTotal AS (Cantidad * CostoUnitario) PERSISTED,
    DocumentoReferencia VARCHAR(100) NOT NULL, -- 'GR-001-2045', 'FAC-E001-893', 'AJU-2026-001'
    Observacion VARCHAR(500) NULL,
    FechaMovimiento DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Mov_Productos FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto),
    CONSTRAINT FK_Mov_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);
GO

-- RF-17: Hoja de Kardex Histórico Físico-Valorizado (Método Promedio Ponderado)
CREATE TABLE Kardex (
    IdKardex BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdProducto INT NOT NULL,
    IdMovimiento BIGINT NOT NULL,
    FechaRegistro DATETIME2 DEFAULT SYSDATETIME(),
    TipoOperacion VARCHAR(50) NOT NULL,
    DocumentoReferencia VARCHAR(100) NOT NULL,
    -- Entradas
    CantidadEntrada INT NOT NULL DEFAULT 0,
    CostoUnitarioEntrada DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    TotalEntrada DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    -- Salidas
    CantidadSalida INT NOT NULL DEFAULT 0,
    CostoUnitarioSalida DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    TotalSalida DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    -- Saldo Resultante
    CantidadSaldo INT NOT NULL,
    CostoUnitarioPromedio DECIMAL(12,2) NOT NULL,
    TotalSaldo DECIMAL(14,2) NOT NULL,
    CONSTRAINT FK_Kardex_Productos FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto),
    CONSTRAINT FK_Kardex_Movimientos FOREIGN KEY (IdMovimiento) REFERENCES MovimientosInventario(IdMovimiento)
);
GO

-- RF-20: Ajustes Manuales Justificados de Inventario (Conteo Físico / Mermas)
CREATE TABLE AjustesInventario (
    IdAjuste INT IDENTITY(1,1) PRIMARY KEY,
    NumeroAjuste VARCHAR(30) NOT NULL UNIQUE, -- 'AJU-2026-001'
    IdProducto INT NOT NULL,
    IdUsuarioSolicitante INT NOT NULL,
    IdUsuarioAprobador INT NOT NULL,
    TipoAjuste VARCHAR(20) NOT NULL CHECK (TipoAjuste IN ('FALTANTE', 'SOBRANTE', 'MERMA_DANO')),
    CantidadAjuste INT NOT NULL CHECK (CantidadAjuste > 0),
    StockSistema INT NOT NULL,
    StockFisicoReal INT NOT NULL,
    MotivoJustificado VARCHAR(100) NOT NULL, -- 'Tablero desportillado en descarga', 'Humedad en drywall', 'Diferencia en conteo cíclico', 'Golpe de montacargas'
    DetalleJustificacion VARCHAR(500) NOT NULL,
    FechaAjuste DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Ajustes_Productos FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto),
    CONSTRAINT FK_Ajustes_UsuarioSol FOREIGN KEY (IdUsuarioSolicitante) REFERENCES Usuarios(IdUsuario),
    CONSTRAINT FK_Ajustes_UsuarioAprob FOREIGN KEY (IdUsuarioAprobador) REFERENCES Usuarios(IdUsuario)
);
GO

-- RF-19: Consolidado de Cierre Diario de Movimientos
CREATE TABLE CierresDiarios (
    IdCierre INT IDENTITY(1,1) PRIMARY KEY,
    FechaJornada DATE NOT NULL UNIQUE,
    IdUsuarioCierre INT NOT NULL,
    TotalTransacciones INT NOT NULL DEFAULT 0,
    TotalUnidadesEntrada INT NOT NULL DEFAULT 0,
    TotalValorEntrada DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    TotalUnidadesSalida INT NOT NULL DEFAULT 0,
    TotalValorSalida DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    TotalAjustesMermas INT NOT NULL DEFAULT 0,
    StockFinalTotalUnidades INT NOT NULL DEFAULT 0,
    ValorizacionFinalInventario DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    DiscrepanciasDetectadas INT NOT NULL DEFAULT 0,
    Estado VARCHAR(20) NOT NULL DEFAULT 'CERRADO' CHECK (Estado IN ('ABIERTO', 'CERRADO', 'AUDITADO')),
    FirmaDigitalResponsable VARCHAR(256) NOT NULL,
    Observaciones VARCHAR(500) NULL,
    FechaHoraCierre DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Cierres_Usuarios FOREIGN KEY (IdUsuarioCierre) REFERENCES Usuarios(IdUsuario)
);
GO

-- ====================================================================================
-- 5. VISTAS OPERATIVAS Y ANALÍTICAS (RF-09, RF-10, RF-11, RF-14, RF-15, RF-18)
-- ====================================================================================

-- RF-09, RF-10: Vista de Alertas de Reabastecimiento y Bajo Stock
CREATE OR ALTER VIEW vw_AlertasReabastecimiento AS
SELECT 
    p.IdProducto,
    p.CodigoSKU,
    p.CodigoBarras,
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.StockActual,
    p.StockMinimo,
    p.StockMaximo,
    (p.StockMinimo - p.StockActual) AS UnidadesFaltantesParaMinimo,
    (p.StockMaximo - p.StockActual) AS UnidadesSugeridasReabastecer,
    CASE 
        WHEN p.StockActual = 0 THEN 'AGOTADO'
        WHEN p.StockActual <= (p.StockMinimo / 2) THEN 'CRITICO'
        WHEN p.StockActual <= p.StockMinimo THEN 'BAJO_STOCK'
        ELSE 'NORMAL'
    END AS EstadoAlerta,
    u.CodigoUbicacion,
    pr.RazonSocial AS ProveedorHabitual,
    pr.Telefono AS TelefonoProveedor
FROM Productos p
INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria
INNER JOIN UbicacionesAlmacen u ON p.IdUbicacion = u.IdUbicacion
LEFT JOIN ProductoProveedores pp ON p.IdProducto = pp.IdProducto AND pp.EsProveedorPrincipal = 1
LEFT JOIN Proveedores pr ON pp.IdProveedor = pr.IdProveedor
WHERE p.Activo = 1 AND p.StockActual <= p.StockMinimo;
GO

-- RF-18: Vista de Consulta Rápida de Stock para Almacenero (Optimizada)
CREATE OR ALTER VIEW vw_StockAlmacenero AS
SELECT 
    p.IdProducto,
    p.CodigoSKU,
    p.CodigoBarras,
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.Marca,
    p.EspesorMm,
    p.Dimensiones,
    p.UnidadMedida,
    p.StockActual AS StockDisponible,
    p.StockMinimo,
    u.Zona,
    u.Pasillo,
    u.Rack,
    u.Nivel,
    u.CodigoUbicacion,
    u.TipoMercaderia,
    p.PesoUnitarioKg,
    (p.StockActual * p.PesoUnitarioKg) AS PesoTotalAlmacenadoKg,
    CASE 
        WHEN p.StockActual = 0 THEN 'SIN STOCK'
        WHEN p.StockActual <= p.StockMinimo THEN 'REORDENAR'
        ELSE 'DISPONIBLE'
    END AS Disponibilidad
FROM Productos p
INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria
INNER JOIN UbicacionesAlmacen u ON p.IdUbicacion = u.IdUbicacion
WHERE p.Activo = 1;
GO

-- RF-11, RF-14: Vista de Reporte Valorizado de Inventario
CREATE OR ALTER VIEW vw_ReporteValorizadoInventario AS
SELECT 
    p.IdProducto,
    p.CodigoSKU,
    p.Nombre,
    c.Nombre AS Categoria,
    p.StockActual,
    p.CostoCompra AS CostoUnitarioPromedio,
    p.PrecioVenta,
    (p.StockActual * p.CostoCompra) AS ValorizacionCostoTotal,
    (p.StockActual * p.PrecioVenta) AS ValorizacionVentaEstimada,
    ((p.PrecioVenta - p.CostoCompra) * p.StockActual) AS MargenBrutoPotencial,
    p.ClasificacionABC,
    u.CodigoUbicacion
FROM Productos p
INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria
INNER JOIN UbicacionesAlmacen u ON p.IdUbicacion = u.IdUbicacion
WHERE p.Activo = 1;
GO

-- ====================================================================================
-- 6. STORED PROCEDURES TRANSACCIONALES (RF-16, RF-17, RF-19, RF-20, RF-15)
-- ====================================================================================

-- RF-16, RF-17: Registrar Movimiento Transaccional con Actualización Automática de Stock y Kardex
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
        DECLARE @StockActual INT, @StockNuevo INT, @NombreProducto VARCHAR(200);
        SELECT @StockActual = StockActual, @NombreProducto = Nombre 
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
            CONCAT('Producto: ', @NombreProducto, ' (SKU: ', @IdProducto, '), Cantidad: ', @Cantidad, ', Stock Anterior: ', @StockActual, ', Stock Nuevo: ', @StockNuevo, ', Doc: ', @DocumentoReferencia)
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

-- RF-20: Procedimiento de Ajuste Manual Justificado de Inventario
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

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StockActual INT, @CostoUnitario DECIMAL(12,2), @NuevoStockFisico INT;
        SELECT @StockActual = StockActual, @CostoUnitario = CostoCompra
        FROM Productos
        WHERE IdProducto = @IdProducto;

        IF @TipoAjuste IN ('FALTANTE', 'MERMA_DANO')
            SET @NuevoStockFisico = @StockActual - @CantidadAjuste;
        ELSE
            SET @NuevoStockFisico = @StockActual + @CantidadAjuste;

        -- Generar folio de ajuste
        DECLARE @Folio VARCHAR(30) = CONCAT('AJU-', FORMAT(SYSDATETIME(), 'yyyyMMdd-HHmm'), '-', @IdProducto);

        INSERT INTO AjustesInventario (
            NumeroAjuste, IdProducto, IdUsuarioSolicitante, IdUsuarioAprobador,
            TipoAjuste, CantidadAjuste, StockSistema, StockFisicoReal,
            MotivoJustificado, DetalleJustificacion, FechaAjuste
        )
        VALUES (
            @Folio, @IdProducto, @IdUsuarioSolicitante, @IdUsuarioAprobador,
            @TipoAjuste, @CantidadAjuste, @StockActual, @NuevoStockFisico,
            @MotivoJustificado, @DetalleJustificacion, SYSDATETIME()
        );

        -- Registrar movimiento correspondiente
        DECLARE @TipoMov VARCHAR(30);
        IF @TipoAjuste = 'SOBRANTE'
            SET @TipoMov = 'AJUSTE_POSITIVO';
        ELSE IF @TipoAjuste = 'MERMA_DANO'
            SET @TipoMov = 'MERMA';
        ELSE
            SET @TipoMov = 'AJUSTE_NEGATIVO';

        EXEC sp_RegistrarMovimiento
            @IdProducto = @IdProducto,
            @IdUsuario = @IdUsuarioAprobador,
            @TipoMovimiento = @TipoMov,
            @Cantidad = @CantidadAjuste,
            @CostoUnitario = @CostoUnitario,
            @DocumentoReferencia = @Folio,
            @Observacion = @DetalleJustificacion;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- RF-19: Procedimiento para Generar Consolidado de Cierre Diario de Movimientos
CREATE OR ALTER PROCEDURE sp_GenerarCierreDiario
    @FechaJornada DATE,
    @IdUsuarioCierre INT,
    @Observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM CierresDiarios WHERE FechaJornada = @FechaJornada AND Estado = 'CERRADO')
    BEGIN
        DECLARE @FechaStr VARCHAR(30) = CONVERT(VARCHAR(30), @FechaJornada, 120);
        RAISERROR('La jornada correspondiente a la fecha %s ya se encuentra cerrada.', 16, 1, @FechaStr);
        RETURN;
    END

    DECLARE @TotalTransacciones INT = 0;
    DECLARE @TotalEntradas INT = 0, @TotalValorEntrada DECIMAL(14,2) = 0;
    DECLARE @TotalSalidas INT = 0, @TotalValorSalida DECIMAL(14,2) = 0;
    DECLARE @TotalMermas INT = 0;
    DECLARE @StockFinalUnidades INT = 0;
    DECLARE @ValorizacionFinal DECIMAL(14,2) = 0;

    SELECT 
        @TotalTransacciones = COUNT(*),
        @TotalEntradas = ISNULL(SUM(CASE WHEN TipoMovimiento IN ('ENTRADA_COMPRA', 'AJUSTE_POSITIVO') THEN Cantidad ELSE 0 END), 0),
        @TotalValorEntrada = ISNULL(SUM(CASE WHEN TipoMovimiento IN ('ENTRADA_COMPRA', 'AJUSTE_POSITIVO') THEN (Cantidad * CostoUnitario) ELSE 0 END), 0),
        @TotalSalidas = ISNULL(SUM(CASE WHEN TipoMovimiento = 'SALIDA_VENTA' THEN Cantidad ELSE 0 END), 0),
        @TotalValorSalida = ISNULL(SUM(CASE WHEN TipoMovimiento = 'SALIDA_VENTA' THEN (Cantidad * CostoUnitario) ELSE 0 END), 0),
        @TotalMermas = ISNULL(SUM(CASE WHEN TipoMovimiento IN ('MERMA', 'AJUSTE_NEGATIVO') THEN Cantidad ELSE 0 END), 0)
    FROM MovimientosInventario
    WHERE CAST(FechaMovimiento AS DATE) = @FechaJornada;

    SELECT 
        @StockFinalUnidades = ISNULL(SUM(StockActual), 0),
        @ValorizacionFinal = ISNULL(SUM(StockActual * CostoCompra), 0)
    FROM Productos WHERE Activo = 1;

    DECLARE @Firma VARCHAR(256) = CONCAT('DIGITAL-SIGN-MARTINDAY-', FORMAT(@FechaJornada, 'yyyyMMdd'), '-USR-', @IdUsuarioCierre);

    INSERT INTO CierresDiarios (
        FechaJornada, IdUsuarioCierre, TotalTransacciones, 
        TotalUnidadesEntrada, TotalValorEntrada, TotalUnidadesSalida, TotalValorSalida,
        TotalAjustesMermas, StockFinalTotalUnidades, ValorizacionFinalInventario,
        Estado, FirmaDigitalResponsable, Observaciones, FechaHoraCierre
    )
    VALUES (
        @FechaJornada, @IdUsuarioCierre, @TotalTransacciones,
        @TotalEntradas, @TotalValorEntrada, @TotalSalidas, @TotalValorSalida,
        @TotalMermas, @StockFinalUnidades, @ValorizacionFinal,
        'CERRADO', @Firma, @Observaciones, SYSDATETIME()
    );

    -- Auditoría
    INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion)
    VALUES (@IdUsuarioCierre, 'CIERRE_DIARIO', 'CIERRE', CONCAT('Cierre ejecutado para jornada ', @FechaJornada, '. Entradas: ', @TotalEntradas, ', Salidas: ', @TotalSalidas, ', Mermas: ', @TotalMermas));

    SELECT * FROM CierresDiarios WHERE FechaJornada = @FechaJornada;
END;
GO

-- RF-15: Procedimiento para Calcular y Actualizar Clasificación ABC de Rotación
CREATE OR ALTER PROCEDURE sp_CalcularRotacionABC
AS
BEGIN
    SET NOCOUNT ON;

    -- Clasificar según volumen de salidas en los últimos 90 días
    WITH ResumenSalidas AS (
        SELECT 
            p.IdProducto,
            ISNULL(SUM(m.Cantidad), 0) AS TotalSalidasUnidades,
            ISNULL(SUM(m.Cantidad * p.PrecioVenta), 0) AS TotalVentasValor
        FROM Productos p
        LEFT JOIN MovimientosInventario m ON p.IdProducto = m.IdProducto 
            AND m.TipoMovimiento = 'SALIDA_VENTA'
            AND m.FechaMovimiento >= DATEADD(DAY, -90, SYSDATETIME())
        WHERE p.Activo = 1
        GROUP BY p.IdProducto
    ),
    RankingPareto AS (
        SELECT 
            IdProducto,
            TotalSalidasUnidades,
            PERCENT_RANK() OVER (ORDER BY TotalSalidasUnidades DESC) AS PercentilRotacion
        FROM ResumenSalidas
    )
    UPDATE p
    SET p.ClasificacionABC = CASE 
            WHEN r.PercentilRotacion <= 0.20 THEN 'A' -- 20% con mayor movimiento (Alta Rotación)
            WHEN r.PercentilRotacion <= 0.60 THEN 'B' -- Rotación Media
            ELSE 'C'                                 -- Rotación Baja / Estancada
        END
    FROM Productos p
    INNER JOIN RankingPareto r ON p.IdProducto = r.IdProducto;
END;
GO

-- ====================================================================================
-- 7. DATOS SEMILLA (SEEDS) - REPRESENTACIONES MARTÍN
-- ====================================================================================

-- Roles
INSERT INTO Roles (NombreRol, Descripcion, NivelJerarquico, PermisosJSON)
VALUES 
('Administrador', 'Control total del sistema, configuración, usuarios y bitácoras', 1, '["ALL"]'),
('Gerencia', 'Visualización ejecutiva, reportes financieros, Kardex y rotación ABC', 2, '["READ_ALL", "REPORTS_VIEW", "KARDEX_VIEW", "DASHBOARD_VIEW", "AUDIT_VIEW"]'),
('Encargado de Almacén', 'Gestión operativa de productos, stock, ubicaciones, recepción y mermas', 3, '["CATALOGO_CRUD", "MOVIMIENTOS_WRITE", "UBICACIONES_VIEW", "AJUSTES_WRITE", "QUICK_STOCK"]');
GO

-- Usuarios iniciales (RF-01)
-- Claves simuladas seguras con hash (contraseña por defecto: 'Martin2026!')
INSERT INTO Usuarios (IdRol, Nombres, Apellidos, CorreoCorporativo, Telefono, Direccion, PasswordHash, RequiereCambioPassword, Activo)
VALUES
(1, 'Carlos Eduardo', 'Martín Quispe', 'administrador@rep-martin.com', '987654321', 'Av. Argentina 1850, Lima Industrial', 'HASH_ADMIN_2026', 0, 1),
(2, 'Patricia Andrea', 'Villanueva Prado', 'gerencia@rep-martin.com', '984512367', 'San Isidro Empresarial', 'HASH_GERENCIA_2026', 0, 1),
(3, 'Jorge Luis', 'Paredes Soto', 'almacen@rep-martin.com', '991283746', 'Av. Canta Callao 340', 'HASH_ALMACEN_2026', 0, 1);
GO

-- Categorías
INSERT INTO Categorias (Codigo, Nombre, Descripcion)
VALUES
('CAT-MEL', 'Tableros de Melamina', 'Tableros MDP/MDF aglomerados melamínicos de 15mm y 18mm para muebles y carpintería'),
('CAT-DRY', 'Drywall y Construcción en Seco', 'Planchas de yeso-cartón estándar, resistentes a humedad y fuego, perfiles de acero'),
('CAT-PIS', 'Pisos y Acabados', 'Pisos laminados de alto tránsito, pisos vinílicos SPC y zócalos hidrófugos'),
('CAT-MUE', 'Muebles y Kit RTA', 'Muebles modulados listos para armar, repisas, muebles de cocina y oficina'),
('CAT-HER', 'Herrajes y Accesorios', 'Bisagras cangrejo, correderas telescópicas, tiradores, cantos PVC y tornillos');
GO

-- Ubicaciones físicas en Almacén Central (RF-12)
INSERT INTO UbicacionesAlmacen (Zona, Pasillo, Rack, Nivel, CapacidadCargaKg, CargaActualKg, TipoMercaderia)
VALUES
('ZONA-A', 'P-01', 'R-01', 'N-1', 4500.00, 2800.00, 'Tableros Melamina 18mm'),
('ZONA-A', 'P-01', 'R-02', 'N-1', 4500.00, 3100.00, 'Tableros Melamina 15mm'),
('ZONA-A', 'P-02', 'R-01', 'N-2', 3500.00, 1900.00, 'Tableros MDF y MDP Crudo'),
('ZONA-B', 'P-03', 'R-01', 'N-1', 5000.00, 3800.00, 'Planchas Drywall Yeso Standard'),
('ZONA-B', 'P-03', 'R-02', 'N-1', 5000.00, 2400.00, 'Planchas Drywall RH Antihumedad'),
('ZONA-C', 'P-04', 'R-01', 'N-1', 4000.00, 2100.00, 'Pisos Laminados 8mm'),
('ZONA-C', 'P-04', 'R-02', 'N-2', 3500.00, 1500.00, 'Pisos Vinílicos SPC 5mm'),
('ZONA-D', 'P-05', 'R-01', 'N-1', 2000.00, 450.00, 'Herrajes y Correderas Pesadas'),
('ZONA-D', 'P-05', 'R-01', 'N-2', 2000.00, 320.00, 'Tornillos Spax y Bisagras'),
('ZONA-E', 'P-06', 'R-01', 'N-1', 3000.00, 1200.00, 'Muebles en Caja RTA');
GO

-- Proveedores (RF-13)
INSERT INTO Proveedores (RUC, RazonSocial, NombreComercial, ContactoPrincipal, Telefono, Correo, Direccion, Ciudad, CalificacionEstrellas)
VALUES
('20100123451', 'ARAUCO PERÚ S.A.', 'Arauco / Vesto', 'Ing. Roberto Mendoza', '01-4458900', 'ventas@arauco.com.pe', 'Av. Canaval y Moreyra 480', 'Lima', 5),
('20334455662', 'NOVOPAN DEL PERÚ S.A.C.', 'Pelíkano', 'Lic. Mariana Fernández', '01-6187700', 'pedidos@pelikano.com', 'Av. Elmer Faucett 1920', 'Callao', 5),
('20556677883', 'ETEX PERÚ S.A.C.', 'Gyplac / Promart', 'Arq. Diego Canales', '01-5136000', 'contacto@gyplac.pe', 'Carretera Central Km 10.5', 'Ate, Lima', 4),
('20448899114', 'DUCASSE INDUSTRIAL PERÚ S.A.', 'Ducasse Herrajes', 'Sr. Walter Rivas', '01-7195400', 'cotizaciones@ducasse.com.pe', 'Av. Colonial 2210', 'Lima', 5),
('20601239875', 'IMPORTADORA Y DISTRIBUIDORA MASISA S.A.C.', 'Masisa', 'Ing. Sofía Benítez', '01-3198000', 'servicioalcliente@masisa.com', 'Av. República de Panamá 3505', 'San Isidro', 4);
GO

-- Productos representativos del rubro maderero (RF-05, RF-12, RF-15)
INSERT INTO Productos (IdCategoria, IdUbicacion, CodigoSKU, CodigoBarras, Nombre, Descripcion, Marca, EspesorMm, Dimensiones, UnidadMedida, PesoUnitarioKg, PrecioVenta, CostoCompra, StockActual, StockMinimo, StockMaximo, ClasificacionABC)
VALUES
(1, 1, 'MEL-VES-ROB-18', '7751234001015', 'Tablero Melamina Vesto Roble Cendra 18mm', 'Tablero de partículas con recubrimiento melamínico antibacteriano cobre, textura sincronizada', 'Vesto / Arauco', 18.00, '2.15 x 2.44 m', 'Plancha', 42.50, 168.00, 122.00, 48, 15, 120, 'A'),
(1, 1, 'MEL-PEL-BLA-18', '7751234001022', 'Tablero Melamina Pelíkano Blanco Humo 18mm', 'Tablero melamínico de alta densidad para frentes y laterales de cocina y closets', 'Pelíkano', 18.00, '2.15 x 2.44 m', 'Plancha', 43.00, 145.00, 105.00, 85, 20, 150, 'A'),
(1, 2, 'MEL-PEL-CAR-15', '7751234001039', 'Tablero Melamina Pelíkano Caramelo 15mm', 'Melamina cálida veteada ideal para fondos, cajonería y divisiones interiores', 'Pelíkano', 15.00, '2.15 x 2.44 m', 'Plancha', 36.00, 132.00, 94.00, 32, 10, 80, 'B'),
(1, 3, 'MDF-MAS-TRU-18', '7751234001046', 'Tablero MDF Masisa Trupan Crudo 18mm', 'Tablero de fibra de mediana densidad sin enchapar, óptimo para corte CNC y laqueado', 'Masisa', 18.00, '1.83 x 2.60 m', 'Plancha', 46.00, 155.00, 110.00, 24, 8, 60, 'B'),
(2, 4, 'DRY-GYP-STD-12', '7751234002012', 'Plancha Drywall Yeso Gyplac Standard 1/2 Pulgada', 'Plancha de yeso con cartón reciclado para tabiquería interior y cielos rasos', 'Gyplac', 12.70, '1.22 x 2.44 m', 'Plancha', 22.00, 34.50, 23.80, 140, 30, 250, 'A'),
(2, 5, 'DRY-VOL-RH-12',  '7751234002029', 'Plancha Drywall Volcán Resistente a Humedad (RH) 1/2"', 'Plancha verde con silicona en el núcleo para zonas húmedas de baños y cocinas', 'Volcán', 12.70, '1.22 x 2.44 m', 'Plancha', 24.50, 48.00, 33.50, 23, 15, 90, 'B'),
(3, 6, 'PIS-KAI-ROB-08', '7751234003019', 'Piso Laminado Kaindl Roble Natural AC4 8mm (Caja 2.22m2)', 'Piso flotante con sistema de clic hermético de alto tránsito comercial', 'Kaindl', 8.00, '1.38 x 0.19 m', 'Caja', 16.00, 89.00, 61.00, 65, 12, 120, 'B'),
(3, 7, 'PIS-SPC-VIN-05', '7751234003026', 'Piso Vinílico SPC 100% Resistente al Agua 5mm (Caja 2.19m2)', 'Piso rígido de piedra caliza y polímero con manta acústica IXPE incorporada', 'FloorMaster', 5.00, '1.22 x 0.18 m', 'Caja', 18.50, 128.00, 88.00, 4, 10, 60, 'C'),
(5, 8, 'HER-DUC-TEL-45', '7751234004016', 'Corredera Telescópica Pesada 45cm Cincada (Par)', 'Corredera de extracción total para cajones con capacidad de carga hasta 45kg', 'Ducasse', 1.20, '45 cm', 'Par', 0.95, 18.50, 11.20, 180, 40, 300, 'A'),
(5, 9, 'HER-DUC-BIS-110','7751234004023', 'Bisagra Cangrejo Cierre Suave 110 Grados (Bolsa x 20)', 'Bisagra recta con amortiguador hidráulico incorporado y clip de montaje rápido', 'Ducasse', 1.50, '35 mm cazoleta', 'Bolsa', 1.80, 42.00, 26.50, 52, 15, 100, 'B'),
(4, 10,'MUE-MOD-DES-01', '7751234005013', 'Escritorio Home Office Melamina Roble / Blanco RTA', 'Escritorio modular con repisas y pasacables listo para armar en caja plana', 'Martin Modular', 18.00, '1.20 x 0.60 x 0.75 m', 'Unidad', 28.00, 279.00, 185.00, 12, 5, 25, 'C');
GO

-- Relación Producto-Proveedor
INSERT INTO ProductoProveedores (IdProducto, IdProveedor, CostoPactado, CodigoArticuloProveedor)
VALUES
(1, 1, 122.00, 'AR-VES-ROB-18'),
(2, 2, 105.00, 'NOV-PEL-BLA-18'),
(3, 2, 94.00, 'NOV-PEL-CAR-15'),
(4, 5, 110.00, 'MAS-TRU-18'),
(5, 3, 23.80, 'GYP-PL-12'),
(6, 3, 33.50, 'VOL-RH-12'),
(9, 4, 11.20, 'DUC-TEL-45'),
(10, 4, 26.50, 'DUC-BIS-110');
GO

-- Movimientos iniciales para poblar Kardex e Histórico (RF-16, RF-17)
EXEC sp_RegistrarMovimiento 
    @IdProducto = 1, @IdUsuario = 1, @TipoMovimiento = 'ENTRADA_COMPRA', @Cantidad = 60, @CostoUnitario = 122.00, 
    @DocumentoReferencia = 'FAC-001-4589', @Observacion = 'Ingreso de lote semanal de melamina Roble Cendra';

EXEC sp_RegistrarMovimiento 
    @IdProducto = 1, @IdUsuario = 3, @TipoMovimiento = 'SALIDA_VENTA', @Cantidad = 12, @CostoUnitario = 122.00, 
    @DocumentoReferencia = 'BOL-B002-1204', @Observacion = 'Despacho a taller de carpintería contratista';

EXEC sp_RegistrarMovimiento 
    @IdProducto = 5, @IdUsuario = 1, @TipoMovimiento = 'ENTRADA_COMPRA', @Cantidad = 180, @CostoUnitario = 23.80, 
    @DocumentoReferencia = 'GR-002-9931', @Observacion = 'Recepción directa de planta Gyplac';

EXEC sp_RegistrarMovimiento 
    @IdProducto = 5, @IdUsuario = 3, @TipoMovimiento = 'SALIDA_VENTA', @Cantidad = 40, @CostoUnitario = 23.80, 
    @DocumentoReferencia = 'FAC-E001-3310', @Observacion = 'Venta para obra multifamiliar Miraflores';

EXEC sp_RegistrarMovimiento 
    @IdProducto = 6, @IdUsuario = 3, @TipoMovimiento = 'SALIDA_VENTA', @Cantidad = 15, @CostoUnitario = 33.50, 
    @DocumentoReferencia = 'FAC-E001-3315', @Observacion = 'Despacho urgente proyecto baños';

-- Registrar un Ajuste por Merma justificada (RF-20)
EXEC sp_AjusteInventarioManual
    @IdProducto = 1,
    @IdUsuarioSolicitante = 3,
    @IdUsuarioAprobador = 1,
    @TipoAjuste = 'MERMA_DANO',
    @CantidadAjuste = 1,
    @MotivoJustificado = 'Tablero desportillado en esquina por impacto en maniobra',
    @DetalleJustificacion = 'Se identificó rotura en la esquina superior izquierda de 1 plancha durante la inspección del rack A-P01-R01.';

-- Bitácora de inicio de sistema (RF-22)
INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion)
VALUES 
(1, 'SISTEMA_INICIALIZADO', 'SEGURIDAD', 'Creación de base de datos RepresentacionesMartinDB con esquemas, tablas, triggers y datos semilla de catálogo maderero.'),
(1, 'USUARIO_CREADO', 'SEGURIDAD', 'Registro inicial de cuentas de usuario: Administrador, Gerencia y Encargado de Almacén.');
GO

-- Recalcular rotación inicial ABC (RF-15)
EXEC sp_CalcularRotacionABC;
GO

PRINT '======================================================================';
PRINT 'Base de Datos "RepresentacionesMartinDB" creada y configurada con éxito.';
PRINT 'Tablas, Triggers, Stored Procedures, Vistas y Semillas Listos para SSMS.';
PRINT '======================================================================';
GO
