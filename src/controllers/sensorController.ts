import { Request, Response } from "express";
import { SensorData } from "../types/sensor";
import { DataStorageService } from "../services/dataStorageService";
import { QualityCheckService } from "../services/qualityCheckService";
import { NotificationService } from "../services/notificationService";

const storageService = new DataStorageService();

export const SensorController = {
  async receiveData(req: Request, res: Response): Promise<void> {
    try {
      const sensorData: SensorData = {
        deviceId: req.body.deviceId,
        humidity: req.body.humidity,
        temperature: req.body.temperature,
        batteryLevel: req.body.batteryLevel,
        timestamp: new Date(req.body.timestamp || Date.now()),
      };

      // Verificar calidad
      const qualityCheck = QualityCheckService.checkDataQuality(sensorData);

      // Almacenar datos
      const storedData = await storageService.storeSensorData(
        sensorData,
        qualityCheck
      );

      // Verificar notificaciones
      if (qualityCheck.isValid) {
        await NotificationService.checkAndNotify(
          sensorData,
          qualityCheck.score
        );
      }

      res.status(201).json({
        success: true,
        data: storedData,
        quality: qualityCheck,
      });
    } catch (error) {
      console.error("Error receiving sensor data:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  async getDeviceData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const data = await storageService.getSensorData(deviceId, hours);

      res.json({
        success: true,
        data: data,
        count: data.length,
      });
    } catch (error) {
      console.error("Error fetching device data:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  async getQualityReport(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const report = await storageService.getDataQualityReport(deviceId, days);

      res.json({
        success: true,
        report: report,
      });
    } catch (error) {
      console.error("Error generating quality report:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
};
