import { mongoDBService } from "../config/mongodb";
import { PlantDevice, PlantDeviceUpdateDto, CreateDeviceRequest } from "../types/plantDevice";
import { mqttTopicService } from "./mqttTopicService";

export class DeviceService {
  private getDefaultThresholds() {
    return {
      minHumidity: parseInt(process.env.DEFAULT_MIN_HUMIDITY || "30"),
      maxHumidity: parseInt(process.env.DEFAULT_MAX_HUMIDITY || "100"),
      minSoilHumidity: parseInt(process.env.DEFAULT_MIN_SOIL_HUMIDITY || "35"),
      maxSoilHumidity: parseInt(process.env.DEFAULT_MAX_SOIL_HUMIDITY || "100"),
      minTempC: parseFloat(process.env.DEFAULT_MIN_TEMP || "-10"),
      maxTempC: parseFloat(process.env.DEFAULT_MAX_TEMP || "38"),
      minLightLux: parseInt(process.env.DEFAULT_MIN_LIGHT || "200"),
      maxLightLux: parseInt(process.env.DEFAULT_MAX_LIGHT || "50000"),
    };
  }

  async getDevicesByOwner(userId: string): Promise<PlantDevice[]> {
    const collection = mongoDBService.getPlantDevicesCollection();
    // Retornar todos los dispositivos activos (o filtrar por ownerId si prefieres)
    return await collection.find({ isActive: true }).toArray();
  }

  async getDeviceByPlantId(plantId: string): Promise<PlantDevice | null> {
    const collection = mongoDBService.getPlantDevicesCollection();
    return await collection.findOne({ plantId });
  }

  async createDevice(request: CreateDeviceRequest): Promise<PlantDevice> {
    const collection = mongoDBService.getPlantDevicesCollection();

    // Verificar si ya existe
    const existing = await collection.findOne({ plantId: request.plantId });
    if (existing) {
      throw new Error("¡Esta planta ya existe!");
    }

    const defaults = this.getDefaultThresholds();

    const device: PlantDevice = {
      plantId: request.plantId,
      name: request.name,
      ownerId: request.userId,
      isActive: true,
      topic: mqttTopicService.getDeviceDataTopic(request.plantId),
      qosLevel: 1,
      lastDataReceived: new Date(),
      ...defaults,
    };

    await collection.insertOne(device as any);
    return device;
  }

  async updateThresholds(
    plantId: string,
    updateDto: PlantDeviceUpdateDto
  ): Promise<PlantDevice> {
    const collection = mongoDBService.getPlantDevicesCollection();

    const device = await collection.findOne({ plantId });
    if (!device) {
      throw new Error("PlantDevice no encontrado.");
    }

    const updateFields: any = {};
    if (updateDto.minHumidity !== undefined) updateFields.minHumidity = updateDto.minHumidity;
    if (updateDto.maxHumidity !== undefined) updateFields.maxHumidity = updateDto.maxHumidity;
    if (updateDto.minSoilHumidity !== undefined)
      updateFields.minSoilHumidity = updateDto.minSoilHumidity;
    if (updateDto.maxSoilHumidity !== undefined)
      updateFields.maxSoilHumidity = updateDto.maxSoilHumidity;
    if (updateDto.minTempC !== undefined) updateFields.minTempC = updateDto.minTempC;
    if (updateDto.maxTempC !== undefined) updateFields.maxTempC = updateDto.maxTempC;
    if (updateDto.minLightLux !== undefined) updateFields.minLightLux = updateDto.minLightLux;
    if (updateDto.maxLightLux !== undefined) updateFields.maxLightLux = updateDto.maxLightLux;

    await collection.updateOne({ plantId }, { $set: updateFields });

    return (await collection.findOne({ plantId }))!;
  }
}

export const deviceService = new DeviceService();
