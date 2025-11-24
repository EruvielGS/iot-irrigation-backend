import mqtt, { MqttClient } from "mqtt";
import { SensorData } from "../types/sensor";
import { DataStorageService } from "./dataStorageService";
import { QualityCheckService } from "./qualityCheckService";
import { NotificationService } from "./notificationService";

export class MQTTService {
  private client: MqttClient | null = null;
  private storageService: DataStorageService;

  constructor() {
    this.storageService = new DataStorageService();
  }

  public connect(): void {
    const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";

    this.client = mqtt.connect(mqttUrl);

    this.client.on("connect", () => {
      console.log("✅ Conectado al broker MQTT");
      this.client!.subscribe("sensors/+/data");
      this.client!.subscribe("sensors/+/status");
    });

    this.client.on("message", async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());

        if (topic.includes("/data")) {
          await this.handleSensorData(data);
        } else if (topic.includes("/status")) {
          await this.handleStatusMessage(data);
        }
      } catch (error) {
        console.error("❌ Error procesando mensaje MQTT:", error);
      }
    });

    this.client.on("error", (error) => {
      console.error("❌ Error MQTT:", error);
    });
  }

  private async handleSensorData(data: any): Promise<void> {
    const sensorData: SensorData = {
      deviceId: data.deviceId,
      humidity: data.humidity,
      temperature: data.temperature,
      batteryLevel: data.batteryLevel,
      timestamp: new Date(data.timestamp || Date.now()),
    };

    // Verificar calidad de datos
    const qualityCheck = QualityCheckService.checkDataQuality(sensorData);

    // Almacenar datos
    const storedData = await this.storageService.storeSensorData(
      sensorData,
      qualityCheck
    );

    // Verificar y enviar notificaciones
    if (qualityCheck.isValid) {
      await NotificationService.checkAndNotify(sensorData, qualityCheck.score);
    }

    console.log(
      `📊 Datos procesados - Device: ${sensorData.deviceId}, Humedad: ${sensorData.humidity}, Calidad: ${qualityCheck.score}`
    );
  }

  private async handleStatusMessage(data: any): Promise<void> {
    console.log("📡 Mensaje de estado recibido:", data);
    // Aquí puedes manejar mensajes de estado del dispositivo
  }

  public publish(topic: string, message: any): void {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message));
    }
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end();
    }
  }
}
