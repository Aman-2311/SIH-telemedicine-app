import React from "react";
import { Check, Clock, AlertTriangle } from "lucide-react";

interface DoseStatusProps {
  status: "taken" | "upcoming" | "missed" | "due";
  takenAt?: string;
}

export const DoseStatus: React.FC<DoseStatusProps> = ({ status, takenAt }) => {
  if (status === "taken") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <Check className="w-3.5 h-3.5" />
        <span>Taken {takenAt ? `at ${takenAt}` : ""}</span>
      </span>
    );
  }

  if (status === "missed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Missed</span>
      </span>
    );
  }

  // Upcoming / Scheduled
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
      <Clock className="w-3.5 h-3.5" />
      <span>Upcoming</span>
    </span>
  );
};
