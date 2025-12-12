import { Request, Response } from "express";
import { analyticsService } from "../services/analyticsService";

export const AnalyticsController = {
  // Obtener KPIs de una planta
  async getPlantKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const kpis = await analyticsService.getPlantKPIs(plantId);
      res.json(kpis);
    } catch (error) {
      console.error("Error al obtener KPIs:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial de temperatura
  async getTemperatureHistory(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "24h";
      const history = await analyticsService.getHistory(plantId, "tempC", range);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial de temperatura:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial de humedad de suelo
  async getSoilHumidityHistory(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "24h";
      const history = await analyticsService.getHistory(plantId, "soilHumidity", range);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial de humedad de suelo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial de luz
  async getLightHistory(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "24h";
      const history = await analyticsService.getHistory(plantId, "lightLux", range);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial de luz:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial de humedad ambiental
  async getHumidityHistory(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "24h";
      const history = await analyticsService.getHistory(plantId, "ambientHumidity", range);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial de humedad:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial combinado
  async getHistoryCombined(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "24h";
      const history = await analyticsService.getHistoryCombined(plantId, range);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial combinado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener clustering
  async getClustering(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const clustering = await analyticsService.getClustering(plantId);
      res.json(clustering);
    } catch (error) {
      console.error("Error al obtener clustering:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
