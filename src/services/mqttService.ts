import mqtt, { MqttClient } from "mqtt";
import { Reading, MessageType } from "../types/reading";
import { telemetryService } from "./telemetryService";
import { actuatorService } from "./actuatorService";
import { mqttTopicService } from "./mqttTopicService";

export class MQTTService {
  private client: MqttClient | null = null;

  public connect(): void {
    const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";

    this.client = mqtt.connect(mqttUrl);

    this.client.on("connect", () => {
      console.log("✅ Conectado al broker MQTT");
      
      // Suscribirse a todos los tópicos de datos
      this.client!.subscribe("planta/+/data", { qos: 1 });
      this.client!.subscribe("planta/+/status", { qos: 1 });
      
      console.log("📡 Suscrito a: planta/+/data y planta/+/status");
    });

    this.client.on("message", async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());

        if (topic.includes("/data")) {
          await this.handleSensorData(topic, data);
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

    this.client.on("reconnect", () => {
      console.log("🔄 Reconectando al broker MQTT...");
    });

    // Configurar el cliente MQTT en el actuator service
    actuatorService.setMqttClient(this.client);
  }

  private async handleSensorData(topic: string, data: any): Promise<void> {
    try {
      // Extraer plantId del tópico: planta/{plantId}/data
      const parts = topic.split("/");
      const plantId = parts[1];

      const reading: Reading = {
        plantId,
        tempC: data.tempC || data.temperature,
        ambientHumidity: data.ambientHumidity || data.humidity,
        soilHumidity: data.soilHumidity || data.soilHum,
        lightLux: data.lightLux || data.light,
        pumpOn: data.pumpOn,
        timestamp: new Date(data.timestamp || Date.now()),
        msgType: data.msgType || MessageType.READING,
      };

      // Procesar y guardar usando el servicio de telemetría
      await telemetryService.processAndSave(reading);
    } catch (error) {
      console.error("❌ Error manejando datos del sensor:", error);
    }
  }

  private async handleStatusMessage(data: any): Promise<void> {
    console.log("📡 Mensaje de estado recibido:", data);
  }

  public publish(topic: string, message: any): void {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    }
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end();
      console.log("🔒 Desconectado del broker MQTT");
    }
  }

  public getClient(): MqttClient | null {
    return this.client;
  }
}
