export class MqttTopicService {
  private readonly BASE_TOPIC = "planta";

  getDeviceDataTopic(plantId: string): string {
    return `${this.BASE_TOPIC}/${plantId}/lecturas`;
  }

  getDeviceCommandTopic(plantId: string): string {
    return `${this.BASE_TOPIC}/${plantId}/command/`;
  }

  getWebSocketTopic(plantId: string): string {
    return `/topic/plant/${plantId}`;
  }
}

export const mqttTopicService = new MqttTopicService();
