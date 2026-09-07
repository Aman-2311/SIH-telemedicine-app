import { create } from "zustand";
import { api, Facility } from "../utils/api";

type Prescription = { diagnosis: string; medicines: Array<{ name: string; dosage: string; frequency?: string; duration?: string; instructions?: string }>; doctor_name?: string; updated_at?: string } | null;

type PatientState = {
  prescription: Prescription;
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  fetchPrescription: () => Promise<void>;
  fetchFacilities: (lat: number, lon: number) => Promise<void>;
};

export const usePatientStore = create<PatientState>((set) => ({
  prescription: null,
  facilities: [],
  loading: false,
  error: null,
  fetchPrescription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Prescription>("/api/patient/me/prescription");
      set({ prescription: response.data, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Unable to load prescription" });
    }
  },
  fetchFacilities: async (lat, lon) => {
    try {
      const response = await api.get<Facility[]>(`/api/facilities/nearby?lat=${lat}&lon=${lon}`);
      set({ facilities: Array.isArray(response.data) ? response.data : [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load nearby facilities" });
    }
  },
}));
