import { InfluxDB } from "@influxdata/influxdb-client";

const influxConfig = {
  url: process.env.INFLUXDB_URL || "http://localhost:8086",
  token: process.env.INFLUXDB_TOKEN || "my-token",
  org: process.env.INFLUXDB_ORG || "my-org",
  bucket: process.env.INFLUXDB_BUCKET || "irrigation-data",
};

export const influxDB = new InfluxDB({
  url: influxConfig.url,
  token: influxConfig.token,
});

export const queryApi = influxDB.getQueryApi(influxConfig.org);
export const writeApi = influxDB.getWriteApi(
  influxConfig.org,
  influxConfig.bucket,
  "ns"
);

export default influxConfig;
