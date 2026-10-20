-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Paso 0 (solo SQL Server local): crea la base de datos vacía.
-- En Azure SQL la base de datos se crea desde el portal y este script NO se ejecuta.
-- Después ejecuta 01_ESQUEMA_Y_DATOS.sql conectado a RepresentacionesMartinDB.
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

PRINT 'Base de datos RepresentacionesMartinDB creada. Ahora ejecuta 01_ESQUEMA_Y_DATOS.sql sobre ella.';
GO
