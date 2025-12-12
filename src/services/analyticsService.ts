import { InfluxDB } from "@influxdata/influxdb-client";
import { KpiDto, ChartPointDto, CombinedHistoryData, ClusterResultDto } from "../types/analytics";

export class AnalyticsService {
  private influxDB: InfluxDB;
  private bucket: string;
  private org: string;

  constructor() {
    const url = process.env.INFLUXDB_URL || "http://localhost:8086";
    const token = process.env.INFLUXDB_TOKEN || "";
    this.org = process.env.INFLUXDB_ORG || "iot-org";
    this.bucket = process.env.INFLUXDB_BUCKET || "irrigation-data";

    this.influxDB = new InfluxDB({ url, token });
  }

  async getPlantKPIs(plantId: string): Promise<KpiDto> {
    const queryApi = this.influxDB.getQueryApi(this.org);

    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> last()
    `;

    console.log(`🔍 Ejecutando query InfluxDB para ${plantId}:`, query);

    const result: any = {};

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          console.log(`📥 InfluxDB row recibida:`, o);
          if (o._field === "tempC") result.currentTemp = o._value;
          if (o._field === "soilHumidity") result.currentSoil = o._value;
          if (o._field === "lightLux") result.currentLight = o._value;
          if (o._field === "ambientHumidity") result.currentHumidity = o._value;
          if (o._field === "pumpOn") result.pumpOn = o._value;
        },
        error: (error) => {
          console.error("❌ Error consultando KPIs:", error);
          reject(error);
        },
        complete: () => {
          console.log(`📊 Resultado acumulado de InfluxDB:`, result);
          const kpi: KpiDto = {
            currentTemp: result.currentTemp || 0,
            currentSoil: result.currentSoil || 0,
            currentLight: result.currentLight || 0,
            currentHumidity: result.currentHumidity || 0,
            healthIndex: this.calculateHealthIndex(result),
            dataQuality: 100,
            lastUpdate: new Date().toISOString(),
            pumpOn: result.pumpOn || false,
          };
          console.log(`✅ KPI final calculado:`, kpi);
          resolve(kpi);
        },
      });
    });
  }

  async getHistory(plantId: string, field: string, range: string = "24h"): Promise<ChartPointDto[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);

    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -${range})
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> filter(fn: (r) => r["_field"] == "${field}")
        |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
    `;

    const data: ChartPointDto[] = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          data.push({
            time: new Date(o._time).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: o._value,
          });
        },
        error: (error) => {
          console.error(`❌ Error consultando historial de ${field}:`, error);
          reject(error);
        },
        complete: () => {
          resolve(data);
        },
      });
    });
  }

  async getHistoryCombined(plantId: string, range: string = "72h", window?: string): Promise<CombinedHistoryData[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);

    console.log(`📊 Consultando historial combinado para ${plantId}, rango: ${range}, window: ${window || 'auto'}`);

    // Primero verificar si HAY datos sin agregación
    const simpleQuery = `
      from(bucket: "${this.bucket}")
        |> range(start: -${range})
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> limit(n: 5)
    `;

    console.log(`🔍 Verificando si existen datos para ${plantId}...`);
    
    let hasData = false;
    await new Promise((resolve) => {
      queryApi.queryRows(simpleQuery, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          console.log(`✅ DATO ENCONTRADO:`, {
            time: o._time,
            field: o._field,
            value: o._value,
            plant_id: o.plant_id,
            measurement: o._measurement
          });
          hasData = true;
        },
        error: (error) => {
          console.error("❌ Error en verificación:", error);
          resolve(null);
        },
        complete: () => {
          if (!hasData) {
            console.log(`⚠️  NO se encontraron datos para ${plantId} en las últimas ${range}`);
          }
          resolve(null);
        }
      });
    });

    // Query con agregación adaptativa o personalizada
    // Si no se especifica window, usar valores automáticos
    let aggregationWindow: string;
    if (window) {
      aggregationWindow = window;
    } else {
      aggregationWindow = range === "72h" ? "10m" : range === "24h" ? "5m" : "1m";
    }
    
    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -${range})
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> filter(fn: (r) => r["_field"] == "tempC" or r["_field"] == "ambientHumidity" or r["_field"] == "soilHumidity" or r["_field"] == "lightLux")
        |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
    `;

    console.log(`🔍 Query InfluxDB con agregación (${aggregationWindow}):\n${query}`);

    const dataMap: Map<string, CombinedHistoryData> = new Map();

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          console.log(`📈 Fila recibida de InfluxDB:`, {
            time: o._time,
            field: o._field,
            value: o._value,
            plantId: o.plant_id
          });
          
          const timeKey = new Date(o._time).toISOString();

          if (!dataMap.has(timeKey)) {
            const date = new Date(o._time);
            // Formato adaptativo según la cantidad de tiempo
            let timeFormat: string;
            if (range === "72h") {
              // Para 3 días: mostrar día/mes hora:minuto
              timeFormat = date.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
            } else {
              // Para rangos cortos: solo hora:minuto:segundo
              timeFormat = date.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
            }
            
            dataMap.set(timeKey, {
              time: timeFormat,
            });
          }

          const entry = dataMap.get(timeKey)!;
          if (o._field === "tempC") entry.temp = o._value;
          if (o._field === "ambientHumidity") entry.ambientHum = o._value;
          if (o._field === "soilHumidity") entry.soilHum = o._value;
          if (o._field === "lightLux") entry.light = o._value;
        },
        error: (error) => {
          console.error("❌ Error consultando historial combinado:", error);
          reject(error);
        },
        complete: () => {
          const data = Array.from(dataMap.values()).sort((a, b) => {
            return a.time.localeCompare(b.time);
          });
          console.log(`✅ Historial combinado obtenido: ${data.length} puntos`);
          resolve(data);
        },
      });
    });
  }

  // Obtener todos los datos sin agregación (útil cuando hay pocos datos)
  async getHistoryRaw(plantId: string, range: string = "1h", limit: number = 100): Promise<CombinedHistoryData[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);

    console.log(`📊 Consultando historial RAW para ${plantId}, rango: ${range}, límite: ${limit}`);

    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -${range})
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> filter(fn: (r) => r["_field"] == "tempC" or r["_field"] == "ambientHumidity" or r["_field"] == "soilHumidity" or r["_field"] == "lightLux")
        |> sort(columns: ["_time"], desc: false)
        |> limit(n: ${limit})
    `;

    const dataMap: Map<string, CombinedHistoryData> = new Map();

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          const timeKey = new Date(o._time).toISOString();

          if (!dataMap.has(timeKey)) {
            dataMap.set(timeKey, {
              time: new Date(o._time).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            });
          }

          const entry = dataMap.get(timeKey)!;
          if (o._field === "tempC") entry.temp = o._value;
          if (o._field === "ambientHumidity") entry.ambientHum = o._value;
          if (o._field === "soilHumidity") entry.soilHum = o._value;
          if (o._field === "lightLux") entry.light = o._value;
        },
        error: (error) => {
          console.error("❌ Error consultando historial raw:", error);
          reject(error);
        },
        complete: () => {
          const data = Array.from(dataMap.values());
          console.log(`✅ Historial RAW obtenido: ${data.length} puntos`);
          resolve(data);
        },
      });
    });
  }

  async getClustering(plantId: string): Promise<ClusterResultDto> {
    // Implementación simplificada
    return {
      period: "7d",
      clusters: {
        Normal: 70,
        Crítico: 20,
        Alerta: 10,
      },
    };
  }

  private calculateHealthIndex(data: any): number {
    let score = 100;

    if (data.currentSoil < 35) {
      score -= 40;
    } else if (data.currentSoil < 45) {
      score -= 20;
    }

    if (data.currentTemp > 38) {
      score -= 30;
    } else if (data.currentTemp > 33) {
      score -= 15;
    }

    return Math.max(0, score);
  }
}

export const analyticsService = new AnalyticsService();
