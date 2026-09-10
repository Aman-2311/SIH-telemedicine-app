import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Gauge,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Database,
  User,
  X,
  Volume2,
  ArrowRight,
  Info,
} from "lucide-react";
import { useIntakeStore } from "../../store/useIntakeStore";
import { useNetworkStore } from "../../store/useNetworkStore";
import { api, IntakeResponse } from "../../utils/api";
import { GeminiIcon } from "../../components/GeminiIcon";
import { CompactSubmissionStepper } from "./components/CompactSubmissionStepper";

interface VoiceIntakeFormProps {
  language?: "English" | "हिंदी" | "मराठी";
  onSuccessSubmitted?: (result: IntakeResponse | { offline: boolean }) => void;
  onViewCaseDetails?: (caseId?: string) => void;
  onGoHome?: () => void;
}

export const VoiceIntakeForm: React.FC<VoiceIntakeFormProps> = ({
  language = "English",
  onSuccessSubmitted,
  onViewCaseDetails,
  onGoHome,
}) => {
  const {
    abhaId,
    patientName,
    spokenText,
    translatedSymptoms,
    vitals,
    imageUrl,
    triagePriority,
    aiRecommendation,
    isListening,
    isExtracting,
    isSubmitting,
    lastSubmissionResult,
    error,
    setAbhaId,
    setPatientName,
    setSpokenText,
    setTranslatedSymptoms,
    setVitals,
    setImageUrl,
    setIsListening,
    extractVoiceAI,
    submitIntake,
    resetForm,
    clearError,
  } = useIntakeStore();

  const { isOnline } = useNetworkStore();

  const [activeSpeechLang, setActiveSpeechLang] = useState<"hi-IN" | "mr-IN" | "en-IN">(
    language === "हिंदी" ? "hi-IN" : language === "मराठी" ? "mr-IN" : "en-IN"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [showStepper, setShowStepper] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (language === "हिंदी") setActiveSpeechLang("hi-IN");
    else if (language === "मराठी") setActiveSpeechLang("mr-IN");
    else setActiveSpeechLang("en-IN");
  }, [language]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicNotice("Speech recognition is not natively supported in this browser. Use Quick Test chips or type text.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeSpeechLang;

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSpokenText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const errType = event?.error;
        if (errType === "not-allowed" || errType === "service-not-allowed") {
          setMicNotice("Microphone permission was blocked. You can use the 1-click Quick Test chips below to test Gemini AI translation.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      // ignore
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [activeSpeechLang, setIsListening, setSpokenText]);

  const handleToggleMic = () => {
    clearError();
    setMicNotice(null);
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);

      if (spokenText.trim()) {
        void extractVoiceAI(spokenText);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = activeSpeechLang;
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch {
                setIsListening(false);
                setMicNotice("Could not start microphone. Click a Quick Test chip to test Gemini translation.");
              }
            }, 100);
          } catch {
            setIsListening(false);
          }
        }
      } else {
        setMicNotice("Microphone API unavailable. Click a Quick Test chip below to simulate voice dictation.");
      }
    }
  };

  const handleManualExtract = () => {
    if (!spokenText.trim() || isExtracting) return;
    void extractVoiceAI(spokenText);
  };

  const handleSimulateDemo = (sampleText: string) => {
    setSpokenText(sampleText);
    clearError();
    setMicNotice(null);
    void extractVoiceAI(sampleText);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setUploadedFileName(file.name);

    // Immediate local preview so the user gets instant visual response
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Base64 fallback (held in store for offline sync)
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setImageUrl(b64);
    };
    reader.readAsDataURL(file);

    // Direct upload to Supabase Storage if online
    if (navigator.onLine) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data?.status === "success" && res.data?.data?.url) {
          const supabaseUrl = res.data.data.url;
          setImageUrl(supabaseUrl);
          setImagePreview(supabaseUrl);
        }
      } catch (err: any) {
        console.warn("Direct Supabase storage upload deferred to intake submission:", err);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview(null);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!abhaId || !patientName) {
      alert("Please provide both Patient Name and ABHA ID before submitting.");
      return;
    }
    if (!translatedSymptoms && !spokenText) {
      alert("Please dictate symptoms or select a Quick Test chip.");
      return;
    }

    // Launch the 4-phase vertical submission progress stepper
    setShowStepper(true);
    const res = await submitIntake();
    if (res?.data?.case_id || res?.data?.id) {
      setSubmittedCaseId(String(res.data.case_id || res.data.id));
    }
  };

  const handleStepperComplete = () => {
    setShowStepper(false);
    resetForm();
    setImagePreview(null);
    setUploadedFileName(null);
    if (onSuccessSubmitted) {
      onSuccessSubmitted({ offline: !isOnline });
    }
  };

  return (
    <div className="voice-intake-container fade-in">
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="form-header-bar">
        <div>
          <h2 className="form-header-title">
            {language === "English" ? "Clinical Patient Intake" : "रोगी प्रवेश एवं परीक्षण"}
          </h2>
          <p className="form-header-sub">
            {language === "English"
              ? "Speech-to-Clinical Translation & Automated Triage"
              : "वाक्-से-नैदानिक अनुवाद एवं स्वचालित प्राथमिकता"}
          </p>
        </div>

        <div className="gemini-powered-pill">
          <GeminiIcon size={16} />
          <span>Gemini 3.6 Flash Engine</span>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner--red">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div style={{ flex: 1, fontSize: "0.85rem" }}>
            <strong>System Notice:</strong> {error}
          </div>
          <button onClick={clearError} className="alert-close-btn">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {micNotice && (
        <div className="alert-banner" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
          <Info className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <div style={{ flex: 1, fontSize: "0.83rem" }}>
            {micNotice}
          </div>
          <button onClick={() => setMicNotice(null)} className="alert-close-btn">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── PATIENT IDENTIFIERS CARD ── */}
      <div className="glass-panel">
        <div className="panel-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === "English" ? "Patient Demographic & ABHA Identity" : "मरीज विवरण एवं आभा पहचान"}</span>
          </div>
        </div>
        <div className="form-two-col">
          <div className="clean-input-group">
            <label className="clean-input-label">Patient Full Name *</label>
            <div className="clean-input-wrap">
              <User className="w-4 h-4 text-slate-400" />
              <input
                id="patient-name-input"
                type="text"
                placeholder="e.g. Aman Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
          </div>

          <div className="clean-input-group">
            <label className="clean-input-label">ABHA Health ID / Number *</label>
            <div className="clean-input-wrap">
              <Database className="w-4 h-4 text-slate-400" />
              <input
                id="patient-abha-input"
                type="text"
                placeholder="e.g. 13456789 or 91-4829-1029-4411"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── AI VOICE TRIAGE CORE CARD ── */}
      <div className="glass-panel speech-core-panel">
        <div className="speech-core-header">
          <div className="panel-label" style={{ marginBottom: 0 }}>
            <GeminiIcon size={18} />
            <span>Multi-Lingual Clinical NLP & Translation</span>
          </div>

          <div className="speech-lang-selector">
            {(["en-IN", "hi-IN", "mr-IN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setActiveSpeechLang(l)}
                className={`speech-lang-btn ${activeSpeechLang === l ? "speech-lang-btn--active" : ""}`}
              >
                {l === "en-IN" ? "English" : l === "hi-IN" ? "हिंदी" : "मराठी"}
              </button>
            ))}
          </div>
        </div>

        {/* ── GEMINI SPEAK HERE INTERACTIVE CONTAINER ── */}
        <div className={`gemini-speak-interactive-section ${isListening ? "gemini-speak-interactive-section--active" : ""}`}>
          <button
            type="button"
            onClick={handleToggleMic}
            className={`gemini-speak-card-btn ${isListening ? "gemini-speak-card-btn--active" : ""}`}
            title={isListening ? "Stop Voice Recording" : "Speak Here with Gemini AI"}
          >
            <div className="gemini-speak-icon-box">
              <GeminiIcon size={24} />
            </div>

            <div className="gemini-speak-content">
              <div className="gemini-speak-title">
                {isListening ? "Listening Live... Speak Symptoms Now" : "Speak Here with Gemini AI"}
              </div>
              <div className="gemini-speak-subtitle">
                {isListening
                  ? "Recording clinical voice dictation in real-time. Tap again to stop and translate."
                  : "Tap this container to record symptoms in Hindi, Marathi, or English"}
              </div>
            </div>

            <div className="gemini-speak-action">
              <span className={`speak-state-pill ${isListening ? "speak-state-pill--recording" : ""}`}>
                {isListening ? "● RECORDING" : "TAP TO SPEAK"}
              </span>
            </div>
          </button>

          {/* 1-Click Quick Dictation Demo Chips */}
          <div className="quick-test-bar">
            <span className="quick-test-label">Instant Clinical Test:</span>
            <button
              type="button"
              onClick={() =>
                handleSimulateDemo("मरीज को 3 दिन से तेज बुखार है, BP 130/85 है और नाड़ी 95 चल रही है।")
              }
              className="quick-test-chip quick-test-chip--primary"
            >
              <span>⚡ Hindi Sample (बुखार, BP 130/85, नाड़ी 95)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleSimulateDemo("रुग्णाला ३ दिवसांपासून ताप आहे, रक्तदाब 130/85 आहे आणि नाडी 95 आहे. छातीत थोडे दुखत आहे.")
              }
              className="quick-test-chip"
            >
              <span>⚡ Marathi Sample (ताप, रक्तदाब 130/85)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleSimulateDemo("Patient has acute fever for 3 days with BP 130/85 and pulse rate 95 bpm.")
              }
              className="quick-test-chip"
            >
              <span>⚡ English Sample</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Symmetrical Textareas */}
        <div className="dictation-grid">
          {/* Column 1: Spoken text */}
          <div className="dictation-col">
            <div className="dictation-col-header">
              <span className="dictation-col-label">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                Raw Spoken Audio Transcription
              </span>
              <span className="lang-tag">
                {activeSpeechLang === "hi-IN" ? "HINDI" : activeSpeechLang === "mr-IN" ? "MARATHI" : "ENGLISH"}
              </span>
            </div>
            <textarea
              className="glass-textarea"
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder="Spoken symptoms will transcribe here in real-time or via quick test chips..."
              rows={4}
            />
          </div>

          {/* Column 2: Gemini Translated English */}
          <div className="dictation-col">
            <div className="dictation-col-header">
              <span className="dictation-col-label dictation-col-label--gemini">
                <GeminiIcon size={15} />
                Gemini Clinical Translation (English)
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {spokenText.trim() && (
                  <button
                    onClick={handleManualExtract}
                    disabled={isExtracting}
                    className="extract-action-btn"
                    style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isExtracting ? "spin" : ""}`} />
                    <span>Re-Translate</span>
                  </button>
                )}
                <span className="lang-tag lang-tag--gemini">
                  {isExtracting ? "PROCESSING" : "STANDARDIZED"}
                </span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                className="glass-textarea glass-textarea--gemini"
                value={translatedSymptoms}
                onChange={(e) => setTranslatedSymptoms(e.target.value)}
                placeholder="Gemini will translate symptoms and extract clinical terminology here..."
                rows={4}
              />
              {isExtracting && (
                <div className="textarea-processing-overlay">
                  <RefreshCw className="w-5 h-5 spin text-blue-600" />
                  <span>Gemini 3.6 Flash Translating...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI CLINICAL TRIAGE RECOMMENDATION (ALWAYS VISIBLE) ── */}
      <div className={`glass-panel triage-result-card triage-result-card--${triagePriority.toLowerCase()}`}>
        <div className="triage-result-header">
          <div className="triage-title-wrap">
            <GeminiIcon size={18} />
            <strong>AI Triage Urgency Assessment</strong>
          </div>

          <span className={`triage-badge-tag triage-badge-tag--${triagePriority.toLowerCase()}`}>
            {triagePriority} Priority Risk
          </span>
        </div>

        <p className="triage-rec-text">
          <strong>Clinical Recommendation: </strong>
          {aiRecommendation || "Evaluated by Gemini Clinical AI. Ready for physician teleconsultation review."}
        </p>
      </div>

      {/* ── EXTRACTED CLINICAL VITALS (ALWAYS VISIBLE) ── */}
      <div className="glass-panel">
        <div className="panel-label" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            Extracted Clinical Vitals
          </div>
          <span className="sync-pill sync-pill--done">Gemini Auto-Parsed</span>
        </div>

        <div className="vitals-4col-grid">
          <div className="vital-input-card">
            <div className="vital-input-header">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              <span>Blood Pressure</span>
            </div>
            <div className="vital-input-inner">
              <input
                type="text"
                placeholder="120/80"
                value={vitals.bp}
                onChange={(e) => setVitals({ bp: e.target.value })}
              />
              <span className="vital-unit">mmHg</span>
            </div>
          </div>

          <div className="vital-input-card">
            <div className="vital-input-header">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              <span>Temperature</span>
            </div>
            <div className="vital-input-inner">
              <input
                type="text"
                placeholder="98.6"
                value={vitals.temp}
                onChange={(e) => setVitals({ temp: e.target.value })}
              />
              <span className="vital-unit">°F</span>
            </div>
          </div>

          <div className="vital-input-card">
            <div className="vital-input-header">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Pulse Rate</span>
            </div>
            <div className="vital-input-inner">
              <input
                type="text"
                placeholder="72"
                value={vitals.pulse}
                onChange={(e) => setVitals({ pulse: e.target.value })}
              />
              <span className="vital-unit">bpm</span>
            </div>
          </div>

          <div className="vital-input-card">
            <div className="vital-input-header">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Oxygen Saturation</span>
            </div>
            <div className="vital-input-inner">
              <input
                type="text"
                placeholder="98"
                value={vitals.spo2}
                onChange={(e) => setVitals({ spo2: e.target.value })}
              />
              <span className="vital-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ATTACHMENT & SUBMISSION ── */}
      <div className="glass-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          {imagePreview ? (
            <div className="photo-preview-chip" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", width: 42, height: 42, borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1", flexShrink: 0 }}>
                <img src={imagePreview} alt="Clinical Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {isUploadingImage && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <RefreshCw className="w-3.5 h-3.5 spin" />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploadedFileName || "Clinical Photo"}
                </span>
                <span style={{ fontSize: 10, color: isUploadingImage ? "#0284c7" : "#059669", fontWeight: 700 }}>
                  {isUploadingImage ? "Uploading to Supabase..." : "✓ Supabase Storage"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="photo-remove-btn"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline-photo"
            >
              <Camera className="w-4 h-4" />
              <span>Attach Symptom Photo</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={resetForm}
            className="btn-secondary-sm"
          >
            Reset Form
          </button>

          <button
            id="submit-intake-case-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage || !abhaId || !patientName}
            className="pro-submit-btn"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 spin" />
                <span>Submitting to Doctor...</span>
              </>
            ) : isUploadingImage ? (
              <>
                <RefreshCw className="w-4 h-4 spin" />
                <span>Uploading Attachment...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Intake Case</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── COMPACT 5-STEP PROCESSING STEPPER & CONFIRMATION CARD ── */}
      <CompactSubmissionStepper
        isOpen={showStepper}
        patientName={patientName || "Patient"}
        abhaId={abhaId}
        caseId={submittedCaseId || lastSubmissionResult?.case_id || "24"}
        department={triagePriority === "High" ? "Cardiology / Emergency" : "General Medicine"}
        priority={triagePriority}
        isOffline={!isOnline}
        onViewCase={() => {
          setShowStepper(false);
          resetForm();
          setImagePreview(null);
          if (onViewCaseDetails) {
            onViewCaseDetails(lastSubmissionResult?.case_id || "case-mock-1");
          } else if (onSuccessSubmitted) {
            onSuccessSubmitted({ offline: !isOnline });
          }
        }}
        onGoHome={() => {
          setShowStepper(false);
          resetForm();
          setImagePreview(null);
          if (onGoHome) {
            onGoHome();
          } else if (onSuccessSubmitted) {
            onSuccessSubmitted({ offline: !isOnline });
          }
        }}
        onClose={() => setShowStepper(false)}
      />
    </div>
  );
};
