import { Router } from "express";
import { SensorController } from "../controllers/sensorController";

const router = Router();

/**
 * @swagger
 * /api/sensors/data:
 *   post:
 *     summary: Recibe datos de sensores desde dispositivos ESP32
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorData'
 *     responses:
 *       201:
 *         description: Datos recibidos y procesados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SensorData'
 *                 quality:
 *                   $ref: '#/components/schemas/QualityCheckResult'
 */
router.post("/data", SensorController.receiveData);

/**
 * @swagger
 * /api/sensors/{deviceId}:
 *   get:
 *     summary: Obtiene datos históricos de un dispositivo específico
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dispositivo ESP32
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Número de horas de datos a recuperar
 *     responses:
 *       200:
 *         description: Datos históricos del dispositivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorData'
 *                 count:
 *                   type: integer
 */
router.get("/:deviceId", SensorController.getDeviceData);

/**
 * @swagger
 * /api/sensors/{deviceId}/quality-report:
 *   get:
 *     summary: Genera un reporte de calidad de datos para un dispositivo
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dispositivo ESP32
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Número de días para el reporte
 *     responses:
 *       200:
 *         description: Reporte de calidad de datos
 */
router.get("/:deviceId/quality-report", SensorController.getQualityReport);

export const sensorRoutes = router;
