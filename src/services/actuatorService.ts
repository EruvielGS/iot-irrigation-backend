import { GenericCommandPayload, MqttCommandMessage } from "../types/command";
import { mqttTopicService } from "./mqttTopicService";
import { MqttClient } from "mqtt";

export class ActuatorService {
  private mqttClient: MqttClient | null = null;

  setMqttClient(client: MqttClient) {
    this.mqttClient = client;
  }

  sendCommand(plantId: string, payload: GenericCommandPayload): void {
    if (!this.mqttClient || !this.mqttClient.connected) {
      throw new Error("MQTT no está conectado.");
    }

    const topic = mqttTopicService.getDeviceCommandTopic(plantId);
    const message: MqttCommandMessage = {
      cmd: payload.command,
    };

    const jsonMessage = JSON.stringify(message);

    this.mqttClient.publish(topic, jsonMessage, { qos: 1 }, (error) => {
      if (error) {
        console.error(`❌ Error enviando comando MQTT a ${topic}:`, error);
        throw new Error("Error de conexión MQTT.");
      } else {
        console.log(`📡 Comando enviado: Tópico=${topic}, Payload=${jsonMessage}`);
      }
    });
  }
}

export const actuatorService = new ActuatorService();
