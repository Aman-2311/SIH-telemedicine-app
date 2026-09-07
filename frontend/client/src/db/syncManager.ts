import { api, IntakePayload, IntakeResponse } from "../utils/api";
import { db, OfflineIntake } from "./dexieConfig";

let isSyncing = false;
type SyncListener = (pendingCount: number, syncing: boolean) => void;
const listeners = new Set<SyncListener>();

export function subscribeToSync(listener: SyncListener) {
  listeners.add(listener);
  // Trigger initial count check
  void notifyListeners();
  return () => {
    listeners.delete(listener);
  };
}

async function notifyListeners() {
  try {
    const count = await getPendingIntakeCount();
    listeners.forEach((listener) => listener(count, isSyncing));
  } catch {
    listeners.forEach((listener) => listener(0, isSyncing));
  }
}

export async function getPendingIntakeCount(): Promise<number> {
  return db.intakes.where("status").anyOf("queued", "sync_failed").count();
}

export async function getPendingIntakes(): Promise<OfflineIntake[]> {
  return db.intakes.where("status").anyOf("queued", "sync_failed").toArray();
}

export async function queueOfflineIntake(payload: IntakePayload): Promise<number> {
  const id = await db.intakes.add({
    payload,
    status: "queued",
    retries: 0,
    created_at: new Date().toISOString(),
  });
  await notifyListeners();
  return id;
}

export async function syncQueuedIntakes(): Promise<{ synced: number; failed: number }> {
  if (isSyncing || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  await notifyListeners();

  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingIntakes();
    for (const item of pending) {
      if (!item.localId || item.retries >= 5) continue;

      await db.intakes.update(item.localId, { status: "syncing" });

      try {
        await api.post<IntakeResponse>("/api/intake/", item.payload);
        await db.intakes.update(item.localId, { status: "synced" });
        synced++;
      } catch (error) {
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Sync failed";
        await db.intakes.update(item.localId, {
          status: "sync_failed",
          retries: item.retries + 1,
          last_error: errorMessage,
        });
      }
    }
  } finally {
    isSyncing = false;
    await notifyListeners();
  }

  return { synced, failed };
}

export function startSyncManager(): () => void {
  const handleOnline = () => {
    void syncQueuedIntakes();
  };

  window.addEventListener("online", handleOnline);
  // Auto-attempt sync on init
  void syncQueuedIntakes();

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
