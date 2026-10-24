-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Usuario de la aplicación para Azure SQL Database (usuario contenido, sin login)
--
-- La API NO debe conectarse con la cuenta de administrador del servidor.
-- Este script crea "martin_app" con los permisos mínimos que usa server/*.js:
--   * Lectura de todas las tablas y vistas (db_datareader).
--   * INSERT en BitacoraAuditoria, Kardex, MovimientosInventario, PasswordResets, Usuarios.
--   * UPDATE en PasswordResets, Productos, Usuarios.
--   * EXECUTE en sp_AjusteInventarioManual (HU-004: registra el ajuste, stock, Kardex y bitácora).
--   * Ningún DELETE ni cambios de esquema: la bitácora de auditoría no se puede alterar.
--
-- Cómo usarlo:
--   1. Conecta SSMS a la base RepresentacionesMartinDB (NO a master) con el administrador.
--   2. Sustituye <<CAMBIA_ESTA_CONTRASEÑA>> por una contraseña larga y nueva.
--      Azure exige al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos.
--   3. Ejecuta el script (F5). No guardes el archivo con la contraseña real.
--   4. Pon DB_USER=martin_app y esa contraseña en DB_PASSWORD (server/.env y Vercel).
-- ====================================================================================

DECLARE @Password NVARCHAR(128) = N'<<CAMBIA_ESTA_CONTRASEÑA>>';
DECLARE @BaseActual SYSNAME = DB_NAME();

IF @BaseActual = 'master'
BEGIN
    RAISERROR('Estás conectado a master. Selecciona la base RepresentacionesMartinDB y vuelve a ejecutar.', 16, 1);
    SET NOEXEC ON;
END
ELSE IF @Password = N'<<CAMBIA_ESTA_CONTRASEÑA>>'
BEGIN
    RAISERROR('Sustituye <<CAMBIA_ESTA_CONTRASEÑA>> por una contraseña real antes de ejecutar.', 16, 1);
    SET NOEXEC ON;
END
ELSE IF USER_ID('martin_app') IS NULL
BEGIN
    BEGIN TRY
        DECLARE @Sql NVARCHAR(400) = N'CREATE USER martin_app WITH PASSWORD = ' + QUOTENAME(@Password, '''') + N';';
        EXEC (@Sql);
        PRINT 'Usuario martin_app creado.';
    END TRY
    BEGIN CATCH
        -- Sin usuario no tiene sentido aplicar permisos: se detiene el resto del script
        DECLARE @Error NVARCHAR(2048) = ERROR_MESSAGE();
        RAISERROR('No se pudo crear martin_app: %s', 16, 1, @Error);
        SET NOEXEC ON;
    END CATCH
END
ELSE
BEGIN
    PRINT 'El usuario martin_app ya existía: se reaplican los permisos (la contraseña no cambia).';
END
GO

ALTER ROLE db_datareader ADD MEMBER martin_app;

GRANT INSERT ON dbo.BitacoraAuditoria     TO martin_app;
GRANT INSERT ON dbo.Kardex                TO martin_app;
GRANT INSERT ON dbo.MovimientosInventario TO martin_app;
GRANT INSERT, UPDATE ON dbo.PasswordResets TO martin_app;
GRANT UPDATE ON dbo.Productos             TO martin_app;
GRANT INSERT, UPDATE ON dbo.Usuarios      TO martin_app;
GRANT EXECUTE ON dbo.sp_AjusteInventarioManual TO martin_app;
GO

PRINT 'Permisos de martin_app aplicados.';
GO
SET NOEXEC OFF;
GO
