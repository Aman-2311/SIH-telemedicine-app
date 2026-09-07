import { create } from "zustand";
import {
  api,
  PrescribePayload,
  PrescriptionResponse,
  QueueItem,
} from "../utils/api";

interface DoctorQueueState {
  queue: QueueItem[];
  selectedCaseId: string | null;
  selectedCase: QueueItem | null;
  isLoadingQueue: boolean;
  isSubmittingPrescription: boolean;
  filterDepartment: string;
  filterPriority: string;
  error: string | null;
  lastPrescribedResult: PrescriptionResponse | null;

  // Actions
  fetchQueue: () => Promise<void>;
  selectCase: (caseId: string) => void;
  setFilterDepartment: (dept: string) => void;
  setFilterPriority: (priority: string) => void;
  prescribe: (caseId: string, payload: PrescribePayload) => Promise<boolean>;
  clearError: () => void;
}

export const useDoctorQueueStore = create<DoctorQueueState>((set, get) => ({
  queue: [],
  selectedCaseId: null,
  selectedCase: null,
  isLoadingQueue: false,
  isSubmittingPrescription: false,
  filterDepartment: "all",
  filterPriority: "all",
  error: null,
  lastPrescribedResult: null,

  fetchQueue: async () => {
    set({ isLoadingQueue: true, error: null });
    try {
      const response = await api.get<QueueItem[]>("/api/queue/");
      const items = Array.isArray(response.data) ? response.data : [];

      // Sort with high triage priority first (Urgent / High -> Moderate / Medium -> Routine / Low)
      const priorityWeights: Record<string, number> = {
        urgent: 3,
        high: 3,
        moderate: 2,
        medium: 2,
        routine: 1,
        low: 1,
      };

      const sorted = [...items].sort((a, b) => {
        const weightA =
          priorityWeights[a.triage_priority?.toLowerCase()] || 0;
        const weightB =
          priorityWeights[b.triage_priority?.toLowerCase()] || 0;
        return weightB - weightA;
      });

      const currentSelected = get().selectedCaseId;
      const updatedSelectedCase =
        sorted.find((item) => (item.case_id || item.id) === currentSelected) ||
        sorted[0] ||
        null;

      set({
        queue: sorted,
        selectedCase: updatedSelectedCase,
        selectedCaseId: updatedSelectedCase
          ? updatedSelectedCase.case_id || updatedSelectedCase.id
          : null,
        isLoadingQueue: false,
      });
    } catch (err: any) {
      set({
        isLoadingQueue: false,
        error:
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to fetch active queue from server.",
      });
    }
  },

  selectCase: (caseId: string) => {
    const item =
      get().queue.find((c) => (c.case_id || c.id) === caseId) || null;
    set({
      selectedCaseId: caseId,
      selectedCase: item,
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
    try {
      const response = await api.post<PrescriptionResponse>(
        `/api/queue/${caseId}/prescribe`,
        payload
      );

      // Remove the prescribed patient from queue immediately for snappy UI
      const remaining = get().queue.filter(
        (item) => (item.case_id || item.id) !== caseId
      );

      set({
        queue: remaining,
        selectedCaseId: remaining.length > 0 ? (remaining[0].case_id || remaining[0].id) : null,
        selectedCase: remaining.length > 0 ? remaining[0] : null,
        isSubmittingPrescription: false,
        lastPrescribedResult: response.data,
      });

      return true;
    } catch (err: any) {
      set({
        isSubmittingPrescription: false,
        error:
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit prescription.",
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
