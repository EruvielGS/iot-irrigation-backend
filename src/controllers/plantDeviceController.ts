import { Request, Response } from "express";
import { deviceService } from "../services/deviceService";
import { actuatorService } from "../services/actuatorService";
import { emailService } from "../services/emailService";
import { mongoDBService } from "../config/mongodb";
import { CreateDeviceRequest, PlantDeviceUpdateDto } from "../types/plantDevice";
import { GenericCommandPayload } from "../types/command";

export const PlantDeviceController = {
  // Listar todos los dispositivos
  async listAllDevices(req: Request, res: Response): Promise<void> {
    try {
      // Por ahora listamos todos los dispositivos activos
      const devices = await deviceService.getDevicesByOwner("");
      res.json(devices);
    } catch (error) {
      console.error("Error al listar dispositivos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener detalle de un dispositivo
  async getDeviceDetails(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const device = await deviceService.getDeviceByPlantId(plantId);

      if (!device) {
        res.status(404).json({ error: "Dispositivo no encontrado" });
        return;
      }

      res.json(device);
    } catch (error) {
      console.error("Error al obtener detalles del dispositivo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Crear nuevo dispositivo
  async createDevice(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateDeviceRequest = req.body;

      if (!request.plantId || !request.name || !request.userId) {
        res.status(400).json({ error: "Faltan campos requeridos" });
        return;
      }

      const device = await deviceService.createDevice(request);
      res.status(201).json(device);
    } catch (error: any) {
      console.error("Error al crear dispositivo:", error);
      res.status(400).json({ error: error.message || "Error creando dispositivo" });
    }
  },

  // Actualizar umbrales
  async updateDeviceThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const updateDto: PlantDeviceUpdateDto = req.body;

      const device = await deviceService.getDeviceByPlantId(plantId);
      if (!device) {
        res.status(404).json({ error: "Dispositivo no encontrado" });
        return;
      }

      const updatedDevice = await deviceService.updateThresholds(plantId, updateDto);
      res.json(updatedDevice);
    } catch (error: any) {
      console.error("Error al actualizar umbrales:", error);
      res.status(500).json({ error: error.message || "Error al actualizar umbrales" });
    }
  },

  // Enviar comando manual
  async triggerManualCommand(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const commandPayload: GenericCommandPayload = req.body;

      if (!commandPayload.command) {
        res.status(400).json({ error: "Comando requerido" });
        return;
      }

      const device = await deviceService.getDeviceByPlantId(plantId);
      if (!device) {
        res.status(404).json({ error: "Planta no encontrada" });
        return;
      }

      if (!device.isActive) {
        res.status(400).json({ error: "La planta está inactiva" });
        return;
      }

      actuatorService.sendCommand(plantId, commandPayload);
      
      console.log(`💧 Comando ${commandPayload.command} enviado a ${plantId}`);
      res.json({ message: "Comando enviado exitosamente" });
    } catch (error: any) {
      console.error("Error al disparar comando manual:", error);
      if (error.message.includes("MQTT")) {
        res.status(503).json({ error: "Error de conexión MQTT: " + error.message });
      } else {
        res.status(500).json({ error: "Error interno al procesar la solicitud" });
      }
    }
  },

  // Enviar notificación de prueba
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;

      const device = await deviceService.getDeviceByPlantId(plantId);
      if (!device) {
        res.status(404).json({ error: "Dispositivo no encontrado" });
        return;
      }

      // Crear alerta de prueba en MongoDB
      const collection = mongoDBService.getPlantAlertsCollection();
      const alert = {
        plantId: plantId,
        message: `Notificación de prueba para ${device.name}`,
        severity: "INFO",
        metricType: "TEST",
        metricValue: 0,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      await collection.insertOne(alert as any);

      // Enviar email de prueba
      const targetEmail = device.ownerEmail || process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "";
      
      if (targetEmail) {
        await emailService.enviarAlertaHtml(
          targetEmail,
          `[IoT] Notificación de Prueba - ${device.name}`,
          "Esta es una notificación de prueba del sistema de riego IoT. Si recibiste este email, las notificaciones están funcionando correctamente.",
          "INFO",
          plantId,
          {
            plantId,
            tempC: 25,
            ambientHumidity: 60,
            soilHumidity: 50,
            lightLux: 1000,
            pumpOn: false,
          } as any
        );
      }

      console.log(`🔔 Notificación de prueba enviada para ${plantId} a ${targetEmail}`);
      res.json({ 
        message: "Notificación de prueba enviada exitosamente",
        email: targetEmail,
        alert 
      });
    } catch (error: any) {
      console.error("Error enviando notificación de prueba:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  },

  // Eliminar dispositivo
  async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;

      const device = await deviceService.getDeviceByPlantId(plantId);
      if (!device) {
        res.status(404).json({ error: "Dispositivo no encontrado" });
        return;
      }

      const deleted = await deviceService.deleteDevice(plantId);
      
      if (deleted) {
        console.log(`🗑️  Dispositivo ${plantId} eliminado exitosamente`);
        res.json({ message: "Dispositivo eliminado exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo eliminar el dispositivo" });
      }
    } catch (error: any) {
      console.error("Error al eliminar dispositivo:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  },
};
