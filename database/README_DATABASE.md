# Guía de Base de Datos - Representaciones Martín (SSMS)

Esta base de datos relacional para **SQL Server Management Studio (SSMS)** da soporte a los 22 requerimientos funcionales del sistema de control de inventarios de **Representaciones Martín**, empresa especializada en tableros de melamina, drywall, pisos y acabados de construcción.

---

## 🚀 Pasos para Ejecutar en SQL Server Management Studio (SSMS)

1. Abre **SQL Server Management Studio (SSMS)** y conéctate a tu instancia de SQL Server (por ejemplo: `.` o `localhost` o `.\SQLEXPRESS`).
2. Haz clic en **File > Open > File...** (o presiona `Ctrl + O`) y selecciona el archivo:
   ```text
   c:\Users\Kevin\Desktop\WEB INVENTARIO\database\01_CREATE_DATABASE_MARTIN.sql
   ```
3. Verifica que la ventana de consulta apunte a la base de datos `master` (el script se encargará de crear y posicionarse en `RepresentacionesMartinDB`).
4. Haz clic en **Execute** (o presiona `F5`).
5. En la pestaña de *Messages* verás el resultado exitoso:
   ```text
   ======================================================================
   Base de Datos "RepresentacionesMartinDB" creada y configurada con éxito.
   Tablas, Triggers, Stored Procedures, Vistas y Semillas Listos para SSMS.
   ======================================================================
   ```

---

## 🗄️ Diccionario de Datos y Mapeo con los Requerimientos Funcionales

| Tabla | Propósito | Requerimientos Asociados |
| :--- | :--- | :--- |
| `Roles` | Perfiles jerárquicos y matriz de permisos JSON. | **RF-03, RF-04** |
| `Usuarios` | Datos de colaboradores corporativos, teléfonos, hashes y estado activo. | **RF-01, RF-21** |
| `PasswordResets` | Tokens temporales con expiración para recuperación de cuenta. | **RF-02** |
| `BitacoraAuditoria` | Registro inmutable de acciones, módulo, IP y sello de tiempo. | **RF-22** |
| `Categorias` | Familias madereras (Melamina, Drywall, Pisos, Muebles, Herrajes). | **RF-05, RF-08** |
| `UbicacionesAlmacen` | Localización física para mercadería pesada: Zona, Pasillo, Rack, Nivel. | **RF-12** |
| `Proveedores` | Fabricantes y distribuidores oficiales (Arauco, Pelíkano, Gyplac, etc.). | **RF-13** |
| `Productos` | Catálogo maestro de tableros, planchas, espesores, dimensiones, stocks y precios. | **RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RF-15** |
| `ProductoProveedores` | Asociación de proveedores con costos pactados y tiempos de entrega. | **RF-13** |
| `OrdenesCompra` y `Detalle` | Gestión integral de adquisiciones y recepciones de almacén. | **RF-13** |
| `MovimientosInventario` | Registro atómico de entradas, salidas, traslados y mermas. | **RF-16** |
| `Kardex` | Libro de control físico-valorizado bajo método Promedio Ponderado. | **RF-17** |
| `AjustesInventario` | Justificaciones de mermas (tableros rotos, daños de montacargas) y descuadres. | **RF-20** |
| `CierresDiarios` | Cierre de turno / jornada con totales de transacciones y firma digital. | **RF-19** |

---

## ⚡ Stored Procedures Incluidos

1. `EXEC sp_RegistrarMovimiento`: Realiza transacciones atómicas seguras, valida disponibilidad de stock, actualiza saldos físicos, asienta el renglón en `Kardex` y escribe en `BitacoraAuditoria`.
2. `EXEC sp_AjusteInventarioManual`: Realiza regularizaciones por mermas o diferencias de conteo físico, con motivo obligatorio y aprobación.
3. `EXEC sp_GenerarCierreDiario`: Consolida la actividad de la fecha seleccionada, genera firma digital del responsable y bloquea la jornada.
4. `EXEC sp_CalcularRotacionABC`: Aplica el algoritmo de Pareto sobre las salidas para categorizar los productos en A (alta rotación), B (media) y C (baja).

---

## 🔍 Vistas Preconfiguradas

- `SELECT * FROM vw_AlertasReabastecimiento`: Notifica artículos en punto de reorden o agotados (**RF-09, RF-10**).
- `SELECT * FROM vw_StockAlmacenero`: Consulta rápida con coordenadas de pasillo, rack y nivel para personal de almacén (**RF-18**).
- `SELECT * FROM vw_ReporteValorizadoInventario`: Valorización financiera y márgenes brutos estimados (**RF-11, RF-14**).
