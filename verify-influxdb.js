/**
 * Script para verificar datos en InfluxDB
 * Ejecutar con: node verify-influxdb.js
 */

const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || '';
const org = process.env.INFLUXDB_ORG || 'iot-org';
const bucket = process.env.INFLUXDB_BUCKET || 'irrigation-data';

const influxDB = new InfluxDB({ url, token });
const queryApi = influxDB.getQueryApi(org);

async function verificarDatos() {
  console.log('🔍 Verificando datos en InfluxDB...');
  console.log(`📊 URL: ${url}`);
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`🏢 Org: ${org}\n`);

  // Query para obtener últimos 10 registros
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
      |> limit(n: 10)
  `;

  console.log('📝 Ejecutando query...\n');

  let count = 0;
  const registros = [];

  try {
    await new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          count++;
          registros.push({
            time: o._time,
            plantId: o.plant_id,
            field: o._field,
            value: o._value,
            measurement: o._measurement
          });
        },
        error: (error) => {
          console.error('❌ Error:', error);
          reject(error);
        },
        complete: () => {
          console.log(`✅ Query completado - ${count} registros encontrados\n`);
          
          if (count === 0) {
            console.log('⚠️  No se encontraron datos en las últimas 24 horas');
            console.log('Posibles causas:');
            console.log('  1. Los datos no se están escribiendo');
            console.log('  2. El bucket está vacío');
            console.log('  3. El token no tiene permisos de lectura');
          } else {
            console.log('📊 Últimos registros:');
            console.table(registros.slice(0, 5));
            
            // Agrupar por plantId
            const porPlanta = {};
            registros.forEach(r => {
              if (!porPlanta[r.plantId]) {
                porPlanta[r.plantId] = [];
              }
              porPlanta[r.plantId].push(r);
            });
            
            console.log('\n📈 Resumen por dispositivo:');
            Object.keys(porPlanta).forEach(plantId => {
              console.log(`  ${plantId}: ${porPlanta[plantId].length} registros`);
            });
          }
          
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('❌ Error ejecutando query:', error.message);
    process.exit(1);
  }
}

verificarDatos()
  .then(() => {
    console.log('\n✅ Verificación completa');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
