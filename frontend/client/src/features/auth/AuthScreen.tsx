import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { UserRole } from "../../utils/api";
import { DoctorOnboarding } from "./DoctorOnboarding";

interface AuthScreenProps {
  onSuccessRole?: (role: UserRole) => void;
  onLanguageChange?: (lang: "English" | "हिंदी" | "मराठी") => void;
  language?: "English" | "हिंदी" | "मराठी";
}

type Step = "splash" | "role" | "login" | "create" | "otp" | "success";

const ROLES = [
  { key: "asha" as const, icon: <Users className="w-6 h-6" />, label: "ASHA Worker", gradient: "linear-gradient(135deg, #0d9b86, #0fb891)" },
  { key: "doctor" as const, icon: <Stethoscope className="w-6 h-6" />, label: "Doctor", gradient: "linear-gradient(135deg, #123b50, #1a5c74)" },
  { key: "patient" as const, icon: <UserCheck className="w-6 h-6" />, label: "Patient", gradient: "linear-gradient(135deg, #15a28f, #3bbfa3)" },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccessRole,
  onLanguageChange,
  language = "English",
}) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>("splash");
  const [selectedRole, setSelectedRole] = useState<"asha" | "doctor" | "patient" | null>(null);
  const [phone, setPhone] = useState("9820012345");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp] = useState("1234");
  const [isCreating, setIsCreating] = useState(false);

  // Auto-advance splash → role
  useEffect(() => {
    if (step === "splash") {
      const t = setTimeout(() => setStep("role"), 2200);
      return () => clearTimeout(t);
    }
  }, [step]);

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

    // In demo, any OTP works
    if (isCreating) {
      // Actually generate dummy ID
      const { generateAbha } = useAuthStore.getState();
      const res = await generateAbha({
        full_name: fullName || "New User",
        phone_number: phone,
        role: selectedRole
      });
      if (res?.abha_id || res?.app_id) {
        setStep("success");
        setTimeout(() => onSuccessRole?.(selectedRole), 800);
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
        setTimeout(() => onSuccessRole?.(selectedRole), 800);
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
        <div className="auth-orb auth-orb--3" />
      </div>

      {/* ─── SPLASH ─── */}
      {step === "splash" && (
        <div className="auth-splash">
          <div className="auth-splash__icon">
            <HeartPulse className="w-10 h-10" />
          </div>
          <h1 className="auth-splash__title">SAHARA</h1>
          <p className="auth-splash__sub">Health Bridge</p>
          <div className="auth-splash__loader">
            <span />
          </div>
        </div>
      )}

      {/* ─── ROLE SELECT ─── */}
      {step === "role" && (
        <div className="auth-card auth-card--wide fade-in">
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
          <p className="auth-card__sub">
            {language === "English" && "Rural telemedicine for everyone"}
            {language === "हिंदी" && "सभी के लिए ग्रामीण टेलीमेडिसिन"}
            {language === "मराठी" && "सर्वांसाठी ग्रामीण टेलिमेडिसिन"}
          </p>

          <div className="auth-card__label">
            {language === "English" ? "Continue as" : language === "हिंदी" ? "जारी रखें" : "म्हणून पुढे जा"}
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
                <span className="role-btn__label">{r.label}</span>
                <ArrowRight className="w-4 h-4 role-btn__arrow" />
              </button>
            ))}
          </div>

          <div className="auth-card__trust">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ABDM Certified • End-to-End Encrypted</span>
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
            {language === "English" ? "Enter your mobile number to continue" : language === "हिंदी" ? "जारी रखने के लिए मोबाइल नंबर दर्ज करें" : "पुढे जाण्यासाठी मोबाइल नंबर टाका"}
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
              {language === "English" ? "Mobile Number" : language === "हिंदी" ? "मोबाइल नंबर" : "मोबाइल नंबर"}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-prefix">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { clearError(); setPhone(e.target.value); }}
                placeholder="98200 12345"
                maxLength={10}
                autoFocus
              />
            </div>

            <div className="auth-demo-note">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedRole === "asha" && "Test Account: Sunita Patil (TEST) • TEST-ASHA-MH-0001"}
                {selectedRole === "patient" && "Test Account: Savita Patil (TEST) • TEST-PATIENT-MH-0002"}
                {selectedRole === "doctor" && "Test Account: Dr. Arvind Kulkarni (MD) • DOC-MH-7001"}
              </span>
            </div>

            <button type="submit" className="auth-cta-btn" disabled={isLoading || phone.length < 10}>
              {isLoading ? <RefreshCw className="w-4 h-4 spin" /> : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="auth-create-link-row">
              <button type="button" className="auth-create-link-btn" onClick={() => setStep("create")}>
                {language === "English" ? "Don't have a SAHARA ID? Create one" : "SAHARA ID नहीं है? नया बनाएं"}
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
              phone_number: phone || "9820012345",
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
            {language === "English" ? "Create SAHARA ID" : language === "हिंदी" ? "SAHARA ID बनाएं" : "SAHARA ID तयार करा"}
          </h2>
          <p className="auth-card__sub">
            {language === "English" ? "Generate a new digital health identity" : "नई डिजिटल स्वास्थ्य पहचान बनाएं"}
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
                placeholder="Savita Patil"
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
                placeholder="98200 12345"
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
            {language === "English" ? "Verify OTP" : language === "हिंदी" ? "OTP सत्यापित करें" : "OTP सत्यापित करा"}
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
          <h2 className="auth-card__heading">Welcome!</h2>
          <p className="auth-card__sub">Taking you to your dashboard…</p>
          <div className="auth-splash__loader" style={{ marginTop: 16 }}>
            <span />
          </div>
        </div>
      )}
    </div>
  );
};
