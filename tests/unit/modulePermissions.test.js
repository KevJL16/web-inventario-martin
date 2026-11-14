// PC 12: matriz única de acceso a módulos (regresión de DEF-17)
import { describe, it, expect } from 'vitest';
import { MODULE_ROLES, canAccessModule } from '../../src/config/modulePermissions.js';
import { ADJUSTMENT_ROLES } from '../../shared/adjustmentRules.js';

describe('canAccessModule (HU-004 CA-4)', () => {
  it.each(['Administrador', 'Encargado de Almacén', 'Gerencia'])('%s puede abrir Ajustes y Mermas', (rol) => {
    expect(canAccessModule('ajustes', rol)).toBe(true);
  });

  it('Vendedor no puede abrir Ajustes y Mermas', () => {
    expect(canAccessModule('ajustes', 'Vendedor')).toBe(false);
  });

  it('todo rol que registra ajustes también puede abrir el módulo', () => {
    for (const rol of ADJUSTMENT_ROLES) expect(canAccessModule('ajustes', rol)).toBe(true);
  });

  it('niega módulos desconocidos y roles vacíos', () => {
    expect(canAccessModule('modulo-inexistente', 'Administrador')).toBe(false);
    expect(canAccessModule('ajustes', undefined)).toBe(false);
  });

  it('solo Administrador gestiona usuarios', () => {
    expect(MODULE_ROLES.usuarios).toEqual(['Administrador']);
  });

  it('la matriz no se puede modificar en tiempo de ejecución', () => {
    expect(Object.isFrozen(MODULE_ROLES)).toBe(true);
  });
});
