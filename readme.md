# 🌱 Sistema de Riego Inteligente IoT

Sistema de riego automatizado para plantas utilizando ESP32, sensores de humedad y tecnología IoT.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🚀 Instalación y Ejecución por Primera Vez

### Paso 1: Clonar y preparar el proyecto

```bash
# Navegar al directorio del proyecto
cd iot-irrigation-system

# Instalar dependencias
npm install
```

### Paso 2: Configurar variables de entorno

El archivo `.env` ya debe estar creado con esta configuración:

```env
PORT=3000
NODE_ENV=development
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=my-super-secret-token
INFLUXDB_ORG=iot-org
INFLUXDB_BUCKET=irrigation-data
MQTT_URL=mqtt://localhost:1883
```

### Paso 3: Crear archivo de configuración MQTT

Asegúrate de que el archivo `mosquitto.conf` exista en la raíz del proyecto con este contenido:

```conf
listener 1883 0.0.0.0
allow_anonymous true
```

### Paso 4: Compilar el proyecto

```bash
npm run build
```

### Paso 5: Iniciar servicios con Docker

```bash
# Levantar InfluxDB y Mosquitto MQTT
npm run docker:up

# Verificar que los servicios estén corriendo
docker-compose ps
```

Deberías ver:
```
NAME           IMAGE                   STATUS              PORTS
iot_influxdb   influxdb:2.7            Up X seconds        0.0.0.0:8086->8086/tcp
iot_mqtt       eclipse-mosquitto:2.0   Up X seconds        0.0.0.0:1883->1883/tcp
```

### Paso 6: Inicializar InfluxDB (Primera vez)

1. Abre tu navegador y ve a: http://localhost:8086
2. Configuración inicial:
   - **Usuario:** `admin`
   - **Contraseña:** `password123`
   - **Organization:** `iot-org`
   - **Bucket:** `irrigation-data`
   - **Token:** `my-super-secret-token`

### Paso 7: Ejecutar el backend

```bash
# Ejecutar en modo desarrollo
npm run dev
```

Deberías ver en consola:
```
🚀 Servidor ejecutándose en http://localhost:3000
📚 Documentación disponible en http://localhost:3000/api-docs
✅ Conectado al broker MQTT
```

## ✅ Verificación

Una vez ejecutado todo, verifica que esté funcionando:

### 1. **Health Check**
- http://localhost:3000/health

### 2. **Documentación API**
- http://localhost:3000/api-docs

### 3. **InfluxDB UI**
- http://localhost:8086

### 4. **MQTT Broker**
- Escuchando en: `mqtt://localhost:1883`

## 📁 Estructura del Proyecto

```
iot-irrigation-system/
├── src/                 # Código fuente TypeScript
├── dist/               # Código compilado (se genera con build)
├── docker-compose.yml  # Configuración de servicios Docker
├── mosquitto.conf      # Configuración del broker MQTT
├── .env               # Variables de entorno
└── package.json       # Dependencias y scripts
```

## 🛠 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Compilar TypeScript
npm start           # Ejecutar versión compilada
```

### Docker
```bash
npm run docker:up    # Levantar servicios
npm run docker:down  # Detener servicios
docker-compose logs  # Ver logs de los servicios
```

### Limpieza
```bash
npm run clean        # Eliminar carpeta dist
```

## 🔌 Endpoints Principales

- `POST /api/sensors/data` - Recibir datos de sensores
- `GET /api/sensors/:deviceId` - Obtener datos históricos
- `GET /api/notifications/rules` - Obtener reglas de notificación
- `GET /health` - Estado del sistema

## 🌐 Flujo de Datos

```
ESP32 → MQTT (1883) → Backend Node.js → InfluxDB → Frontend
```

## 🐛 Solución de Problemas

### Error de conexión MQTT
```bash
# Verificar que Mosquitto esté corriendo
docker-compose logs mqtt-broker

# Probar conexión MQTT manualmente
mosquitto_sub -h localhost -t "test"
```

### Error de base de datos
```bash
# Verificar que InfluxDB esté corriendo
docker-compose logs influxdb

# Acceder a http://localhost:8086 para verificar la configuración
```

### Puerto en uso
```bash
# Verificar procesos en puertos
netstat -ano | findstr :3000
netstat -ano | findstr :1883
netstat -ano | findstr :8086
```

## 📞 Soporte

Si encuentras problemas:

1. Verifica que todos los prerrequisitos estén instalados
2. Revisa que los puertos 3000, 1883 y 8086 estén libres
3. Ejecuta `docker-compose logs` para ver errores específicos
4. Asegúrate de que el archivo `mosquitto.conf` esté en la raíz del proyecto

---
