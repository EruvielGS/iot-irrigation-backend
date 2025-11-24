import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import WebSocket from "ws";
import { createServer } from "http";

// Configuración de environment
dotenv.config();

// Importaciones de rutas y configuraciones
import { setupSwagger } from "./utils/swagger";
import { requestLogger, errorLogger } from "./middleware/logger";
import { MQTTService } from "./services/mqttService";
import { NotificationService } from "./services/notificationService";

// Importación de rutas
import { sensorRoutes } from "./routes/sensorRoutes";
import { notificationRoutes } from "./routes/notificationRoutes";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Nuevo cliente WebSocket conectado");
  NotificationService.addWebSocketClient(ws);

  ws.on("close", () => {
    console.log("🔒 Cliente WebSocket desconectado");
  });
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));
app.use(requestLogger);

// Configuración de Swagger
setupSwagger(app);

// Rutas
app.use("/api/sensors", sensorRoutes);
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
    version: "1.0.0",
    endpoints: {
      documentation: "/api-docs",
      health: "/health",
      sensors: "/api/sensors",
      notifications: "/api/notifications",
    },
  });
});

// Middleware de manejo de errores
app.use(errorLogger);

// Inicialización de servicios
const mqttService = new MQTTService();
mqttService.connect();

// Manejo de graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Recibido SIGTERM, cerrando servidor...");
  mqttService.disconnect();
  server.close(() => {
    console.log("✅ Servidor cerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Recibido SIGINT, cerrando servidor...");
  mqttService.disconnect();
  server.close(() => {
    console.log("✅ Servidor cerrado");
    process.exit(0);
  });
});

// Iniciar servidor
server.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(
    `📚 Documentación disponible en http://localhost:${port}/api-docs`
  );
  console.log(
    `📚 Documentación disponible en http://localhost:${port}/api-docs.json`
  );
});

export default app;
