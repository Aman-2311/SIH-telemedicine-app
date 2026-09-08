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
    try {
      const response = await api.get<QueueItem[]>("/api/queue/");
      const items = Array.isArray(response.data) ? response.data : [];

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
        error:
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to fetch active queue from server.",
      });
    }
  },

  fetchCompletedCases: async () => {
    set({ isLoadingCompleted: true });
    try {
      const response = await api.get<QueueItem[]>("/api/queue/completed");
      const items = Array.isArray(response.data) ? response.data : [];
      set({ completedCases: items, isLoadingCompleted: false });
    } catch (err: any) {
      set({ isLoadingCompleted: false });
    }
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

      // Refresh completed cases
      void get().fetchCompletedCases();

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
