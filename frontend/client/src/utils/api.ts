import axios from "axios";

// Localhost FastAPI backend default for SIH Hackathon Demo
// Uses empty string default so Vite proxy seamlessly routes /api to http://127.0.0.1:8000 without CORS issues
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// Automatic JWT Bearer token attachment
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("sahara_access_token") ||
      localStorage.getItem("swasthya_access_token") ||
      "mock_jwt_token_asha_999";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // In mock demo mode, don't brutally kick the user out if local server restarts
    if (error.response && error.response.status === 401) {
      console.warn("API 401 received - Continuing in local demo mode.");
    }
    return Promise.reject(error);
  }
);

/* ==================== API Type Definitions ==================== */

// 1. Auth Types
export type UserRole = "asha" | "patient" | "doctor";

export interface LoginPayload {
  abha_id: string;
  role: UserRole;
}

export interface GenerateAbhaPayload {
  phone_number: string;
  full_name: string;
  role: UserRole;
}

export interface SendOtpPayload {
  phone_number: string;
}

export interface AuthResponse {
  status?: string;
  access_token: string;
  token_type?: string;
  user_id?: string;
  user?: {
    abha_id?: string;
    app_id?: string;
    full_name?: string;
    phone_number?: string;
    role?: UserRole;
  };
  abha_id?: string;
  app_id?: string;
  mock_otp?: string;
  message?: string;
}

// 2. Intake & AI Types
export interface Vitals {
  bp: string;
  temp: string;
  pulse: string;
  spo2?: string;
  weight?: string;
}

export interface ExtractVoicePayload {
  spoken_text: string;
}

export interface ExtractVoiceResponse {
  translated_symptoms: string;
  extracted_vitals: {
    bp: string;
    temp: string;
    pulse: string;
    [key: string]: string;
  };
  original_language?: string;
  confidence_score?: number;
}

export interface IntakePayload {
  abha_id: string;
  patient_name?: string;
  translated_symptoms?: string;
  vitals: Vitals;
  voice_note_text: string;
  image_url?: string;
}

export interface IntakeResponse {
  case_id?: string;
  id?: string;
  abha_id: string;
  triage_priority: "Urgent" | "Moderate" | "Routine" | "High" | "Medium" | "Low";
  department: string;
  status: string;
  created_at: string;
  translated_symptoms?: string;
}

// 3. Queue & Doctor Types
export interface QueueItem {
  id: string;
  case_id?: string;
  patient_name?: string;
  abha_id: string;
  age?: number;
  gender?: string;
  triage_priority: "Urgent" | "Moderate" | "Routine" | "High" | "Medium" | "Low";
  department: string;
  vitals: Vitals;
  voice_note_text: string;
  translated_symptoms?: string;
  ai_red_flags?: string[];
  image_url?: string;
  created_at: string;
  status?: string;
}

export interface MedicineItem {
  name: string;
  dosage: string;
  duration: string;
  frequency?: string;
  instructions?: string;
  generic_alternative?: string;
}

export interface PrescribePayload {
  doctor_id: string;
  diagnosis: string;
  medicines: MedicineItem[];
}

export interface PrescriptionResponse {
  case_id?: string;
  diagnosis: string;
  medicines: MedicineItem[];
  doctor_id?: string;
  doctor_name?: string;
  created_at?: string;
  status?: string;
}

// 4. Facility & Geolocation Types
export interface Facility {
  id: string | number;
  name: string;
  type: "hospital" | "pharmacy" | "phc" | "jan_aushadhi";
  lat: number;
  lon: number;
  distance_km: number;
  address?: string;
  phone?: string;
  is_generic_store?: boolean;
}
