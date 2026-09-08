import React, { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, GraduationCap, Plus, Building2, UserCircle } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

interface DoctorOnboardingProps {
  onBack: () => void;
  onComplete: () => void;
}

type OnboardingStep = "hpr" | "qualifications";

export const DoctorOnboarding: React.FC<DoctorOnboardingProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>("hpr");
  const [hprId, setHprId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Qualification State
  const [qualifications] = useState([
    { degree: "MBBS", institution: "Government Medical College", year: "2014" },
    { degree: "MD — General Medicine", institution: "Government Medical College", year: "2017" },
  ]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hprId) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1500);
  };

  const handleNext = () => {
    if (step === "hpr") setStep("qualifications");
    else if (step === "qualifications") {
      // In next steps we would go to Step 5 (Facility Association)
      // For now, let's complete or mock further completion
      onComplete();
    }
  };

  return (
    <div className="auth-card auth-card--wide fade-in" style={{ maxWidth: 500 }}>
      <button className="auth-back" onClick={step === "hpr" ? onBack : () => setStep("hpr")}>
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* ─── HPR VERIFICATION ─── */}
      {step === "hpr" && (
        <div className="fade-in">
          <div className="auth-card__logo" style={{ marginBottom: 16 }}>
            <div className="auth-card__logo-circle" style={{ background: "linear-gradient(135deg, #123b50, #1a5c74)" }}>
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <h2 className="auth-card__heading" style={{ fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            Verify Professional Identity
          </h2>
          <p className="auth-card__sub" style={{ marginBottom: 24 }}>
            Enter your Healthcare Professional Registry (HPR) ID to verify your credentials.
          </p>

          {!isVerified ? (
            <form onSubmit={handleVerify} className="auth-form-inner">
              <label className="auth-field-label">Enter HPR / HP-ID</label>
              <div className="auth-input-wrap">
                <input
                  type="text"
                  value={hprId}
                  onChange={(e) => setHprId(e.target.value.toUpperCase())}
                  placeholder="HPR-XXXXXXXX"
                  autoFocus
                />
              </div>

              <button type="submit" className="auth-cta-btn" disabled={isVerifying || !hprId}>
                {isVerifying ? "Verifying..." : "Verify Identity"}
              </button>

              <div style={{ marginTop: 20, padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", fontSize: "0.8rem", color: "var(--muted)" }}>
                <strong>Prototype verification flow</strong>
                <br />
                ABDM integration ready
              </div>
            </form>
          ) : (
            <div className="fade-in" style={{ textAlign: "left", marginTop: 20 }}>
              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(15, 184, 145, 0.1)", border: "1px solid rgba(15, 184, 145, 0.3)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "var(--teal)", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck className="w-5 h-5" /> HPR Verification Successful
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--text)" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--teal)" }} /> Professional identity found
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--text)" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--teal)" }} /> Registration information available
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--text)" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--teal)" }} /> Professional profile matched
                  </li>
                </ul>
                <div style={{ marginTop: 16, fontSize: "0.75rem", color: "var(--muted)", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
                  Verification source: <strong>Healthcare Professionals Registry (ABDM)</strong>
                </div>
              </div>

              <button className="auth-cta-btn" onClick={handleNext} style={{ marginTop: 24 }}>
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── QUALIFICATIONS ─── */}
      {step === "qualifications" && (
        <div className="fade-in">
          <div className="auth-card__logo" style={{ marginBottom: 16 }}>
            <div className="auth-card__logo-circle" style={{ background: "linear-gradient(135deg, #15a28f, #3bbfa3)" }}>
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <h2 className="auth-card__heading" style={{ fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            Qualifications
          </h2>
          <p className="auth-card__sub" style={{ marginBottom: 24 }}>
            Your credentials securely imported from HPR.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {qualifications.map((q, idx) => (
              <div key={idx} style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--teal)", marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem" }}>{q.degree}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: 4 }}>{q.institution}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Class of {q.year}</div>
                </div>
              </div>
            ))}
          </div>

          <button style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, background: "transparent", border: "1px dashed var(--border-color)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <Plus className="w-4 h-4" /> Add Qualification
          </button>

          <button className="auth-cta-btn" onClick={handleNext} style={{ marginTop: 24 }}>
            Confirm Qualifications <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
