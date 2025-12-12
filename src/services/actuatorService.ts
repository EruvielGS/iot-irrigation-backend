import { GenericCommandPayload, MqttCommandMessage } from "../types/command";
import { mqttTopicService } from "./mqttTopicService";
import { MqttClient } from "mqtt";

export class ActuatorService {
  private mqttClient: MqttClient | null = null;

  setMqttClient(client: MqttClient) {
    this.mqttClient = client;
    console.log("✅ Cliente MQTT configurado en ActuatorService");
  }

  isClientConnected(): boolean {
    return this.mqttClient?.connected || false;
  }

  sendCommand(plantId: string, payload: GenericCommandPayload): void {
    if (!this.mqttClient) {
      const error = "Cliente MQTT no inicializado. Espera a que se conecte a HiveMQ.";
      console.error(`❌ ${error}`);
      throw new Error(error);
    }

    if (!this.mqttClient.connected) {
      const error = "MQTT no está conectado a HiveMQ Cloud. Verifica la conexión.";
      console.error(`❌ ${error}`);
      throw new Error(error);
    }

    const topic = mqttTopicService.getDeviceCommandTopic(plantId);
    const message: MqttCommandMessage = {
      cmd: payload.command,
    };

    const jsonMessage = JSON.stringify(message);

    console.log(`📤 Enviando comando a HiveMQ - Planta: ${plantId}, Comando: ${payload.command}`);

    this.mqttClient.publish(topic, jsonMessage, { qos: 1 }, (error) => {
      if (error) {
        console.error(`❌ Error enviando comando MQTT a ${topic}:`, error.message);
        throw new Error(`Error de conexión MQTT: ${error.message}`);
      } else {
        console.log(`✅ Comando enviado exitosamente a ${topic}`);
        console.log(`📋 Payload: ${jsonMessage}`);
      }
    });
  }
}

export const actuatorService = new ActuatorService();
