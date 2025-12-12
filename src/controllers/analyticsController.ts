import { Request, Response } from "express";
import { analyticsService } from "../services/analyticsService";
import { telemetryService } from "../services/telemetryService";

export const AnalyticsController = {
  // Obtener KPIs de una planta
  async getPlantKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      console.log(`📊 Consultando KPIs para ${plantId}...`);
      const kpis = await analyticsService.getPlantKPIs(plantId);
      console.log(`✅ KPIs obtenidos para ${plantId}:`, kpis);
      res.json(kpis);
    } catch (error) {
      console.error("❌ Error al obtener KPIs:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener datos en tiempo real (última lectura)
  async getRealtimeData(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      console.log(`⚡ Obteniendo datos en tiempo real para ${plantId}...`);
      const reading = telemetryService.getLatestReading(plantId);
      
      if (!reading) {
        res.json({
          temp: 0,
          soilHum: 0,
          ambientHum: 0,
          light: 0,
          pumpOn: false,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        temp: reading.tempC ?? 0,
        soilHum: reading.soilHumidity ?? 0,
        ambientHum: reading.ambientHumidity ?? 0,
        light: reading.lightLux ?? 0,
        pumpOn: reading.pumpOn ?? false,
        timestamp: reading.timestamp?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error al obtener datos en tiempo real:", error);
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
      const range = (req.query.range as string) || "72h";
      const window = req.query.window as string | undefined;
      console.log(`📊 GET /analytics/${plantId}/history/combined - Range: ${range}, Window: ${window || 'auto'}`);
      const history = await analyticsService.getHistoryCombined(plantId, range, window);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial combinado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener historial RAW sin agregación (todos los puntos)
  async getHistoryRaw(req: Request, res: Response): Promise<void> {
    try {
      const { plantId } = req.params;
      const range = (req.query.range as string) || "1h";
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await analyticsService.getHistoryRaw(plantId, range, limit);
      res.json(history);
    } catch (error) {
      console.error("Error al obtener historial raw:", error);
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
