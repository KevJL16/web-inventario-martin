import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_KARDEX,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';
import { StorageModel } from '../models/StorageModel';
import { InventoryController } from '../controllers/InventoryController';
import { useAuth } from './AuthContext';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // Estados persistentes respaldados por StorageModel
  const [categories, setCategories] = useState(() => StorageModel.get('martin_categories', INITIAL_CATEGORIES));
  const [locations, setLocations] = useState(() => StorageModel.get('martin_locations', INITIAL_LOCATIONS));
  const [suppliers, setSuppliers] = useState(() => StorageModel.get('martin_suppliers', INITIAL_SUPPLIERS));
  const [products, setProducts] = useState(() => StorageModel.get('martin_products', INITIAL_PRODUCTS));
  const [movements, setMovements] = useState(() => StorageModel.get('martin_movements', INITIAL_MOVEMENTS));
  const [kardex, setKardex] = useState(() => StorageModel.get('martin_kardex', INITIAL_KARDEX));
  const [purchaseOrders, setPurchaseOrders] = useState(() => StorageModel.get('martin_orders', INITIAL_PURCHASE_ORDERS));
  const [adjustments, setAdjustments] = useState(() => StorageModel.get('martin_adjustments', INITIAL_ADJUSTMENTS));
  const [closures, setClosures] = useState(() => StorageModel.get('martin_closures', []));
  const [auditLogs, setAuditLogs] = useState(() => StorageModel.get('martin_audit_logs', INITIAL_AUDIT_LOGS));
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);

  // Comprobar estado de conexión con SQL Server (API Node Express en puerto 5000)
  const checkDbStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setIsDbConnected(true);
          setDbInfo(data.data);
          return true;
        }
      }
      setIsDbConnected(false);
      return false;
    } catch {
      setIsDbConnected(false);
      return false;
    }
  };

  // Carga inicial y sondeo periódico de SQL Server
  useEffect(() => {
    const initDatabase = async () => {
      const connected = await checkDbStatus();
      if (connected) {
        try {
          const [resProds, resMovs] = await Promise.all([
            fetch('http://localhost:5000/api/productos'),
            fetch('http://localhost:5000/api/movimientos')
          ]);
          if (resProds.ok) {
            const sqlProds = await resProds.json();
            if (Array.isArray(sqlProds) && sqlProds.length > 0) {
              setProducts(sqlProds);
            }
          }
          if (resMovs.ok) {
            const sqlMovs = await resMovs.json();
            if (Array.isArray(sqlMovs) && sqlMovs.length > 0) {
              setMovements(sqlMovs);
            }
          }
        } catch (err) {
          console.warn('Backend SQL Server activo pero hubo un retraso en la carga:', err);
        }
      }
    };

    initDatabase();
    const interval = setInterval(checkDbStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sincronización automática con LocalStorage de respaldo
  useEffect(() => { StorageModel.set('martin_categories', categories); }, [categories]);
  useEffect(() => { StorageModel.set('martin_locations', locations); }, [locations]);
  useEffect(() => { StorageModel.set('martin_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { StorageModel.set('martin_products', products); }, [products]);
  useEffect(() => { StorageModel.set('martin_movements', movements); }, [movements]);
  useEffect(() => { StorageModel.set('martin_kardex', kardex); }, [kardex]);
  useEffect(() => { StorageModel.set('martin_orders', purchaseOrders); }, [purchaseOrders]);
  useEffect(() => { StorageModel.set('martin_adjustments', adjustments); }, [adjustments]);
  useEffect(() => { StorageModel.set('martin_closures', closures); }, [closures]);
  useEffect(() => { StorageModel.set('martin_audit_logs', auditLogs); }, [auditLogs]);

  // RF-22: Bitácora de Auditoría
  const logAction = (accion, modulo, descripcion) => {
    const newLog = {
      id: Date.now(),
      usuario: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Sistema',
      rol: currentUser ? currentUser.rolNombre : 'Sistema',
      accion,
      modulo,
      descripcion,
      fecha: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sincronización en vivo con SQL Server (RepresentacionesMartinDB en puerto 1434 vía API Node)
  const syncWithSqlServer = async (movement) => {
    try {
      const res = await fetch('http://localhost:5000/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: movement.sku,
          tipo: movement.tipo,
          cantidad: movement.cantidad,
          costoUnitario: movement.costoUnitario,
          comprobante: movement.comprobante,
          observacion: movement.observacion,
          usuarioId: currentUser?.id || 1
        })
      });

      if (res.ok) {
        setIsDbConnected(true);
        // Refrescar productos desde SQL Server para garantizar stock idéntico
        const pRes = await fetch('http://localhost:5000/api/productos');
        if (pRes.ok) {
          const freshProds = await pRes.json();
          if (Array.isArray(freshProds) && freshProds.length > 0) {
            setProducts(freshProds);
          }
        }
      }
    } catch {
      // Si el servidor backend no está encendido, continúa funcionando fluidamente con LocalStorage
    }
  };

  // RF-16: Salida por Venta Directa (Controlador MVC)
  const registerSale = ({ productId, cantidad, precioVenta, comprobante, cliente, observacion }) => {
    const res = InventoryController.registerSale({
      productId,
      cantidad,
      precioVenta,
      comprobante,
      cliente,
      observacion,
      usuario: currentUser,
      products,
      setProducts,
      setMovements,
      setKardex,
      logAction
    });

    if (res.success && res.movement) {
      syncWithSqlServer(res.movement);
    }

    return res;
  };

  // RF-16: Registrar Movimiento General (Controlador MVC)
  const registerMovement = ({ productoId, tipo, cantidad, costoUnitario, comprobante, observacion }) => {
    const res = InventoryController.registerMovement({
      productoId,
      tipo,
      cantidad,
      costoUnitario,
      comprobante,
      observacion,
      usuario: currentUser,
      products,
      setProducts,
      setMovements,
      setKardex,
      logAction
    });

    if (res.success && res.movement) {
      syncWithSqlServer(res.movement);
    }

    return res;
  };

  // RF-20: Ajuste de Inventario y Mermas (Controlador MVC)
  const registerAdjustment = ({ productoId, tipoAjuste, cantidadAjuste, motivo, detalle }) => {
    const res = InventoryController.registerAdjustment({
      productoId,
      tipoAjuste,
      cantidadAjuste,
      motivo,
      detalle,
      usuario: currentUser,
      products,
      setProducts,
      setMovements,
      setKardex,
      setAdjustments,
      logAction
    });

    if (res.success && res.movement) {
      syncWithSqlServer(res.movement);
    }

    return res;
  };

  // RF-05: Alta de Producto (Controlador MVC)
  const addProduct = (prodData) => {
    const res = InventoryController.createProduct({
      prodData,
      categories,
      locations,
      suppliers,
      setProducts,
      logAction
    });

    if (res.success && res.product.stockActual > 0) {
      registerMovement({
        productoId: res.product.id,
        tipo: 'ENTRADA_COMPRA',
        cantidad: res.product.stockActual,
        costoUnitario: res.product.costoCompra,
        comprobante: 'INVENTARIO-INICIAL',
        observacion: 'Carga de stock inicial en alta de catálogo'
      });
    }

    return res;
  };

  // RF-06: Edición de Producto (Controlador MVC)
  const updateProduct = (id, updatedData) => {
    return InventoryController.updateProduct({
      id,
      prodData: updatedData,
      categories,
      locations,
      suppliers,
      setProducts,
      logAction
    });
  };

  // RF-07: Baja Lógica de Producto (Controlador MVC)
  const deleteProduct = (id) => {
    return InventoryController.deleteProduct({
      id,
      products,
      setProducts,
      logAction
    });
  };

  // RF-13: Crear Orden de Compra
  const createPurchaseOrder = (orderData) => {
    const sup = suppliers.find(s => s.id === Number(orderData.proveedorId)) || suppliers[0];
    const folio = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const items = orderData.items.map(item => {
      const p = products.find(prod => prod.id === Number(item.productoId));
      return {
        productoId: item.productoId,
        productoNombre: p ? p.nombre : 'Artículo',
        sku: p ? p.sku : 'SKU',
        cantidad: Number(item.cantidad),
        costoUnit: Number(item.costoUnit || p.costoCompra),
        subtotal: Number(item.cantidad) * Number(item.costoUnit || p.costoCompra)
      };
    });

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);

    const newOrder = {
      id: Date.now(),
      numeroOrden: folio,
      proveedorId: sup.id,
      proveedorNombre: sup.razonSocial,
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaEsperada: orderData.fechaEsperada || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      estado: 'Solicitada',
      total,
      items,
      observaciones: orderData.observaciones || 'Pedido regular de reabastecimiento'
    };

    setPurchaseOrders(prev => [newOrder, ...prev]);
    logAction('CREAR_ORDEN_COMPRA', 'ORDENES', `Emisión de Orden de Compra ${folio} a "${sup.razonSocial}" por S/ ${total.toFixed(2)}`);
    return { success: true, order: newOrder };
  };

  // RF-13: Recepcionar Orden de Compra
  const receivePurchaseOrder = (orderId) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Orden no encontrada' };
    if (order.estado === 'Recepcionada') return { success: false, message: 'Esta orden ya fue ingresada al almacén' };

    order.items.forEach(item => {
      registerMovement({
        productoId: item.productoId,
        tipo: 'ENTRADA_COMPRA',
        cantidad: item.cantidad,
        costoUnitario: item.costoUnit,
        comprobante: order.numeroOrden,
        observacion: `Recepción de mercadería de O/C ${order.numeroOrden}`
      });
    });

    setPurchaseOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: 'Recepcionada', fechaRecepcion: new Date().toISOString() } : o));
    logAction('RECEPCION_ORDEN_COMPRA', 'ORDENES', `Recepción completa de Orden de Compra ${order.numeroOrden}. Stock y Kardex actualizados.`);
    return { success: true };
  };

  // RF-19: Cierre Diario
  const executeDailyClosure = (observaciones = '') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMovements = movements.filter(m => m.fecha.startsWith(todayStr));

    const totalEntradas = todayMovements
      .filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo))
      .reduce((sum, m) => sum + m.cantidad, 0);

    const totalValorEntrada = todayMovements
      .filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo))
      .reduce((sum, m) => sum + m.total, 0);

    const totalSalidas = todayMovements
      .filter(m => m.tipo === 'SALIDA_VENTA')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const totalValorSalida = todayMovements
      .filter(m => m.tipo === 'SALIDA_VENTA')
      .reduce((sum, m) => sum + m.total, 0);

    const totalMermas = todayMovements
      .filter(m => ['MERMA', 'AJUSTE_NEGATIVO'].includes(m.tipo))
      .reduce((sum, m) => sum + m.cantidad, 0);

    const stockFinalUnidades = products.filter(p => p.activo).reduce((sum, p) => sum + p.stockActual, 0);
    const valorizacionFinal = products.filter(p => p.activo).reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);

    const closureRecord = {
      id: Date.now(),
      fechaJornada: todayStr,
      responsable: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Jefatura de Almacén',
      totalTransacciones: todayMovements.length,
      totalEntradas,
      totalValorEntrada,
      totalSalidas,
      totalValorSalida,
      totalMermas,
      stockFinalUnidades,
      valorizacionFinal,
      discrepanciasDetectadas: 0,
      firmaDigital: `DIGITAL-SHA256-MARTINDAY-${todayStr.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      observaciones: observaciones || 'Cierre de jornada operativo sin discrepancias no justificadas.',
      fechaHoraCierre: new Date().toISOString()
    };

    setClosures(prev => [closureRecord, ...prev]);
    logAction('CIERRE_DIARIO', 'CIERRE', `Cierre de jornada ${todayStr} ejecutado. Transacciones: ${todayMovements.length}, Entradas: ${totalEntradas}, Salidas: ${totalSalidas}`);
    return { success: true, closure: closureRecord };
  };

  // RF-15: Rotación ABC
  const recalculateABC = () => {
    const salidasPorProd = {};
    movements.filter(m => m.tipo === 'SALIDA_VENTA').forEach(m => {
      salidasPorProd[m.productoId] = (salidasPorProd[m.productoId] || 0) + m.cantidad;
    });

    const sortedProds = [...products].sort((a, b) => {
      const countA = salidasPorProd[a.id] || 0;
      const countB = salidasPorProd[b.id] || 0;
      return countB - countA;
    });

    const totalCount = sortedProds.length;
    const top20Index = Math.ceil(totalCount * 0.25);
    const mid60Index = Math.ceil(totalCount * 0.65);

    setProducts(prev => prev.map(p => {
      const idx = sortedProds.findIndex(sp => sp.id === p.id);
      let cat = 'C';
      if (idx < top20Index) cat = 'A';
      else if (idx < mid60Index) cat = 'B';
      return { ...p, clasificacionABC: cat };
    }));

    logAction('CALCULO_ABC', 'ANALITICA', 'Recálculo algorítmico de clasificación ABC de demanda completado.');
  };

  // Alertas de Reabastecimiento
  const lowStockAlerts = products.filter(p => p.activo && p.stockActual <= p.stockMinimo);

  // Restablecer Datos de Demostración
  const resetDemoData = () => {
    if (window.confirm('¿Deseas restablecer todos los datos de demostración a su estado inicial maderero de Representaciones Martín?')) {
      StorageModel.clearAll();
      window.location.reload();
    }
  };

  return (
    <InventoryContext.Provider value={{
      categories,
      locations,
      suppliers,
      products,
      movements,
      kardex,
      purchaseOrders,
      adjustments,
      closures,
      auditLogs,
      lowStockAlerts,
      registerSale,
      addProduct,
      updateProduct,
      deleteProduct,
      registerMovement,
      registerAdjustment,
      createPurchaseOrder,
      receivePurchaseOrder,
      executeDailyClosure,
      recalculateABC,
      logAction,
      resetDemoData,
      isDbConnected,
      dbInfo,
      checkDbStatus
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
