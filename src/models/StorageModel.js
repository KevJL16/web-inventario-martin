/**
 * MODELO: StorageModel
 * Capa de persistencia segura para LocalStorage con soporte de fallbacks y parseo robusto.
 */

export const StorageModel = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === '') {
        return fallback;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[StorageModel] Error al leer clave '${key}', usando fallback:`, error);
      return fallback;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[StorageModel] Error al guardar clave '${key}':`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[StorageModel] Error al remover clave '${key}':`, error);
      return false;
    }
  },

  clearAll: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('[StorageModel] Error al limpiar LocalStorage:', error);
      return false;
    }
  }
};
