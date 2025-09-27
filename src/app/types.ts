export interface FuelRecord {
  id: string;
  odometer: number;
  fuelVolume: number;
  fuelPrice: number;
  entryDate: string; // ISO string
}

export interface MaintenanceRecord {
  id: string;
  targetOdometer: number;
  description: string;
  createdAt: string; // ISO string
}

export interface AppConfiguration {
  currencyCode: string;
}
