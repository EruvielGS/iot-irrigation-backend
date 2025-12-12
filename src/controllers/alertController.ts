import { Request, Response } from "express";
import { mongoDBService } from "../config/mongodb";

export const AlertController = {
  // Obtener alertas de una planta
  async getAlertsByPlant(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const collection = mongoDBService.getPlantAlertsCollection();
      const alerts = await collection
        .find({ plantId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      res.json(alerts);
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Marcar alerta como leída
  async markAlertAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const collection = mongoDBService.getPlantAlertsCollection();

      await collection.updateOne({ _id: alertId as any }, { $set: { isRead: true } });

      res.json({ message: "Alerta marcada como leída" });
    } catch (error) {
      console.error("Error al marcar alerta como leída:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener alertas no leídas
  async getUnreadAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const collection = mongoDBService.getPlantAlertsCollection();

      const alerts = await collection
        .find({ plantId, isRead: false })
        .sort({ timestamp: -1 })
        .toArray();

      res.json(alerts);
    } catch (error) {
      console.error("Error al obtener alertas no leídas:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
