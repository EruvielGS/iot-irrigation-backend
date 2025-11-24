import { Point } from "@influxdata/influxdb-client";
import { writeApi, queryApi } from "../config/influxdb";
import {
  SensorData,
  QualityCheckResult,
  StoredSensorData,
} from "../types/sensor";

export class DataStorageService {
  public async storeSensorData(
    sensorData: SensorData,
    qualityCheck: QualityCheckResult
  ): Promise<StoredSensorData> {
    const point = new Point("sensor_data")
      .tag("deviceId", sensorData.deviceId)
      .tag("isValid", qualityCheck.isValid.toString())
      .floatField("humidity", sensorData.humidity)
      .floatField("quality_score", qualityCheck.score)
      .timestamp(sensorData.timestamp);

    if (sensorData.temperature !== undefined) {
      point.floatField("temperature", sensorData.temperature);
    }

    if (sensorData.batteryLevel !== undefined) {
      point.floatField("battery_level", sensorData.batteryLevel);
    }

    await writeApi.writePoint(point);
    await writeApi.flush();

    const storedData: StoredSensorData = {
      ...sensorData,
      id: this.generateId(),
      qualityScore: qualityCheck.score,
      isValid: qualityCheck.isValid,
    };

    return storedData;
  }

  public async getSensorData(
    deviceId: string,
    hours: number = 24
  ): Promise<SensorData[]> {
    const fluxQuery = `
      from(bucket: "irrigation-data")
        |> range(start: -${hours}h)
        |> filter(fn: (r) => r._measurement == "sensor_data")
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const results: SensorData[] = [];

    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const row = tableMeta.toObject(values);

      const sensorData: SensorData = {
        deviceId: row.deviceId as string,
        humidity: parseFloat(row.humidity as string),
        timestamp: new Date(row._time as string),
      };

      if (row.temperature) {
        sensorData.temperature = parseFloat(row.temperature as string);
      }

      if (row.battery_level) {
        sensorData.batteryLevel = parseFloat(row.battery_level as string);
      }

      results.push(sensorData);
    }

    return results;
  }

  public async getDataQualityReport(
    deviceId: string,
    days: number = 7
  ): Promise<any> {
    const fluxQuery = `
      from(bucket: "irrigation-data")
        |> range(start: -${days}d)
        |> filter(fn: (r) => r._measurement == "sensor_data")
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> filter(fn: (r) => r._field == "quality_score" or r._field == "humidity")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const qualityData: any[] = [];

    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const row = tableMeta.toObject(values);
      qualityData.push({
        timestamp: row._time,
        qualityScore: row.quality_score,
        humidity: row.humidity,
      });
    }

    const avgQuality =
      qualityData.reduce((sum, data) => sum + data.qualityScore, 0) /
      qualityData.length;
    const validReadings = qualityData.filter(
      (data) => data.qualityScore >= 60
    ).length;
    const totalReadings = qualityData.length;

    return {
      deviceId,
      period: `${days} days`,
      averageQualityScore: avgQuality.toFixed(2),
      dataQuality: `${((validReadings / totalReadings) * 100).toFixed(1)}%`,
      totalReadings,
      validReadings,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
