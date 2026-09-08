import React, { useState } from "react";
import { Bell, Clock, AlertCircle } from "lucide-react";
import { useMedicationStore, MedicationScheduleItem } from "../../../store/useMedicationStore";
import { MedicationProgress } from "./MedicationProgress";
import { MedicationDoseRow } from "./MedicationDoseRow";
import { MedicationCard } from "./MedicationCard";
import { MedicationDetailsDialog } from "./MedicationDetailsDialog";

interface MedicationScheduleProps {
  prescription: any;
  onShowToast: (msg: string) => void;
}

export const MedicationSchedule: React.FC<MedicationScheduleProps> = ({
  prescription,
  onShowToast,
}) => {
  const {
    markAsTaken,
    remindersEnabled,
    setRemindersEnabled,
    generateScheduleFromRx,
  } = useMedicationStore();

  const [selectedDetailMed, setSelectedDetailMed] = useState<any | null>(null);

  const {
    todayDoses,
    tomorrowDoses,
    completedCount,
    totalTodayCount,
  } = generateScheduleFromRx(prescription);

  const handleMarkDose = (med: MedicationScheduleItem) => {
    const res = markAsTaken(med.medicineName, med.slot, med.dateStr);
    onShowToast(`✓ Dose recorded. ${med.medicineName} marked as taken at ${res.timeStr}.`);
  };

  const handleToggleReminders = async () => {
    if (!remindersEnabled) {
      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            setRemindersEnabled(true);
            onShowToast("✓ Medicine reminders enabled on this device.");
          } else {
            setRemindersEnabled(true);
            onShowToast("Reminder preferences saved locally.");
          }
        } catch {
          setRemindersEnabled(true);
          onShowToast("Reminder preferences saved locally.");
        }
      } else {
        setRemindersEnabled(true);
        onShowToast("Reminder preferences saved locally.");
      }
    } else {
      setRemindersEnabled(false);
      onShowToast("Medicine reminders paused.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Indicator Section */}
      <MedicationProgress
        completedCount={completedCount}
        totalCount={totalTodayCount}
      />

      {/* Browser Reminders Opt-in */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Medication Reminders</div>
            <div className="text-[11px] text-slate-500">
              {remindersEnabled
                ? "Active on this device for upcoming dosage times."
                : "Receive timely reminders when doses are due."}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleReminders}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition flex-shrink-0 ${
            remindersEnabled
              ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
          }`}
        >
          {remindersEnabled ? "✓ Reminders Enabled" : "Enable Reminders"}
        </button>
      </div>

      {/* TODAY'S DOSES */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>TODAY</span>
          <span className="text-[11px] font-normal text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {todayDoses.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            No scheduled doses for today.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {todayDoses.map((dose) => (
              <MedicationDoseRow
                key={dose.id}
                dose={dose}
                onMarkAsTaken={handleMarkDose}
                showMarkButton={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* TOMORROW'S DOSES */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          TOMORROW
        </div>

        {tomorrowDoses.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            No scheduled doses for tomorrow.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tomorrowDoses.map((dose) => (
              <MedicationDoseRow
                key={dose.id}
                dose={dose}
                showMarkButton={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* STRUCTURED MEDICATION CARDS */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          PRESCRIBED MEDICINES ({prescription?.medicines?.length || 0})
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prescription?.medicines?.map((med: any, i: number) => (
            <MedicationCard
              key={i}
              medicine={med}
              onClick={() => setSelectedDetailMed(med)}
            />
          ))}
        </div>
      </div>

      {/* Medication Details Modal */}
      {selectedDetailMed && (
        <MedicationDetailsDialog
          medicine={selectedDetailMed}
          doctorName={prescription?.doctor_name}
          onClose={() => setSelectedDetailMed(null)}
        />
      )}
    </div>
  );
};
