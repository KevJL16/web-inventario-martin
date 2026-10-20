// ============================================================================
// AUTENTICACIÓN Y GESTIÓN DE USUARIOS (RF-01, RF-02, RF-03, RF-04, RF-21)
// Contraseñas con bcrypt, sesión con JWT (Authorization: Bearer <token>).
// ============================================================================

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getPool, sql } from './db.js';
import { JWT_SECRET, JWT_EXPIRES_IN, IS_PRODUCTION } from './config.js';
import {
  hashPassword,
  verifyPassword,
  DUMMY_HASH,
  MIN_PASSWORD_LENGTH,
  generateTemporaryPassword,
  generateResetToken,
  hashResetToken
} from './passwords.js';

const RESET_TOKEN_MINUTES = 30;
const ADMIN_ROLE = 'Administrador';

const USER_COLUMNS = `
  u.IdUsuario, u.IdRol, r.NombreRol, u.Nombres, u.Apellidos, u.CorreoCorporativo,
  u.Telefono, u.Direccion, u.RequiereCambioPassword, u.Activo, u.MotivoBaja,
  u.FechaBaja, u.FechaRegistro, u.UltimoAcceso
`;

// Nunca se envía PasswordHash al cliente
function toPublicUser(row) {
  return {
    id: row.IdUsuario,
    rolId: row.IdRol,
    rolNombre: row.NombreRol,
    nombres: row.Nombres,
    apellidos: row.Apellidos,
    correo: row.CorreoCorporativo,
    telefono: row.Telefono,
    direccion: row.Direccion,
    requiereCambioPassword: Boolean(row.RequiereCambioPassword),
    activo: Boolean(row.Activo),
    motivoBaja: row.MotivoBaja,
    fechaBaja: row.FechaBaja,
    fechaRegistro: row.FechaRegistro,
    ultimoAcceso: row.UltimoAcceso
  };
}

async function findUserById(id) {
  const p = await getPool();
  const result = await p.request()
    .input('id', sql.Int, id)
    .query(`SELECT ${USER_COLUMNS} FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol WHERE u.IdUsuario = @id;`);
  return result.recordset[0] || null;
}

async function logAudit(userId, accion, descripcion, ip) {
  try {
    const p = await getPool();
    await p.request()
      .input('idUser', sql.Int, userId)
      .input('accion', sql.VarChar, accion)
      .input('desc', sql.NVarChar, descripcion)
      .input('ip', sql.VarChar, ip || null)
      .query(`INSERT INTO BitacoraAuditoria (IdUsuario, Accion, Modulo, Descripcion, DireccionIP)
              VALUES (@idUser, @accion, 'SEGURIDAD', @desc, @ip);`);
  } catch (err) {
    console.error('No se pudo registrar en BitacoraAuditoria:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Middlewares
// ---------------------------------------------------------------------------

// Verifica el JWT y recarga el usuario desde la BD (una baja lógica revoca el acceso al instante)
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Sesión no iniciada.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada.' });
  }

  try {
    const user = await findUserById(Number(payload.sub));
    if (!user || !user.Activo) {
      return res.status(401).json({ success: false, message: 'La cuenta no está activa.' });
    }
    req.user = toPublicUser(user);
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rolNombre)) {
      return res.status(403).json({ success: false, message: 'No tiene permisos para esta acción.' });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

export const authRouter = Router();

// Iniciar sesión con correo corporativo y contraseña
authRouter.post('/auth/login', async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!correo || !password) {
    return res.status(400).json({ success: false, message: 'Por favor ingrese su correo y contraseña.' });
  }

  try {
    const p = await getPool();
    const result = await p.request()
      .input('correo', sql.VarChar, correo)
      .query(`SELECT ${USER_COLUMNS}, u.PasswordHash FROM Usuarios u
              INNER JOIN Roles r ON u.IdRol = r.IdRol
              WHERE LOWER(u.CorreoCorporativo) = @correo;`);
    const user = result.recordset[0];

    const valid = await verifyPassword(password, user?.PasswordHash || DUMMY_HASH);
    if (!user || !valid) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    if (!user.Activo) {
      return res.status(403).json({
        success: false,
        message: `La cuenta de ${user.Nombres} se encuentra INACTIVA. Comuníquese con el Administrador de Sistemas.`
      });
    }

    await p.request()
      .input('id', sql.Int, user.IdUsuario)
      .query('UPDATE Usuarios SET UltimoAcceso = SYSDATETIME() WHERE IdUsuario = @id;');
    await logAudit(user.IdUsuario, 'LOGIN', `Inicio de sesión de ${user.CorreoCorporativo}`, req.ip);

    const token = jwt.sign({ sub: String(user.IdUsuario), rol: user.NombreRol }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({ success: true, token, user: toPublicUser({ ...user, UltimoAcceso: new Date() }) });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, message: 'No se pudo conectar con el servidor de autenticación.' });
  }
});

// Usuario de la sesión actual
authRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// RF-02: Solicitar token de restablecimiento.
// La respuesta es siempre la misma para no revelar qué correos existen.
authRouter.post('/auth/password-reset/request', async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const genericResponse = {
    success: true,
    message: 'Si el correo está registrado y activo, recibirá un token de recuperación válido por 30 minutos.'
  };

  if (!correo) {
    return res.status(400).json({ success: false, message: 'Ingrese su correo corporativo.' });
  }

  try {
    const p = await getPool();
    const result = await p.request()
      .input('correo', sql.VarChar, correo)
      .query('SELECT IdUsuario, CorreoCorporativo, Activo FROM Usuarios WHERE LOWER(CorreoCorporativo) = @correo;');
    const user = result.recordset[0];

    if (user && user.Activo) {
      const { token, tokenHash } = generateResetToken();
      await p.request()
        .input('idUser', sql.Int, user.IdUsuario)
        .input('tokenHash', sql.VarChar, tokenHash)
        .input('minutes', sql.Int, RESET_TOKEN_MINUTES)
        .input('ip', sql.VarChar, req.ip || null)
        .query(`INSERT INTO PasswordResets (IdUsuario, TokenSeguridad, FechaExpiracion, IpSolicitud)
                VALUES (@idUser, @tokenHash, DATEADD(MINUTE, @minutes, SYSDATETIME()), @ip);`);
      await logAudit(user.IdUsuario, 'SOLICITUD_RESET_PASSWORD', 'Token de recuperación emitido', req.ip);

      // TODO: enviar el token por correo (SMTP). Mientras tanto, solo en desarrollo se muestra en la consola del servidor.
      if (!IS_PRODUCTION) {
        console.log(`🔑 [DEV] Token de recuperación para ${user.CorreoCorporativo}: ${token}`);
      }
    }

    res.json(genericResponse);
  } catch (err) {
    console.error('Error al solicitar restablecimiento:', err);
    res.status(500).json({ success: false, message: 'No se pudo procesar la solicitud.' });
  }
});

// RF-02: Confirmar restablecimiento con token
authRouter.post('/auth/password-reset/confirm', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!token || newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Ingrese el token y una contraseña de al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    });
  }

  try {
    const p = await getPool();
    const result = await p.request()
      .input('tokenHash', sql.VarChar, hashResetToken(token))
      .query(`SELECT TOP 1 IdReset, IdUsuario FROM PasswordResets
              WHERE TokenSeguridad = @tokenHash AND Usado = 0 AND FechaExpiracion > SYSDATETIME();`);
    const record = result.recordset[0];

    if (!record) {
      return res.status(400).json({ success: false, message: 'El token de seguridad es inválido, expiró o ya fue utilizado.' });
    }

    const passwordHash = await hashPassword(newPassword);
    const transaction = new sql.Transaction(p);
    await transaction.begin();
    try {
      await transaction.request()
        .input('idReset', sql.Int, record.IdReset)
        .query('UPDATE PasswordResets SET Usado = 1, FechaUso = SYSDATETIME() WHERE IdReset = @idReset;');
      await transaction.request()
        .input('idUser', sql.Int, record.IdUsuario)
        .input('hash', sql.VarChar, passwordHash)
        .query('UPDATE Usuarios SET PasswordHash = @hash, RequiereCambioPassword = 0 WHERE IdUsuario = @idUser;');
      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }

    await logAudit(record.IdUsuario, 'PASSWORD_RESTABLECIDO', 'Contraseña restablecida mediante token', req.ip);
    res.json({ success: true, message: 'Contraseña restablecida exitosamente. Ya puede iniciar sesión con su nueva clave.' });
  } catch (err) {
    console.error('Error al confirmar restablecimiento:', err);
    res.status(500).json({ success: false, message: 'No se pudo restablecer la contraseña.' });
  }
});

// Roles disponibles (para el formulario de alta de usuarios)
authRouter.get('/roles', requireAuth, async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT IdRol AS id, NombreRol AS nombre, Descripcion AS descripcion, NivelJerarquico AS nivel
      FROM Roles WHERE Activo = 1 ORDER BY NivelJerarquico;
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lista de usuarios (solo Administrador)
authRouter.get('/usuarios', requireAuth, requireRole(ADMIN_ROLE), async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT ${USER_COLUMNS} FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol
      ORDER BY u.FechaRegistro DESC;
    `);
    res.json(result.recordset.map(toPublicUser));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// RF-01: Alta de usuario con contraseña temporal (solo Administrador)
authRouter.post('/usuarios', requireAuth, requireRole(ADMIN_ROLE), async (req, res) => {
  const { nombres, apellidos, correo, telefono, direccion, rolId } = req.body || {};

  if (!nombres?.trim() || !apellidos?.trim() || !correo?.includes('@') || !telefono?.trim() || !rolId) {
    return res.status(400).json({ success: false, message: 'Complete nombres, apellidos, correo, teléfono y rol.' });
  }

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const p = await getPool();

    const result = await p.request()
      .input('rol', sql.Int, Number(rolId))
      .input('nombres', sql.VarChar, nombres.trim())
      .input('apellidos', sql.VarChar, apellidos.trim())
      .input('correo', sql.VarChar, correo.trim().toLowerCase())
      .input('telefono', sql.VarChar, telefono.trim())
      .input('direccion', sql.VarChar, direccion?.trim() || null)
      .input('hash', sql.VarChar, passwordHash)
      .query(`INSERT INTO Usuarios (IdRol, Nombres, Apellidos, CorreoCorporativo, Telefono, Direccion, PasswordHash, RequiereCambioPassword, Activo)
              OUTPUT INSERTED.IdUsuario
              VALUES (@rol, @nombres, @apellidos, @correo, @telefono, @direccion, @hash, 1, 1);`);

    const created = await findUserById(result.recordset[0].IdUsuario);
    await logAudit(req.user.id, 'CREAR_USUARIO', `Alta de usuario ${created.CorreoCorporativo} (${created.NombreRol})`, req.ip);

    // La contraseña temporal se devuelve una única vez para que el Administrador la entregue
    res.status(201).json({ success: true, user: toPublicUser(created), temporaryPassword });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ success: false, message: 'El correo corporativo ya se encuentra en uso por otro colaborador.' });
    }
    if (err.number === 547) {
      return res.status(400).json({ success: false, message: 'El rol seleccionado no existe.' });
    }
    console.error('Error al crear usuario:', err);
    res.status(500).json({ success: false, message: 'No se pudo registrar el usuario.' });
  }
});

// RF-21: Inactivación / reactivación (solo Administrador)
authRouter.patch('/usuarios/:id/estado', requireAuth, requireRole(ADMIN_ROLE), async (req, res) => {
  const id = Number(req.params.id);
  const activo = Boolean(req.body?.activo);
  const motivoBaja = String(req.body?.motivoBaja || '').trim() || 'Baja administrativa por jefatura';

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'No puede inactivar su propia cuenta.' });
  }

  try {
    const p = await getPool();
    await p.request()
      .input('id', sql.Int, id)
      .input('activo', sql.Bit, activo)
      .input('motivo', sql.VarChar, activo ? null : motivoBaja)
      .query(`UPDATE Usuarios
              SET Activo = @activo,
                  MotivoBaja = @motivo,
                  FechaBaja = CASE WHEN @activo = 1 THEN NULL ELSE SYSDATETIME() END
              WHERE IdUsuario = @id;`);

    const updated = await findUserById(id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    await logAudit(req.user.id, activo ? 'REACTIVAR_USUARIO' : 'BAJA_USUARIO', `${activo ? 'Reactivación' : 'Baja'} de ${updated.CorreoCorporativo}`, req.ip);
    res.json({ success: true, user: toPublicUser(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
