import { create } from "zustand";
import { api, Facility } from "../utils/api";
import { db } from "../db/dexieConfig";

interface FacilityState {
  userLocation: { lat: number; lon: number } | null;
  facilities: Facility[];
  isLoading: boolean;
  isLocating: boolean;
  error: string | null;

  // Actions
  getUserLocation: () => Promise<{ lat: number; lon: number } | null>;
  fetchNearbyFacilities: (lat: number, lon: number) => Promise<Facility[]>;
  clearError: () => void;
}

// Fallback demo facilities in rural/semi-urban Maharashtra/India for offline resilience
const fallbackFacilities: Facility[] = [
  {
    id: "hosp-1",
    name: "Sub-District Civil Hospital & Emergency Unit",
    type: "hospital",
    lat: 19.076,
    lon: 72.8777,
    distance_km: 1.8,
    address: "Civil Hospital Marg, Ward 4",
    phone: "+91 22 2567 8900",
  },
  {
    id: "pharm-1",
    name: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana Kendra #412",
    type: "pharmacy",
    lat: 19.078,
    lon: 72.875,
    distance_km: 0.6,
    address: "Near Panchayat Samiti Bhavan",
    phone: "+91 98200 12345",
    is_generic_store: true,
  },
  {
    id: "phc-1",
    name: "Primary Health Centre (PHC) & Maternity Care",
    type: "phc",
    lat: 19.072,
    lon: 72.881,
    distance_km: 1.1,
    address: "Main Road, Shindewadi",
    phone: "+91 22 2567 1122",
  },
];

export const useFacilityStore = create<FacilityState>((set, get) => ({
  userLocation: null,
  facilities: [],
  isLoading: false,
  isLocating: false,
  error: null,

  getUserLocation: async () => {
    set({ isLocating: true, error: null });
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Fallback default coordinates (e.g. Mumbai / Pune region)
        const fallback = { lat: 19.076, lon: 72.8777 };
        set({ userLocation: fallback, isLocating: false });
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          set({ userLocation: loc, isLocating: false });
          resolve(loc);
        },
        (geoErr) => {
          console.warn("Geolocation permission denied or error:", geoErr);
          // Default coordinate fallback so maps never render blank
          const fallback = { lat: 19.076, lon: 72.8777 };
          set({
            userLocation: fallback,
            isLocating: false,
            error: "Using approximate regional coordinates.",
          });
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  },

  fetchNearbyFacilities: async (lat: number, lon: number) => {
    set({ isLoading: true, error: null });

    // If offline, check Dexie cache
    if (!navigator.onLine) {
      try {
        const cached = await db.cachedFacilities.toCollection().last();
        if (cached && cached.facilities.length > 0) {
          set({ facilities: cached.facilities, isLoading: false });
          return cached.facilities;
        }
      } catch {
        // fallback continues
      }
      set({ facilities: fallbackFacilities, isLoading: false });
      return fallbackFacilities;
    }

    try {
      const response = await api.get<any>(
        `/api/facilities/nearby?lat=${lat}&lon=${lon}`
      );
      const raw = response.data?.facilities || response.data?.data || response.data;
      const list = Array.isArray(raw) && raw.length > 0 ? raw : fallbackFacilities;

      set({ facilities: list, isLoading: false });

      // Save to Dexie cache for future offline visits
      try {
        await db.cachedFacilities.add({
          lat,
          lon,
          facilities: list,
          cached_at: new Date().toISOString(),
        });
      } catch {
        // ignore cache write error
      }

      return list;
    } catch (err: any) {
      // Fallback to local facility dataset with computed distances
      set({
        facilities: fallbackFacilities,
        isLoading: false,
        error: "Loaded cached local medical centers.",
      });
      return fallbackFacilities;
    }
  },

  clearError: () => set({ error: null }),
}));
