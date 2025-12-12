export interface PlantAlert {
  id?: string;
  plantId: string;
  severity: "CRITICA" | "ALERTA" | "RECOMENDACION" | "INFO";
  message: string;
  metric: string;
  value: number;
  timestamp?: Date;
  isRead: boolean;
}
