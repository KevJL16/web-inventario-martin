// ============================================================================
// SCRIPT DE VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS SQL SERVER
// "Representaciones Martín" - RepresentacionesMartinDB
// ============================================================================

import sql from 'mssql';
import { dbConfig } from './config.js';

async function testConnection() {
  console.log('\n===============================================================');
  console.log('🔍 VERIFICANDO CONEXIÓN A SQL SERVER (RepresentacionesMartinDB)');
  console.log('===============================================================\n');

  try {
    // Credenciales leídas de server/.env (ver server/config.js)
    const pool = await sql.connect(dbConfig);

    console.log('✅ ¡CONEXIÓN EXITOSA A SQL SERVER!');
    console.log(`   Instancia: ${dbConfig.server}:${dbConfig.port}`);
    console.log(`   Base de datos: ${dbConfig.database}\n`);

    // 1. Consultar Productos
    const resProd = await pool.request().query('SELECT COUNT(*) AS TotalProductos FROM Productos;');
    console.log(`📦 Total de Productos en Catálogo: ${resProd.recordset[0].TotalProductos}`);

    // 2. Consultar Kardex
    const resKardex = await pool.request().query('SELECT COUNT(*) AS TotalKardex FROM Kardex;');
    console.log(`📑 Total de Asientos en Kardex:    ${resKardex.recordset[0].TotalKardex}`);

    // 3. Consultar Alertas
    const resAlertas = await pool.request().query('SELECT COUNT(*) AS TotalAlertas FROM vw_AlertasReabastecimiento;');
    console.log(`⚠️  Alertas de Reabastecimiento:    ${resAlertas.recordset[0].TotalAlertas}`);

    // 4. Muestra de productos
    const resSample = await pool.request().query('SELECT TOP 3 CodigoSKU, Nombre, StockActual, PrecioVenta FROM Productos;');
    console.log('\n📋 Muestra de Artículos Madereros en la Base de Datos:');
    console.table(resSample.recordset);

    console.log('===============================================================');
    console.log('🎉 LA BASE DE DATOS ESTÁ 100% OPERATIVA Y FUNCIONANDO CORRECTAMENTE');
    console.log('===============================================================\n');

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al conectar a SQL Server:', err.message);
    console.log('\n💡 Sugerencia:');
    console.log('1. Asegúrate de haber ejecutado database/00_CREAR_BD_LOCAL.sql y database/01_ESQUEMA_Y_DATOS.sql en SSMS.');
    console.log('2. Comprueba que el servicio de SQL Server esté en estado "Running".');
    process.exit(1);
  }
}

testConnection();
