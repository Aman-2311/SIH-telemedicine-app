import Dexie, { Table } from "dexie";
import { IntakePayload, PrescriptionResponse, Facility } from "../utils/api";

export interface OfflineIntake {
  localId?: number;
  payload: IntakePayload;
  status: "queued" | "syncing" | "synced" | "sync_failed";
  retries: number;
  last_error?: string;
  created_at: string;
}

export interface CachedPrescription {
  id?: number;
  case_id: string;
  prescription: PrescriptionResponse;
  synced_at: string;
}

export interface CachedFacility {
  id?: number;
  lat: number;
  lon: number;
  facilities: Facility[];
  cached_at: string;
}

export class SaharaDatabase extends Dexie {
  intakes!: Table<OfflineIntake, number>;
  cachedPrescriptions!: Table<CachedPrescription, number>;
  cachedFacilities!: Table<CachedFacility, number>;

  constructor() {
    super("SaharaDatabase");
    this.version(2).stores({
      intakes: "++localId, status, created_at, [status+created_at]",
      cachedPrescriptions: "++id, case_id, synced_at",
      cachedFacilities: "++id, [lat+lon], cached_at",
    });
  }
}

export const db = new SaharaDatabase();
