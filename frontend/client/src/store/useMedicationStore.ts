import { create } from "zustand";

export interface AdherenceRecord {
  id: string; // `${dateStr}_${medicineName}_${slot}`
  medicineName: string;
  slot: string;
  dateStr: string; // "YYYY-MM-DD"
  takenAt: string; // e.g. "8:12 AM"
  timestamp: number;
}

export interface MedicationScheduleItem {
  id: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  duration: string;
  slot: "morning" | "afternoon" | "evening" | "night";
  slotLabel: string;
  timeStr: string;
  dateStr: string; // "YYYY-MM-DD"
  dayLabel: "Today" | "Tomorrow";
  status: "taken" | "upcoming" | "due" | "missed";
  takenAt?: string;
  genericAlternative?: string;
  savings?: string;
  doctorName?: string;
}

interface MedicationState {
  adherenceHistory: Record<string, AdherenceRecord>;
  remindersEnabled: boolean;
  selectedMedicationForDetail: MedicationScheduleItem | null;

  // Actions
  markAsTaken: (medicineName: string, slot: string, dateStr?: string) => { status: "recorded"; timeStr: string };
  isTaken: (medicineName: string, slot: string, dateStr?: string) => boolean;
  getTakenTime: (medicineName: string, slot: string, dateStr?: string) => string | undefined;
  setRemindersEnabled: (enabled: boolean) => void;
  setSelectedMedicationForDetail: (med: MedicationScheduleItem | null) => void;
  generateScheduleFromRx: (prescription: any) => {
    todayDoses: MedicationScheduleItem[];
    tomorrowDoses: MedicationScheduleItem[];
    nextDose: MedicationScheduleItem | null;
    bannerState: "UPCOMING" | "DUE_NOW" | "ALL_COMPLETED" | "NO_ACTIVE_RX";
    completedCount: number;
    totalTodayCount: number;
  };
}

const STORAGE_KEY = "sahara_medication_adherence";
const REMINDERS_KEY = "sahara_reminders_enabled";

const getStoredAdherence = (): Record<string, AdherenceRecord> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getStoredReminders = (): boolean => {
  try {
    return localStorage.getItem(REMINDERS_KEY) === "true";
  } catch {
    return false;
  }
};

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useMedicationStore = create<MedicationState>((set, get) => ({
  adherenceHistory: getStoredAdherence(),
  remindersEnabled: getStoredReminders(),
  selectedMedicationForDetail: null,

  markAsTaken: (medicineName: string, slot: string, dateStr?: string) => {
    const targetDate = dateStr || getTodayDateStr();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const key = `${targetDate}_${medicineName}_${slot}`;

    const newRecord: AdherenceRecord = {
      id: key,
      medicineName,
      slot,
      dateStr: targetDate,
      takenAt: timeStr,
      timestamp: now.getTime(),
    };

    const updated = {
      ...get().adherenceHistory,
      [key]: newRecord,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save adherence to localStorage", e);
    }

    set({ adherenceHistory: updated });
    return { status: "recorded", timeStr };
  },

  isTaken: (medicineName: string, slot: string, dateStr?: string) => {
    const targetDate = dateStr || getTodayDateStr();
    const key = `${targetDate}_${medicineName}_${slot}`;
    return !!get().adherenceHistory[key];
  },

  getTakenTime: (medicineName: string, slot: string, dateStr?: string) => {
    const targetDate = dateStr || getTodayDateStr();
    const key = `${targetDate}_${medicineName}_${slot}`;
    return get().adherenceHistory[key]?.takenAt;
  },

  setRemindersEnabled: (enabled: boolean) => {
    try {
      localStorage.setItem(REMINDERS_KEY, String(enabled));
    } catch {}
    set({ remindersEnabled: enabled });
  },

  setSelectedMedicationForDetail: (med: MedicationScheduleItem | null) => {
    set({ selectedMedicationForDetail: med });
  },

  generateScheduleFromRx: (prescription: any) => {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTomorrowDateStr();

    if (!prescription || !prescription.medicines || prescription.medicines.length === 0) {
      return {
        todayDoses: [],
        tomorrowDoses: [],
        nextDose: null,
        bannerState: "NO_ACTIVE_RX",
        completedCount: 0,
        totalTodayCount: 0,
      };
    }

    const todayDoses: MedicationScheduleItem[] = [];
    const tomorrowDoses: MedicationScheduleItem[] = [];

    prescription.medicines.forEach((med: any) => {
      const dosageLower = (med.dosage || "").toLowerCase();
      const name = med.name || "Prescribed Medicine";
      const instructions = med.dosage || "As directed by physician";
      const duration = med.duration || "Course as prescribed";
      const alternative = med.alternative || med.generic_alternative;
      const savings = med.savings || med.generic_price;

      // Extract slot from actual prescription dosage instructions faithfully
      let slot: "morning" | "afternoon" | "evening" | "night" = "morning";
      let slotLabel = "Morning · After breakfast";
      let timeStr = "08:00 AM";

      if (dosageLower.includes("night") || dosageLower.includes("bedtime") || dosageLower.includes("evening")) {
        slot = "evening";
        slotLabel = "Evening · Before sleep";
        timeStr = "08:00 PM";
      } else if (dosageLower.includes("afternoon") || dosageLower.includes("lunch") || dosageLower.includes("sachet")) {
        slot = "afternoon";
        slotLabel = "Afternoon · Post lunch";
        timeStr = "02:00 PM";
      } else if (dosageLower.includes("morning") || dosageLower.includes("breakfast")) {
        slot = "morning";
        slotLabel = "Morning · After breakfast";
        timeStr = "08:00 AM";
      }

      // Check Today's status from persisted adherence history
      const takenToday = get().isTaken(name, slot, todayStr);
      const takenTime = get().getTakenTime(name, slot, todayStr);

      todayDoses.push({
        id: `today_${name}_${slot}`,
        medicineName: name,
        dosage: med.dosage || "1 dose",
        instructions,
        duration,
        slot,
        slotLabel,
        timeStr,
        dateStr: todayStr,
        dayLabel: "Today",
        status: takenToday ? "taken" : "upcoming",
        takenAt: takenTime,
        genericAlternative: alternative,
        savings,
        doctorName: prescription.doctor_name,
      });

      // Tomorrow's planned dose
      tomorrowDoses.push({
        id: `tomorrow_${name}_${slot}`,
        medicineName: name,
        dosage: med.dosage || "1 dose",
        instructions,
        duration,
        slot,
        slotLabel,
        timeStr,
        dateStr: tomorrowStr,
        dayLabel: "Tomorrow",
        status: "upcoming",
        genericAlternative: alternative,
        savings,
        doctorName: prescription.doctor_name,
      });
    });

    const completedCount = todayDoses.filter((d) => d.status === "taken").length;
    const totalTodayCount = todayDoses.length;

    // Find next upcoming dose for today
    const upcomingToday = todayDoses.find((d) => d.status === "upcoming");
    let nextDose: MedicationScheduleItem | null = null;
    let bannerState: "UPCOMING" | "DUE_NOW" | "ALL_COMPLETED" | "NO_ACTIVE_RX" = "UPCOMING";

    if (upcomingToday) {
      nextDose = upcomingToday;
      bannerState = "UPCOMING";
    } else if (totalTodayCount > 0 && completedCount === totalTodayCount) {
      // All completed for today! Next dose is tomorrow morning
      nextDose = tomorrowDoses[0] || null;
      bannerState = "ALL_COMPLETED";
    } else {
      nextDose = tomorrowDoses[0] || null;
      bannerState = "UPCOMING";
    }

    return {
      todayDoses,
      tomorrowDoses,
      nextDose,
      bannerState,
      completedCount,
      totalTodayCount,
    };
  },
}));
