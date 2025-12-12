# Configuración HiveMQ Cloud

## 🌐 Información de Conexión

Este proyecto está configurado para usar **HiveMQ Cloud** como broker MQTT en lugar de un broker local.

### Configuración Actual

```env
MQTT_URL=ssl://4af2e02d30094389b2d8963af54158dd.s1.eu.hivemq.cloud:8883
MQTT_USER=backend_user
MQTT_PASSWORD=@Perico123
MQTT_CLIENT_ID=SpringCloud_01
```

## ✨ Características Implementadas

### 1. **Conexión SSL/TLS**
- Conexión segura usando el puerto 8883
- Verificación de certificados SSL habilitada
- Conexión cifrada end-to-end

### 2. **Autenticación**
- Usuario: `backend_user`
- Contraseña cifrada
- Client ID único: `SpringCloud_01`

### 3. **Manejo de Reconexión**
- Reconexión automática cada 5 segundos
- Máximo de 10 intentos de reconexión
- Logging detallado de intentos

### 4. **Quality of Service (QoS)**
- QoS 1 para todos los mensajes (al menos una vez)
- Garantiza la entrega de mensajes críticos

## 📡 Tópicos MQTT

### Suscripciones del Backend
- `planta/+/data` - Datos de sensores de todas las plantas
- `planta/+/status` - Estado de todas las plantas

### Publicaciones del Backend
- `planta/{plantId}/command` - Comandos para dispositivos específicos

## 🔧 Configuración del Cliente

El servicio MQTT incluye:

```typescript
- clientId: Identificador único del cliente
- clean: true (sesión limpia en cada conexión)
- connectTimeout: 4000ms
- reconnectPeriod: 5000ms
- keepalive: 60s
- rejectUnauthorized: true (verificar SSL)
```

## 🚀 Uso

### Iniciar el Sistema

```bash
npm run dev
```

### Logs Esperados

```
🔌 Conectando a HiveMQ Cloud: ssl://...s1.eu.hivemq.cloud:8883
👤 Usuario: backend_user
🆔 Client ID: SpringCloud_01
✅ Conectado exitosamente al broker HiveMQ Cloud
📡 Suscrito a: planta/+/data
📡 Suscrito a: planta/+/status
```

## 🧪 Pruebas

### Publicar Mensaje de Prueba (desde dispositivo ESP32)

```cpp
// Ejemplo de payload JSON
{
  "tempC": 25.5,
  "ambientHumidity": 60,
  "soilHumidity": 45,
  "lightLux": 1000,
  "pumpOn": false,
  "timestamp": "2025-12-12T10:30:00Z",
  "msgType": "READING"
}
```

Publicar en: `planta/planta_001/data`

## 🔐 Seguridad

### Recomendaciones
1. **No compartir credenciales** en repositorios públicos
2. Usar **variables de entorno** (.env nunca debe estar en Git)
3. Rotar contraseñas periódicamente
4. Usar **Client IDs únicos** para cada dispositivo

### Configurar .gitignore

```gitignore
.env
.env.local
.env.*.local
```

## 🛠️ Troubleshooting

### Error: "Not authorized"
- Verifica `MQTT_USER` y `MQTT_PASSWORD` en .env
- Asegúrate de que las credenciales sean correctas en HiveMQ Cloud

### Error: "Connection refused"
- Verifica que la URL sea correcta (puerto 8883 para SSL)
- Confirma que el cluster de HiveMQ Cloud esté activo

### Error: "ECONNREFUSED"
- Verifica tu conexión a Internet
- Confirma que no haya firewall bloqueando el puerto 8883

### Desconexiones frecuentes
- Revisa el `keepalive` (default: 60s)
- Verifica la estabilidad de tu conexión
- Aumenta `reconnectPeriod` si es necesario

## 📊 Monitoreo

### Métodos Útiles del Servicio MQTT

```typescript
// Verificar si está conectado
mqttService.isConnected(): boolean

// Obtener cliente
mqttService.getClient(): MqttClient | null

// Publicar mensaje
mqttService.publish(topic, message)

// Desconectar
mqttService.disconnect()
```

## 🌟 Ventajas de HiveMQ Cloud

1. **Alta disponibilidad** - 99.99% uptime SLA
2. **Escalabilidad** - Maneja miles de conexiones simultáneas
3. **Seguridad** - TLS/SSL por defecto
4. **Sin mantenimiento** - Servicio completamente administrado
5. **Dashboard web** - Monitoreo en tiempo real
6. **Multi-región** - Baja latencia global

## 📱 Cliente ESP32

Para conectar dispositivos ESP32 a HiveMQ Cloud:

```cpp
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

WiFiClientSecure espClient;
PubSubClient client(espClient);

const char* mqtt_server = "4af2e02d30094389b2d8963af54158dd.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "device_user";
const char* mqtt_password = "tu_password";

void setup() {
  espClient.setInsecure(); // Para pruebas - usa certificados en producción
  client.setServer(mqtt_server, mqtt_port);
}
```

---

**Última actualización:** 12 de diciembre de 2025
**Versión del sistema:** 2.0.0
