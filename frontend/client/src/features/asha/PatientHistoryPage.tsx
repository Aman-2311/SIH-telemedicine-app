import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Users,
  Plus,
  Filter,
} from "lucide-react";
import { SubmittedIntakeRecord } from "../../store/useIntakeStore";

interface PatientHistoryPageProps {
  intakes: SubmittedIntakeRecord[];
  onSelectCase: (intake: SubmittedIntakeRecord) => void;
  onNewIntake: () => void;
}

type FilterType = "all" | "active" | "completed" | "pending_sync";

export const PatientHistoryPage: React.FC<PatientHistoryPageProps> = ({
  intakes,
  onSelectCase,
  onNewIntake,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const filtered = intakes.filter((item) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        String(item.patient_name || "").toLowerCase().includes(q) ||
        String(item.abha_id || "").toLowerCase().includes(q) ||
        String(item.id || "").toLowerCase().includes(q) ||
        String(item.department || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    // Tab filter match
    if (selectedFilter === "active") {
      return !item.synced || item.triage_priority === "High";
    }
    if (selectedFilter === "completed") {
      return item.synced;
    }
    if (selectedFilter === "pending_sync") {
      return !item.synced;
    }
    return true;
  });

  return (
    <div className="page fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View previous consultations and case outcomes.
          </p>
        </div>

        <button
          onClick={onNewIntake}
          className="btn-clinical-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Patient Intake</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-5 space-y-3">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, ABHA ID, or department..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
              selectedFilter === "all"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Cases ({intakes.length})
          </button>

          <button
            onClick={() => setSelectedFilter("active")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
              selectedFilter === "active"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Active & High Priority
          </button>

          <button
            onClick={() => setSelectedFilter("completed")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
              selectedFilter === "completed"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Completed / Synced ({intakes.filter((i) => i.synced).length})
          </button>

          <button
            onClick={() => setSelectedFilter("pending_sync")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
              selectedFilter === "pending_sync"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Pending Sync ({intakes.filter((i) => !i.synced).length})
          </button>
        </div>
      </div>

      {/* Case Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            No patient history yet
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Completed consultations will appear here once recorded.
          </p>
          <button
            onClick={onNewIntake}
            className="btn-clinical-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Intake</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isHigh = item.triage_priority === "High";

            return (
              <div
                key={item.id}
                onClick={() => onSelectCase(item)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-500 shadow-sm hover:shadow transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(item.patient_name || "P")[0].toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {item.patient_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isHigh
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : item.triage_priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.triage_priority} Priority
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      ABHA: {item.abha_id} • {item.department || "General Medicine"}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Last consultation: {item.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-none border-slate-100">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      item.synced
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {item.synced ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{item.synced ? "Completed" : "Pending Sync"}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCase(item);
                    }}
                    className="btn-clinical-outline text-xs py-1.5 px-3 flex items-center gap-1 font-semibold group-hover:border-teal-500 group-hover:text-teal-800"
                  >
                    <span>View Case</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
