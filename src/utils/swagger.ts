import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IoT Irrigation System API",
      version: "1.0.0",
      description: "API para el sistema de riego inteligente con ESP32",
      contact: {
        name: "Equipo IoT",
        email: "equipo@iot-irrigation.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo",
      },
    ],
    components: {
      schemas: {
        SensorData: {
          type: "object",
          required: ["deviceId", "humidity"],
          properties: {
            deviceId: {
              type: "string",
              description: "ID único del dispositivo ESP32",
              example: "esp32-001",
            },
            humidity: {
              type: "number",
              description: "Nivel de humedad del suelo (0-100)",
              example: 45.5,
              minimum: 0,
              maximum: 100,
            },
            temperature: {
              type: "number",
              description: "Temperatura ambiente en Celsius",
              example: 25.5,
            },
            batteryLevel: {
              type: "number",
              description: "Nivel de batería del sensor (0-100)",
              example: 85,
              minimum: 0,
              maximum: 100,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp de la lectura",
            },
          },
        },
        QualityCheckResult: {
          type: "object",
          properties: {
            isValid: {
              type: "boolean",
              description:
                "Indica si los datos pasaron las validaciones de calidad",
            },
            errors: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Lista de errores encontrados",
            },
            score: {
              type: "number",
              description: "Puntaje de calidad (0-100)",
            },
          },
        },
        NotificationRule: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID único de la regla",
            },
            condition: {
              type: "string",
              enum: [
                "humidity_low",
                "humidity_high",
                "device_offline",
                "battery_low",
              ],
              description: "Tipo de condición que activa la notificación",
            },
            threshold: {
              type: "number",
              description: "Umbral para activar la notificación",
            },
            message: {
              type: "string",
              description: "Mensaje de la notificación",
            },
            enabled: {
              type: "boolean",
              description: "Indica si la regla está activa",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/*.ts", // Para desarrollo con ts-node
    "./dist/routes/*.js", // Para producción
    "./src/controllers/*.ts", // Alternativa
    "./src/**/*.ts", // Busca en todos los archivos TypeScript
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};
