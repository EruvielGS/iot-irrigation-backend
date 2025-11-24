import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";

const router = Router();

/**
 * @swagger
 * /api/notifications/rules:
 *   get:
 *     summary: Obtiene todas las reglas de notificación
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Lista de reglas de notificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationRule'
 */
router.get("/rules", NotificationController.getRules);

/**
 * @swagger
 * /api/notifications/rules/{ruleId}:
 *   patch:
 *     summary: Actualiza una regla de notificación
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la regla a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               threshold:
 *                 type: number
 *               message:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Regla actualizada exitosamente
 *       404:
 *         description: Regla no encontrada
 */
router.patch("/rules/:ruleId", NotificationController.updateRule);

export const notificationRoutes = router;
