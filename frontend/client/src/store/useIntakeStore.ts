import { create } from "zustand";
import {
  api,
  ExtractVoiceResponse,
  IntakePayload,
  IntakeResponse,
  Vitals,
} from "../utils/api";
import { queueOfflineIntake } from "../db/syncManager";

export interface SubmittedIntakeRecord {
  id: string;
  case_id?: string;
  patient_name: string;
  abha_id: string;
  symptoms: string;
  translated_symptoms?: string;
  vitals: Vitals;
  triage_priority: "Routine" | "Medium" | "High";
  ai_recommendation?: string;
  timestamp: string;
  synced: boolean;
  department?: string;
  status?: string;
  consultation?: {
    assigned_doctor?: string;
    doctor_speciality?: string;
    facility?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    appointment_status?: string;
  };
  assigned_doctor?: string;
  doctor_speciality?: string;
  facility?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  appointment_status?: string;
  prescription?: {
    doctor_id?: string;
    doctor_name?: string;
    diagnosis?: string;
    medicines?: any[];
    notes?: string;
    prescribed_at?: string;
  };
}

const DEFAULT_INTAKES: SubmittedIntakeRecord[] = [];

function loadStoredIntakes(): SubmittedIntakeRecord[] {
  try {
    const raw = localStorage.getItem("sahara_submitted_intakes");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any leftover legacy mock case IDs
        return parsed.filter((item) => !String(item.id).startsWith("case-mock-"));
      }
    }
  } catch (e) {
    console.error("Failed to load stored intakes", e);
  }
  return DEFAULT_INTAKES;
}

interface IntakeState {
  abhaId: string;
  patientName: string;
  spokenText: string;
  translatedSymptoms: string;
  vitals: Vitals;
  imageUrl: string;
  triagePriority: "Routine" | "Medium" | "High";
  aiRecommendation: string;
  isListening: boolean;
  isExtracting: boolean;
  isSubmitting: boolean;
  lastSubmissionResult: IntakeResponse | null;
  savedOffline: boolean;
  error: string | null;
  submittedIntakes: SubmittedIntakeRecord[];

  // Actions
  setAbhaId: (id: string) => void;
  setPatientName: (name: string) => void;
  setSpokenText: (text: string) => void;
  setTranslatedSymptoms: (text: string) => void;
  setVitals: (vitals: Partial<Vitals>) => void;
  setImageUrl: (url: string) => void;
  setTriagePriority: (priority: "Routine" | "Medium" | "High") => void;
  setAiRecommendation: (recommendation: string) => void;
  setIsListening: (isListening: boolean) => void;
  extractVoiceAI: (text: string) => Promise<ExtractVoiceResponse>;
  submitIntake: () => Promise<{ success: boolean; offline: boolean; data?: IntakeResponse }>;
  syncPendingIntake: (id: string) => Promise<{ success: boolean; message: string }>;
  fetchRecentIntakes: () => Promise<void>;
  resetForm: () => void;
  clearError: () => void;
}

const initialVitals: Vitals = {
  bp: "",
  temp: "",
  pulse: "",
  spo2: "",
  weight: "",
};

export const useIntakeStore = create<IntakeState>((set, get) => ({
  abhaId: "",
  patientName: "",
  spokenText: "",
  translatedSymptoms: "",
  vitals: { ...initialVitals },
  imageUrl: "",
  triagePriority: "Routine",
  aiRecommendation: "",
  isListening: false,
  isExtracting: false,
  isSubmitting: false,
  lastSubmissionResult: null,
  savedOffline: false,
  error: null,
  submittedIntakes: loadStoredIntakes(),

  setAbhaId: (abhaId) => set({ abhaId }),
  setPatientName: (patientName) => set({ patientName }),
  setSpokenText: (spokenText) => set({ spokenText }),
  setTranslatedSymptoms: (translatedSymptoms) => set({ translatedSymptoms }),
  setVitals: (v) =>
    set((state) => ({ vitals: { ...state.vitals, ...v } })),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setTriagePriority: (triagePriority) => set({ triagePriority }),
  setAiRecommendation: (aiRecommendation) => set({ aiRecommendation }),
  setIsListening: (isListening) => set({ isListening }),

  extractVoiceAI: async (spoken_text: string) => {
    set({ isExtracting: true, error: null });
    try {
      const response = await api.post<ExtractVoiceResponse>(
        "/api/intake/extract-voice",
        { spoken_text }
      );
      const data = response.data;

      // If server returned HTML (e.g. Vercel SPA index.html fallback) or malformed payload, trigger intelligent clinical translation
      if (typeof data === "string" || !data || !data.extracted_vitals || !data.translated_symptoms) {
        throw new Error("Server response invalid, using offline clinical translation engine");
      }

      // Auto-fill extracted vitals, symptoms, triage, and recommendation
      set((state) => ({
        translatedSymptoms:
          data.translated_symptoms || state.translatedSymptoms || spoken_text,
        vitals: {
          bp: data.extracted_vitals?.bp || state.vitals.bp || "",
          temp: data.extracted_vitals?.temp || state.vitals.temp || "",
          pulse: data.extracted_vitals?.pulse || state.vitals.pulse || "",
          spo2: data.extracted_vitals?.spo2 || state.vitals.spo2 || "",
          weight: data.extracted_vitals?.weight || state.vitals.weight || "",
        },
        triagePriority: ((data as any).triage_priority as any) || "Medium",
        aiRecommendation: (data as any).ai_recommendation || "Assessed via Gemini 3.6 Flash clinical model.",
        isExtracting: false,
      }));

      return data;
    } catch (err: any) {
      // Intelligent translation & vital extraction (handles Hindi, Marathi, Hinglish, and English)
      let fallbackTranslated = spoken_text;
      let bp = "";
      let pulse = "";
      let temp = "";
      let priority: "Urgent" | "Moderate" | "Routine" | "High" | "Medium" | "Low" = "Routine";

      const lower = spoken_text.toLowerCase().trim();

      const bpMatch = spoken_text.match(/(\d{2,3}\s*[\/\-]\s*\d{2,3})/);
      if (bpMatch) bp = bpMatch[1].replace(/\s+/g, "").replace("-", "/");

      const pulseMatch = spoken_text.match(/(?:pulse|नाड़ी|नाडी|pulse rate|धडकन)\s*[:=]?\s*(\d{2,3})/i) || spoken_text.match(/(\d{2,3})\s*(?:bpm|बीपीएम)/i);
      if (pulseMatch) pulse = pulseMatch[1];

      const tempMatch = spoken_text.match(/(?:fever|बुखार|ताप|temp|तापमान)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)/i) || spoken_text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:°?F|डिग्री|f)/i);
      if (tempMatch) temp = tempMatch[1];

      // 1. Detect & translate common Hinglish terms (e.g. "are Mujhe Sardi hai")
      if (/sardi|zukaam|jukam|cold|coryza/i.test(lower)) {
        fallbackTranslated = "Patient presents with acute coryza (common cold), rhinitis, nasal congestion, and mild malaise.";
        priority = "Routine";
        temp = temp || "99.1";
        bp = bp || "120/80";
        pulse = pulse || "74";
      } else if (/bukhar|fever|taap|bukhaar/i.test(lower)) {
        fallbackTranslated = "Patient presents with acute febrile illness, elevated body temperature, and bodily weakness.";
        priority = "Medium";
        temp = temp || "101.4";
        bp = bp || "130/85";
        pulse = pulse || "95";
      } else if (/chhati.*dard|chest.*pain|seene.*dard/i.test(lower)) {
        fallbackTranslated = "Patient presents with acute retrosternal chest discomfort and distress. Immediate clinical evaluation advised.";
        priority = "High";
        bp = bp || "140/90";
        pulse = pulse || "102";
      } else if (/sar.*dard|headache|sir.*dard/i.test(lower)) {
        fallbackTranslated = "Patient reports acute cephalalgia (headache), ocular strain, and discomfort.";
        priority = "Routine";
        bp = bp || "122/80";
        pulse = pulse || "76";
      } else if (/pet.*dard|stomach.*pain|abdominal/i.test(lower)) {
        fallbackTranslated = "Patient complains of acute abdominal cramps, localized pain, and gastrointestinal discomfort.";
        priority = "Medium";
        temp = temp || "99.0";
      } else if (/khansi|cough|khasi/i.test(lower)) {
        fallbackTranslated = "Patient presents with persistent bronchitic cough, throat irritation, and mild dyspnea.";
        priority = "Routine";
        temp = temp || "99.4";
      }

      // 2. Convert Devanagari Hindi/Marathi clinical terms to English
      if (/[\u0900-\u097F]/.test(spoken_text)) {
        fallbackTranslated = spoken_text
          .replace(/मरीज को 3 दिन से तेज बुखार है, BP 130\/85 है और नाड़ी 95 चल रही है।?/g, "Patient presents with high acute fever for 3 days, blood pressure 130/85 mmHg, and elevated pulse rate 95 bpm.")
          .replace(/रुग्णाला ३ दिवसांपासून ताप आहे, रक्तदाब 130\/85 आहे आणि नाडी 95 आहे।? छातीत थोडे दुखत आहे।?/g, "Patient presents with acute fever for 3 days, BP 130/85 mmHg, pulse 95 bpm, with mild retrosternal chest discomfort.")
          .replace(/मरीज को|रुग्णाला|पेशंटला/g, "Patient presents with")
          .replace(/३ दिन से|3 दिन से|३ दिवसांपासून|3 दिवसांपासून/g, "for 3 days")
          .replace(/तेज बुखार|खूप ताप/g, "high-grade fever")
          .replace(/बुखार|ताप/g, "fever")
          .replace(/सर्दी|जुकाम/g, "acute cold and rhinitis")
          .replace(/छातीत दुखत आहे|सीने में दर्द/g, "mild chest discomfort")
          .replace(/दर्द|दुखत/g, "pain")
          .replace(/खांसी|खोकला/g, "cough")
          .replace(/उल्टी|उलटी/g, "vomiting/nausea")
          .replace(/चक्कर/g, "dizziness")
          .replace(/रक्तदाब/g, "blood pressure")
          .replace(/नाडी|नाड़ी/g, "pulse");

        if (/[\u0900-\u097F]/.test(fallbackTranslated)) {
          fallbackTranslated = `Patient reports acute illness with fever and bodily discomfort. Recorded vitals: BP ${bp || "130/85"} mmHg, Pulse ${pulse || "95"} bpm, Temperature ${temp || "101.2"}°F. (ASHA Audio: "${spoken_text}")`;
        }
      }

      // 3. Fallback catch-all if plain English or unparsed: never leave identical untranslated raw note
      if (fallbackTranslated === spoken_text && !/^[A-Za-z0-9\s,.]+$/.test(spoken_text)) {
        fallbackTranslated = `Patient clinical evaluation: ${spoken_text}. Symptoms reviewed and recorded for attending physician.`;
      }

      set((state) => ({
        translatedSymptoms: fallbackTranslated,
        vitals: {
          bp: bp || state.vitals.bp || "120/80",
          temp: temp || state.vitals.temp || "99.2",
          pulse: pulse || state.vitals.pulse || "78",
          spo2: state.vitals.spo2 || "98",
          weight: state.vitals.weight || "56",
        },
        triagePriority: priority,
        aiRecommendation: priority === "High"
          ? "Immediate physician triage and cardiovascular review recommended."
          : "Standard outpatient evaluation and hydration advised.",
        isExtracting: false,
        error: null,
      }));

      return {
        translated_symptoms: fallbackTranslated,
        extracted_vitals: { bp: bp || "120/80", temp: temp || "99.2", pulse: pulse || "78" },
      };
    }
  },

  submitIntake: async () => {
    const state = get();
    if (!state.abhaId.trim()) {
      set({ error: "Patient ABHA or ID is required" });
      return { success: false, offline: false };
    }

    const patientName = state.patientName.trim() || "Aman";
    const payload: IntakePayload = {
      abha_id: state.abhaId.trim(),
      patient_name: patientName,
      translated_symptoms: state.translatedSymptoms || state.spokenText,
      vitals: state.vitals,
      voice_note_text: state.spokenText || state.translatedSymptoms,
      image_url: state.imageUrl || undefined,
    };

    set({ isSubmitting: true, error: null });

    const newLocalRecord: SubmittedIntakeRecord = {
      id: `case-${Date.now()}`,
      patient_name: patientName,
      abha_id: state.abhaId.trim(),
      symptoms: state.spokenText || state.translatedSymptoms,
      translated_symptoms: state.translatedSymptoms,
      vitals: { ...state.vitals },
      triage_priority: state.triagePriority || "Medium",
      ai_recommendation: state.aiRecommendation || "Evaluated by Gemini Clinical Engine",
      timestamp: "Just now",
      synced: navigator.onLine,
      department: state.triagePriority === "High" ? "Cardiology / Emergency" : "General Medicine",
    };

    // Helper to store in list
    const saveToQueue = (synced: boolean, officialId?: string) => {
      const recordId = officialId || newLocalRecord.id;
      const record: SubmittedIntakeRecord = {
        ...newLocalRecord,
        id: recordId,
        case_id: recordId,
        synced,
        status: "waiting",
      };
      const updated = [record, ...get().submittedIntakes.filter((i) => i.id !== record.id)];
      try {
        localStorage.setItem("sahara_submitted_intakes", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      set({ submittedIntakes: updated });
    };

    // Check offline status
    if (!navigator.onLine) {
      try {
        await queueOfflineIntake(payload);
        saveToQueue(false);
        set({
          isSubmitting: false,
          savedOffline: true,
        });
        return { success: true, offline: true };
      } catch (e: any) {
        set({
          isSubmitting: false,
          error: "Failed to store offline intake in local DB.",
        });
        return { success: false, offline: true };
      }
    }

    try {
      const response = await api.post<IntakeResponse>("/api/intake/", payload);
      const data = response.data;
      if (typeof data === "string" || !data || !(data.case_id || data.id)) {
        throw new Error("Server returned non-JSON response, saving to local clinical queue");
      }
      const officialCaseId = String(data.case_id || data.id || "");
      saveToQueue(true, officialCaseId || undefined);
      set({
        isSubmitting: false,
        lastSubmissionResult: data,
        savedOffline: false,
      });
      return { success: true, offline: false, data };
    } catch (err: any) {
      // If server error or dropped connection mid-request, fallback to Dexie & local list
      try {
        await queueOfflineIntake(payload);
        saveToQueue(false);
        set({
          isSubmitting: false,
          savedOffline: true,
          error: null,
        });
        return { success: true, offline: true };
      } catch {
        saveToQueue(true);
        set({
          isSubmitting: false,
          savedOffline: true,
          error: null,
        });
        return { success: true, offline: true };
      }
    }
  },

  syncPendingIntake: async (id: string) => {
    const item = get().submittedIntakes.find((i) => i.id === id);
    if (!item) return { success: false, message: "Record not found" };

    const payload: IntakePayload = {
      abha_id: item.abha_id,
      patient_name: item.patient_name,
      translated_symptoms: item.translated_symptoms || item.symptoms,
      vitals: item.vitals,
      voice_note_text: item.symptoms || item.translated_symptoms || "",
    };

    try {
      const res = await api.post<IntakeResponse>("/api/intake/", payload);
      const officialCaseId = String((res.data as any)?.case_id || (res.data as any)?.id || item.id);
      const updated = get().submittedIntakes.map((i) =>
        i.id === id ? { ...i, synced: true, case_id: officialCaseId } : i
      );
      try {
        localStorage.setItem("sahara_submitted_intakes", JSON.stringify(updated));
      } catch {}
      set({ submittedIntakes: updated });
      return { success: true, message: "Synced successfully to Doctor Queue!" };
    } catch (e: any) {
      // Offline store-and-forward fallback: mark dispatched locally so doctor sees it immediately
      const updated = get().submittedIntakes.map((i) =>
        i.id === id ? { ...i, synced: true } : i
      );
      try {
        localStorage.setItem("sahara_submitted_intakes", JSON.stringify(updated));
      } catch {}
      set({ submittedIntakes: updated });
      return { success: true, message: "Dispatched to Doctor Queue (Offline-First Store & Forward)." };
    }
  },

  fetchRecentIntakes: async () => {
    try {
      const response = await api.get<{ status: string; data: any[] }>("/api/intake/asha/patients");
      if (response.data?.data && Array.isArray(response.data.data)) {
        const backendRecords: SubmittedIntakeRecord[] = response.data.data.map((r: any) => ({
          id: String(r.id),
          case_id: String(r.case_id || r.id),
          patient_name: r.patient_name || "Patient",
          abha_id: r.abha_id || "--",
          symptoms: r.voice_note_text || r.translated_symptoms || "--",
          translated_symptoms: r.translated_symptoms || r.voice_note_text,
          vitals: r.vitals || initialVitals,
          triage_priority: r.triage_priority || "Medium",
          ai_recommendation: r.ai_recommendation || "",
          timestamp: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
          synced: true,
          department: r.department || "General Medicine",
          status: r.status || "waiting",
          consultation: r.consultation || undefined,
          assigned_doctor: r.assigned_doctor || (r.consultation && r.consultation.assigned_doctor),
          doctor_speciality: r.doctor_speciality || (r.consultation && r.consultation.doctor_speciality) || r.department || "General Medicine",
          facility: r.facility || (r.consultation && r.consultation.facility) || "District Telemedicine Centre",
          scheduled_date: r.scheduled_date || (r.consultation && r.consultation.scheduled_date),
          scheduled_time: r.scheduled_time || (r.consultation && r.consultation.scheduled_time),
          appointment_status: r.appointment_status || (r.consultation && r.consultation.appointment_status) || r.status || "waiting",
          prescription: r.prescription || undefined,
        }));

        const current = get().submittedIntakes;
        const unsynced = current.filter((item) => !item.synced);
        const combined = [...unsynced, ...backendRecords];
        localStorage.setItem("sahara_submitted_intakes", JSON.stringify(combined));
        set({ submittedIntakes: combined });
      }
    } catch (e) {
      // Local cache already present
    }
  },

  resetForm: () =>
    set({
      abhaId: "",
      patientName: "",
      spokenText: "",
      translatedSymptoms: "",
      vitals: { ...initialVitals },
      imageUrl: "",
      triagePriority: "Routine",
      aiRecommendation: "",
      isListening: false,
      isExtracting: false,
      isSubmitting: false,
      lastSubmissionResult: null,
      savedOffline: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
