export enum QcStatus {
  VALID = "VALID",
  OUT_OF_RANGE = "OUT_OF_RANGE",
  RATE_ERROR = "RATE_ERROR",
  QC_ERROR = "QC_ERROR",
  EVENT = "EVENT",
}

export enum AdvisorResult {
  CRITICA = "CRITICA",
  ALERTA = "ALERTA",
  RECOMENDACION = "RECOMENDACION",
  INFO = "INFO",
}

export enum MessageType {
  READING = "READING",
  EVENT = "EVENT",
}

export interface Reading {
  id?: string;
  plantId: string;
  userId?: string;
  timestamp?: Date;

  // Datos de sensores
  tempC?: number;
  ambientHumidity?: number;
  lightLux?: number;
  soilHumidity?: number;

  // Estado de bomba
  pumpOn?: boolean;

  // Enums
  msgType?: MessageType;
  qcStatus?: QcStatus;
  advisorResult?: AdvisorResult;
}

export interface TelemetryData {
  temp?: number;
  ambientHum?: number;
  soilHum?: number;
  light?: number;
  pumpOn?: boolean;
}
