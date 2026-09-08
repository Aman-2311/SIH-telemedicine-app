import React from "react";
import {
  ArrowLeft,
  User,
  Heart,
  Gauge,
  Thermometer,
  Activity,
  ShieldCheck,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Pill,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { SubmittedIntakeRecord } from "../../store/useIntakeStore";
import { Facility } from "../../utils/api";

interface PatientCaseDetailViewProps {
  intake: SubmittedIntakeRecord;
  onBack: () => void;
  onNavigateToMap?: (facilityId?: string) => void;
}

export const PatientCaseDetailView: React.FC<PatientCaseDetailViewProps> = ({
  intake,
  onBack,
  onNavigateToMap,
}) => {
  const isHigh = intake.triage_priority === "High";
  const isSynced = intake.synced;
  const vitals = intake.vitals || ({} as any);

  // Derive status label strictly following case status model
  const statusLabel = isSynced ? "Synced to Doctor" : "Pending Sync";

  return (
    <div className="page fade-in pb-16 max-w-4xl mx-auto">
      {/* Top Back Nav & Case Number */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 p-1.5 rounded-lg hover:bg-teal-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>

        <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          Case ID: #{intake.id.replace("case-", "").slice(0, 8)}
        </span>
      </div>

      {/* ── 1. PATIENT HEADER ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
              {(intake.patient_name || "P")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {intake.patient_name}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isHigh
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : intake.triage_priority === "Medium"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {intake.triage_priority} Priority
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>ABHA: <strong>{intake.abha_id}</strong></span>
                <span>•</span>
                <span>{intake.department || "General Medicine"}</span>
                <span>•</span>
                <span>{intake.timestamp}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                isSynced
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {isSynced ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{statusLabel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. RECORDED VITALS (Only actual values) ── */}
      <div className="mb-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Recorded Vitals
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {vitals.bp && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Blood Pressure</div>
                <div className="text-sm font-bold text-slate-900">{vitals.bp} mmHg</div>
              </div>
            </div>
          )}

          {vitals.pulse && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Pulse Rate</div>
                <div className="text-sm font-bold text-slate-900">{vitals.pulse} bpm</div>
              </div>
            </div>
          )}

          {vitals.temp && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Body Temp</div>
                <div className="text-sm font-bold text-slate-900">{vitals.temp}°F</div>
              </div>
            </div>
          )}

          {vitals.spo2 && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">SpO₂ Oxygen</div>
                <div className="text-sm font-bold text-slate-900">{vitals.spo2}%</div>
              </div>
            </div>
          )}

          {!vitals.bp && !vitals.pulse && !vitals.temp && !vitals.spo2 && (
            <div className="col-span-full p-4 bg-slate-50 text-slate-500 rounded-xl border border-slate-200 text-xs italic">
              No specific vitals were recorded for this intake.
            </div>
          )}
        </div>
      </div>

      {/* ── 3. SYMPTOMS & CLINICAL TRANSLATION ── */}
      <div className="mb-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Symptom Dictation & Translation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                <span>Original Statement</span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  Local Speech
                </span>
              </div>
              <p className="text-xs text-slate-800 italic leading-relaxed font-sans">
                "{intake.symptoms || "Symptom note recorded via voice"}"
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 p-4 rounded-xl border border-teal-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-teal-900 mb-1.5 flex items-center justify-between">
                <span>AI Clinical Translation</span>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                  Gemini Clinical NLP
                </span>
              </div>
              <p className="text-xs text-slate-900 font-medium leading-relaxed">
                {intake.translated_symptoms || intake.symptoms}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. AI TRIAGE & NOTE ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">AI Triage Assessment</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isHigh ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              Priority: {intake.triage_priority}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Department: {intake.department || "General Medicine"}</span>
        </div>

        {intake.ai_recommendation && (
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mb-3">
            {intake.ai_recommendation}
          </p>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>AI-assisted triage. Clinical decisions are made by the consulting doctor.</span>
        </div>
      </div>

      {/* ── 5. DOCTOR CONSULTATION / CARE PLAN ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Consultation & Doctor Review
        </h3>

        {/* Doctor Summary List / Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">DOCTOR</span>
            <span className="font-bold text-slate-800">
              {isSynced ? "Dr. Arvind Kulkarni" : "Waiting for specialist assignment"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">SPECIALITY / FACILITY</span>
            <span className="font-medium text-slate-700">
              {isSynced ? "Cardiology • Sub-District Hospital" : "Awaiting assignment"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">CONSULTATION STATUS</span>
            <span className={`font-bold ${intake.status === "completed" ? "text-emerald-700" : "text-amber-700"}`}>
              {intake.status === "completed" ? "✓ Reviewed • Prescription Ready" : "Queued for Doctor Review"}
            </span>
          </div>
        </div>

        {/* Treatment Plan if completed with real prescription */}
        {intake.status === "completed" && intake.prescription?.diagnosis ? (
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Treatment Plan</span>
              {intake.prescription?.doctor_name && (
                <span className="text-[11px] font-normal text-slate-500">
                  By {intake.prescription.doctor_name}
                </span>
              )}
            </div>
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div>
                <span className="font-bold text-emerald-950 block mb-0.5">Diagnosis:</span>
                <span className="text-emerald-900 font-medium">
                  {intake.prescription.diagnosis}
                </span>
              </div>
              {intake.prescription.medicines && intake.prescription.medicines.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <span className="font-bold text-emerald-950 block mb-1">Prescribed Medicines:</span>
                  <ul className="list-disc list-inside text-emerald-900 space-y-0.5 font-medium">
                    {intake.prescription.medicines.map((med: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-bold">{med.name}</span> ({med.dosage} • {med.duration})
                        {med.generic_alternative && (
                          <span className="text-emerald-700 block text-[11px] pl-4">
                            ↳ Alternative: {med.generic_alternative}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {intake.prescription.notes && (
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800">
                  <span className="font-bold">Doctor's Advice: </span>
                  {intake.prescription.notes}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
            Prescription and treatment plan will appear once the consulting doctor finishes clinical review.
          </div>
        )}
      </div>

      {/* ── 6. WHERE TO GO NEXT (Care Destination Section) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Where to Go Next
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recommended healthcare facility for medications & follow-up care.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nearest PMBJP Jan Aushadhi Pharmacy */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Generic Pharmacy (80% Off)
                </span>
                <span className="text-xs font-bold text-emerald-900">0.8 km</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">PMBJP Jan Aushadhi Kendra</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Main Market Road, Near Panchayat Office
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/50 flex items-center justify-between">
              <button
                onClick={() => onNavigateToMap && onNavigateToMap()}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
              <a
                href="https://www.google.com/maps/search/Jan+Aushadhi+Kendra"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* District Civil Hospital or PHC */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                  Emergency & Inpatient
                </span>
                <span className="text-xs font-bold text-slate-800">2.9 km</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">District Civil Hospital</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Civil Lines, 24/7 Casualty & Diagnostic Lab
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => onNavigateToMap && onNavigateToMap()}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
              <a
                href="https://www.google.com/maps/search/District+Hospital"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
