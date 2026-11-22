-- ====================================================================================
-- SISTEMA DE CONTROL DE INVENTARIO - "REPRESENTACIONES MARTÍN"
-- Migración: rol Vendedor (nivel 4) para bases ya creadas
--
-- * Crea el rol Vendedor: consulta el catálogo y el stock, registra ventas y ve el
--   dashboard de ventas. No modifica productos ni registra compras, mermas o ajustes,
--   y no ve costos de compra (lo controla la API, ver shared/roleRules.js).
-- * Crea la cuenta vendedor@rep-martin.com sin contraseña utilizable. Para habilitarla:
--     npm run set-password -- vendedor@rep-martin.com          (local)
--     npm run set-password:azure -- vendedor@rep-martin.com    (Azure)
--
-- Ejecutar conectado a RepresentacionesMartinDB (local o Azure) con un usuario
-- administrador. Es un solo lote (sin GO) y es re-ejecutable: no duplica nada.
-- Las bases creadas con 01_ESQUEMA_Y_DATOS.sql actualizado ya incluyen el rol.
-- ====================================================================================

IF DB_NAME() = 'master'
BEGIN
    RAISERROR('Estás conectado a master. Selecciona la base RepresentacionesMartinDB y vuelve a ejecutar.', 16, 1);
    RETURN;
END

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Vendedor')
BEGIN
    INSERT INTO Roles (NombreRol, Descripcion, NivelJerarquico, PermisosJSON)
    VALUES ('Vendedor', 'Atención comercial: consulta el catálogo y el stock, registra ventas y ve el dashboard de ventas', 4,
            '["CATALOGO_VIEW", "VENTAS_WRITE", "VENTAS_VIEW", "QUICK_STOCK", "ALERTAS_VIEW", "DASHBOARD_VENTAS"]');
    PRINT 'Rol Vendedor creado.';
END
ELSE
    PRINT 'El rol Vendedor ya existía.';

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE CorreoCorporativo = 'vendedor@rep-martin.com')
BEGIN
    -- El marcador no es un hash bcrypt válido: la cuenta no inicia sesión hasta asignarle contraseña
    INSERT INTO Usuarios (IdRol, Nombres, Apellidos, CorreoCorporativo, Telefono, Direccion, PasswordHash, RequiereCambioPassword, Activo)
    SELECT IdRol, 'Lucía Fernanda', 'Ramos Castillo', 'vendedor@rep-martin.com', '986741235', 'Av. Arequipa 2450, Lince', 'HASH_VENDEDOR_2026', 0, 1
    FROM Roles WHERE NombreRol = 'Vendedor';

    INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion)
    SELECT IdUsuario, 'USUARIO_CREADO', 'SEGURIDAD', 'Alta del rol Vendedor (nivel 4) y de la cuenta vendedor@rep-martin.com.'
    FROM Usuarios WHERE CorreoCorporativo = 'administrador@rep-martin.com';

    PRINT 'Cuenta vendedor@rep-martin.com creada (asígnale una contraseña con set-password).';
END
ELSE
    PRINT 'La cuenta vendedor@rep-martin.com ya existía.';

COMMIT TRANSACTION;
