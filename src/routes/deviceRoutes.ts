import { Router } from "express";
import { PlantDeviceController } from "../controllers/plantDeviceController";

export const deviceRoutes = Router();

// Listar todos los dispositivos
deviceRoutes.get("/", PlantDeviceController.listAllDevices);

// Crear nuevo dispositivo
deviceRoutes.post("/", PlantDeviceController.createDevice);

// Obtener detalle de un dispositivo
deviceRoutes.get("/:plantId", PlantDeviceController.getDeviceDetails);

// Actualizar umbrales
deviceRoutes.put("/:plantId/thresholds", PlantDeviceController.updateDeviceThresholds);

// Enviar comando manual
deviceRoutes.post("/:plantId/command", PlantDeviceController.triggerManualCommand);

// Enviar notificación de prueba
deviceRoutes.post("/:plantId/test-notification", PlantDeviceController.sendTestNotification);

// Eliminar dispositivo
deviceRoutes.delete("/:plantId", PlantDeviceController.deleteDevice);
