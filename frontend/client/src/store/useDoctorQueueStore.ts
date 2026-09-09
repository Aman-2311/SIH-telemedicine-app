import { create } from "zustand";
import {
  api,
  PrescribePayload,
  PrescriptionResponse,
  QueueItem,
} from "../utils/api";

interface DoctorQueueState {
  queue: QueueItem[];
  completedCases: QueueItem[];
  selectedCaseId: string | null;
  selectedCase: QueueItem | null;
  isUserSelected: boolean;
  isLoadingQueue: boolean;
  isLoadingCompleted: boolean;
  isSubmittingPrescription: boolean;
  filterDepartment: string;
  filterPriority: string;
  error: string | null;
  lastPrescribedResult: PrescriptionResponse | null;
  lastSyncedAt: Date | null;

  // Actions
  fetchQueue: () => Promise<void>;
  fetchCompletedCases: () => Promise<void>;
  selectCase: (caseId: string) => void;
  setFilterDepartment: (dept: string) => void;
  setFilterPriority: (priority: string) => void;
  prescribe: (caseId: string, payload: PrescribePayload) => Promise<boolean>;
  clearError: () => void;
}

export const useDoctorQueueStore = create<DoctorQueueState>((set, get) => ({
  queue: [],
  completedCases: [],
  selectedCaseId: null,
  selectedCase: null,
  isUserSelected: false,
  isLoadingQueue: false,
  isLoadingCompleted: false,
  isSubmittingPrescription: false,
  filterDepartment: "all",
  filterPriority: "all",
  error: null,
  lastPrescribedResult: null,
  lastSyncedAt: null,

  fetchQueue: async () => {
    set({ isLoadingQueue: true, error: null });

    // 1. Fetch from real backend doctor waiting queue endpoint (GET /api/)
    let serverItems: QueueItem[] = [];
    try {
      const response = await api.get<any>("/api/");
      const data = response.data;
      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      if (Array.isArray(raw)) {
        serverItems = raw.map((item: any) => ({
          ...item,
          id: String(item.id || item.case_id),
          case_id: String(item.case_id || item.id),
        }));
      }
    } catch (err: any) {
      console.warn("Server queue unavailable, falling back to local sync", err?.message);
    }

    // 2. Load locally submitted intakes (from ASHA tablet or offline queue)
    let localItems: QueueItem[] = [];
    try {
      const stored = localStorage.getItem("sahara_submitted_intakes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localItems = parsed
            .filter((p: any) => p.status === "waiting" || p.status === "scheduled" || !p.status)
            .map((p: any) => ({
              id: String(p.id || p.case_id || Date.now()),
              case_id: String(p.case_id || p.id || Date.now()),
              patient_name: p.patient_name || "Patient",
              abha_id: p.abha_id,
              age: p.age || 38,
              gender: p.gender || "Female",
              triage_priority: p.triage_priority || "Medium",
              department: p.department || "General Medicine",
              vitals: p.vitals || { bp: "120/80", temp: "98.6", pulse: "72" },
              voice_note_text: p.voice_note_text || p.symptoms || "",
              translated_symptoms: p.translated_symptoms || p.symptoms || "",
              ai_red_flags: p.ai_red_flags || ["Clinical evaluation recommended"],
              created_at: p.created_at || new Date().toISOString(),
              status: p.status || "waiting",
              assigned_doctor: p.assigned_doctor || p.vitals?.consultation?.assigned_doctor,
              doctor_speciality: p.doctor_speciality || p.vitals?.consultation?.doctor_speciality,
              facility: p.facility || p.vitals?.consultation?.facility,
              facility_address: p.facility_address || p.vitals?.consultation?.facility_address,
              scheduled_date: p.scheduled_date || p.vitals?.consultation?.scheduled_date,
              scheduled_time: p.scheduled_time || p.vitals?.consultation?.scheduled_time,
              appointment_status: p.appointment_status || p.vitals?.consultation?.appointment_status,
            }));
        }
      }
    } catch (e) {
      console.error("Failed to load local queue items", e);
    }

    // 3. Combine: Local intakes first, then server items (deduplicated by case_id/id)
    const seenIds = new Set<string>();
    const items: QueueItem[] = [];
    for (const item of [...localItems, ...serverItems]) {
      const id = String(item.case_id || item.id);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        items.push(item);
      }
    }

    try {
      // Sort with today's active cases first, high triage priority next, newest first within tier
      const priorityWeights: Record<string, number> = {
        urgent: 3,
        high: 3,
        moderate: 2,
        medium: 2,
        routine: 1,
        low: 1,
      };

      const todayPrefix = new Date().toISOString().split("T")[0];
      const sorted = [...items].sort((a, b) => {
        const aToday = (a.created_at || "").startsWith(todayPrefix) ? 1 : 0;
        const bToday = (b.created_at || "").startsWith(todayPrefix) ? 1 : 0;
        if (bToday !== aToday) return bToday - aToday;

        const weightA = priorityWeights[a.triage_priority?.toLowerCase() || ""] || 0;
        const weightB = priorityWeights[b.triage_priority?.toLowerCase() || ""] || 0;
        if (weightB !== weightA) return weightB - weightA;

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      const currentSelected = get().selectedCaseId;
      const isManual = get().isUserSelected;

      const currentCaseObj = sorted.find((item) => (item.case_id || item.id) === currentSelected);
      const isCurrentCaseToday = currentCaseObj && (currentCaseObj.created_at || "").startsWith(todayPrefix);
      const isTopCaseToday = sorted[0] && (sorted[0].created_at || "").startsWith(todayPrefix);

      let updatedSelectedCase = currentCaseObj;
      if (!isManual || (!isCurrentCaseToday && isTopCaseToday) || !currentCaseObj) {
        updatedSelectedCase = sorted[0] || null;
      }

      set({
        queue: sorted,
        selectedCase: updatedSelectedCase,
        selectedCaseId: updatedSelectedCase
          ? updatedSelectedCase.case_id || updatedSelectedCase.id
          : null,
        lastSyncedAt: new Date(),
        isLoadingQueue: false,
      });
    } catch (err: any) {
      set({
        isLoadingQueue: false,
        error: err?.message || "Failed to process queue.",
      });
    }
  },

  fetchCompletedCases: async () => {
    set({ isLoadingCompleted: true });
    // Completed cases are maintained locally from doctor prescriptions and synchronized intakes
    // Obsolete non-existent /api/queue/completed HTTP endpoint removed to eliminate 404 console errors

    // Merge with local completed records
    let localCompleted: QueueItem[] = [];
    try {
      const stored = localStorage.getItem("sahara_submitted_intakes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localCompleted = parsed
            .filter((p: any) => p.status === "completed")
            .map((p: any) => ({
              id: String(p.id || p.case_id),
              case_id: String(p.case_id || p.id),
              patient_name: p.patient_name || "Patient",
              abha_id: p.abha_id,
              triage_priority: p.triage_priority || "Medium",
              department: p.department || "General Medicine",
              vitals: p.vitals || { bp: "120/80", temp: "98.6", pulse: "72" },
              voice_note_text: p.voice_note_text || p.symptoms || "",
              translated_symptoms: p.translated_symptoms || p.symptoms || "",
              created_at: p.created_at || new Date().toISOString(),
              status: "completed",
            }));
        }
      }
    } catch {}

    const seen = new Set<string>();
    const allCompleted: QueueItem[] = [];
    for (const item of localCompleted) {
      const id = String(item.case_id || item.id);
      if (!seen.has(id)) {
        seen.add(id);
        allCompleted.push(item);
      }
    }

    set({ completedCases: allCompleted, isLoadingCompleted: false });
  },

  selectCase: (caseId: string) => {
    const item =
      get().queue.find((c) => (c.case_id || c.id) === caseId) || null;
    set({
      selectedCaseId: caseId,
      selectedCase: item,
      isUserSelected: true,
    });
  },

  setFilterDepartment: (filterDepartment: string) => {
    set({ filterDepartment });
  },

  setFilterPriority: (filterPriority: string) => {
    set({ filterPriority });
  },

  prescribe: async (caseId: string, payload: PrescribePayload) => {
    set({ isSubmittingPrescription: true, error: null });
    let serverPrescriptionResult: PrescriptionResponse | null = null;
    try {
      const response = await api.post<PrescriptionResponse>(
        `/api/${caseId}/prescribe`,
        payload
      );
      if (response?.data && typeof response.data === "object") {
        serverPrescriptionResult = response.data;
      }
    } catch (err: any) {
      console.warn("Prescribe server sync failed, falling back to local update", err?.message);
    }

    // Always update local storage so status immediately becomes completed
    try {
      const stored = localStorage.getItem("sahara_submitted_intakes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((p: any) =>
            String(p.id || p.case_id) === caseId
              ? {
                  ...p,
                  status: "completed",
                  appointment_status: "completed",
                  diagnosis: payload.diagnosis,
                  medicines: payload.medicines,
                  prescription: {
                    diagnosis: payload.diagnosis,
                    medicines: payload.medicines,
                    doctor_id: payload.doctor_id,
                    prescribed_at: new Date().toISOString(),
                    prescribed_by: p.assigned_doctor || "Specialist Doctor",
                  },
                }
              : p
          );
          localStorage.setItem("sahara_submitted_intakes", JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Failed to update local storage prescription status", e);
    }

    // Remove the prescribed patient from queue immediately for snappy UI
    const remaining = get().queue.filter(
      (item) => (item.case_id || item.id) !== caseId
    );

    set({
      queue: remaining,
      selectedCaseId: remaining.length > 0 ? (remaining[0].case_id || remaining[0].id) : null,
      selectedCase: remaining.length > 0 ? remaining[0] : null,
      isSubmittingPrescription: false,
      lastPrescribedResult: serverPrescriptionResult || {
        case_id: caseId,
        diagnosis: payload.diagnosis,
        medicines: payload.medicines,
        doctor_id: payload.doctor_id,
        created_at: new Date().toISOString(),
        status: "completed",
      },
    });

    // Refresh completed cases
    void get().fetchCompletedCases();

    return true;
  },

  clearError: () => set({ error: null }),
}));
