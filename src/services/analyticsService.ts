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

    const result: any = {};

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
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

  async getHistoryCombined(plantId: string, range: string = "24h"): Promise<CombinedHistoryData[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);

    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -${range})
        |> filter(fn: (r) => r["_measurement"] == "sensores_planta")
        |> filter(fn: (r) => r["plant_id"] == "${plantId}")
        |> filter(fn: (r) => r["_field"] == "tempC" or r["_field"] == "ambientHumidity" or r["_field"] == "soilHumidity" or r["_field"] == "lightLux")
        |> aggregateWindow(every: 10m, fn: mean, createEmpty: false)
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
          console.error("❌ Error consultando historial combinado:", error);
          reject(error);
        },
        complete: () => {
          const data = Array.from(dataMap.values()).sort((a, b) => {
            return a.time.localeCompare(b.time);
          });
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
