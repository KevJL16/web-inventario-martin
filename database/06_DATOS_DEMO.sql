-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- DATOS DE DEMOSTRACIÓN (ficticios): 474 ventas y 16 mermas o ajustes en 90 días
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

INSERT INTO #Eventos (Dia, Minuto, Sku, Tipo, Cantidad, Usuario, Doc, Obs, Motivo) VALUES
(90, 599, 'MEL-VES-ROB-18', 'VENTA', 5, 'A', 'BV-B001-001201', 'Venta a cliente: Carpintería Los Andes.', NULL),
(90, 1007, 'MEL-PEL-CAR-15', 'VENTA', 2, 'V', 'FAC-F001-003401', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(90, 568, 'DRY-GYP-STD-12', 'VENTA', 21, 'V', 'BV-B001-001202', 'Venta a cliente: Ebanistería Flores.', NULL),
(90, 1003, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003402', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(90, 892, 'MEL-VES-ROB-18', 'VENTA', 2, 'A', 'FAC-F001-003403', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(90, 938, 'MEL-PEL-BLA-18', 'VENTA', 3, 'W', 'FAC-F001-003404', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(89, 787, 'PIS-KAI-ROB-08', 'VENTA', 7, 'V', 'BV-B001-001203', 'Venta a cliente: Público General.', NULL),
(89, 783, 'MEL-PEL-CAR-15', 'VENTA', 3, 'V', 'BV-B001-001204', 'Venta a cliente: Público General.', NULL),
(89, 954, 'MEL-PEL-CAR-15', 'VENTA', 5, 'A', 'BV-B001-001205', 'Venta a cliente: Público General.', NULL),
(89, 1069, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003405', 'Venta a cliente: Ebanistería Flores.', NULL),
(89, 608, 'MEL-PEL-CAR-15', 'VENTA', 1, 'W', 'BV-B001-001206', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(89, 997, 'MEL-PEL-BLA-18', 'VENTA', 9, 'V', 'FAC-F001-003406', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(88, 529, 'PIS-KAI-ROB-08', 'VENTA', 4, 'W', 'FAC-F001-003407', 'Venta a cliente: Decoraciones Huamán.', NULL),
(87, 783, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'BV-B001-001207', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(87, 844, 'MEL-PEL-BLA-18', 'VENTA', 5, 'W', 'FAC-F001-003408', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(87, 905, 'MEL-PEL-BLA-18', 'VENTA', 8, 'A', 'BV-B001-001208', 'Venta a cliente: Público General.', NULL),
(86, 900, 'HER-DUC-TEL-45', 'VENTA', 8, 'V', 'FAC-F001-003409', 'Venta a cliente: Carpintería Los Andes.', NULL),
(86, 545, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003410', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(86, 561, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'BV-B001-001209', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(86, 581, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'BV-B001-001210', 'Venta a cliente: Público General.', NULL),
(85, 1109, 'MEL-VES-ROB-18', 'VENTA', 5, 'V', 'BV-B001-001211', 'Venta a cliente: Público General.', NULL),
(85, 738, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003411', 'Venta a cliente: Carpintería Los Andes.', NULL),
(85, 542, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'BV-B001-001212', 'Venta a cliente: Ebanistería Flores.', NULL),
(85, 528, 'DRY-GYP-STD-12', 'VENTA', 10, 'V', 'FAC-F001-003412', 'Venta a cliente: Carpintería Los Andes.', NULL),
(85, 1039, 'MEL-VES-ROB-18', 'VENTA', 4, 'V', 'BV-B001-001213', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(85, 878, 'PIS-KAI-ROB-08', 'VENTA', 2, 'A', 'BV-B001-001214', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(84, 626, 'MEL-VES-ROB-18', 'VENTA', 4, 'V', 'FAC-F001-003413', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(84, 942, 'DRY-GYP-STD-12', 'VENTA', 24, 'W', 'FAC-F001-003414', 'Venta a cliente: Ebanistería Flores.', NULL),
(84, 1097, 'DRY-VOL-RH-12', 'VENTA', 4, 'W', 'FAC-F001-003415', 'Venta a cliente: Ebanistería Flores.', NULL),
(84, 646, 'HER-DUC-TEL-45', 'VENTA', 15, 'A', 'FAC-F001-003416', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(84, 809, 'MEL-PEL-BLA-18', 'VENTA', 4, 'V', 'FAC-F001-003417', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(84, 649, 'HER-DUC-TEL-45', 'VENTA', 6, 'A', 'FAC-F001-003418', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(84, 707, 'MEL-PEL-BLA-18', 'VENTA', 5, 'W', 'FAC-F001-003419', 'Venta a cliente: Decoraciones Huamán.', NULL),
(83, 1027, 'DRY-GYP-STD-12', 'VENTA', 14, 'V', 'BV-B001-001215', 'Venta a cliente: Público General.', NULL),
(83, 1029, 'HER-DUC-BIS-110', 'VENTA', 3, 'V', 'FAC-F001-003420', 'Venta a cliente: Carpintería Los Andes.', NULL),
(83, 1002, 'MUE-MOD-DES-01', 'VENTA', 2, 'W', 'FAC-F001-003421', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(83, 1040, 'MEL-VES-ROB-18', 'VENTA', 2, 'V', 'BV-B001-001216', 'Venta a cliente: Público General.', NULL),
(83, 651, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'FAC-F001-003422', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(83, 619, 'MEL-PEL-BLA-18', 'VENTA', 3, 'A', 'BV-B001-001217', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(83, 960, 'HER-DUC-BIS-110', 'VENTA', 4, 'A', 'FAC-F001-003423', 'Venta a cliente: Ebanistería Flores.', NULL),
(83, 813, 'DRY-GYP-STD-12', 'VENTA', 23, 'W', 'BV-B001-001218', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(82, 840, 'MEL-VES-ROB-18', 'VENTA', 8, 'V', 'FAC-F001-003424', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(82, 1057, 'DRY-GYP-STD-12', 'VENTA', 12, 'V', 'BV-B001-001219', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(82, 905, 'PIS-KAI-ROB-08', 'VENTA', 7, 'W', 'FAC-F001-003425', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(82, 913, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003426', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(82, 667, 'HER-DUC-BIS-110', 'VENTA', 3, 'A', 'FAC-F001-003427', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(82, 584, 'MEL-VES-ROB-18', 'VENTA', 6, 'V', 'FAC-F001-003428', 'Venta a cliente: Carpintería Los Andes.', NULL),
(82, 931, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'BV-B001-001220', 'Venta a cliente: Ebanistería Flores.', NULL),
(80, 758, 'HER-DUC-BIS-110', 'VENTA', 4, 'W', 'BV-B001-001221', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(80, 669, 'MEL-PEL-CAR-15', 'VENTA', 1, 'W', 'BV-B001-001222', 'Venta a cliente: Público General.', NULL),
(80, 785, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'BV-B001-001223', 'Venta a cliente: Público General.', NULL),
(80, 898, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'FAC-F001-003429', 'Venta a cliente: Decoraciones Huamán.', NULL),
(79, 667, 'DRY-VOL-RH-12', 'VENTA', 6, 'W', 'FAC-F001-003430', 'Venta a cliente: Decoraciones Huamán.', NULL),
(79, 534, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'BV-B001-001224', 'Venta a cliente: Público General.', NULL),
(79, 717, 'MDF-MAS-TRU-18', 'VENTA', 1, 'V', 'BV-B001-001225', 'Venta a cliente: Público General.', NULL),
(79, 979, 'PIS-SPC-VIN-05', 'VENTA', 4, 'A', 'FAC-F001-003431', 'Venta a cliente: Carpintería Los Andes.', NULL),
(79, 846, 'MUE-MOD-DES-01', 'VENTA', 1, 'V', 'BV-B001-001226', 'Venta a cliente: Público General.', NULL),
(79, 602, 'DRY-VOL-RH-12', 'VENTA', 3, 'A', 'FAC-F001-003432', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(79, 518, 'DRY-VOL-RH-12', 'VENTA', 2, 'A', 'FAC-F001-003433', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(79, 771, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'FAC-F001-003434', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(78, 705, 'MUE-MOD-DES-01', 'VENTA', 1, 'W', 'BV-B001-001227', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(78, 1056, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'BV-B001-001228', 'Venta a cliente: Decoraciones Huamán.', NULL),
(78, 853, 'HER-DUC-BIS-110', 'VENTA', 4, 'V', 'BV-B001-001229', 'Venta a cliente: Público General.', NULL),
(78, 922, 'MEL-PEL-BLA-18', 'VENTA', 7, 'V', 'FAC-F001-003435', 'Venta a cliente: Ebanistería Flores.', NULL),
(78, 628, 'MEL-PEL-CAR-15', 'VENTA', 2, 'A', 'BV-B001-001230', 'Venta a cliente: Público General.', NULL),
(78, 558, 'HER-DUC-BIS-110', 'VENTA', 3, 'A', 'FAC-F001-003436', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(77, 1022, 'MEL-VES-ROB-18', 'VENTA', 7, 'W', 'FAC-F001-003437', 'Venta a cliente: Carpintería Los Andes.', NULL),
(77, 538, 'DRY-GYP-STD-12', 'VENTA', 6, 'W', 'FAC-F001-003438', 'Venta a cliente: Ebanistería Flores.', NULL),
(77, 659, 'MDF-MAS-TRU-18', 'VENTA', 1, 'W', 'BV-B001-001231', 'Venta a cliente: Público General.', NULL),
(77, 520, 'HER-DUC-TEL-45', 'VENTA', 13, 'A', 'BV-B001-001232', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(77, 609, 'DRY-GYP-STD-12', 'VENTA', 16, 'W', 'FAC-F001-003439', 'Venta a cliente: Ebanistería Flores.', NULL),
(77, 535, 'MEL-VES-ROB-18', 'VENTA', 3, 'W', 'BV-B001-001233', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(77, 750, 'DRY-VOL-RH-12', 'VENTA', 8, 'V', 'FAC-F001-003440', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(77, 818, 'DRY-VOL-RH-12', 'VENTA', 8, 'W', 'BV-B001-001234', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(76, 934, 'DRY-VOL-RH-12', 'VENTA', 3, 'V', 'BV-B001-001235', 'Venta a cliente: Ebanistería Flores.', NULL),
(76, 1024, 'PIS-SPC-VIN-05', 'VENTA', 3, 'V', 'FAC-F001-003441', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(76, 721, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'BV-B001-001236', 'Venta a cliente: Público General.', NULL),
(76, 935, 'MEL-PEL-BLA-18', 'VENTA', 7, 'W', 'BV-B001-001237', 'Venta a cliente: Público General.', NULL),
(76, 964, 'MDF-MAS-TRU-18', 'VENTA', 1, 'W', 'BV-B001-001238', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(76, 908, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'BV-B001-001239', 'Venta a cliente: Ebanistería Flores.', NULL),
(76, 702, 'DRY-VOL-RH-12', 'VENTA', 8, 'W', 'FAC-F001-003442', 'Venta a cliente: Ebanistería Flores.', NULL),
(75, 643, 'DRY-GYP-STD-12', 'VENTA', 17, 'A', 'BV-B001-001240', 'Venta a cliente: Decoraciones Huamán.', NULL),
(75, 725, 'PIS-SPC-VIN-05', 'VENTA', 3, 'W', 'FAC-F001-003443', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(75, 777, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'BV-B001-001241', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(75, 642, 'DRY-VOL-RH-12', 'VENTA', 3, 'W', 'BV-B001-001242', 'Venta a cliente: Ebanistería Flores.', NULL),
(75, 657, 'MDF-MAS-TRU-18', 'VENTA', 1, 'V', 'BV-B001-001243', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(75, 595, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'FAC-F001-003444', 'Venta a cliente: Carpintería Los Andes.', NULL),
(75, 630, 'HER-DUC-BIS-110', 'VENTA', 3, 'V', 'FAC-F001-003445', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(75, 827, 'MEL-PEL-BLA-18', 'VENTA', 3, 'W', 'BV-B001-001244', 'Venta a cliente: Público General.', NULL),
(73, 719, 'PIS-SPC-VIN-05', 'VENTA', 4, 'V', 'BV-B001-001245', 'Venta a cliente: Público General.', NULL),
(73, 1030, 'DRY-GYP-STD-12', 'VENTA', 23, 'V', 'BV-B001-001246', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(73, 1103, 'MEL-PEL-BLA-18', 'VENTA', 6, 'V', 'BV-B001-001247', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(73, 1077, 'DRY-GYP-STD-12', 'VENTA', 24, 'A', 'FAC-F001-003446', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(73, 778, 'DRY-GYP-STD-12', 'VENTA', 24, 'W', 'BV-B001-001248', 'Venta a cliente: Público General.', NULL),
(72, 690, 'MEL-PEL-BLA-18', 'VENTA', 2, 'V', 'BV-B001-001249', 'Venta a cliente: Público General.', NULL),
(72, 891, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003447', 'Venta a cliente: Ebanistería Flores.', NULL),
(72, 915, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'BV-B001-001250', 'Venta a cliente: Público General.', NULL),
(72, 1004, 'MEL-VES-ROB-18', 'VENTA', 2, 'V', 'BV-B001-001251', 'Venta a cliente: Público General.', NULL),
(72, 655, 'MEL-VES-ROB-18', 'VENTA', 2, 'V', 'FAC-F001-003448', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(71, 784, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'BV-B001-001252', 'Venta a cliente: Público General.', NULL),
(71, 925, 'MEL-VES-ROB-18', 'VENTA', 2, 'V', 'BV-B001-001253', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(71, 1060, 'HER-DUC-TEL-45', 'VENTA', 6, 'A', 'FAC-F001-003449', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(71, 790, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'FAC-F001-003450', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(70, 822, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'BV-B001-001254', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(70, 938, 'HER-DUC-BIS-110', 'VENTA', 1, 'W', 'BV-B001-001255', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(70, 909, 'HER-DUC-BIS-110', 'VENTA', 1, 'W', 'FAC-F001-003451', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(70, 634, 'DRY-GYP-STD-12', 'VENTA', 12, 'W', 'FAC-F001-003452', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(70, 882, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'BV-B001-001256', 'Venta a cliente: Público General.', NULL),
(69, 753, 'MEL-PEL-BLA-18', 'VENTA', 4, 'V', 'BV-B001-001257', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(69, 599, 'MEL-VES-ROB-18', 'VENTA', 1, 'V', 'FAC-F001-003453', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(69, 1018, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003454', 'Venta a cliente: Carpintería Los Andes.', NULL),
(69, 1006, 'MEL-VES-ROB-18', 'VENTA', 1, 'V', 'FAC-F001-003455', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(69, 777, 'PIS-KAI-ROB-08', 'VENTA', 4, 'V', 'FAC-F001-003456', 'Venta a cliente: Decoraciones Huamán.', NULL),
(69, 579, 'MEL-PEL-CAR-15', 'VENTA', 3, 'W', 'BV-B001-001258', 'Venta a cliente: Público General.', NULL),
(69, 1028, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'FAC-F001-003457', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(68, 1104, 'DRY-GYP-STD-12', 'VENTA', 20, 'V', 'BV-B001-001259', 'Venta a cliente: Público General.', NULL),
(68, 697, 'HER-DUC-BIS-110', 'VENTA', 4, 'V', 'BV-B001-001260', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(68, 866, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'BV-B001-001261', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(68, 510, 'MEL-PEL-CAR-15', 'VENTA', 4, 'V', 'BV-B001-001262', 'Venta a cliente: Carpintería Los Andes.', NULL),
(68, 1036, 'MDF-MAS-TRU-18', 'VENTA', 1, 'A', 'FAC-F001-003458', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(68, 755, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'FAC-F001-003459', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(67, 533, 'MEL-VES-ROB-18', 'VENTA', 8, 'V', 'BV-B001-001263', 'Venta a cliente: Público General.', NULL),
(66, 673, 'DRY-GYP-STD-12', 'VENTA', 12, 'V', 'BV-B001-001264', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(66, 969, 'PIS-KAI-ROB-08', 'VENTA', 3, 'W', 'BV-B001-001265', 'Venta a cliente: Carpintería Los Andes.', NULL),
(66, 1071, 'PIS-SPC-VIN-05', 'VENTA', 6, 'A', 'BV-B001-001266', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(66, 899, 'MEL-PEL-BLA-18', 'VENTA', 9, 'A', 'FAC-F001-003460', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(66, 664, 'PIS-SPC-VIN-05', 'VENTA', 6, 'V', 'BV-B001-001267', 'Venta a cliente: Público General.', NULL),
(66, 1066, 'HER-DUC-BIS-110', 'VENTA', 4, 'W', 'FAC-F001-003461', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(65, 630, 'PIS-SPC-VIN-05', 'VENTA', 2, 'A', 'BV-B001-001268', 'Venta a cliente: Público General.', NULL),
(65, 1078, 'PIS-SPC-VIN-05', 'VENTA', 2, 'W', 'FAC-F001-003462', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(65, 870, 'PIS-SPC-VIN-05', 'VENTA', 4, 'A', 'FAC-F001-003463', 'Venta a cliente: Ebanistería Flores.', NULL),
(65, 526, 'MEL-PEL-BLA-18', 'VENTA', 5, 'V', 'BV-B001-001269', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(65, 969, 'PIS-SPC-VIN-05', 'VENTA', 3, 'A', 'BV-B001-001270', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(64, 986, 'MEL-VES-ROB-18', 'VENTA', 4, 'V', 'FAC-F001-003464', 'Venta a cliente: Carpintería Los Andes.', NULL),
(64, 1007, 'PIS-KAI-ROB-08', 'VENTA', 4, 'W', 'BV-B001-001271', 'Venta a cliente: Carpintería Los Andes.', NULL),
(64, 565, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'BV-B001-001272', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(64, 664, 'DRY-GYP-STD-12', 'VENTA', 23, 'W', 'FAC-F001-003465', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(63, 736, 'MEL-PEL-BLA-18', 'VENTA', 9, 'A', 'BV-B001-001273', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(63, 838, 'HER-DUC-TEL-45', 'VENTA', 11, 'W', 'FAC-F001-003466', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(63, 691, 'PIS-SPC-VIN-05', 'VENTA', 5, 'W', 'FAC-F001-003467', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(63, 915, 'DRY-GYP-STD-12', 'VENTA', 16, 'V', 'FAC-F001-003468', 'Venta a cliente: Carpintería Los Andes.', NULL),
(63, 795, 'HER-DUC-TEL-45', 'VENTA', 16, 'W', 'BV-B001-001274', 'Venta a cliente: Público General.', NULL),
(63, 643, 'PIS-SPC-VIN-05', 'VENTA', 6, 'W', 'FAC-F001-003469', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(63, 646, 'HER-DUC-BIS-110', 'VENTA', 1, 'V', 'FAC-F001-003470', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(62, 1071, 'MEL-PEL-BLA-18', 'VENTA', 4, 'V', 'FAC-F001-003471', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(62, 964, 'DRY-GYP-STD-12', 'VENTA', 17, 'V', 'FAC-F001-003472', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(62, 783, 'MUE-MOD-DES-01', 'VENTA', 1, 'V', 'BV-B001-001275', 'Venta a cliente: Público General.', NULL),
(62, 685, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'BV-B001-001276', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(62, 735, 'MEL-PEL-BLA-18', 'VENTA', 4, 'V', 'FAC-F001-003473', 'Venta a cliente: Decoraciones Huamán.', NULL),
(61, 975, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'BV-B001-001277', 'Venta a cliente: Público General.', NULL),
(61, 726, 'HER-DUC-BIS-110', 'VENTA', 4, 'W', 'BV-B001-001278', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(61, 593, 'DRY-GYP-STD-12', 'VENTA', 16, 'W', 'FAC-F001-003474', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(61, 959, 'HER-DUC-TEL-45', 'VENTA', 11, 'W', 'FAC-F001-003475', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(61, 695, 'MEL-VES-ROB-18', 'VENTA', 8, 'V', 'FAC-F001-003476', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(61, 603, 'HER-DUC-TEL-45', 'VENTA', 8, 'W', 'BV-B001-001279', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(59, 649, 'MEL-VES-ROB-18', 'VENTA', 6, 'A', 'BV-B001-001280', 'Venta a cliente: Ebanistería Flores.', NULL),
(59, 896, 'PIS-KAI-ROB-08', 'VENTA', 2, 'V', 'FAC-F001-003477', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(59, 900, 'DRY-GYP-STD-12', 'VENTA', 20, 'V', 'BV-B001-001281', 'Venta a cliente: Público General.', NULL),
(59, 858, 'HER-DUC-TEL-45', 'VENTA', 8, 'V', 'BV-B001-001282', 'Venta a cliente: Público General.', NULL),
(59, 1082, 'DRY-VOL-RH-12', 'VENTA', 5, 'V', 'FAC-F001-003478', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(59, 1096, 'MEL-PEL-CAR-15', 'VENTA', 3, 'V', 'BV-B001-001283', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(58, 936, 'MDF-MAS-TRU-18', 'VENTA', 4, 'W', 'BV-B001-001284', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(58, 745, 'HER-DUC-BIS-110', 'VENTA', 3, 'W', 'BV-B001-001285', 'Venta a cliente: Ebanistería Flores.', NULL),
(58, 514, 'HER-DUC-BIS-110', 'VENTA', 2, 'W', 'FAC-F001-003479', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(58, 637, 'MEL-VES-ROB-18', 'VENTA', 7, 'A', 'FAC-F001-003480', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(58, 1067, 'HER-DUC-BIS-110', 'VENTA', 2, 'V', 'BV-B001-001286', 'Venta a cliente: Ebanistería Flores.', NULL),
(58, 1033, 'HER-DUC-BIS-110', 'VENTA', 1, 'V', 'FAC-F001-003481', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(58, 730, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'BV-B001-001287', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(57, 923, 'MEL-PEL-BLA-18', 'VENTA', 5, 'W', 'FAC-F001-003482', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(57, 1075, 'DRY-VOL-RH-12', 'VENTA', 5, 'V', 'BV-B001-001288', 'Venta a cliente: Público General.', NULL),
(57, 811, 'DRY-VOL-RH-12', 'VENTA', 4, 'V', 'BV-B001-001289', 'Venta a cliente: Decoraciones Huamán.', NULL),
(57, 668, 'DRY-GYP-STD-12', 'VENTA', 11, 'W', 'FAC-F001-003483', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(57, 804, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'BV-B001-001290', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(57, 522, 'MEL-PEL-CAR-15', 'VENTA', 2, 'W', 'FAC-F001-003484', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(57, 557, 'DRY-GYP-STD-12', 'VENTA', 8, 'V', 'FAC-F001-003485', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(57, 1095, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'FAC-F001-003486', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(56, 1064, 'DRY-GYP-STD-12', 'VENTA', 23, 'V', 'FAC-F001-003487', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(56, 670, 'HER-DUC-BIS-110', 'VENTA', 5, 'A', 'FAC-F001-003488', 'Venta a cliente: Ebanistería Flores.', NULL),
(56, 1019, 'DRY-GYP-STD-12', 'VENTA', 18, 'V', 'FAC-F001-003489', 'Venta a cliente: Decoraciones Huamán.', NULL),
(56, 789, 'DRY-GYP-STD-12', 'VENTA', 10, 'W', 'FAC-F001-003490', 'Venta a cliente: Ebanistería Flores.', NULL),
(56, 1080, 'MEL-PEL-BLA-18', 'VENTA', 2, 'A', 'BV-B001-001291', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(55, 567, 'DRY-GYP-STD-12', 'VENTA', 14, 'A', 'BV-B001-001292', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(55, 722, 'DRY-GYP-STD-12', 'VENTA', 21, 'W', 'FAC-F001-003491', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(55, 1081, 'MEL-PEL-BLA-18', 'VENTA', 2, 'V', 'BV-B001-001293', 'Venta a cliente: Público General.', NULL),
(55, 788, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003492', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(55, 591, 'MEL-PEL-BLA-18', 'VENTA', 8, 'A', 'FAC-F001-003493', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(55, 994, 'DRY-VOL-RH-12', 'VENTA', 9, 'V', 'BV-B001-001294', 'Venta a cliente: Público General.', NULL),
(55, 941, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'FAC-F001-003494', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(54, 560, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003495', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(54, 881, 'DRY-GYP-STD-12', 'VENTA', 22, 'V', 'FAC-F001-003496', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(54, 963, 'PIS-KAI-ROB-08', 'VENTA', 6, 'V', 'FAC-F001-003497', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(54, 788, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'FAC-F001-003498', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(54, 991, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'FAC-F001-003499', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(54, 912, 'MEL-VES-ROB-18', 'VENTA', 7, 'V', 'BV-B001-001295', 'Venta a cliente: Ebanistería Flores.', NULL),
(54, 513, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'FAC-F001-003500', 'Venta a cliente: Decoraciones Huamán.', NULL),
(52, 644, 'MEL-PEL-BLA-18', 'VENTA', 8, 'V', 'FAC-F001-003501', 'Venta a cliente: Carpintería Los Andes.', NULL),
(52, 563, 'HER-DUC-TEL-45', 'VENTA', 7, 'A', 'FAC-F001-003502', 'Venta a cliente: Decoraciones Huamán.', NULL),
(52, 1074, 'HER-DUC-TEL-45', 'VENTA', 6, 'W', 'FAC-F001-003503', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(52, 650, 'MEL-VES-ROB-18', 'VENTA', 5, 'V', 'FAC-F001-003504', 'Venta a cliente: Ebanistería Flores.', NULL),
(52, 709, 'MDF-MAS-TRU-18', 'VENTA', 3, 'V', 'BV-B001-001296', 'Venta a cliente: Público General.', NULL),
(52, 997, 'PIS-KAI-ROB-08', 'VENTA', 4, 'W', 'FAC-F001-003505', 'Venta a cliente: Decoraciones Huamán.', NULL),
(51, 683, 'HER-DUC-TEL-45', 'VENTA', 10, 'V', 'FAC-F001-003506', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(51, 919, 'HER-DUC-TEL-45', 'VENTA', 4, 'V', 'BV-B001-001297', 'Venta a cliente: Público General.', NULL),
(51, 775, 'DRY-VOL-RH-12', 'VENTA', 4, 'W', 'BV-B001-001298', 'Venta a cliente: Ebanistería Flores.', NULL),
(51, 862, 'MEL-VES-ROB-18', 'VENTA', 2, 'W', 'BV-B001-001299', 'Venta a cliente: Público General.', NULL),
(50, 947, 'HER-DUC-TEL-45', 'VENTA', 9, 'V', 'FAC-F001-003507', 'Venta a cliente: Carpintería Los Andes.', NULL),
(50, 951, 'PIS-SPC-VIN-05', 'VENTA', 6, 'W', 'FAC-F001-003508', 'Venta a cliente: Ebanistería Flores.', NULL),
(50, 641, 'MEL-PEL-BLA-18', 'VENTA', 10, 'W', 'FAC-F001-003509', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(50, 634, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'FAC-F001-003510', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(50, 755, 'DRY-GYP-STD-12', 'VENTA', 18, 'V', 'FAC-F001-003511', 'Venta a cliente: Ebanistería Flores.', NULL),
(49, 898, 'DRY-VOL-RH-12', 'VENTA', 8, 'V', 'FAC-F001-003512', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(49, 569, 'HER-DUC-TEL-45', 'VENTA', 6, 'V', 'FAC-F001-003513', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(49, 887, 'HER-DUC-BIS-110', 'VENTA', 4, 'V', 'BV-B001-001300', 'Venta a cliente: Decoraciones Huamán.', NULL),
(49, 705, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'BV-B001-001301', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(49, 1026, 'PIS-KAI-ROB-08', 'VENTA', 4, 'V', 'BV-B001-001302', 'Venta a cliente: Público General.', NULL),
(49, 976, 'MEL-PEL-BLA-18', 'VENTA', 3, 'W', 'FAC-F001-003514', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(48, 668, 'DRY-VOL-RH-12', 'VENTA', 7, 'W', 'BV-B001-001303', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(48, 923, 'PIS-KAI-ROB-08', 'VENTA', 3, 'W', 'FAC-F001-003515', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(48, 978, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'BV-B001-001304', 'Venta a cliente: Público General.', NULL),
(48, 1013, 'MDF-MAS-TRU-18', 'VENTA', 4, 'W', 'FAC-F001-003516', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(48, 1009, 'PIS-SPC-VIN-05', 'VENTA', 4, 'W', 'BV-B001-001305', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(48, 880, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'BV-B001-001306', 'Venta a cliente: Público General.', NULL),
(48, 844, 'HER-DUC-TEL-45', 'VENTA', 16, 'V', 'FAC-F001-003517', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(47, 890, 'PIS-SPC-VIN-05', 'VENTA', 4, 'A', 'FAC-F001-003518', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(47, 674, 'PIS-KAI-ROB-08', 'VENTA', 8, 'V', 'BV-B001-001307', 'Venta a cliente: Decoraciones Huamán.', NULL),
(47, 548, 'HER-DUC-BIS-110', 'VENTA', 5, 'W', 'FAC-F001-003519', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(47, 715, 'MEL-PEL-CAR-15', 'VENTA', 5, 'A', 'FAC-F001-003520', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(46, 934, 'HER-DUC-TEL-45', 'VENTA', 9, 'V', 'FAC-F001-003521', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(45, 704, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'FAC-F001-003522', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(45, 852, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003523', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(45, 903, 'MEL-PEL-BLA-18', 'VENTA', 9, 'V', 'FAC-F001-003524', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(45, 904, 'MEL-VES-ROB-18', 'VENTA', 4, 'W', 'FAC-F001-003525', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(44, 550, 'PIS-SPC-VIN-05', 'VENTA', 6, 'W', 'BV-B001-001308', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(44, 754, 'DRY-VOL-RH-12', 'VENTA', 3, 'W', 'FAC-F001-003526', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(44, 897, 'PIS-SPC-VIN-05', 'VENTA', 4, 'V', 'BV-B001-001309', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(44, 853, 'MDF-MAS-TRU-18', 'VENTA', 1, 'W', 'BV-B001-001310', 'Venta a cliente: Público General.', NULL),
(44, 869, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'BV-B001-001311', 'Venta a cliente: Ebanistería Flores.', NULL),
(44, 642, 'DRY-GYP-STD-12', 'VENTA', 24, 'W', 'FAC-F001-003527', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(44, 864, 'PIS-SPC-VIN-05', 'VENTA', 2, 'W', 'FAC-F001-003528', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(44, 644, 'MUE-MOD-DES-01', 'VENTA', 2, 'W', 'BV-B001-001312', 'Venta a cliente: Público General.', NULL),
(43, 533, 'MEL-VES-ROB-18', 'VENTA', 3, 'A', 'FAC-F001-003529', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(43, 1093, 'DRY-GYP-STD-12', 'VENTA', 10, 'A', 'FAC-F001-003530', 'Venta a cliente: Decoraciones Huamán.', NULL),
(43, 1109, 'PIS-KAI-ROB-08', 'VENTA', 7, 'W', 'FAC-F001-003531', 'Venta a cliente: Ebanistería Flores.', NULL),
(43, 796, 'MEL-PEL-BLA-18', 'VENTA', 7, 'A', 'FAC-F001-003532', 'Venta a cliente: Decoraciones Huamán.', NULL),
(43, 904, 'MEL-PEL-BLA-18', 'VENTA', 10, 'W', 'FAC-F001-003533', 'Venta a cliente: Carpintería Los Andes.', NULL),
(43, 1108, 'PIS-KAI-ROB-08', 'VENTA', 7, 'W', 'FAC-F001-003534', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(43, 582, 'MEL-VES-ROB-18', 'VENTA', 6, 'W', 'FAC-F001-003535', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(42, 839, 'MEL-PEL-BLA-18', 'VENTA', 10, 'A', 'BV-B001-001313', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(42, 916, 'DRY-GYP-STD-12', 'VENTA', 23, 'V', 'FAC-F001-003536', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(42, 764, 'DRY-GYP-STD-12', 'VENTA', 7, 'V', 'BV-B001-001314', 'Venta a cliente: Público General.', NULL),
(42, 723, 'HER-DUC-BIS-110', 'VENTA', 1, 'V', 'FAC-F001-003537', 'Venta a cliente: Carpintería Los Andes.', NULL),
(42, 887, 'DRY-GYP-STD-12', 'VENTA', 21, 'V', 'FAC-F001-003538', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(42, 690, 'PIS-KAI-ROB-08', 'VENTA', 3, 'W', 'FAC-F001-003539', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(41, 870, 'HER-DUC-BIS-110', 'VENTA', 3, 'V', 'FAC-F001-003540', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(41, 1089, 'HER-DUC-TEL-45', 'VENTA', 4, 'W', 'FAC-F001-003541', 'Venta a cliente: Carpintería Los Andes.', NULL),
(41, 1096, 'DRY-VOL-RH-12', 'VENTA', 3, 'W', 'FAC-F001-003542', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(41, 674, 'MEL-VES-ROB-18', 'VENTA', 5, 'A', 'BV-B001-001315', 'Venta a cliente: Decoraciones Huamán.', NULL),
(40, 1046, 'MEL-PEL-BLA-18', 'VENTA', 5, 'V', 'BV-B001-001316', 'Venta a cliente: Público General.', NULL),
(40, 610, 'HER-DUC-TEL-45', 'VENTA', 7, 'V', 'BV-B001-001317', 'Venta a cliente: Público General.', NULL),
(40, 901, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'FAC-F001-003543', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(40, 902, 'PIS-KAI-ROB-08', 'VENTA', 4, 'W', 'BV-B001-001318', 'Venta a cliente: Público General.', NULL),
(40, 772, 'DRY-GYP-STD-12', 'VENTA', 12, 'W', 'FAC-F001-003544', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(39, 1040, 'MEL-VES-ROB-18', 'VENTA', 6, 'V', 'BV-B001-001319', 'Venta a cliente: Público General.', NULL),
(38, 1015, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'FAC-F001-003545', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(38, 994, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003546', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(38, 885, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'FAC-F001-003547', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(38, 667, 'MEL-PEL-CAR-15', 'VENTA', 3, 'V', 'FAC-F001-003548', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(38, 714, 'HER-DUC-TEL-45', 'VENTA', 7, 'W', 'FAC-F001-003549', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(37, 827, 'HER-DUC-TEL-45', 'VENTA', 12, 'V', 'FAC-F001-003550', 'Venta a cliente: Carpintería Los Andes.', NULL),
(37, 788, 'DRY-VOL-RH-12', 'VENTA', 4, 'V', 'BV-B001-001320', 'Venta a cliente: Carpintería Los Andes.', NULL),
(37, 530, 'MEL-VES-ROB-18', 'VENTA', 7, 'W', 'FAC-F001-003551', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(37, 752, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'BV-B001-001321', 'Venta a cliente: Público General.', NULL),
(37, 730, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'FAC-F001-003552', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(37, 850, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'BV-B001-001322', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(36, 1105, 'HER-DUC-TEL-45', 'VENTA', 16, 'V', 'BV-B001-001323', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(36, 873, 'MEL-VES-ROB-18', 'VENTA', 6, 'A', 'BV-B001-001324', 'Venta a cliente: Público General.', NULL),
(36, 668, 'HER-DUC-BIS-110', 'VENTA', 2, 'A', 'FAC-F001-003553', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(36, 823, 'MUE-MOD-DES-01', 'VENTA', 1, 'V', 'FAC-F001-003554', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(36, 860, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'FAC-F001-003555', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(36, 688, 'DRY-GYP-STD-12', 'VENTA', 12, 'V', 'BV-B001-001325', 'Venta a cliente: Público General.', NULL),
(35, 803, 'HER-DUC-BIS-110', 'VENTA', 3, 'W', 'FAC-F001-003556', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(35, 551, 'HER-DUC-TEL-45', 'VENTA', 13, 'V', 'BV-B001-001326', 'Venta a cliente: Público General.', NULL),
(35, 734, 'MDF-MAS-TRU-18', 'VENTA', 2, 'V', 'BV-B001-001327', 'Venta a cliente: Público General.', NULL),
(35, 887, 'HER-DUC-BIS-110', 'VENTA', 2, 'W', 'FAC-F001-003557', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(35, 951, 'MEL-PEL-BLA-18', 'VENTA', 2, 'A', 'FAC-F001-003558', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(35, 682, 'MEL-VES-ROB-18', 'VENTA', 6, 'W', 'FAC-F001-003559', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(34, 831, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'FAC-F001-003560', 'Venta a cliente: Decoraciones Huamán.', NULL),
(34, 767, 'MEL-PEL-BLA-18', 'VENTA', 10, 'A', 'FAC-F001-003561', 'Venta a cliente: Ebanistería Flores.', NULL),
(34, 1005, 'MEL-PEL-CAR-15', 'VENTA', 3, 'W', 'BV-B001-001328', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(34, 852, 'PIS-SPC-VIN-05', 'VENTA', 5, 'V', 'BV-B001-001329', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(34, 782, 'PIS-KAI-ROB-08', 'VENTA', 3, 'V', 'FAC-F001-003562', 'Venta a cliente: Decoraciones Huamán.', NULL),
(34, 1000, 'DRY-VOL-RH-12', 'VENTA', 4, 'V', 'FAC-F001-003563', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(34, 1013, 'DRY-VOL-RH-12', 'VENTA', 3, 'V', 'FAC-F001-003564', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(33, 716, 'DRY-GYP-STD-12', 'VENTA', 19, 'A', 'FAC-F001-003565', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(33, 838, 'HER-DUC-TEL-45', 'VENTA', 11, 'W', 'BV-B001-001330', 'Venta a cliente: Público General.', NULL),
(33, 751, 'HER-DUC-TEL-45', 'VENTA', 7, 'W', 'FAC-F001-003566', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(33, 886, 'MEL-PEL-BLA-18', 'VENTA', 5, 'W', 'BV-B001-001331', 'Venta a cliente: Público General.', NULL),
(33, 1057, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'FAC-F001-003567', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(33, 1010, 'DRY-GYP-STD-12', 'VENTA', 15, 'W', 'FAC-F001-003568', 'Venta a cliente: Carpintería Los Andes.', NULL),
(33, 968, 'DRY-VOL-RH-12', 'VENTA', 4, 'A', 'FAC-F001-003569', 'Venta a cliente: Ebanistería Flores.', NULL),
(32, 1066, 'MEL-PEL-CAR-15', 'VENTA', 3, 'V', 'FAC-F001-003570', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(31, 823, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003571', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(31, 632, 'MEL-PEL-BLA-18', 'VENTA', 6, 'V', 'FAC-F001-003572', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(31, 511, 'HER-DUC-TEL-45', 'VENTA', 7, 'A', 'FAC-F001-003573', 'Venta a cliente: Decoraciones Huamán.', NULL),
(30, 648, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'BV-B001-001332', 'Venta a cliente: Público General.', NULL),
(30, 1016, 'MEL-PEL-BLA-18', 'VENTA', 9, 'W', 'BV-B001-001333', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(30, 587, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'FAC-F001-003574', 'Venta a cliente: Decoraciones Huamán.', NULL),
(30, 958, 'HER-DUC-TEL-45', 'VENTA', 16, 'V', 'FAC-F001-003575', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(30, 879, 'PIS-KAI-ROB-08', 'VENTA', 8, 'W', 'FAC-F001-003576', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(30, 767, 'DRY-VOL-RH-12', 'VENTA', 4, 'A', 'FAC-F001-003577', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(30, 537, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'FAC-F001-003578', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(29, 1006, 'MEL-PEL-BLA-18', 'VENTA', 4, 'V', 'BV-B001-001334', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(29, 676, 'MEL-PEL-CAR-15', 'VENTA', 5, 'V', 'FAC-F001-003579', 'Venta a cliente: Carpintería Los Andes.', NULL),
(29, 825, 'MDF-MAS-TRU-18', 'VENTA', 1, 'W', 'BV-B001-001335', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(29, 832, 'DRY-GYP-STD-12', 'VENTA', 19, 'W', 'FAC-F001-003580', 'Venta a cliente: Decoraciones Huamán.', NULL),
(29, 888, 'MEL-VES-ROB-18', 'VENTA', 1, 'V', 'FAC-F001-003581', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(29, 547, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'FAC-F001-003582', 'Venta a cliente: Ebanistería Flores.', NULL),
(29, 867, 'DRY-VOL-RH-12', 'VENTA', 6, 'W', 'BV-B001-001336', 'Venta a cliente: Carpintería Los Andes.', NULL),
(29, 1013, 'HER-DUC-TEL-45', 'VENTA', 4, 'V', 'FAC-F001-003583', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(28, 1093, 'DRY-VOL-RH-12', 'VENTA', 10, 'A', 'FAC-F001-003584', 'Venta a cliente: Ebanistería Flores.', NULL),
(28, 942, 'DRY-VOL-RH-12', 'VENTA', 8, 'W', 'FAC-F001-003585', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(28, 771, 'MEL-PEL-CAR-15', 'VENTA', 2, 'V', 'FAC-F001-003586', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(28, 761, 'DRY-VOL-RH-12', 'VENTA', 2, 'V', 'FAC-F001-003587', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(28, 731, 'PIS-KAI-ROB-08', 'VENTA', 3, 'V', 'BV-B001-001337', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(28, 809, 'DRY-VOL-RH-12', 'VENTA', 4, 'W', 'FAC-F001-003588', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(28, 1010, 'DRY-VOL-RH-12', 'VENTA', 9, 'A', 'FAC-F001-003589', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(27, 806, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'FAC-F001-003590', 'Venta a cliente: Ebanistería Flores.', NULL),
(27, 774, 'DRY-GYP-STD-12', 'VENTA', 19, 'V', 'FAC-F001-003591', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(27, 765, 'MEL-PEL-CAR-15', 'VENTA', 2, 'W', 'FAC-F001-003592', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(27, 1068, 'MUE-MOD-DES-01', 'VENTA', 2, 'A', 'BV-B001-001338', 'Venta a cliente: Público General.', NULL),
(27, 931, 'DRY-GYP-STD-12', 'VENTA', 19, 'A', 'BV-B001-001339', 'Venta a cliente: Público General.', NULL),
(27, 761, 'MEL-VES-ROB-18', 'VENTA', 7, 'V', 'BV-B001-001340', 'Venta a cliente: Público General.', NULL),
(27, 627, 'PIS-SPC-VIN-05', 'VENTA', 5, 'W', 'FAC-F001-003593', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(27, 813, 'MEL-PEL-BLA-18', 'VENTA', 2, 'V', 'BV-B001-001341', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(26, 701, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'BV-B001-001342', 'Venta a cliente: Público General.', NULL),
(26, 523, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'BV-B001-001343', 'Venta a cliente: Público General.', NULL),
(26, 1102, 'MEL-VES-ROB-18', 'VENTA', 2, 'W', 'FAC-F001-003594', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(26, 738, 'DRY-VOL-RH-12', 'VENTA', 6, 'A', 'BV-B001-001344', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(26, 813, 'HER-DUC-TEL-45', 'VENTA', 5, 'V', 'BV-B001-001345', 'Venta a cliente: Público General.', NULL),
(26, 853, 'DRY-VOL-RH-12', 'VENTA', 3, 'V', 'BV-B001-001346', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(26, 551, 'PIS-SPC-VIN-05', 'VENTA', 3, 'V', 'BV-B001-001347', 'Venta a cliente: Decoraciones Huamán.', NULL),
(25, 1014, 'MEL-PEL-BLA-18', 'VENTA', 10, 'A', 'FAC-F001-003595', 'Venta a cliente: Ebanistería Flores.', NULL),
(24, 620, 'PIS-KAI-ROB-08', 'VENTA', 2, 'A', 'FAC-F001-003596', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(24, 592, 'MEL-PEL-BLA-18', 'VENTA', 8, 'V', 'BV-B001-001348', 'Venta a cliente: Público General.', NULL),
(24, 524, 'MEL-VES-ROB-18', 'VENTA', 1, 'V', 'FAC-F001-003597', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(24, 1109, 'DRY-GYP-STD-12', 'VENTA', 14, 'V', 'BV-B001-001349', 'Venta a cliente: Decoraciones Huamán.', NULL),
(24, 651, 'DRY-VOL-RH-12', 'VENTA', 6, 'V', 'FAC-F001-003598', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(24, 649, 'MEL-PEL-BLA-18', 'VENTA', 10, 'W', 'BV-B001-001350', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(23, 901, 'MDF-MAS-TRU-18', 'VENTA', 4, 'V', 'BV-B001-001351', 'Venta a cliente: Público General.', NULL),
(23, 749, 'HER-DUC-TEL-45', 'VENTA', 13, 'W', 'BV-B001-001352', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(23, 522, 'MEL-VES-ROB-18', 'VENTA', 8, 'A', 'FAC-F001-003599', 'Venta a cliente: Carpintería Los Andes.', NULL),
(23, 725, 'HER-DUC-TEL-45', 'VENTA', 15, 'A', 'FAC-F001-003600', 'Venta a cliente: Carpintería Los Andes.', NULL),
(23, 1104, 'DRY-VOL-RH-12', 'VENTA', 9, 'W', 'BV-B001-001353', 'Venta a cliente: Público General.', NULL),
(23, 837, 'PIS-SPC-VIN-05', 'VENTA', 2, 'A', 'BV-B001-001354', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(22, 514, 'PIS-KAI-ROB-08', 'VENTA', 6, 'V', 'FAC-F001-003601', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(22, 687, 'HER-DUC-BIS-110', 'VENTA', 4, 'V', 'FAC-F001-003602', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(22, 621, 'DRY-GYP-STD-12', 'VENTA', 16, 'W', 'BV-B001-001355', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(22, 584, 'MEL-VES-ROB-18', 'VENTA', 5, 'V', 'BV-B001-001356', 'Venta a cliente: Ebanistería Flores.', NULL),
(22, 546, 'DRY-VOL-RH-12', 'VENTA', 3, 'V', 'FAC-F001-003603', 'Venta a cliente: Ebanistería Flores.', NULL),
(22, 1031, 'DRY-GYP-STD-12', 'VENTA', 10, 'W', 'FAC-F001-003604', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(22, 959, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'FAC-F001-003605', 'Venta a cliente: Decoraciones Huamán.', NULL),
(21, 693, 'MEL-PEL-BLA-18', 'VENTA', 10, 'W', 'FAC-F001-003606', 'Venta a cliente: Carpintería Los Andes.', NULL),
(21, 815, 'DRY-VOL-RH-12', 'VENTA', 8, 'W', 'BV-B001-001357', 'Venta a cliente: Decoraciones Huamán.', NULL),
(21, 1070, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'BV-B001-001358', 'Venta a cliente: Público General.', NULL),
(21, 817, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'FAC-F001-003607', 'Venta a cliente: Ebanistería Flores.', NULL),
(21, 621, 'DRY-GYP-STD-12', 'VENTA', 14, 'V', 'FAC-F001-003608', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(21, 979, 'MEL-PEL-CAR-15', 'VENTA', 1, 'W', 'FAC-F001-003609', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(21, 1006, 'MDF-MAS-TRU-18', 'VENTA', 4, 'V', 'BV-B001-001359', 'Venta a cliente: Público General.', NULL),
(21, 845, 'MEL-PEL-BLA-18', 'VENTA', 3, 'W', 'BV-B001-001360', 'Venta a cliente: Carpintería Los Andes.', NULL),
(20, 704, 'DRY-GYP-STD-12', 'VENTA', 5, 'W', 'BV-B001-001361', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(20, 790, 'MEL-VES-ROB-18', 'VENTA', 1, 'A', 'FAC-F001-003610', 'Venta a cliente: Carpintería Los Andes.', NULL),
(20, 807, 'DRY-GYP-STD-12', 'VENTA', 11, 'A', 'FAC-F001-003611', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(20, 637, 'MEL-VES-ROB-18', 'VENTA', 5, 'W', 'FAC-F001-003612', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(20, 1096, 'HER-DUC-BIS-110', 'VENTA', 4, 'V', 'BV-B001-001362', 'Venta a cliente: Carpintería Los Andes.', NULL),
(20, 1018, 'PIS-KAI-ROB-08', 'VENTA', 4, 'W', 'BV-B001-001363', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(20, 683, 'DRY-VOL-RH-12', 'VENTA', 7, 'W', 'FAC-F001-003613', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(19, 859, 'DRY-VOL-RH-12', 'VENTA', 3, 'W', 'BV-B001-001364', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(19, 772, 'HER-DUC-TEL-45', 'VENTA', 8, 'V', 'FAC-F001-003614', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(19, 683, 'HER-DUC-TEL-45', 'VENTA', 13, 'V', 'BV-B001-001365', 'Venta a cliente: Público General.', NULL),
(19, 1005, 'HER-DUC-TEL-45', 'VENTA', 11, 'W', 'FAC-F001-003615', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(19, 629, 'HER-DUC-BIS-110', 'VENTA', 1, 'V', 'BV-B001-001366', 'Venta a cliente: Público General.', NULL),
(19, 1019, 'MUE-MOD-DES-01', 'VENTA', 1, 'V', 'FAC-F001-003616', 'Venta a cliente: Decoraciones Huamán.', NULL),
(17, 1085, 'MEL-PEL-BLA-18', 'VENTA', 6, 'A', 'FAC-F001-003617', 'Venta a cliente: Decoraciones Huamán.', NULL),
(17, 672, 'PIS-SPC-VIN-05', 'VENTA', 4, 'W', 'FAC-F001-003618', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(17, 878, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'FAC-F001-003619', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(16, 876, 'PIS-KAI-ROB-08', 'VENTA', 4, 'V', 'FAC-F001-003620', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(16, 902, 'MUE-MOD-DES-01', 'VENTA', 2, 'W', 'BV-B001-001367', 'Venta a cliente: Público General.', NULL),
(16, 632, 'PIS-KAI-ROB-08', 'VENTA', 5, 'V', 'BV-B001-001368', 'Venta a cliente: Público General.', NULL),
(16, 976, 'MDF-MAS-TRU-18', 'VENTA', 2, 'A', 'BV-B001-001369', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(16, 819, 'MEL-VES-ROB-18', 'VENTA', 4, 'W', 'BV-B001-001370', 'Venta a cliente: Carpintería Los Andes.', NULL),
(16, 1005, 'PIS-SPC-VIN-05', 'VENTA', 6, 'W', 'BV-B001-001371', 'Venta a cliente: Público General.', NULL),
(16, 724, 'MEL-PEL-BLA-18', 'VENTA', 8, 'W', 'BV-B001-001372', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(15, 1010, 'DRY-GYP-STD-12', 'VENTA', 19, 'A', 'BV-B001-001373', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(15, 895, 'PIS-KAI-ROB-08', 'VENTA', 5, 'V', 'BV-B001-001374', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(15, 552, 'DRY-GYP-STD-12', 'VENTA', 16, 'W', 'BV-B001-001375', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(15, 803, 'DRY-VOL-RH-12', 'VENTA', 9, 'A', 'BV-B001-001376', 'Venta a cliente: Público General.', NULL),
(15, 770, 'MEL-VES-ROB-18', 'VENTA', 4, 'A', 'BV-B001-001377', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(14, 797, 'HER-DUC-TEL-45', 'VENTA', 13, 'V', 'FAC-F001-003621', 'Venta a cliente: Ebanistería Flores.', NULL),
(14, 968, 'HER-DUC-TEL-45', 'VENTA', 12, 'V', 'FAC-F001-003622', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(14, 717, 'MEL-VES-ROB-18', 'VENTA', 2, 'W', 'BV-B001-001378', 'Venta a cliente: Público General.', NULL);

INSERT INTO #Eventos (Dia, Minuto, Sku, Tipo, Cantidad, Usuario, Doc, Obs, Motivo) VALUES
(14, 570, 'MEL-PEL-BLA-18', 'VENTA', 7, 'V', 'FAC-F001-003623', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(14, 948, 'MEL-VES-ROB-18', 'VENTA', 5, 'W', 'FAC-F001-003624', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(13, 583, 'MEL-PEL-BLA-18', 'VENTA', 2, 'V', 'FAC-F001-003625', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(13, 995, 'MDF-MAS-TRU-18', 'VENTA', 2, 'W', 'BV-B001-001379', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(13, 525, 'MEL-PEL-BLA-18', 'VENTA', 10, 'W', 'FAC-F001-003626', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(13, 1088, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'BV-B001-001380', 'Venta a cliente: Carpintería Los Andes.', NULL),
(13, 716, 'MEL-VES-ROB-18', 'VENTA', 8, 'V', 'FAC-F001-003627', 'Venta a cliente: Decoraciones Huamán.', NULL),
(13, 892, 'HER-DUC-BIS-110', 'VENTA', 1, 'W', 'FAC-F001-003628', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(13, 867, 'HER-DUC-BIS-110', 'VENTA', 5, 'V', 'BV-B001-001381', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(12, 842, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'FAC-F001-003629', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(12, 608, 'MEL-VES-ROB-18', 'VENTA', 6, 'A', 'BV-B001-001382', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(12, 879, 'MEL-PEL-BLA-18', 'VENTA', 5, 'W', 'BV-B001-001383', 'Venta a cliente: Decoraciones Huamán.', NULL),
(12, 729, 'DRY-VOL-RH-12', 'VENTA', 7, 'A', 'BV-B001-001384', 'Venta a cliente: Público General.', NULL),
(12, 905, 'PIS-KAI-ROB-08', 'VENTA', 4, 'A', 'FAC-F001-003630', 'Venta a cliente: Carpintería Los Andes.', NULL),
(12, 1077, 'DRY-GYP-STD-12', 'VENTA', 15, 'V', 'BV-B001-001385', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(12, 768, 'MEL-PEL-BLA-18', 'VENTA', 4, 'W', 'FAC-F001-003631', 'Venta a cliente: Decoraciones Huamán.', NULL),
(12, 1098, 'MEL-PEL-BLA-18', 'VENTA', 3, 'V', 'BV-B001-001386', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(11, 837, 'DRY-VOL-RH-12', 'VENTA', 3, 'W', 'FAC-F001-003632', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(10, 1073, 'DRY-GYP-STD-12', 'VENTA', 16, 'V', 'BV-B001-001387', 'Venta a cliente: Público General.', NULL),
(10, 754, 'PIS-KAI-ROB-08', 'VENTA', 7, 'V', 'BV-B001-001388', 'Venta a cliente: Público General.', NULL),
(10, 744, 'HER-DUC-TEL-45', 'VENTA', 7, 'W', 'FAC-F001-003633', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(10, 902, 'DRY-VOL-RH-12', 'VENTA', 7, 'W', 'FAC-F001-003634', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(10, 1101, 'DRY-GYP-STD-12', 'VENTA', 17, 'V', 'BV-B001-001389', 'Venta a cliente: Público General.', NULL),
(9, 1000, 'MDF-MAS-TRU-18', 'VENTA', 3, 'A', 'BV-B001-001390', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(9, 997, 'PIS-SPC-VIN-05', 'VENTA', 4, 'W', 'FAC-F001-003635', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(9, 1046, 'DRY-GYP-STD-12', 'VENTA', 21, 'V', 'BV-B001-001391', 'Venta a cliente: Público General.', NULL),
(9, 925, 'PIS-KAI-ROB-08', 'VENTA', 6, 'W', 'BV-B001-001392', 'Venta a cliente: Público General.', NULL),
(9, 802, 'DRY-VOL-RH-12', 'VENTA', 8, 'V', 'BV-B001-001393', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(8, 767, 'MUE-MOD-DES-01', 'VENTA', 2, 'V', 'BV-B001-001394', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(8, 741, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'FAC-F001-003636', 'Venta a cliente: Carpintería Los Andes.', NULL),
(8, 917, 'MEL-PEL-CAR-15', 'VENTA', 2, 'V', 'FAC-F001-003637', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(8, 706, 'MDF-MAS-TRU-18', 'VENTA', 3, 'W', 'FAC-F001-003638', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(8, 897, 'DRY-GYP-STD-12', 'VENTA', 19, 'A', 'FAC-F001-003639', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(7, 679, 'DRY-GYP-STD-12', 'VENTA', 17, 'W', 'FAC-F001-003640', 'Venta a cliente: Carpintería Los Andes.', NULL),
(7, 730, 'HER-DUC-BIS-110', 'VENTA', 2, 'A', 'BV-B001-001395', 'Venta a cliente: Público General.', NULL),
(7, 620, 'MEL-PEL-BLA-18', 'VENTA', 6, 'V', 'BV-B001-001396', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(7, 873, 'HER-DUC-TEL-45', 'VENTA', 11, 'V', 'BV-B001-001397', 'Venta a cliente: Carpintería Los Andes.', NULL),
(6, 511, 'HER-DUC-TEL-45', 'VENTA', 14, 'V', 'FAC-F001-003641', 'Venta a cliente: Decoraciones Huamán.', NULL),
(6, 1053, 'DRY-GYP-STD-12', 'VENTA', 22, 'V', 'FAC-F001-003642', 'Venta a cliente: Carpintería Los Andes.', NULL),
(6, 861, 'DRY-GYP-STD-12', 'VENTA', 18, 'W', 'FAC-F001-003643', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(6, 782, 'MEL-VES-ROB-18', 'VENTA', 5, 'W', 'BV-B001-001398', 'Venta a cliente: Decoraciones Huamán.', NULL),
(6, 817, 'MEL-VES-ROB-18', 'VENTA', 6, 'V', 'BV-B001-001399', 'Venta a cliente: Público General.', NULL),
(6, 525, 'PIS-SPC-VIN-05', 'VENTA', 5, 'W', 'FAC-F001-003644', 'Venta a cliente: Decoraciones Huamán.', NULL),
(6, 616, 'DRY-GYP-STD-12', 'VENTA', 16, 'V', 'FAC-F001-003645', 'Venta a cliente: Decoraciones Huamán.', NULL),
(5, 868, 'HER-DUC-TEL-45', 'VENTA', 9, 'V', 'FAC-F001-003646', 'Venta a cliente: Constructora Pacífico Sur S.A.C..', NULL),
(5, 620, 'MEL-PEL-BLA-18', 'VENTA', 10, 'V', 'FAC-F001-003647', 'Venta a cliente: Proyectos Interiores Delgado S.A.C..', NULL),
(5, 561, 'MEL-PEL-BLA-18', 'VENTA', 9, 'V', 'FAC-F001-003648', 'Venta a cliente: Carpintería Los Andes.', NULL),
(5, 734, 'HER-DUC-BIS-110', 'VENTA', 1, 'V', 'BV-B001-001400', 'Venta a cliente: Público General.', NULL),
(5, 581, 'MEL-VES-ROB-18', 'VENTA', 3, 'V', 'FAC-F001-003649', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(3, 669, 'PIS-KAI-ROB-08', 'VENTA', 2, 'V', 'FAC-F001-003650', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(3, 692, 'MEL-PEL-BLA-18', 'VENTA', 7, 'W', 'BV-B001-001401', 'Venta a cliente: Público General.', NULL),
(3, 1054, 'DRY-GYP-STD-12', 'VENTA', 14, 'V', 'FAC-F001-003651', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(3, 1007, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'FAC-F001-003652', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(3, 912, 'MEL-PEL-CAR-15', 'VENTA', 5, 'W', 'BV-B001-001402', 'Venta a cliente: Público General.', NULL),
(3, 586, 'MDF-MAS-TRU-18', 'VENTA', 4, 'A', 'FAC-F001-003653', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(2, 1036, 'MEL-PEL-BLA-18', 'VENTA', 7, 'V', 'BV-B001-001403', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(2, 512, 'HER-DUC-TEL-45', 'VENTA', 7, 'W', 'BV-B001-001404', 'Venta a cliente: Público General.', NULL),
(2, 793, 'PIS-KAI-ROB-08', 'VENTA', 8, 'V', 'BV-B001-001405', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(2, 776, 'MEL-PEL-BLA-18', 'VENTA', 8, 'V', 'BV-B001-001406', 'Venta a cliente: Público General.', NULL),
(2, 985, 'MDF-MAS-TRU-18', 'VENTA', 2, 'V', 'BV-B001-001407', 'Venta a cliente: Público General.', NULL),
(2, 642, 'PIS-KAI-ROB-08', 'VENTA', 8, 'V', 'BV-B001-001408', 'Venta a cliente: Público General.', NULL),
(2, 1100, 'MEL-PEL-BLA-18', 'VENTA', 6, 'W', 'FAC-F001-003654', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(2, 1026, 'MDF-MAS-TRU-18', 'VENTA', 2, 'V', 'FAC-F001-003655', 'Venta a cliente: Remodelaciones Santa Rosa.', NULL),
(1, 790, 'DRY-GYP-STD-12', 'VENTA', 14, 'A', 'FAC-F001-003656', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(1, 1087, 'MDF-MAS-TRU-18', 'VENTA', 2, 'A', 'FAC-F001-003657', 'Venta a cliente: Ebanistería Flores.', NULL),
(1, 981, 'MEL-PEL-BLA-18', 'VENTA', 7, 'A', 'FAC-F001-003658', 'Venta a cliente: Inversiones Drywall Lima S.A.C..', NULL),
(1, 583, 'MEL-PEL-BLA-18', 'VENTA', 7, 'W', 'FAC-F001-003659', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(1, 775, 'MEL-PEL-BLA-18', 'VENTA', 6, 'V', 'FAC-F001-003660', 'Venta a cliente: Taller de Melamina El Roble.', NULL),
(1, 1018, 'DRY-GYP-STD-12', 'VENTA', 17, 'W', 'FAC-F001-003661', 'Venta a cliente: Ebanistería Flores.', NULL),
(1, 740, 'MDF-MAS-TRU-18', 'VENTA', 2, 'A', 'FAC-F001-003662', 'Venta a cliente: Arq. Valeria Campos.', NULL),
(1, 919, 'MEL-PEL-CAR-15', 'VENTA', 1, 'V', 'FAC-F001-003663', 'Venta a cliente: Cocinas y Closets Quispe.', NULL),
(0, 603, 'MEL-PEL-BLA-18', 'VENTA', 7, 'W', 'BV-B001-001409', 'Venta a cliente: Muebles Rivera E.I.R.L..', NULL),
(0, 655, 'MEL-PEL-CAR-15', 'VENTA', 4, 'V', 'FAC-F001-003664', 'Venta a cliente: Carpintería Los Andes.', NULL),
(0, 630, 'PIS-SPC-VIN-05', 'VENTA', 6, 'A', 'FAC-F001-003665', 'Venta a cliente: Decoraciones Huamán.', NULL),
(2, 952, 'DRY-VOL-RH-12', 'VENTA_GRANDE', 0, 'A', 'FAC-F001-003666', 'Venta a cliente: Constructora Pacífico Sur S.A.C.. Pedido para obra.', NULL),
(1, 909, 'PIS-SPC-VIN-05', 'VENTA_GRANDE', 0, 'W', 'FAC-F001-003667', 'Venta a cliente: Proyectos Interiores Delgado S.A.C.. Pedido para obra.', NULL),
(1, 768, 'MDF-MAS-TRU-18', 'VENTA_GRANDE', 0, 'W', 'FAC-F001-003668', 'Venta a cliente: Muebles Rivera E.I.R.L.. Pedido para obra.', NULL),
(89, 457, 'MEL-PEL-BLA-18', 'MERMA_DANO', 1, 'L', NULL, 'Dos esquinas rotas al bajar el lote del camión del proveedor.', 'Tablero desportillado en descarga'),
(83, 532, 'MEL-VES-ROB-18', 'MERMA_DANO', 3, 'L', NULL, 'Plancha con hundimiento en la cara principal tras maniobra en el rack.', 'Golpe de montacargas'),
(76, 500, 'DRY-GYP-STD-12', 'MERMA_DANO', 3, 'L', NULL, 'Planchas con manchas de humedad por filtración en la zona B.', 'Humedad en drywall'),
(68, 715, 'DRY-VOL-RH-12', 'MERMA_DANO', 2, 'L', NULL, 'Cartón rasgado en el borde al apilar las planchas sin separadores.', 'Cartón rasgado'),
(65, 539, 'PIS-KAI-ROB-08', 'MERMA_DANO', 3, 'L', NULL, 'Caja aplastada con tablillas quebradas en el sistema de clic.', 'Caja aplastada'),
(57, 515, 'MDF-MAS-TRU-18', 'MERMA_DANO', 1, 'L', NULL, 'Tablero deformado por almacenamiento vertical prolongado.', 'Tablero alabeado'),
(51, 521, 'DRY-GYP-STD-12', 'MERMA_DANO', 3, 'L', NULL, 'Plancha partida al moverla del patio de recepción al rack.', 'Rotura en traslado interno'),
(48, 587, 'MEL-PEL-CAR-15', 'MERMA_DANO', 3, 'L', NULL, 'Rayones profundos en la cara melamínica, no apto para venta.', 'Rayado en superficie'),
(43, 896, 'HER-DUC-TEL-45', 'FALTANTE', 6, 'L', NULL, 'El conteo físico del rack D encontró menos pares que el sistema.', 'Diferencia en conteo cíclico'),
(37, 509, 'HER-DUC-BIS-110', 'FALTANTE', 4, 'L', NULL, 'Faltan bolsas respecto al sistema en el conteo semanal.', 'Diferencia en conteo cíclico'),
(30, 724, 'PIS-SPC-VIN-05', 'FALTANTE', 2, 'L', NULL, 'Conteo mensual con una caja menos que el registro del sistema.', 'Diferencia en conteo cíclico'),
(27, 1004, 'MEL-PEL-BLA-18', 'FALTANTE', 2, 'L', NULL, 'Se detectó una plancha despachada sin comprobante en el conteo.', 'Despacho sin registrar'),
(18, 806, 'HER-DUC-TEL-45', 'SOBRANTE', 4, 'L', NULL, 'Se encontraron pares adicionales mal ubicados en el rack D.', 'Sobrante en conteo físico'),
(12, 489, 'DRY-GYP-STD-12', 'SOBRANTE', 3, 'L', NULL, 'Planchas de un lote anterior que no se registraron al recibir.', 'Recepción no registrada'),
(7, 457, 'MEL-VES-ROB-18', 'MERMA_DANO', 2, 'L', NULL, 'Borde desportillado detectado durante la inspección del lote.', 'Tablero desportillado en descarga'),
(2, 521, 'PIS-KAI-ROB-08', 'MERMA_DANO', 1, 'L', NULL, 'Caja con humedad que hinchó las tablillas del piso laminado.', 'Humedad en empaque');

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
