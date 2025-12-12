import { MongoClient, Db, Collection } from "mongodb";
import { PlantDevice } from "../types/plantDevice";
import { PlantAlert } from "../types/plantAlert";

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private plantDevicesCollection: Collection<PlantDevice> | null = null;
  private plantAlertsCollection: Collection<PlantAlert> | null = null;

  async connect(): Promise<void> {
    try {
      const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/iot-irrigation";
      this.client = new MongoClient(uri);
      await this.client.connect();
      
      this.db = this.client.db();
      this.plantDevicesCollection = this.db.collection<PlantDevice>("plant_devices");
      this.plantAlertsCollection = this.db.collection<PlantAlert>("plant_alerts");

      // Crear índices
      await this.plantDevicesCollection.createIndex({ plantId: 1 }, { unique: true });
      await this.plantDevicesCollection.createIndex({ macAddress: 1 }, { unique: true, sparse: true });
      await this.plantAlertsCollection.createIndex({ plantId: 1, timestamp: -1 });

      console.log("✅ Conectado a MongoDB");
    } catch (error) {
      console.error("❌ Error conectando a MongoDB:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("🔒 Desconectado de MongoDB");
    }
  }

  getPlantDevicesCollection(): Collection<PlantDevice> {
    if (!this.plantDevicesCollection) {
      throw new Error("MongoDB no está conectado");
    }
    return this.plantDevicesCollection;
  }

  getPlantAlertsCollection(): Collection<PlantAlert> {
    if (!this.plantAlertsCollection) {
      throw new Error("MongoDB no está conectado");
    }
    return this.plantAlertsCollection;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("MongoDB no está conectado");
    }
    return this.db;
  }
}

export const mongoDBService = new MongoDBService();
