import React, { useState } from 'react';
import { Database, Download, Copy, CheckCircle2, FileCode, Server, Terminal, Play, AlertTriangle, RefreshCw } from 'lucide-react';

export const SqlView = () => {
  const [copied, setCopied] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const copyScriptPath = () => {
    navigator.clipboard.writeText(`c:\\Users\\Kevin\\Desktop\\WEB INVENTARIO\\database\\01_CREATE_DATABASE_MARTIN.sql`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(key);
    setTimeout(() => setCopiedQuery(''), 3000);
  };

  const checkLiveApiConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/status');
      const data = await res.json();
      setTestResult({
        success: data.connected,
        message: data.message,
        details: data.data
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Servidor API (puerto 5000) no iniciado o sin respuesta.',
        hint: 'Ejecuta en una terminal: "npm run server" o prueba el comando directo: "npm run test-db"'
      });
    } finally {
      setTesting(false);
    }
  };

  const queryVerificacion1 = `-- 1. Comprobar Catálogo de Productos y Existencias en Almacén
USE RepresentacionesMartinDB;
SELECT 
    p.IdProducto,
    p.CodigoSKU,
    p.Nombre,
    c.Nombre AS Categoria,
    p.StockActual,
    p.StockMinimo,
    p.PrecioVenta,
    u.CodigoUbicacion
FROM Productos p
INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria
INNER JOIN UbicacionesAlmacen u ON p.IdUbicacion = u.IdUbicacion
WHERE p.Activo = 1;`;

  const queryVerificacion2 = `-- 2. Comprobar Alertas de Reabastecimiento Crítico (RF-09 / RF-10)
USE RepresentacionesMartinDB;
SELECT * FROM vw_AlertasReabastecimiento;`;

  const queryVerificacion3 = `-- 3. Comprobar Libro Mayor de Kardex Histórico Físico-Valorizado (RF-17)
USE RepresentacionesMartinDB;
SELECT 
    k.IdKardex,
    p.Nombre AS Producto,
    k.FechaRegistro,
    k.TipoOperacion,
    k.DocumentoReferencia,
    k.CantidadEntrada,
    k.TotalEntrada,
    k.CantidadSalida,
    k.TotalSalida,
    k.CantidadSaldo,
    k.CostoUnitarioPromedio,
    k.TotalSaldo
FROM Kardex k
INNER JOIN Productos p ON k.IdProducto = p.IdProducto
ORDER BY k.IdKardex DESC;`;

  const queryVerificacion4 = `-- 4. Probar Stored Procedure Transaccional de Movimiento (RF-16)
USE RepresentacionesMartinDB;
EXEC sp_RegistrarMovimiento
    @IdProducto = 1,
    @IdUsuario = 1,
    @TipoMovimiento = 'SALIDA_VENTA',
    @Cantidad = 2,
    @CostoUnitario = 122.00,
    @DocumentoReferencia = 'TEST-VERIF-001',
    @Observacion = 'Prueba de transacción desde SSMS';

-- Verificar actualización inmediata del stock:
SELECT IdProducto, CodigoSKU, Nombre, StockActual 
FROM Productos WHERE IdProducto = 1;`;

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              SQL Server Management Studio (SSMS)
            </span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Base de Datos Activa: RepresentacionesMartinDB
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Verificación y Conexión de Base de Datos SQL Server
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitorea el estado de conexión con la base de datos relacional, ejecuta pruebas y consulta los datos en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyScriptPath}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Ruta Copiada' : 'Copiar Ruta .SQL'}
          </button>
          <a
            href="file:///c:/Users/Kevin/Desktop/WEB%20INVENTARIO/database/01_CREATE_DATABASE_MARTIN.sql"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-amber-400" /> Abrir Script SSMS
          </a>
        </div>
      </div>

      {/* Tarjeta de Diagnóstico y Estado en Vivo */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-600" /> Diagnóstico de Conexión en Tiempo Real
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prueba la comunicación directa entre la aplicación web y SQL Server Management Studio.
            </p>
          </div>

          <button
            onClick={checkLiveApiConnection}
            disabled={testing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Comprobando...' : 'Probar Conexión con Servidor API'}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs ${
            testResult.success 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950' 
              : 'bg-amber-50 border border-amber-200 text-amber-950'
          } animate-fade-in`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 font-mono text-[11px]">
                <div>Base de Datos: <strong>{testResult.details.DatabaseName}</strong></div>
                <div>Productos Activos: <strong>{testResult.details.TotalProductos}</strong></div>
                <div>Asientos Kardex: <strong>{testResult.details.TotalKardex}</strong></div>
                <div>Alertas Stock: <strong>{testResult.details.TotalAlertas}</strong></div>
              </div>
            )}
            {testResult.hint && (
              <p className="text-[11px] text-amber-800 mt-1">{testResult.hint}</p>
            )}
          </div>
        )}

        {/* Consola de Comando Rápido */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-amber-400 font-bold text-[11px]">
            💻 Comando de Terminal para Diagnóstico Rápido:
          </p>
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-emerald-400">npm run test-db</span>
            <button
              onClick={() => copyToClipboard('npm run test-db', 'cmd')}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              {copiedQuery === 'cmd' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Ejecuta este comando en tu terminal para conectar directamente con SQL Server por TCP/IP e imprimir las tablas en pantalla.
          </p>
        </div>
      </div>

      {/* Consultas T-SQL para verificar directamente en SSMS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-600" /> Consultas de Verificación para Ejecutar en SSMS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Copia cualquiera de estas consultas, pégalas en una ventana de New Query en SSMS y presiona <strong>F5</strong> para comprobar el funcionamiento.
          </p>
        </div>

        <div className="space-y-4">
          
          {/* Query 1 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">1. Catálogo de Artículos Madereros y Stock Actual</span>
              <button
                onClick={() => copyToClipboard(queryVerificacion1, 'q1')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {copiedQuery === 'q1' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQuery === 'q1' ? 'Copiado a portapapeles' : 'Copiar Consulta'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
              {queryVerificacion1}
            </pre>
          </div>

          {/* Query 2 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">2. Vista de Alertas de Reabastecimiento Crítico (RF-09 / RF-10)</span>
              <button
                onClick={() => copyToClipboard(queryVerificacion2, 'q2')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {copiedQuery === 'q2' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQuery === 'q2' ? 'Copiado a portapapeles' : 'Copiar Consulta'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
              {queryVerificacion2}
            </pre>
          </div>

          {/* Query 3 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">3. Hoja de Kardex Histórico Físico-Valorizado (RF-17)</span>
              <button
                onClick={() => copyToClipboard(queryVerificacion3, 'q3')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {copiedQuery === 'q3' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQuery === 'q3' ? 'Copiado a portapapeles' : 'Copiar Consulta'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
              {queryVerificacion3}
            </pre>
          </div>

          {/* Query 4 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">4. Prueba del Stored Procedure Transaccional (RF-16)</span>
              <button
                onClick={() => copyToClipboard(queryVerificacion4, 'q4')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {copiedQuery === 'q4' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQuery === 'q4' ? 'Copiado a portapapeles' : 'Copiar Consulta'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
              {queryVerificacion4}
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
};
