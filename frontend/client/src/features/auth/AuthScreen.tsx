import React, { useState } from "react";
import {
  Users,
  Stethoscope,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Phone,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { UserRole } from "../../utils/api";
import { DoctorOnboarding } from "./DoctorOnboarding";

interface AuthScreenProps {
  onSuccessRole?: (role: UserRole) => void;
  onLanguageChange?: (lang: "English" | "हिंदी" | "मराठी") => void;
  language?: "English" | "हिंदी" | "मराठी";
}

type Step = "role" | "login" | "create" | "otp" | "success";

const ROLES = [
  { key: "asha" as const, icon: <Users className="w-6 h-6" />, label: "ASHA Worker", subtitle: "Community Health Portal", gradient: "linear-gradient(135deg, #0d9b86, #0fb891)" },
  { key: "doctor" as const, icon: <Stethoscope className="w-6 h-6" />, label: "Doctor", subtitle: "Tele-Consultation Queue", gradient: "linear-gradient(135deg, #123b50, #1a5c74)" },
  { key: "patient" as const, icon: <UserCheck className="w-6 h-6" />, label: "Patient", subtitle: "Prescriptions & Records", gradient: "linear-gradient(135deg, #15a28f, #3bbfa3)" },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccessRole,
  onLanguageChange,
  language = "English",
}) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<"asha" | "doctor" | "patient" | null>(null);
  const [phone, setPhone] = useState("9000010001");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp] = useState("1234");
  const [isCreating, setIsCreating] = useState(false);

  const handleRolePick = (role: "asha" | "doctor" | "patient") => {
    clearError();
    setSelectedRole(role);
    if (role === "asha") {
      setPhone("9000010001");
      setFullName("Sunita Patil (TEST)");
    } else if (role === "patient") {
      setPhone("9000010002");
      setFullName("Savita Patil (TEST)");
    } else {
      setPhone("9000010003");
      setFullName("Dr. Arvind Kulkarni (MD)");
    }
    setStep("login");
  };

  const handleQuickLogin = async (role: "asha" | "patient" | "doctor") => {
    clearError();
    setSelectedRole(role);
    const canonicalId =
      role === "asha"
        ? "TEST-ASHA-MH-0001"
        : role === "patient"
        ? "TEST-PATIENT-MH-0002"
        : "DOC-MH-7001";

    const ok = await login({ abha_id: canonicalId, role });
    if (ok) {
      setStep("success");
      setTimeout(() => onSuccessRole?.(role), 500);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setOtp("");
    setIsCreating(false);
    setStep("otp");
  };

  const handleCreateId = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setOtp("");
    setIsCreating(true);
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!selectedRole) return;
    
    if (isCreating) {
      const { generateAbha } = useAuthStore.getState();
      const res = await generateAbha({
        full_name: fullName || "New User",
        phone_number: phone,
        role: selectedRole
      });
      if (res?.abha_id || res?.app_id) {
        setStep("success");
        setTimeout(() => onSuccessRole?.(selectedRole), 600);
      }
    } else {
      const canonicalId =
        selectedRole === "asha"
          ? "TEST-ASHA-MH-0001"
          : selectedRole === "patient"
          ? "TEST-PATIENT-MH-0002"
          : "DOC-MH-7001";

      const ok = await login({ abha_id: canonicalId, role: selectedRole });
      if (ok) {
        setStep("success");
        setTimeout(() => onSuccessRole?.(selectedRole), 600);
      }
    }
  };

  const handleAutoFillOtp = () => {
    setOtp(mockOtp);
  };

  return (
    <div className="auth-screen">
      {/* Animated background */}
      <div className="auth-screen__bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>

      {/* ─── ROLE SELECT / MAIN SIGN IN ─── */}
      {step === "role" && (
        <div className="auth-card auth-card--wide fade-in" style={{ maxWidth: 480 }}>
          {/* Lang switcher */}
          <div className="auth-card__lang">
            {(["English", "हिंदी", "मराठी"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLanguageChange?.(l)}
                className={`auth-lang-pill ${language === l ? "auth-lang-pill--active" : ""}`}
              >
                {l === "English" ? "EN" : l === "हिंदी" ? "हि" : "म"}
              </button>
            ))}
          </div>

          <div className="auth-card__logo">
            <div className="auth-card__logo-circle">
              <HeartPulse className="w-7 h-7" />
            </div>
          </div>

          <h2 className="auth-card__heading">Welcome to <em>SAHARA</em></h2>
          <p className="auth-card__sub" style={{ marginBottom: 16 }}>
            {language === "English" && "Rural Telemedicine & Digital Health Bridge"}
            {language === "हिंदी" && "ग्रामीण टेलीमेडिसिन और डिजिटल स्वास्थ्य सेतु"}
            {language === "मराठी" && "ग्रामीण टेलिमेडिसिन आणि डिजिटल आरोग्य सेतू"}
          </p>

          {/* Quick Demo Test Access */}
          <div style={{
            background: "linear-gradient(135deg, rgba(13, 155, 134, 0.08), rgba(18, 59, 80, 0.08))",
            border: "1px solid rgba(13, 155, 134, 0.25)",
            borderRadius: "14px",
            padding: "12px 14px",
            marginBottom: 20,
            textAlign: "left",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: "0.74rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--teal)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}>
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Quick Demo Sign-In
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600 }}>
                Safe Test Data
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Test User 1 - ASHA */}
              <button
                type="button"
                onClick={() => handleQuickLogin("asha")}
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>
                    👩‍⚕️ Sunita Patil (TEST)
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    ASHA Worker • ABHA: TEST-ASHA-MH-0001
                  </div>
                </div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--teal)" }}>
                  Enter →
                </span>
              </button>

              {/* Test User 2 - Patient */}
              <button
                type="button"
                onClick={() => handleQuickLogin("patient")}
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>
                    🩺 Savita Patil (TEST)
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    Patient Portal • ABHA: TEST-PATIENT-MH-0002
                  </div>
                </div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--teal)" }}>
                  Enter →
                </span>
              </button>

              {/* Doctor User */}
              <button
                type="button"
                onClick={() => handleQuickLogin("doctor")}
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>
                    👨‍⚕️ Dr. Arvind Kulkarni (MD)
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    Doctor Queue • Reg: DOC-MH-7001
                  </div>
                </div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--teal)" }}>
                  Enter →
                </span>
              </button>
            </div>
          </div>

          <div className="auth-card__label" style={{ textAlign: "left" }}>
            {language === "English" ? "Or Continue with Mobile / OTP" : "या मोबाइल / OTP द्वारे पुढे जा"}
          </div>

          <div className="role-select">
            {ROLES.map((r) => (
              <button
                key={r.key}
                className="role-btn"
                onClick={() => handleRolePick(r.key)}
              >
                <div className="role-btn__icon" style={{ background: r.gradient }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="role-btn__label">{r.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500 }}>
                    {r.subtitle}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 role-btn__arrow" />
              </button>
            ))}
          </div>

          <div className="auth-card__trust" style={{ marginTop: 20 }}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic JWT (HS256) • ABDM Compliant</span>
          </div>
        </div>
      )}

      {/* ─── PHONE LOGIN ─── */}
      {step === "login" && selectedRole && (
        <div className="auth-card fade-in">
          <button className="auth-back" onClick={() => { clearError(); setStep("role"); }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="auth-card__logo">
            <div className="auth-card__logo-circle" style={{ background: ROLES.find(r => r.key === selectedRole)?.gradient }}>
              {ROLES.find(r => r.key === selectedRole)?.icon}
            </div>
          </div>

          <h2 className="auth-card__heading">
            {language === "English" ? "Sign In" : language === "हिंदी" ? "साइन इन करें" : "साइन इन करा"}
          </h2>
          <p className="auth-card__sub">
            {language === "English" ? "Enter your mobile number to receive OTP" : "जारी रखने के लिए मोबाइल नंबर दर्ज करें"}
          </p>

          {error && (
            <div className="auth-error">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="auth-form-inner">
            <label className="auth-field-label">
              <Phone className="w-3.5 h-3.5" />
              {language === "English" ? "Mobile Number" : "मोबाइल नंबर"}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-prefix">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { clearError(); setPhone(e.target.value); }}
                placeholder="90000 10001"
                maxLength={10}
                autoFocus
              />
            </div>

            <div className="auth-demo-note">
              <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {selectedRole === "asha" && "Sunita Patil (TEST) • TEST-ASHA-MH-0001"}
                {selectedRole === "patient" && "Savita Patil (TEST) • TEST-PATIENT-MH-0002"}
                {selectedRole === "doctor" && "Dr. Arvind Kulkarni (MD) • DOC-MH-7001"}
              </span>
            </div>

            <button type="submit" className="auth-cta-btn" disabled={isLoading || phone.length < 10}>
              {isLoading ? <RefreshCw className="w-4 h-4 spin" /> : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
            </button>
            
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button type="button" onClick={() => setStep("create")} style={{ background: "transparent", color: "var(--teal)", fontSize: "0.85rem", fontWeight: 600 }}>
                {language === "English" ? "Need a new SAHARA ID? Create one" : "SAHARA ID नहीं है? नया बनाएं"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── CREATE ID ─── */}
      {step === "create" && selectedRole === "doctor" && (
        <DoctorOnboarding 
          onBack={() => { clearError(); setStep("login"); }} 
          onComplete={async () => {
            const { generateAbha } = useAuthStore.getState();
            await generateAbha({
              full_name: "Dr. Verified",
              phone_number: phone || "9000010003",
              role: "doctor"
            });
            setStep("success");
            setTimeout(() => onSuccessRole?.("doctor"), 800);
          }}
        />
      )}
      {step === "create" && selectedRole !== "doctor" && selectedRole && (
        <div className="auth-card fade-in">
          <button className="auth-back" onClick={() => { clearError(); setStep("login"); }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="auth-card__logo">
            <div className="auth-card__logo-circle" style={{ background: ROLES.find(r => r.key === selectedRole)?.gradient }}>
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>

          <h2 className="auth-card__heading">
            {language === "English" ? "Create SAHARA ID" : "SAHARA ID बनाएं"}
          </h2>
          <p className="auth-card__sub">
            {language === "English" ? "Generate a synthetic digital health identity" : "नई डिजिटल स्वास्थ्य पहचान बनाएं"}
          </p>

          <form onSubmit={handleCreateId} className="auth-form-inner">
            <label className="auth-field-label">
              <UserCheck className="w-3.5 h-3.5" />
              {language === "English" ? "Full Name" : "पूरा नाम"}
            </label>
            <div className="auth-input-wrap">
              <input
                type="text"
                value={fullName}
                onChange={(e) => { clearError(); setFullName(e.target.value); }}
                placeholder="Savita Patil (TEST)"
                required
              />
            </div>
            
            <label className="auth-field-label">
              <Phone className="w-3.5 h-3.5" />
              {language === "English" ? "Mobile Number" : "मोबाइल नंबर"}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-prefix">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { clearError(); setPhone(e.target.value); }}
                placeholder="90000 10002"
                maxLength={10}
                required
              />
            </div>

            <button type="submit" className="auth-cta-btn" disabled={isLoading || phone.length < 10 || !fullName}>
              {isLoading ? <RefreshCw className="w-4 h-4 spin" /> : <>Generate ID & Get OTP <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      )}

      {/* ─── OTP VERIFY ─── */}
      {step === "otp" && (
        <div className="auth-card fade-in">
          <button className="auth-back" onClick={() => { clearError(); setStep("login"); }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="auth-card__logo">
            <div className="auth-card__logo-circle" style={{ background: "linear-gradient(135deg, var(--teal), #0fb891)" }}>
              <Lock className="w-6 h-6" />
            </div>
          </div>

          <h2 className="auth-card__heading">
            {language === "English" ? "Verify OTP" : "OTP सत्यापित करें"}
          </h2>
          <p className="auth-card__sub">
            {language === "English" ? `Code sent to +91 ${phone}` : `+91 ${phone} पर कोड भेजा गया`}
          </p>

          {error && (
            <div className="auth-error">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="auth-form-inner">
            <label className="auth-field-label">
              <KeyRound className="w-3.5 h-3.5" />
              Enter 4-digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => { clearError(); setOtp(e.target.value.replace(/\D/g, "").slice(0, 4)); }}
              placeholder="● ● ● ●"
              className="auth-otp-input"
              maxLength={4}
              autoFocus
            />

            <button type="button" className="auth-autofill-btn" onClick={handleAutoFillOtp}>
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill Demo OTP ({mockOtp})
            </button>

            <button type="submit" className="auth-cta-btn" disabled={isLoading || otp.length < 4}>
              {isLoading ? <RefreshCw className="w-4 h-4 spin" /> : <>Verify & Enter <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      )}

      {/* ─── SUCCESS ─── */}
      {step === "success" && (
        <div className="auth-card auth-card--success fade-in">
          <div className="auth-success-orb">
            <CheckCircle2 className="w-12 h-12" />
            <div className="auth-success-ring" />
            <div className="auth-success-ring auth-success-ring--2" />
          </div>
          <h2 className="auth-card__heading">Signed In!</h2>
          <p className="auth-card__sub">Taking you to your dashboard…</p>
          <div className="auth-splash__loader" style={{ marginTop: 16 }}>
            <span />
          </div>
        </div>
      )}
    </div>
  );
};
