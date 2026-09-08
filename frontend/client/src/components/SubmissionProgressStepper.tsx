import React, { useEffect, useState } from "react";
import { Check, ShieldCheck, Sparkles, Navigation, ArrowRight } from "lucide-react";
import { GeminiIcon } from "./GeminiIcon";

export interface StepperStep {
  id: number;
  title: string;
  subtitle: string;
  badge?: string;
  icon?: React.ReactNode;
}

const DEFAULT_STEPS: StepperStep[] = [
  {
    id: 1,
    title: "Patient Intake & Offline Vault",
    subtitle: "ABHA Identity verified & encrypted locally in Dexie.js offline store",
    badge: "Offline-First",
  },
  {
    id: 2,
    title: "Universal Gemini 3.6 Flash NLP",
    subtitle: "Spoken Hindi/Marathi translated into clinical English & vitals extracted",
    badge: "Gemini AI",
  },
  {
    id: 3,
    title: "Smart Triage & Doctor Dispatch",
    subtitle: "Priority score assigned & routed to Urban Specialist Telemedicine queue",
    badge: "Clinical Triage",
  },
  {
    id: 4,
    title: "Geospatial Care & Map Routing",
    subtitle: "Haversine GPS routing resolved for nearest Jan Aushadhi & District Hospital",
    badge: "Live GPS",
  },
];

interface SubmissionProgressStepperProps {
  patientName?: string;
  abhaId?: string;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

export const SubmissionProgressStepper: React.FC<SubmissionProgressStepperProps> = ({
  patientName = "Patient",
  abhaId = "",
  isOpen,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setIsFinished(false);
      return;
    }

    // Sequentially advance steps to visually demonstrate the 4-phase telemedicine pipeline
    const t1 = setTimeout(() => setCurrentStep(2), 600);
    const t2 = setTimeout(() => setCurrentStep(3), 1300);
    const t3 = setTimeout(() => setCurrentStep(4), 2000);
    const t4 = setTimeout(() => {
      setIsFinished(true);
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 750);
      return () => clearTimeout(finishTimer);
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="stepper-overlay fade-in">
      <div className="stepper-modal scale-in">
        {/* Header */}
        <div className="stepper-modal-header">
          <div className="stepper-header-badge">
            <span className="stepper-header-dot" />
            <span>Asynchronous Clinical Pipeline Active</span>
          </div>
          <h2 className="stepper-modal-title">Submitting Patient Case</h2>
          <p className="stepper-modal-sub">
            Patient: <strong style={{ color: "#0f172a" }}>{patientName}</strong> {abhaId ? `• ABHA: ${abhaId}` : ""}
          </p>
        </div>

        {/* Vertical Stepper List (matching visual design) */}
        <div className="vertical-stepper-list">
          {DEFAULT_STEPS.map((step, index) => {
            const isCompleted = isFinished || currentStep > step.id;
            const isActive = !isFinished && currentStep === step.id;
            const isLast = index === DEFAULT_STEPS.length - 1;

            return (
              <div key={step.id} className="stepper-row">
                {/* Left Indicator & Track */}
                <div className="stepper-indicator-col">
                  <div
                    className={`stepper-node ${
                      isCompleted
                        ? "stepper-node--completed"
                        : isActive
                        ? "stepper-node--active"
                        : "stepper-node--pending"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    ) : isActive ? (
                      <div className="stepper-active-dot" />
                    ) : (
                      <div className="stepper-pending-dot" />
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`stepper-connector-line ${
                        isCompleted ? "stepper-connector-line--completed" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Right Content */}
                <div className={`stepper-content-col ${isActive ? "stepper-content-col--active" : ""}`}>
                  <div className="stepper-title-wrap">
                    <h4
                      className={`stepper-step-title ${
                        isCompleted
                          ? "stepper-step-title--completed"
                          : isActive
                          ? "stepper-step-title--active"
                          : "stepper-step-title--pending"
                      }`}
                    >
                      {step.title}
                    </h4>
                    {isActive && (
                      <span className="stepper-live-tag">PROCESSING</span>
                    )}
                    {isCompleted && (
                      <span className="stepper-done-tag">CONFIRMED</span>
                    )}
                  </div>
                  <p
                    className={`stepper-step-desc ${
                      isActive ? "stepper-step-desc--active" : ""
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div className="stepper-footer-box">
          {isFinished ? (
            <div className="stepper-success-state fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Navigation className="w-5 h-5 text-emerald-600 animate-bounce" />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#065f46" }}>
                  All 4 Telemedicine Phases Complete! Opening Geospatial Referral Map...
                </span>
              </div>
              <button
                onClick={onComplete}
                className="stepper-jump-btn"
              >
                <span>View Map Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="stepper-progress-state">
              <div className="stepper-pulse-loader" />
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#475569" }}>
                <GeminiIcon size={16} />
                <span>Executing Phase {currentStep} of 4 • Low-bandwidth JSON payload under 50KB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
