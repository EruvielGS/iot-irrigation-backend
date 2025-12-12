# 🌱 Sistema de Riego Inteligente IoT

Sistema de riego automatizado para plantas utilizando ESP32, sensores de humedad y tecnología IoT.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
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

Copia el archivo `.env.example` a `.env` y ajusta las configuraciones:

```bash
cp .env.example .env
```

Asegúrate de que tu `.env` contenga:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/iot-irrigation

# InfluxDB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=my-super-secret-token
INFLUXDB_ORG=iot-org
INFLUXDB_BUCKET=irrigation-data

# MQTT
MQTT_URL=mqtt://localhost:1883

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Umbrales por defecto
DEFAULT_MIN_SOIL_HUMIDITY=35
DEFAULT_MAX_SOIL_HUMIDITY=100
DEFAULT_MIN_TEMP=-10
DEFAULT_MAX_TEMP=38
DEFAULT_MIN_HUMIDITY=30
DEFAULT_MAX_HUMIDITY=100
DEFAULT_MIN_LIGHT=200
DEFAULT_MAX_LIGHT=50000
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
# Levantar MongoDB, InfluxDB y Mosquitto MQTT
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps
```

Deberías ver:
```
NAME            IMAGE                   STATUS              PORTS
iot-mongodb     mongo:latest            Up X seconds        0.0.0.0:27017->27017/tcp
iot-influxdb    influxdb:2.7            Up X seconds        0.0.0.0:8086->8086/tcp
iot-mosquitto   eclipse-mosquitto:latest Up X seconds       0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
```

### Paso 6: Verificar InfluxDB (Auto-configurado)

1. Abre tu navegador y ve a: http://localhost:8086
2. Inicia sesión con las credenciales:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123456`
3. La configuración inicial ya está completa:
   - **Organization:** `iot-org`
   - **Bucket:** `irrigation-data`
   - **Token:** `my-super-secret-token` (ya configurado en `.env`)

### Paso 7: Ejecutar el backend

```bash
# Ejecutar en modo desarrollo
npm run dev
```

Deberías ver en consola:
```
[nodemailer] Configuración SMTP cargada
✅ Conectado a MongoDB
✅ Todos los servicios inicializados correctamente
Servidor escuchando en puerto 3000
✅ Conectado al broker MQTT en mqtt://localhost:1883
```

## ✅ Verificación

Una vez ejecutado todo, verifica que esté funcionando:

### 1. **Backend API**
- Health Check: `GET http://localhost:3000/health`
- Debería responder: `{"status":"ok"}`

### 2. **MongoDB**
- Verificar conexión: `docker exec -it iot-mongodb mongosh`
- Listar bases de datos: `show dbs`

### 3. **InfluxDB UI**
- Panel web: http://localhost:8086
- Usuario: `admin` / Contraseña: `admin123456`

### 4. **MQTT Broker**
- Escuchando en: `mqtt://localhost:1883`
- Puerto WebSocket: `9001`

## 📁 Estructura del Proyecto

```
iot-irrigation-system/
├── src/                      # Código fuente TypeScript
│   ├── app.ts               # Punto de entrada principal
│   ├── config/              # Configuración (MongoDB, InfluxDB)
│   ├── controllers/         # Controladores de rutas
│   ├── models/              # Modelos de datos
│   ├── routes/              # Definición de rutas API
│   ├── services/            # Lógica de negocio
│   ├── types/               # Tipos TypeScript
│   └── utils/               # Utilidades
├── dist/                    # Código compilado (generado con build)
├── docker-compose.yml       # Configuración de servicios Docker
├── Dockerfile               # Imagen Docker del backend
├── mosquitto.conf           # Configuración del broker MQTT
├── .env                     # Variables de entorno (local)
├── .env.example             # Plantilla de variables
├── tsconfig.json            # Configuración TypeScript
└── package.json             # Dependencias y scripts
```

## 🛠 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Ejecutar en modo desarrollo con nodemon
npm run build        # Compilar TypeScript a JavaScript
npm start           # Ejecutar versión compilada
```

### Docker
```bash
# Servicios de infraestructura (recomendado para desarrollo)
docker-compose up -d mongodb influxdb mosquitto

# Todos los servicios incluyendo backend
docker-compose up -d

# Ver logs
docker-compose logs -f          # Todos los servicios
docker-compose logs -f mongodb   # Solo MongoDB

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (BORRA DATOS)
docker-compose down -v
```

### Limpieza
```bash
npm run clean        # Eliminar carpeta dist
```

## 🔌 Endpoints Principales

### Dispositivos
- `GET /api/devices` - Listar todos los dispositivos
- `POST /api/devices` - Crear nuevo dispositivo
- `GET /api/devices/:plantId` - Obtener detalles de dispositivo
- `PUT /api/devices/:plantId/thresholds` - Actualizar umbrales
- `POST /api/devices/:plantId/command` - Enviar comando (RIEGO/LUZ/STOP)

### Analítica
- `GET /api/analytics/:plantId/kpi` - Obtener KPIs actuales
- `GET /api/analytics/:plantId/history/combined` - Historial combinado
- `GET /api/analytics/:plantId/clustering` - Clustering de datos

### Alertas
- `GET /api/alerts/:plantId` - Obtener alertas de una planta
- `GET /api/alerts/:plantId/unread` - Alertas no leídas
- `PUT /api/alerts/:alertId/read` - Marcar alerta como leída

## 🌐 Flujo de Datos

```
ESP32 → MQTT (planta/{id}/data) → Backend Node.js
                                    ├─ Quality Control
                                    ├─ Advisor Logic
                                    ├─ MongoDB (alertas/config)
                                    ├─ InfluxDB (telemetría)
                                    └─ WebSocket + Email → Frontend
```

## 🐛 Solución de Problemas

### Error de conexión MongoDB
```bash
# Verificar que MongoDB esté corriendo
docker-compose logs mongodb

# Probar conexión
docker exec -it iot-mongodb mongosh
```

### Error de conexión MQTT
```bash
# Verificar que Mosquitto esté corriendo
docker-compose logs mosquitto

# Probar conexión MQTT manualmente (si tienes mosquitto_sub)
mosquitto_sub -h localhost -t "planta/+/data"
```

### Error de base de datos InfluxDB
```bash
# Verificar que InfluxDB esté corriendo
docker-compose logs influxdb

# Acceder a http://localhost:8086 para verificar la configuración
```

### Puerto en uso
```bash
# Verificar procesos en puertos (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :1883
netstat -ano | findstr :8086
netstat -ano | findstr :27017

# Matar proceso Node.js en puerto 3000
Get-Process -Name node | Stop-Process -Force
```

### Reiniciar todos los servicios
```bash
# Detener todos los contenedores
docker-compose down

# Eliminar volúmenes (CUIDADO: borra todos los datos)
docker-compose down -v

# Levantar de nuevo
docker-compose up -d
```

## 📞 Soporte

Si encuentras problemas:

1. Verifica que todos los prerrequisitos estén instalados
2. Revisa que los puertos 3000, 1883 y 8086 estén libres
3. Ejecuta `docker-compose logs` para ver errores específicos
4. Asegúrate de que el archivo `mosquitto.conf` esté en la raíz del proyecto

---
