// Configuración compartida del módulo de Ajustes y Mermas (HU-004)

export const MOTIVOS_PREDEFINIDOS = [
  'Tablero desportillado en esquina por maniobra de estiba',
  'Rotura en tablero de melamina por manipulación de montacargas',
  'Plancha de drywall afectada por humedad o filtración',
  'Caja de piso flotante con lengüetas de encastre rotas',
  'Diferencia detectada en conteo físico cíclico de almacén',
  'Error en digitación de remisión anterior',
  'Pérdida o extravío en tránsito interno'
];

export const TIPOS_AJUSTE = [
  { value: 'MERMA_DANO', label: 'Merma / Rotura Física (-)' },
  { value: 'FALTANTE', label: 'Faltante por Inventario (-)' },
  { value: 'SOBRANTE', label: 'Sobrante Físico (+)' }
];

export const TIPO_BADGE_CLASSES = {
  MERMA_DANO: 'bg-red-100 text-red-800',
  FALTANTE: 'bg-martin-orange-100 text-martin-orange-800',
  SOBRANTE: 'bg-martin-green-100 text-martin-green-800'
};

/** Estado inicial (y de reinicio) del formulario de ajuste. */
export const crearFormularioInicial = (products = []) => ({
  productoId: products.length > 0 ? String(products[0].id) : '',
  tipoAjuste: 'MERMA_DANO',
  cantidadAjuste: '1',
  motivo: MOTIVOS_PREDEFINIDOS[0],
  detalle: ''
});
