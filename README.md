# Sistema de Control de Inventarios - "Representaciones Martín"

Plataforma integral de gestión y control de inventarios desarrollada a medida para **Representaciones Martín**, empresa especializada en la comercialización de tableros de melamina, drywall, pisos laminados/vinílicos, herrajes industriales y muebles modulados.

---

## 🏗️ Requerimientos Funcionales Implementados (RF-01 al RF-22)

| Código | Requerimiento Funcional | Módulo en el Sistema |
| :---: | :--- | :--- |
| **RF-01** | Registro y Creación de Usuarios | `UsuariosView` / `UserModal`: Registro con nombres completos, correo corporativo, teléfono, dirección y generación automática de credenciales seguras. |
| **RF-02** | Recuperación y Restablecimiento de Cuenta | `AuthModal`: Generación de token temporal de seguridad (30 min) para cambio seguro de contraseña. |
| **RF-03** | Gestión de Roles y Control de Acceso (RBAC) | `RoleContext`: Perfiles jerárquicos (**Administrador**, **Gerencia**, **Encargado de Almacén**) con permisos granulares. |
| **RF-04** | Restricción de Acciones según Rol | Bloqueo dinámico de menús, vistas restringidas y botones de acción según el rol autenticado. |
| **RF-05** | Catálogo: Ingreso de nuevos productos | `ProductModal`: Alta de tableros de melamina (15mm/18mm, 2.15x2.44m), drywall, pisos, herrajes con SKU, precio y costo. |
| **RF-06** | Modificación y actualización de productos | `ProductModal`: Edición de atributos comerciales, técnicos, dimensiones y umbrales de stock. |
| **RF-07** | Eliminación de productos | `CatalogoView`: Baja lógica (soft-delete) que resguarda la integridad histórica del Kardex y movimientos. |
| **RF-08** | Búsqueda y filtrado de productos | `CatalogoView`: Filtro instantáneo por texto (SKU, nombre, EAN-13), familia de materiales y estado de stock. |
| **RF-09** | Alertas automáticas de reabastecimiento | Disparador automático cuando el stock físico es menor o igual al stock mínimo de seguridad. |
| **RF-10** | Notificación visual de productos con bajo stock | `Navbar` & `CatalogoView`: Semáforo visual en tiempo real (Crítico, Bajo Stock, Normal, Agotado) con botón de reposición rápida. |
| **RF-11** | Emisión de Reportes Analíticos | `ReportesView`: Reporte valorizado de inventario en Soles, reporte de sobrestock/críticos y exportación a CSV / Imprimible. |
| **RF-12** | Ubicación exacta de mercadería pesada | `AlmacenUbicacionesView`: Mapa 2D de distribución física por **Zona, Pasillo, Rack y Nivel** con control de carga estructural en kg. |
| **RF-13** | Gestión de Proveedores y Órdenes de Compra | `ProveedoresView`: Directorio de fabricantes oficiales (Arauco, Pelíkano, Masisa, Gyplac) y emisión/recepción de O/C con ingreso automático a Kardex. |
| **RF-14** | Dashboard Ejecutivo en tiempo real | `DashboardView`: Panel de control con valorización de activos, movimientos del día, KPIs y alertas de atención inmediata. |
| **RF-15** | Índice de rotación y clasificación ABC | `RotacionABCView`: Clasificación analítica Pareto de artículos más y menos demandados (Clase A, B y C) con días de inventario. |
| **RF-16** | Registro de Historial de Movimientos | `MovimientosView`: Trazabilidad inmutable de entradas, salidas, traslados y mermas con fecha, usuario y comprobante. |
| **RF-17** | Consulta y Visualización de Kardex Histórico | `KardexView`: Hoja oficial de Kardex Físico-Valorizado bajo método **Promedio Ponderado** con desglose de Entradas, Salidas y Saldos. |
| **RF-18** | Consulta Rápida de Stock para Almacenero | `QuickStockView`: Terminal de alta visibilidad para operarios con simulador de lector de código de barras y coordenadas exactas de estantería. |
| **RF-19** | Consolidado de Cierre Diario de Movimientos | `CierreDiarioView`: Cuadre de jornada al finalizar el turno, balance de entradas/salidas, certificación con firma digital y archivo histórico. |
| **RF-20** | Ajustes Manuales Justificados (Mermas) | `AjustesStockModal`: Regularización de stock por rotura de tableros de melamina, humedad en drywall o conteos cíclicos con motivo obligatorio. |
| **RF-21** | Inactivación y baja lógica de usuarios | `UsuariosView`: Suspensión administrativa y retiro de acceso con registro de motivo de cese laboral. |
| **RF-22** | Bitácora de Auditoría del Sistema (Logs) | `AuditoriaLogsView`: Registro técnico forense inmutable de logins, altas, modificaciones, ajustes y cierres con usuario y sello de tiempo. |

---

## 💻 Ejecución de la Aplicación Web

### 1. Iniciar en Modo de Desarrollo
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm run dev
```
La aplicación iniciará automáticamente en:
👉 `http://localhost:3000`

### 2. Generar Build de Producción
```bash
npm run build
```

---

## 🗄️ Base de Datos en SQL Server Management Studio (SSMS)

El script SQL completo y autoejecutable se encuentra en:
📁 `database/01_CREATE_DATABASE_MARTIN.sql`

### Pasos para ejecutar en SSMS:
1. Conéctate a tu instancia de **SQL Server** en SSMS (`localhost`, `.` o `.\SQLEXPRESS`).
2. Abre el archivo `database/01_CREATE_DATABASE_MARTIN.sql` (`Ctrl + O`).
3. Ejecuta el script (`F5`).
4. Se creará la base de datos `RepresentacionesMartinDB` con 15 tablas normalizadas, triggers de actualización de Kardex, stored procedures (`sp_RegistrarMovimiento`, `sp_AjusteInventarioManual`, `sp_GenerarCierreDiario`, `sp_CalcularRotacionABC`), vistas de almacén y datos semilla madereros.

---

## 👤 Cuentas de Acceso Preconfiguradas (Demostración RBAC)

Puedes alternar entre estos perfiles desde el selector **"Simular Rol"** en la barra superior (Navbar):

| Rol | Usuario | Correo Corporativo | Acceso y Privilegios |
| :--- | :--- | :--- | :--- |
| **Administrador** | Carlos Eduardo Martín | `administrador@rep-martin.com` | Control total del sistema, configuración, usuarios y bitácoras de auditoría. |
| **Gerencia** | Patricia Andrea Villanueva | `gerencia@rep-martin.com` | Visualización ejecutiva, reportes financieros, Kardex, rotación ABC y auditoría. |
| **Encargado de Almacén** | Jorge Luis Paredes | `almacen@rep-martin.com` | Consulta rápida en patio, recepción de órdenes de compra, despacho y registro de mermas. |
