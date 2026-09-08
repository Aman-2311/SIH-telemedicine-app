import React, { useState, useRef, useEffect } from "react";
import { Search, X, User, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { SubmittedIntakeRecord } from "../../../store/useIntakeStore";

interface GlobalPatientSearchProps {
  intakes: SubmittedIntakeRecord[];
  onSelectCase: (intake: SubmittedIntakeRecord) => void;
}

export const GlobalPatientSearch: React.FC<GlobalPatientSearchProps> = ({
  intakes,
  onSelectCase,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? intakes.filter((item) => {
        const q = query.toLowerCase();
        const name = String(item.patient_name || "").toLowerCase();
        const abha = String(item.abha_id || "").toLowerCase();
        const id = String(item.id || "").toLowerCase();
        const dept = String(item.department || "").toLowerCase();
        return name.includes(q) || abha.includes(q) || id.includes(q) || dept.includes(q);
      })
    : [];

  const handleSelect = (item: SubmittedIntakeRecord) => {
    onSelectCase(item);
    setQuery("");
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Mobile Search Icon button when not expanded */}
      <div className="patient-header-search-mobile">
        {!isMobileExpanded ? (
          <button
            onClick={() => {
              setIsMobileExpanded(true);
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
            title="Search patients"
          >
            <Search className="w-4 h-4" />
          </button>
        ) : (
          <div className="fixed inset-x-0 top-0 z-50 bg-white border-b border-slate-200 p-3 shadow-md flex items-center gap-2 animate-in slide-in-from-top-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search patients, ABHA ID, case ID..."
              className="w-full text-xs text-slate-800 bg-transparent border-none outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setIsMobileExpanded(false);
                setIsOpen(false);
                setQuery("");
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop / Tablet Compact Search Input */}
      <div className="patient-header-search-desktop">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="global-patient-search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder="Search patients, ABHA ID, case ID..."
            className="w-64 lg:w-80 h-9 pl-9 pr-8 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-800 rounded-xl border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 lg:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 ${
            isMobileExpanded ? "fixed top-14 left-3 right-3 w-auto" : ""
          }`}
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Search results</span>
            <span>{filtered.length} found</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No patients found matching "{query}"
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-3 hover:bg-teal-50/60 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {item.patient_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.triage_priority === "High"
                            ? "bg-rose-50 text-rose-700"
                            : item.triage_priority === "Medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.triage_priority}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      ABHA: {item.abha_id}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{item.department || "General Medicine"}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
