// Rol Vendedor: reglas compartidas, matriz de módulos y gráfico de productos más vendidos
import { describe, it, expect } from 'vitest';
import { canRegisterMovement, canSell, hideCostsFor, isSalesOnly, ADJUSTMENT_VIEW_ROLES } from '../../shared/roleRules.js';
import { canAccessModule } from '../../src/config/modulePermissions.js';
import { agruparVentasPorProducto } from '../../src/components/dashboard/VentasPieChart.jsx';

const ROLES = ['Administrador', 'Gerencia', 'Encargado de Almacén'];

describe('Reglas del rol Vendedor (shared/roleRules.js)', () => {
  it('el Vendedor solo registra ventas', () => {
    expect(canRegisterMovement('Vendedor', 'SALIDA_VENTA')).toBe(true);
    for (const tipo of ['ENTRADA_COMPRA', 'MERMA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRASLADO']) {
      expect(canRegisterMovement('Vendedor', tipo)).toBe(false);
    }
  });

  it('los demás roles conservan sus permisos de movimientos', () => {
    for (const rol of ROLES) expect(canRegisterMovement(rol, 'ENTRADA_COMPRA')).toBe(true);
  });

  it('sin rol no se registra nada', () => {
    expect(canRegisterMovement(undefined, 'SALIDA_VENTA')).toBe(false);
  });

  it('solo al Vendedor se le ocultan costos y se limita a ventas', () => {
    expect(hideCostsFor('Vendedor')).toBe(true);
    expect(isSalesOnly('Vendedor')).toBe(true);
    for (const rol of ROLES) {
      expect(hideCostsFor(rol)).toBe(false);
      expect(isSalesOnly(rol)).toBe(false);
    }
  });

  it('venden el Administrador y el Vendedor', () => {
    expect(canSell('Administrador')).toBe(true);
    expect(canSell('Vendedor')).toBe(true);
    expect(canSell('Gerencia')).toBe(false);
    expect(canSell('Encargado de Almacén')).toBe(false);
  });

  it('el Vendedor no consulta el historial de ajustes', () => {
    expect(ADJUSTMENT_VIEW_ROLES).not.toContain('Vendedor');
  });
});

describe('Módulos que abre el Vendedor', () => {
  it.each(['dashboard', 'catalogo', 'quickstock', 'movimientos'])('puede abrir %s', (modulo) => {
    expect(canAccessModule(modulo, 'Vendedor')).toBe(true);
  });

  it.each(['almacen', 'kardex', 'ajustes', 'ordenes', 'rotacion', 'reportes', 'cierre', 'usuarios', 'auditoria'])(
    'no puede abrir %s',
    (modulo) => {
      expect(canAccessModule(modulo, 'Vendedor')).toBe(false);
    }
  );
});

describe('agruparVentasPorProducto (gráfico de productos más vendidos)', () => {
  const venta = (productoId, cantidad, total) => ({ tipo: 'SALIDA_VENTA', productoId, productoNombre: `P${productoId}`, cantidad, total });

  it('ordena por unidades y calcula porcentajes que suman 100', () => {
    const { porciones, total } = agruparVentasPorProducto([venta(1, 10, 100), venta(2, 30, 90), venta(1, 10, 100)], 'unidades');
    expect(porciones.map((p) => p.nombre)).toEqual(['P2', 'P1']);
    expect(total).toBe(50);
    expect(porciones[0].porcentaje).toBeCloseTo(60);
    expect(porciones.reduce((s, p) => s + p.porcentaje, 0)).toBeCloseTo(100);
  });

  it('por soles puede cambiar el producto líder', () => {
    const { porciones } = agruparVentasPorProducto([venta(1, 10, 500), venta(2, 30, 90)], 'soles');
    expect(porciones[0].nombre).toBe('P1');
  });

  it('agrupa desde el sexto producto en "Otros productos"', () => {
    const ventas = [1, 2, 3, 4, 5, 6, 7].map((id) => venta(id, 10 - id, 1));
    const { porciones } = agruparVentasPorProducto(ventas, 'unidades');
    expect(porciones).toHaveLength(6);
    expect(porciones[5].nombre).toBe('Otros productos (2)');
    // Productos 6 y 7: 4 + 3 unidades
    expect(porciones[5].unidades).toBe(4 + 3);
  });

  it('ignora compras, mermas y ajustes', () => {
    const { porciones } = agruparVentasPorProducto([venta(1, 5, 50), { ...venta(2, 99, 999), tipo: 'ENTRADA_COMPRA' }, { ...venta(3, 4, 40), tipo: 'MERMA' }], 'unidades');
    expect(porciones.map((p) => p.nombre)).toEqual(['P1']);
  });

  it('sin ventas no hay porciones', () => {
    expect(agruparVentasPorProducto([], 'unidades')).toEqual({ porciones: [], total: 0 });
  });
});
