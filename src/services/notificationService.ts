import { SensorData, NotificationRule } from "../types/sensor";
import WebSocket from "ws";

export class NotificationService {
  private static rules: NotificationRule[] = [
    {
      id: "humidity_low",
      condition: "humidity_low",
      threshold: 30,
      message: "⚠️ Humedad del suelo baja. Considera activar el riego.",
      enabled: true,
    },
    {
      id: "humidity_high",
      condition: "humidity_high",
      threshold: 80,
      message: "🌧️ Humedad del suelo alta. Riego no necesario.",
      enabled: true,
    },
    {
      id: "battery_low",
      condition: "battery_low",
      threshold: 20,
      message: "🔋 Batería del sensor baja. Considera reemplazarla.",
      enabled: true,
    },
  ];

  private static connectedClients: Set<WebSocket> = new Set();

  public static addWebSocketClient(ws: WebSocket): void {
    this.connectedClients.add(ws);

    ws.on("close", () => {
      this.connectedClients.delete(ws);
    });
  }

  public static async checkAndNotify(
    sensorData: SensorData,
    qualityScore: number
  ): Promise<void> {
    const notifications: string[] = [];

    // Aplicar reglas de notificación
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      switch (rule.condition) {
        case "humidity_low":
          if (sensorData.humidity < rule.threshold) {
            notifications.push(rule.message);
          }
          break;
        case "humidity_high":
          if (sensorData.humidity > rule.threshold) {
            notifications.push(rule.message);
          }
          break;
        case "battery_low":
          if (
            sensorData.batteryLevel &&
            sensorData.batteryLevel < rule.threshold
          ) {
            notifications.push(rule.message);
          }
          break;
      }
    }

    // Notificar si la calidad es baja
    if (qualityScore < 60) {
      notifications.push("⚠️ Calidad de datos baja. Verificar sensor.");
    }

    // Enviar notificaciones
    if (notifications.length > 0) {
      await this.sendNotifications(notifications, sensorData);
    }
  }

  private static async sendNotifications(
    messages: string[],
    sensorData: SensorData
  ): Promise<void> {
    const notificationPayload = {
      deviceId: sensorData.deviceId,
      timestamp: new Date(),
      messages: messages,
      data: sensorData,
    };

    // Enviar via WebSocket
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notificationPayload));
      }
    });

    // Log de notificaciones
    console.log("🔔 Notificaciones enviadas:", {
      deviceId: sensorData.deviceId,
      messages: messages,
      timestamp: new Date().toISOString(),
    });
  }

  public static getRules(): NotificationRule[] {
    return this.rules;
  }

  public static updateRule(
    ruleId: string,
    updates: Partial<NotificationRule>
  ): boolean {
    const ruleIndex = this.rules.findIndex((rule) => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      return true;
    }
    return false;
  }
}
