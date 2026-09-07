import { create } from "zustand";
import {
  getPendingIntakeCount,
  subscribeToSync,
  syncQueuedIntakes,
} from "../db/syncManager";

interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncedAt: Date | null;
  syncError: string | null;

  initNetworkListeners: () => () => void;
  triggerManualSync: () => Promise<void>;
  checkPendingCount: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingSyncCount: 0,
  lastSyncedAt: null,
  syncError: null,

  initNetworkListeners: () => {
    const handleOnline = () => {
      set({ isOnline: true });
      void get().triggerManualSync();
    };

    const handleOffline = () => {
      set({ isOnline: false });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribeSync = subscribeToSync((pendingCount, isSyncing) => {
      set({ pendingSyncCount: pendingCount, isSyncing });
    });

    void get().checkPendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeSync();
    };
  },

  checkPendingCount: async () => {
    try {
      const count = await getPendingIntakeCount();
      set({ pendingSyncCount: count });
    } catch {
      // ignore in SSR/tests
    }
  },

  triggerManualSync: async () => {
    if (!navigator.onLine) {
      return;
    }
    set({ isSyncing: true, syncError: null });
    try {
      const res = await syncQueuedIntakes();
      const count = await getPendingIntakeCount();
      set({
        isSyncing: false,
        pendingSyncCount: count,
        lastSyncedAt: new Date(),
      });
    } catch (err: any) {
      set({
        isSyncing: false,
        syncError: err?.message || "Sync failed",
      });
    }
  },
}));
