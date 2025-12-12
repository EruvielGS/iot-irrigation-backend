export interface PlantDevice {
  id?: string;
  ownerId: string;
  plantId: string;
  name: string;
  description?: string;
  macAddress?: string;
  ownerEmail?: string;       // Email del propietario para notificaciones

  // Umbrales de Humedad Ambiental
  minHumidity?: number;
  maxHumidity?: number;

  // Umbrales de Humedad de Suelo
  minSoilHumidity?: number;
  maxSoilHumidity?: number;

  // Umbrales de Temperatura
  minTempC?: number;
  maxTempC?: number;

  // Umbrales de Luz
  minLightLux?: number;
  maxLightLux?: number;

  // Campos de Operación
  topic?: string;
  isActive: boolean;
  lastDataReceived?: Date;
  qosLevel?: number;
}

export interface PlantDeviceUpdateDto {
  minHumidity?: number;
  maxHumidity?: number;
  minSoilHumidity?: number;
  maxSoilHumidity?: number;
  minTempC?: number;
  maxTempC?: number;
  minLightLux?: number;
  maxLightLux?: number;
}

export interface CreateDeviceRequest {
  plantId: string;
  name: string;
  userId: string;
}
