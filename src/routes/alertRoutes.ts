import { Router } from "express";
import { AlertController } from "../controllers/alertController";

export const alertRoutes = Router();

// Obtener alertas de una planta
alertRoutes.get("/:plantId", AlertController.getAlertsByPlant);

// Obtener alertas no leídas
alertRoutes.get("/:plantId/unread", AlertController.getUnreadAlerts);

// Marcar alerta como leída
alertRoutes.put("/:alertId/read", AlertController.markAlertAsRead);
