import { Router } from "express";
import { AnalyticsController } from "../controllers/analyticsController";

export const analyticsRoutes = Router();

// Obtener KPIs de una planta
analyticsRoutes.get("/:plantId/kpi", AnalyticsController.getPlantKPIs);

// Obtener historial de temperatura
analyticsRoutes.get("/:plantId/history/temperature", AnalyticsController.getTemperatureHistory);

// Obtener historial de humedad de suelo
analyticsRoutes.get("/:plantId/history/soil", AnalyticsController.getSoilHumidityHistory);

// Obtener historial de luz
analyticsRoutes.get("/:plantId/history/light", AnalyticsController.getLightHistory);

// Obtener historial de humedad ambiental
analyticsRoutes.get("/:plantId/history/humidity", AnalyticsController.getHumidityHistory);

// Obtener historial combinado
analyticsRoutes.get("/:plantId/history/combined", AnalyticsController.getHistoryCombined);

// Obtener clustering
analyticsRoutes.get("/:plantId/clustering", AnalyticsController.getClustering);
