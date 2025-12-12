import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import WebSocket from "ws";
import { createServer } from "http";

// Configuración de environment
dotenv.config();

// Importaciones de configuraciones y servicios
import { setupSwagger } from "./utils/swagger";
import { requestLogger, errorLogger } from "./middleware/logger";
import { mongoDBService } from "./config/mongodb";
import { MQTTService } from "./services/mqttService";
import { webSocketService } from "./services/webSocketService";
import { telemetryService } from "./services/telemetryService";

// Importación de rutas
import { deviceRoutes } from "./routes/deviceRoutes";
import { analyticsRoutes } from "./routes/analyticsRoutes";
import { alertRoutes } from "./routes/alertRoutes";
import { notificationRoutes } from "./routes/notificationRoutes";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// WebSocket Server
const wss = new WebSocket.Server({ server });
webSocketService.setWebSocketServer(wss);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));
app.use(requestLogger);

// Configuración de Swagger
setupSwagger(app);

// Rutas
app.use("/api/devices", deviceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/notifications", notificationRoutes);

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "IoT Irrigation System API",
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido al Sistema de Riego Inteligente IoT",
    version: "2.0.0",
    endpoints: {
      documentation: "/api-docs",
      health: "/health",
      devices: "/api/devices",
      analytics: "/api/analytics",
      alerts: "/api/alerts",
      notifications: "/api/notifications",
    },
  });
});

// Middleware de manejo de errores
app.use(errorLogger);

// Inicialización de servicios
async function initializeServices() {
  try {
    // Conectar MongoDB
    await mongoDBService.connect();

    // Conectar MQTT
    const mqttService = new MQTTService();
    mqttService.connect();

    console.log("✅ Todos los servicios inicializados correctamente");
  } catch (error) {
    console.error("❌ Error inicializando servicios:", error);
    process.exit(1);
  }
}

// Manejo de graceful shutdown
async function gracefulShutdown() {
  console.log("🛑 Iniciando apagado graceful...");
  
  try {
    await telemetryService.close();
    await mongoDBService.disconnect();
    
    server.close(() => {
      console.log("✅ Servidor cerrado");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error durante el apagado:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Iniciar servidor
initializeServices().then(() => {
  server.listen(port, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
    console.log(`📚 Documentación disponible en http://localhost:${port}/api-docs`);
    console.log(`🔌 WebSocket disponible en ws://localhost:${port}`);
  });
});

export default app;
