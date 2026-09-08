import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock, ShieldCheck, ArrowRight, CheckCircle2, FileText, Home } from "lucide-react";

interface StepDef {
  id: number;
  label: string;
  activeDesc: string;
  doneDesc: string;
  pendingDesc: string;
}

const STEPS: StepDef[] = [
  {
    id: 1,
    label: "Patient Intake",
    activeDesc: "Verifying ABHA ID and encrypting case locally...",
    doneDesc: "Identity verified and case saved.",
    pendingDesc: "Pending",
  },
  {
    id: 2,
    label: "AI Translation",
    activeDesc: "Translating symptoms and extracting vitals...",
    doneDesc: "Gemini clinical translation complete.",
    pendingDesc: "Pending",
  },
  {
    id: 3,
    label: "Smart Triage",
    activeDesc: "Assessing clinical risk & vital thresholds...",
    doneDesc: "Priority score assigned.",
    pendingDesc: "Pending",
  },
  {
    id: 4,
    label: "Doctor Dispatch",
    activeDesc: "Routing case to specialist queue...",
    doneDesc: "Dispatched to telemedicine network.",
    pendingDesc: "Pending",
  },
  {
    id: 5,
    label: "Care Routing",
    activeDesc: "Resolving nearest Jan Aushadhi & hospital...",
    doneDesc: "GPS referral points resolved.",
    pendingDesc: "Pending",
  },
];

interface CompactSubmissionStepperProps {
  isOpen: boolean;
  patientName?: string;
  abhaId?: string;
  caseId?: string;
  department?: string;
  priority?: string;
  isOffline?: boolean;
  onViewCase: () => void;
  onGoHome: () => void;
  onClose?: () => void;
}

export const CompactSubmissionStepper: React.FC<CompactSubmissionStepperProps> = ({
  isOpen,
  patientName = "Patient",
  abhaId = "",
  caseId = "24",
  department = "General Medicine",
  priority = "Medium",
  isOffline = false,
  onViewCase,
  onGoHome,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [submittedTime, setSubmittedTime] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setIsCompleted(false);
      return;
    }

    setSubmittedTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );

    const t1 = setTimeout(() => setCurrentStep(2), 500);
    const t2 = setTimeout(() => setCurrentStep(3), 1100);
    const t3 = setTimeout(() => setCurrentStep(4), 1700);
    const t4 = setTimeout(() => setCurrentStep(5), 2300);
    const t5 = setTimeout(() => {
      setIsCompleted(true);
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[420px] max-h-[520px] p-6 flex flex-col justify-between overflow-y-auto animate-in zoom-in-95 duration-200"
        style={{ width: "calc(100vw - 32px)", maxWidth: "420px" }}
      >
        {!isCompleted ? (
          /* Processing State: Compact 5-step Stepper */
          <div>
            {/* Header */}
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  {isOffline ? "Offline Queue Encryption" : "Clinical Pipeline Active"}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Processing Case</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {patientName} {abhaId ? `• ABHA: ${abhaId}` : ""}
              </p>
            </div>

            {/* Stepper Rows */}
            <div className="flex flex-col gap-2.5 my-2">
              {STEPS.map((step, idx) => {
                const isStepDone = currentStep > step.id;
                const isStepActive = currentStep === step.id;
                const isLast = idx === STEPS.length - 1;

                return (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Node and vertical connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                          isStepDone
                            ? "bg-teal-600 text-white shadow-sm"
                            : isStepActive
                            ? "bg-teal-50 border-2 border-teal-600 text-teal-700 ring-4 ring-teal-100"
                            : "bg-slate-100 border border-slate-300 text-slate-400"
                        }`}
                      >
                        {isStepDone ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : isStepActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      {!isLast && (
                        <div
                          className={`w-0.5 h-6 my-0.5 transition-colors duration-300 ${
                            isStepDone ? "bg-teal-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="flex-1 pb-1">
                      <div
                        className={`text-xs font-bold leading-none ${
                          isStepActive
                            ? "text-teal-900"
                            : isStepDone
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div
                        className={`text-[11px] mt-1 transition-colors ${
                          isStepActive
                            ? "text-teal-700 font-medium"
                            : isStepDone
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        {isStepDone
                          ? step.doneDesc
                          : isStepActive
                          ? step.activeDesc
                          : step.pendingDesc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Step {Math.min(5, currentStep)} of 5</span>
              <span>Encrypted via AES-256</span>
            </div>
          </div>
        ) : (
          /* Submission Success State (Requirement 8) */
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg">Case Submitted</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isOffline
                ? `Patient case #${caseId} is saved securely on this device and will sync automatically when online.`
                : `Patient case #${caseId} has been securely sent to the specialist queue.`}
            </p>

            {/* Metadata Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 my-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px]">
                  {isOffline ? "Pending Sync" : "Waiting for Doctor Review"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    priority === "High"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : priority === "Medium"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {priority} Priority
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="font-medium text-slate-700">{submittedTime}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={onViewCase}
                className="btn-clinical-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-1.5 font-bold shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>View Case Details</span>
              </button>

              <button
                onClick={onGoHome}
                className="btn-clinical-outline text-xs py-2.5 px-4 w-full flex items-center justify-center gap-1.5 font-semibold"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
