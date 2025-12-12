export interface KpiDto {
  currentTemp: number;
  currentSoil: number;
  currentLight: number;
  currentHumidity: number;
  healthIndex: number;
  dataQuality: number;
  lastUpdate: string;
  pumpOn: boolean;
}

export interface ChartPointDto {
  time: string;
  value: number;
}

export interface CombinedHistoryData {
  time: string;
  temp?: number;
  ambientHum?: number;
  soilHum?: number;
  light?: number;
}

export interface ClusteringPiePoint {
  name: string;
  value: number;
  fill: string;
}

export interface ClusterResultDto {
  period: string;
  clusters: Record<string, number>;
}
