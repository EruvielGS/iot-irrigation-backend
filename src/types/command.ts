export enum DeviceCommand {
  RIEGO = "RIEGO",
  LUZ = "LUZ",
  STOP = "STOP",
}

export interface GenericCommandPayload {
  command: DeviceCommand;
}

export interface MqttCommandMessage {
  cmd: string;
}
