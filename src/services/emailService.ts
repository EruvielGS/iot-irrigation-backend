import nodemailer from "nodemailer";
import { Reading } from "../types/reading";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviarAlertaHtml(
    to: string,
    subject: string,
    mensaje: string,
    severidad: string,
    plantId: string,
    reading: Reading
  ): Promise<void> {
    try {
      const colorClass = severidad === "CRITICA" ? "#dc2626" : "#ea580c";

      const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${colorClass}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-box { background: #fef2f2; border-left: 4px solid ${colorClass}; padding: 15px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌱 Sistema de Riego IoT</h1>
        </div>
        <div class="content">
            <div class="alert-box">
                <h2 style="margin-top: 0; color: ${colorClass};">⚠️ ${severidad}</h2>
                <p>${mensaje}</p>
            </div>
            <h3>Detalles de la Planta</h3>
            <p><strong>ID de Planta:</strong> ${plantId}</p>
            
            <h3>Lecturas Actuales</h3>
            <table>
                <tr>
                    <th>Métrica</th>
                    <th>Valor</th>
                </tr>
                ${reading.tempC ? `<tr><td>🌡️ Temperatura</td><td>${reading.tempC.toFixed(1)}°C</td></tr>` : ""}
                ${reading.ambientHumidity ? `<tr><td>💧 Humedad Ambiental</td><td>${reading.ambientHumidity}%</td></tr>` : ""}
                ${reading.soilHumidity ? `<tr><td>🌱 Humedad de Suelo</td><td>${reading.soilHumidity}%</td></tr>` : ""}
                ${reading.lightLux ? `<tr><td>☀️ Luz</td><td>${reading.lightLux} lux</td></tr>` : ""}
                ${reading.pumpOn !== undefined ? `<tr><td>💦 Bomba</td><td>${reading.pumpOn ? "ENCENDIDA" : "APAGADA"}</td></tr>` : ""}
            </table>
            
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <div class="footer">
            Sistema de Riego Inteligente IoT - Monitoreo Automático
        </div>
    </div>
</body>
</html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
      });

      console.log(`📧 Email enviado a ${to}`);
    } catch (error) {
      console.error("❌ Error enviando email:", error);
    }
  }
}

export const emailService = new EmailService();
