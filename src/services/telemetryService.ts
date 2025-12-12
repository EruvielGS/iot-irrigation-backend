import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import { Reading, QcStatus, AdvisorResult } from "../types/reading";
import { PlantDevice } from "../types/plantDevice";
import { PlantAlert } from "../types/plantAlert";
import { WebSocketMessageType } from "../types/websocket";
import { mongoDBService } from "../config/mongodb";
import { deviceService } from "./deviceService";
import { actuatorService } from "./actuatorService";
import { emailService } from "./emailService";
import { webSocketService } from "./webSocketService";

const MEASUREMENT_SENSORES_PLANTA = "sensores_planta";
const TAG_PLANT_ID = "plant_id";
const TAG_STATUS_QC = "status_qc";

export class TelemetryService {
  private influxDB: InfluxDB;
  private writeApi: WriteApi;
  private bucket: string;
  private org: string;
  private minSoilHumidity: number;
  private maxTemp: number;

  constructor() {
    const url = process.env.INFLUXDB_URL || "http://localhost:8086";
    const token = process.env.INFLUXDB_TOKEN || "";
    this.org = process.env.INFLUXDB_ORG || "iot-org";
    this.bucket = process.env.INFLUXDB_BUCKET || "irrigation-data";

    this.influxDB = new InfluxDB({ url, token });
    this.writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
    this.writeApi.useDefaultTags({ app: "iot-irrigation" });

    this.minSoilHumidity = parseInt(process.env.DEFAULT_MIN_SOIL_HUMIDITY || "35");
    this.maxTemp = parseFloat(process.env.DEFAULT_MAX_TEMP || "38");
  }

  async processAndSave(reading: Reading): Promise<void> {
    try {
      // Convertir estado de bomba
      if (reading.pumpOn === undefined) {
        reading.pumpOn = false;
      }

      console.log(
        `📊 Reading: ${reading.plantId} | Hum: ${reading.ambientHumidity}% | SoilHum: ${reading.soilHumidity}% | Temp: ${reading.tempC}°C | Lux: ${reading.lightLux}`
      );

      // Procesar eventos de bomba
      if (reading.msgType === "EVENT") {
        console.log(`💧 Evento de Bomba Recibido: ${reading.pumpOn}`);
        reading.qcStatus = QcStatus.EVENT;
        this.saveToInflux(reading);
        webSocketService.sendUpdate(reading.plantId, WebSocketMessageType.PUMP_EVENT, reading);
        await this.updateDeviceState(reading);
        return;
      }

      // Control de calidad
      if (!this.runQualityControl(reading)) {
        console.log(`🚫 Dato descartado por QC: ${reading.plantId}`);
        reading.qcStatus = QcStatus.OUT_OF_RANGE;
      } else {
        reading.qcStatus = QcStatus.VALID;
      }

      // Lógica de advisor si es válido
      if (reading.qcStatus === QcStatus.VALID) {
        await this.runAdvisorLogic(reading);
      }

      // Enviar WebSocket y guardar
      webSocketService.sendUpdate(reading.plantId, WebSocketMessageType.TELEMETRY, reading);
      this.saveToInflux(reading);
    } catch (error) {
      console.error("❌ Error procesando telemetría:", error);
    }
  }

  private runQualityControl(reading: Reading): boolean {
    if (reading.tempC !== undefined && (reading.tempC < -50 || reading.tempC > 80)) {
      return false;
    }
    if (
      reading.ambientHumidity !== undefined &&
      (reading.ambientHumidity < 0 || reading.ambientHumidity > 100)
    ) {
      return false;
    }
    if (
      reading.soilHumidity !== undefined &&
      (reading.soilHumidity < 0 || reading.soilHumidity > 100)
    ) {
      return false;
    }
    if (reading.lightLux !== undefined && (reading.lightLux < 0 || reading.lightLux > 100000)) {
      return false;
    }
    return true;
  }

  private async runAdvisorLogic(reading: Reading): Promise<void> {
    reading.advisorResult = AdvisorResult.INFO;

    // Obtener email del propietario
    const targetEmail = await this.getTargetEmail(reading.plantId);

    // Alerta crítica de humedad de suelo
    if (reading.soilHumidity !== undefined && reading.soilHumidity < this.minSoilHumidity) {
      reading.advisorResult = AdvisorResult.CRITICA;
      console.log(`⚠️ ALERTA CRÍTICA: Suelo Seco (${reading.soilHumidity}%).`);

      // WebSocket
      webSocketService.sendUpdate(reading.plantId, WebSocketMessageType.ALERT, reading);

      // Guardar alerta en MongoDB
      await this.saveAlertToMongo(
        reading,
        "CRITICA",
        `Humedad crítica: ${reading.soilHumidity}%`,
        "SOIL_HUMIDITY",
        reading.soilHumidity
      );

      // Activar riego
      actuatorService.sendCommand(reading.plantId, { command: "RIEGO" as any });

      // Enviar email
      await emailService.enviarAlertaHtml(
        targetEmail,
        "[IoT URGENTE: Riego Activado]",
        "El sistema ha detectado humedad crítica y ha activado el riego automático.",
        "CRITICA",
        reading.plantId,
        reading
      );
    }
    // Alerta de temperatura alta
    else if (reading.tempC !== undefined && reading.tempC > this.maxTemp) {
      reading.advisorResult = AdvisorResult.ALERTA;

      // WebSocket
      webSocketService.sendUpdate(reading.plantId, WebSocketMessageType.ALERT, reading);

      // Guardar alerta
      await this.saveAlertToMongo(
        reading,
        "ALERTA",
        `Temperatura alta: ${reading.tempC}°C`,
        "TEMPERATURE",
        reading.tempC
      );

      // Enviar email
      await emailService.enviarAlertaHtml(
        targetEmail,
        "[IoT Alerta de Calor]",
        "La temperatura ambiente ha superado el umbral seguro.",
        "ALERTA",
        reading.plantId,
        reading
      );
    }
  }

  private async getTargetEmail(plantId: string): Promise<string> {
    try {
      const device = await deviceService.getDeviceByPlantId(plantId);
      if (device && device.ownerId) {
        // Aquí podrías obtener el email del usuario desde MongoDB
        // Por ahora retornamos el email por defecto
        return process.env.SMTP_USER || "your-email@gmail.com";
      }
    } catch (error) {
      console.error("⚠️ No se pudo obtener email del propietario");
    }
    return process.env.SMTP_USER || "your-email@gmail.com";
  }

  private async saveAlertToMongo(
    reading: Reading,
    severity: "CRITICA" | "ALERTA" | "RECOMENDACION" | "INFO",
    message: string,
    metric: string,
    value: number
  ): Promise<void> {
    try {
      const collection = mongoDBService.getPlantAlertsCollection();
      const alert: PlantAlert = {
        plantId: reading.plantId,
        severity,
        message,
        metric,
        value,
        timestamp: new Date(),
        isRead: false,
      };
      await collection.insertOne(alert as any);
    } catch (error) {
      console.error("❌ Error guardando alerta en MongoDB:", error);
    }
  }

  private saveToInflux(reading: Reading): void {
    try {
      const point = new Point(MEASUREMENT_SENSORES_PLANTA)
        .tag(TAG_PLANT_ID, reading.plantId)
        .tag(TAG_STATUS_QC, reading.qcStatus || QcStatus.QC_ERROR)
        .timestamp(reading.timestamp || new Date());

      if (reading.tempC !== undefined) point.floatField("tempC", reading.tempC);
      if (reading.ambientHumidity !== undefined)
        point.intField("ambientHumidity", reading.ambientHumidity);
      if (reading.soilHumidity !== undefined) point.intField("soilHumidity", reading.soilHumidity);
      if (reading.lightLux !== undefined) point.intField("lightLux", reading.lightLux);
      if (reading.pumpOn !== undefined) point.booleanField("pumpOn", reading.pumpOn);

      this.writeApi.writePoint(point);
      this.writeApi.flush();
    } catch (error) {
      console.error("❌ Error guardando en InfluxDB:", error);
    }
  }

  private async updateDeviceState(reading: Reading): Promise<void> {
    try {
      const collection = mongoDBService.getPlantDevicesCollection();
      await collection.updateOne(
        { plantId: reading.plantId },
        { $set: { lastDataReceived: new Date() } }
      );
    } catch (error) {
      console.error("❌ Error actualizando estado del dispositivo:", error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.writeApi.close();
      console.log("✅ InfluxDB WriteApi cerrado");
    } catch (error) {
      console.error("❌ Error cerrando InfluxDB:", error);
    }
  }
}

export const telemetryService = new TelemetryService();
