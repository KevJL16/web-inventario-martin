/**
 * SERVICIO: Cliente HTTP de la API (Node/Express + SQL Server)
 * Adjunta el JWT de la sesión en cada petición.
 */

// Definida en .env (VITE_API_URL). Sin valor: en desarrollo se usa la API local;
// en producción, rutas relativas al mismo dominio que sirve el frontend.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/+$/, '');

const TOKEN_KEY = 'martin_auth_token';

// sessionStorage: la sesión termina al cerrar la pestaña/navegador
export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Almacenamiento no disponible: la sesión dura solo mientras la página esté abierta
  }
};

// Evento global para que AuthContext cierre la sesión si el servidor responde 401
export const UNAUTHORIZED_EVENT = 'martin:unauthorized';

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && token) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  return res;
}

// Variante que devuelve el JSON y normaliza errores de red
export async function apiJson(path, options) {
  try {
    const res = await apiFetch(path, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'No se pudo conectar con el servidor. Verifique que la API esté encendida.' }
    };
  }
}
