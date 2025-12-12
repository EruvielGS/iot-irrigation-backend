import mqtt, { MqttClient, IClientOptions } from "mqtt";
import { Reading, MessageType } from "../types/reading";
import { telemetryService } from "./telemetryService";
import { actuatorService } from "./actuatorService";
import { mqttTopicService } from "./mqttTopicService";

export class MQTTService {
  private client: MqttClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  public connect(): void {
    const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";
    const mqttUser = process.env.MQTT_USER;
    const mqttPassword = process.env.MQTT_PASSWORD;
    const clientId = process.env.MQTT_CLIENT_ID || `backend_${Math.random().toString(16).slice(2, 10)}`;

    // Configuración de opciones para HiveMQ Cloud
    const options: IClientOptions = {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      keepalive: 60,
      rejectUnauthorized: true, // Verificar certificados SSL
    };

    // Agregar autenticación si está configurada
    if (mqttUser && mqttPassword) {
      options.username = mqttUser;
      options.password = mqttPassword;
    }

    console.log(`🔌 Conectando a HiveMQ Cloud: ${mqttUrl}`);
    console.log(`👤 Usuario: ${mqttUser || 'Sin autenticación'}`);
    console.log(`🆔 Client ID: ${clientId}`);

    this.client = mqtt.connect(mqttUrl, options);

    this.client.on("connect", () => {
      this.reconnectAttempts = 0;
      console.log("✅ Conectado exitosamente al broker HiveMQ Cloud");
      
      // Suscribirse a todos los tópicos de datos
      this.client!.subscribe("planta/+/lecturas", { qos: 1 }, (err) => {
        if (err) {
          console.error("❌ Error suscribiéndose a planta/+/lecturas:", err);
        } else {
          console.log("📡 Suscrito a: planta/+/lecturas");
        }
      });

      this.client!.subscribe("planta/+/status", { qos: 1 }, (err) => {
        if (err) {
          console.error("❌ Error suscribiéndose a planta/+/status:", err);
        } else {
          console.log("📡 Suscrito a: planta/+/status");
        }
      });
      
      // Configurar el cliente MQTT en el actuator service
      actuatorService.setMqttClient(this.client!);
    });

    this.client.on("message", async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`📨 Mensaje recibido en ${topic}:`, data);

        if (topic.includes("/lecturas") || topic.includes("/data")) {
          await this.handleSensorData(topic, data);
        } else if (topic.includes("/status")) {
          await this.handleStatusMessage(data);
        }
      } catch (error) {
        console.error("❌ Error procesando mensaje MQTT:", error);
      }
    });

    this.client.on("error", (error) => {
      console.error("❌ Error MQTT:", error.message);
      if (error.message.includes("Not authorized")) {
        console.error("⚠️ Verifica las credenciales MQTT_USER y MQTT_PASSWORD en el archivo .env");
      }
    });

    this.client.on("reconnect", () => {
      this.reconnectAttempts++;
      console.log(`🔄 Reconectando al broker HiveMQ... (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Máximo de intentos de reconexión alcanzado");
        this.client?.end(true);
      }
    });

    this.client.on("offline", () => {
      console.warn("⚠️ Cliente MQTT desconectado (offline)");
    });

    this.client.on("close", () => {
      console.log("🔒 Conexión MQTT cerrada");
    });
  }

  private async handleSensorData(topic: string, data: any): Promise<void> {
    try {
      // Extraer plantId del tópico: planta/{plantId}/lecturas o planta/{plantId}/data
      const parts = topic.split("/");
      const plantId = parts[1];

      // Validar timestamp: si es muy pequeño (< año 2000 en ms), usar Date.now()
      let timestamp = new Date();
      if (data.timestamp) {
        const ts = typeof data.timestamp === 'number' ? data.timestamp : parseInt(data.timestamp);
        // Si el timestamp es menor a 946684800000 (1 enero 2000), es inválido
        if (ts > 946684800000) {
          timestamp = new Date(ts);
        } else {
          console.log(`⚠️  Timestamp inválido recibido: ${data.timestamp}, usando tiempo actual`);
        }
      }

      const reading: Reading = {
        plantId: data.plantId || plantId,
        tempC: data.tempC || data.temperature,
        ambientHumidity: data.ambientHumidity || data.humidity,
        soilHumidity: data.soilHumidity || data.soilHum,
        lightLux: data.lightLux || data.light,
        pumpOn: data.pumpOn || (data.pumpState === 'ON'),
        timestamp: timestamp,
        msgType: data.msgType || data.type || MessageType.READING,
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
    if (!this.client) {
      console.error("❌ Cliente MQTT no inicializado");
      return;
    }

    if (!this.client.connected) {
      console.error("❌ Cliente MQTT no está conectado. No se puede publicar en:", topic);
      return;
    }

    this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Error publicando en ${topic}:`, err);
      } else {
        console.log(`📤 Mensaje publicado en ${topic}:`, message);
      }
    });
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end(false, {}, () => {
        console.log("🔒 Desconectado del broker HiveMQ Cloud");
      });
      this.client = null;
    }
  }

  public getClient(): MqttClient | null {
    return this.client;
  }

  public isConnected(): boolean {
    return this.client?.connected || false;
  }
}
