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

## 💻 Ejecución Local

### 1. Configurar variables de entorno
```bash
cp server/.env.example server/.env   # credenciales de SQL Server y JWT_SECRET
cp .env.example .env                 # URL de la API para el frontend
```
- `server/.env` contiene secretos (contraseña de la BD, `JWT_SECRET`) y **nunca** se sube al repositorio.
- `.env` solo admite variables `VITE_*`, que se incrustan en el JavaScript público: no pongas secretos ahí.

### 2. Instalar dependencias e iniciar
```bash
npm install
npm run server   # API Node/Express en http://localhost:5000
npm run dev      # Frontend en http://localhost:3000
```

> 💡 Si PowerShell bloquea `npm` ("la ejecución de scripts está deshabilitada"), usa una terminal **Command Prompt** en VS Code o ejecuta `npm.cmd run dev`. No requiere permisos de administrador.

### 3. Generar Build de Producción
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
5. Comprueba la conexión con `npm run test-db`.

---

## 👤 Cuentas de Acceso

La autenticación se valida en el servidor: contraseñas hasheadas con **bcrypt** y sesión mediante **JWT**. El script SQL crea estas cuentas **sin contraseña utilizable**; asígnala con:

```bash
npm run set-password -- administrador@rep-martin.com            # genera una temporal y la muestra una vez
npm run set-password -- administrador@rep-martin.com "MiClave123"  # o fija una concreta
```

| Rol | Usuario | Correo Corporativo | Acceso y Privilegios |
| :--- | :--- | :--- | :--- |
| **Administrador** | Carlos Eduardo Martín | `administrador@rep-martin.com` | Control total del sistema, configuración, usuarios y bitácoras de auditoría. |
| **Gerencia** | Patricia Andrea Villanueva | `gerencia@rep-martin.com` | Visualización ejecutiva, reportes financieros, Kardex, rotación ABC y auditoría. |
| **Encargado de Almacén** | Jorge Luis Paredes | `almacen@rep-martin.com` | Consulta rápida en patio, recepción de órdenes de compra, despacho y registro de mermas. |

---

## ☁️ Despliegue en Vercel

El proyecto se despliega como **un solo proyecto de Vercel**: el frontend (Vite) se sirve desde la CDN y la API Express corre como función serverless (`api/index.js` → `server/app.js`). `vercel.json` redirige `/api/*` a la función. Al estar en el mismo dominio no hace falta `VITE_API_URL` ni CORS.

> ⚠️ Vercel no puede conectarse a un SQL Server en `localhost`. Antes de desplegar necesitas una base de datos accesible desde internet (p. ej. **Azure SQL Database**).

### Pasos
1. Sube el repositorio a GitHub (`dist/` no se versiona: Vercel ejecuta `npm run build`).
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio. Vercel detecta Vite y lee `vercel.json`.
3. En **Settings → Environment Variables** define:

| Variable | Ejemplo / valor |
| :--- | :--- |
| `DB_SERVER` | `tu-servidor.database.windows.net` |
| `DB_PORT` | `1433` |
| `DB_USER` | usuario de la BD |
| `DB_PASSWORD` | contraseña de la BD |
| `DB_NAME` | `RepresentacionesMartinDB` |
| `DB_ENCRYPT` | `true` (obligatorio en Azure SQL) |
| `DB_TRUST_SERVER_CERTIFICATE` | `false` |
| `JWT_SECRET` | cadena aleatoria larga (ver `server/.env.example`) |
| `CORS_ORIGIN` | `https://tu-proyecto.vercel.app` |
| `NODE_ENV` | `production` |

4. Despliega. Comprueba que `https://tu-proyecto.vercel.app/api/status` responde `401` (la API funciona y exige sesión).
5. Asigna las contraseñas ejecutando `npm run set-password` en local con `server/.env` apuntando a la base de datos en la nube.
