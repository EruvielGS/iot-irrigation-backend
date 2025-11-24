export interface SensorData {
  deviceId: string;
  humidity: number;
  temperature?: number;
  timestamp: Date;
  batteryLevel?: number;
}

export interface QualityCheckResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

export interface NotificationRule {
  id: string;
  condition:
    | "humidity_low"
    | "humidity_high"
    | "device_offline"
    | "battery_low";
  threshold: number;
  message: string;
  enabled: boolean;
}

export interface StoredSensorData extends SensorData {
  id: string;
  qualityScore: number;
  isValid: boolean;
}
