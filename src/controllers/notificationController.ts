import { Request, Response } from "express";
import { NotificationService } from "../services/notificationService";

export const NotificationController = {
  getRules(req: Request, res: Response): void {
    const rules = NotificationService.getRules();
    res.json({
      success: true,
      rules: rules,
    });
  },

  updateRule(req: Request, res: Response): void {
    const { ruleId } = req.params;
    const updates = req.body;

    const success = NotificationService.updateRule(ruleId, updates);

    if (success) {
      res.json({
        success: true,
        message: "Rule updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Rule not found",
      });
    }
  },
};
