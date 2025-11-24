import { SensorData, QualityCheckResult } from "../types/sensor";

export class QualityCheckService {
  private static readonly VALID_HUMIDITY_RANGE = { min: 0, max: 100 };
  private static readonly VALID_TEMPERATURE_RANGE = { min: -10, max: 60 };

  public static checkDataQuality(sensorData: SensorData): QualityCheckResult {
    const errors: string[] = [];
    let score = 100;

    // Validar humedad
    if (
      sensorData.humidity < this.VALID_HUMIDITY_RANGE.min ||
      sensorData.humidity > this.VALID_HUMIDITY_RANGE.max
    ) {
      errors.push(`Humedad fuera de rango: ${sensorData.humidity}`);
      score -= 40;
    }

    // Validar temperatura si está presente
    if (sensorData.temperature !== undefined) {
      if (
        sensorData.temperature < this.VALID_TEMPERATURE_RANGE.min ||
        sensorData.temperature > this.VALID_TEMPERATURE_RANGE.max
      ) {
        errors.push(`Temperatura fuera de rango: ${sensorData.temperature}`);
        score -= 20;
      }
    }

    // Validar nivel de batería si está presente
    if (sensorData.batteryLevel !== undefined) {
      if (sensorData.batteryLevel < 0 || sensorData.batteryLevel > 100) {
        errors.push(`Nivel de batería inválido: ${sensorData.batteryLevel}`);
        score -= 20;
      }
    }

    // Validar timestamp
    if (
      sensorData.timestamp > new Date() ||
      sensorData.timestamp < new Date(Date.now() - 86400000)
    ) {
      errors.push("Timestamp inválido");
      score -= 20;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, score),
    };
  }

  public static detectAnomalies(
    historicalData: SensorData[],
    currentData: SensorData
  ): string[] {
    const anomalies: string[] = [];

    if (historicalData.length === 0) return anomalies;

    const recentData = historicalData.slice(-10); // Últimas 10 lecturas
    const avgHumidity =
      recentData.reduce((sum, data) => sum + data.humidity, 0) /
      recentData.length;

    // Detectar cambio brusco en humedad
    if (Math.abs(currentData.humidity - avgHumidity) > 30) {
      anomalies.push(
        `Cambio brusco detectado en humedad: ${avgHumidity.toFixed(2)} -> ${
          currentData.humidity
        }`
      );
    }

    return anomalies;
  }
}
