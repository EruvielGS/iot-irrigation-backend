import { TelemetryData } from "./reading";

export enum WebSocketMessageType {
  TELEMETRY = "TELEMETRY",
  PUMP_EVENT = "PUMP_EVENT",
  ALERT = "ALERT",
}

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  plantId: string;
  data: T;
  timestamp: string;
}

export interface PumpEventData {
  pumpOn: boolean;
}

export interface AlertData {
  severity: string;
  message: string;
  metric: string;
  value: number;
}
