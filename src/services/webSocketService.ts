import WebSocket from "ws";
import { WebSocketMessage, WebSocketMessageType } from "../types/websocket";
import { Reading, TelemetryData } from "../types/reading";

export class WebSocketService {
  private clients: Set<WebSocket> = new Set();
  private wss: WebSocket.Server | null = null;

  setWebSocketServer(wss: WebSocket.Server) {
    this.wss = wss;

    wss.on("connection", (ws: WebSocket) => {
      console.log("🔗 Nuevo cliente WebSocket conectado");
      this.clients.add(ws);

      ws.on("close", () => {
        console.log("🔒 Cliente WebSocket desconectado");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("❌ Error WebSocket:", error);
        this.clients.delete(ws);
      });
    });
  }

  sendUpdate(plantId: string, type: WebSocketMessageType, data: any): void {
    const formattedData = this.formatData(type, data);
    const message: WebSocketMessage = {
      type,
      plantId,
      data: formattedData,
      timestamp: new Date().toISOString(),
    };

    const jsonMessage = JSON.stringify(message);
    
    console.log(`📤 WebSocket broadcast para ${plantId}:`, message);
    console.log(`👥 Clientes conectados: ${this.clients.size}`);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonMessage);
      }
    });
  }

  private formatData(type: WebSocketMessageType, data: any): any {
    switch (type) {
      case WebSocketMessageType.TELEMETRY:
        return {
          temp: data.tempC,
          ambientHum: data.ambientHumidity,
          soilHum: data.soilHumidity,
          light: data.lightLux,
          pumpOn: data.pumpOn,
        };
      case WebSocketMessageType.PUMP_EVENT:
        return {
          pumpOn: data.pumpOn,
        };
      case WebSocketMessageType.ALERT:
        return {
          severity: data.advisorResult,
          message: `Alerta: ${data.advisorResult}`,
          value: data.soilHumidity || data.tempC || 0,
        };
      default:
        return data;
    }
  }

  broadcast(message: any): void {
    const jsonMessage = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonMessage);
      }
    });
  }
}

export const webSocketService = new WebSocketService();
