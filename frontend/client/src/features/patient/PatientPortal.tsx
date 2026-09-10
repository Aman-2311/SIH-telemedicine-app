import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Heart,
  Search,
  Bell,
  Wifi,
  WifiOff,
  Paperclip,
  Mic,
  Send,
  Sparkles,
  ChevronRight,
  FileText,
  MapPin,
  CreditCard,
  User,
  Home as HomeIcon,
  LogOut,
  PhoneCall,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Pill,
  Download,
  Share2,
  Copy,
  AlertTriangle,
  Menu,
  X,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Activity,
  Check,
  Navigation,
  Info,
  ChevronDown,
  Building2,
  Filter,
} from "lucide-react";
import { FacilityMap } from "../../components/FacilityMap";
import { useAuthStore } from "../../store/useAuthStore";
import { useFacilityStore } from "../../store/useFacilityStore";
import { useNetworkStore } from "../../store/useNetworkStore";
import { MedicationBanner } from "./medication/MedicationBanner";
import { MedicationScheduleModal } from "./medication/MedicationScheduleModal";
import { api } from "../../utils/api";

interface PatientPortalProps {
  language?: "English" | "हिंदी" | "मराठी";
  onBack?: () => void;
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
}

type PatientTab =
  | "ask_sahara"
  | "home"
  | "prescriptions"
  | "map"
  | "health_id"
  | "notifications"
  | "profile"
  | "search"
  | "emergency";

interface ChatMessage {
  id: string;
  sender: "sahara" | "user";
  text: string;
  time: string;
  facilities?: any[];
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  language = "English",
  onBack,
  onLanguageChange,
}) => {
  const { user, logout } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const { facilities, getUserLocation, fetchNearbyFacilities } = useFacilityStore();

  const [activeTab, setActiveTab] = useState<PatientTab>("ask_sahara");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Ask SAHARA chat state
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "sahara",
      text: "Hi Savita! I'm your health assistant. You can ask me anything about your prescriptions, nearby hospitals, medicines or your health ID.",
      time: "10:24 AM",
    },
    {
      id: "2",
      sender: "user",
      text: "Find a jan aushadhi near me",
      time: "10:24 AM",
    },
  ]);

  // Prescriptions state
  const [rxTab, setRxTab] = useState<"active" | "past" | "all">("active");

  // Map filters
  const [mapCategory, setMapCategory] = useState<string>("all");
  const [mapSearch, setMapSearch] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  // Notification state
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(3);
  const [notificationTab, setNotificationTab] = useState<string>("all");

  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);
  
  const activeCases = useMemo(() => {
    return patientHistory.filter(c => c.status !== 'completed' || c.prescription);
  }, [patientHistory]);
  const historyCases = patientHistory;

  const activePrescription = useMemo(() => {
    const caseWithRx = patientHistory.find((c) => c.prescription);
    if (!caseWithRx) return null;
    const rx = caseWithRx.prescription;
    const consult = caseWithRx.consultation || caseWithRx.vitals?.consultation || {};
    return {
      ...rx,
      case_id: caseWithRx.case_id || caseWithRx.id,
      doctor_name: rx.doctor_name || rx.prescribed_by || consult.assigned_doctor || caseWithRx.assigned_doctor || "Dr. Arvind Kulkarni (MD)",
      speciality: consult.doctor_speciality || caseWithRx.doctor_speciality || caseWithRx.department || "General Medicine",
      hospital: consult.facility || caseWithRx.facility || "District Civil Hospital & Telemedicine Hub",
      facility_address: consult.facility_address || caseWithRx.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001",
      diagnosis: rx.diagnosis || caseWithRx.translated_symptoms || "Consultation Completed",
      date: caseWithRx.created_at ? new Date(caseWithRx.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Today",
      medicines: rx.medicines || [],
      notes: rx.notes || "Follow prescribed dosage and take medicines with water after food.",
    };
  }, [patientHistory]);

  // Fetch real consultation & prescription records from database
  const fetchPatientData = useCallback(async () => {
    const abha = user?.abha_id || "TEST-PATIENT-MH-0002";
    if (!abha) return;
    try {
      let serverRecords: any[] = [];
      let latestServerRx: any = null;
      try {
        const res = await api.get<{ status: string; data: any[]; latest: any }>(
          `/api/intake/patient/${abha}`
        );
        serverRecords = res.data?.data || [];
        latestServerRx = res.data?.latest;
      } catch (err) {
        console.warn("Server patient fetch failed, falling back to local storage:", err);
      }

      // Merge with local storage intakes for immediate offline/online sync
      let localRecords: any[] = [];
      try {
        const stored = localStorage.getItem("sahara_submitted_intakes");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localRecords = parsed.filter((p: any) => !abha || p.abha_id === abha);
          }
        }
      } catch {}

      const seen = new Set<string>();
      const records: any[] = [];
      for (const item of [...serverRecords, ...localRecords]) {
        const id = String(item.case_id || item.id);
        if (!seen.has(id)) {
          seen.add(id);
          records.push(item);
        }
      }
      setPatientHistory(records);
    } catch (e) {
      console.error("Failed to load patient prescriptions:", e);
    }
  }, [user?.abha_id]);

  useEffect(() => {
    void fetchPatientData();
    const interval = setInterval(() => void fetchPatientData(), 5000);
    return () => clearInterval(interval);
  }, [fetchPatientData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    void (async () => {
      const loc = await getUserLocation();
      if (loc) await fetchNearbyFacilities(loc.lat, loc.lon);
    })();
  }, [getUserLocation, fetchNearbyFacilities]);

  // Web Speech API for voice search
  const handleVoiceSearch = (target: "chat" | "map") => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "हिंदी" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === "chat") {
          setChatInput(transcript);
          handleSendChat(transcript);
        } else {
          setMapSearch(transcript);
          showToast(`Voice Search: "${transcript}"`);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast("Voice input stopped or not detected.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch {
      setIsListening(false);
      showToast("Microphone permission required.");
    }
  };

  // AI Chat prompt sender with Live Gemini & Offline Fallback
  async function handleSendChat(textToSend?: string) {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      // 1. Live Gemini AI Telemedicine Assistant
      const res = await api.post("/api/chat", {
        query,
        language: language || "English",
      });

      if (res.data?.reply) {
        setIsTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "sahara",
            text: res.data.reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }
    } catch (err) {
      console.warn("Live Gemini API unavailable, falling back to offline clinical knowledge base:", err);
    }

    // 2. Offline Clinical Knowledge Base Fallback
    setIsTyping(false);
    const lower = query.toLowerCase();
    let reply = "";
    let facilitiesFound: any[] | undefined = undefined;

    if (lower.includes("jan aushadhi") || lower.includes("pharmacy") || lower.includes("medicine shop")) {
      reply = "Here are the nearest Jan Aushadhi Kendras verified with available stock:";
      facilitiesFound = [
        {
          name: "PMBJP Jan Aushadhi Kendra",
          distance: "0.8 km",
          category: "Generic Pharmacy",
          address: "Village Panchayat Samiti Complex, Block 2",
          discount: "Up to 88% off on Telmisartan & ORS",
        },
      ];
    } else if (lower.includes("prescription") || lower.includes("medicine")) {
      reply = activePrescription
        ? `Your latest prescription from ${activePrescription.doctor_name} (${activePrescription.speciality}) for ${activePrescription.diagnosis} is active. You can view your medicines and Jan Aushadhi generic savings in the Prescriptions tab.`
        : "You currently have no active prescriptions. Your recorded vitals and clinical symptoms are securely logged with the specialist.";
    } else if (lower.includes("hospital") || lower.includes("emergency") || lower.includes("doctor")) {
      reply =
        "District Civil Hospital is 2.9 km away with 24/7 Emergency & General Care. Primary Health Centre (PHC) is 1.4 km away.";
    } else if (lower.includes("health id") || lower.includes("abha")) {
      reply =
        "Your ABDM Digital Health ID is PATIENT-MH-6562 (Savita Patil). It is verified and linked to all government healthcare facilities.";
    } else if (lower.includes("bp") || lower.includes("blood pressure")) {
      reply =
        "Doctor's advice for BP control: Measure BP twice weekly in the morning, reduce salt intake below 5g/day, take Telmisartan 40mg daily after breakfast, and walk 30 minutes every day.";
    } else {
      reply =
        "I am currently operating in offline mode. You can view your active prescriptions in the Prescriptions tab, check the Map tab for nearest hospitals and Jan Aushadhi centers, or consult your local ASHA worker.";
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: "sahara",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        facilities: facilitiesFound,
      },
    ]);
  };

  // Global search trigger
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("search");
    }
  };

  // Filter facilities
  const filteredFacilities = [
    {
      id: "f1",
      name: "PMBJP Jan Aushadhi Kendra",
      distance: "0.8 km",
      type: "jan_aushadhi",
      category: "Generic Pharmacy",
      address: "Village Panchayat Samiti Complex, Block 2",
      badge: "Generic Pharmacy",
      badgeColor: "green",
    },
    {
      id: "f2",
      name: "Primary Health Centre (PHC)",
      distance: "1.4 km",
      type: "phc",
      category: "Rural Main Road, Sector 3",
      badge: "PHC",
      badgeColor: "purple",
    },
    {
      id: "f3",
      name: "District Civil Hospital",
      distance: "2.9 km",
      type: "hospital",
      category: "Zilla Parishad Central Medical Complex",
      badge: "Emergency & General",
      badgeColor: "red",
    },
    {
      id: "f4",
      name: "Urban Specialist Teleconsult Hub",
      distance: "3.5 km",
      type: "specialist",
      category: "Regional Telemedicine Nodal Station",
      badge: "Specialist / Doctor",
      badgeColor: "purple",
    },
  ].filter((f) => {
    if (mapCategory !== "all" && f.type !== mapCategory) return false;
    if (mapSearch.trim() && !f.name.toLowerCase().includes(mapSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="patient-app">
      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR RAIL (260px) — Image 1 Exact
          ═══════════════════════════════════════════════════════════ */}
      <aside className={`patient-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="patient-brand">
          <Menu className="w-5 h-5 text-slate-700 cursor-pointer hidden md:block mr-0.5" />
          <button
            className="patient-sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="patient-brand-logo">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div className="patient-brand-text">
            <h1>SAHARA</h1>
            <p>My Health Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="patient-user-card">
          <div className="patient-avatar-sp">SP</div>
          <div className="patient-user-info">
            <div className="patient-user-name">{user?.full_name || "Savita Patil"}</div>
            <div className="patient-user-abha">ABHA: {user?.abha_id || "PATIENT-MH-6562"}</div>
            <div className="patient-online-pill">
              <span className="patient-online-dot" />
              Online
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="patient-nav">
          <button
            className={`patient-nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("home");
              setMobileSidebarOpen(false);
            }}
          >
            <HomeIcon className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            className={`patient-nav-item ${activeTab === "prescriptions" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("prescriptions");
              setMobileSidebarOpen(false);
            }}
          >
            <FileText className="w-4 h-4" />
            <span>My Prescriptions</span>
          </button>

          <button
            className={`patient-nav-item ${activeTab === "map" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("map");
              setMobileSidebarOpen(false);
            }}
          >
            <MapPin className="w-4 h-4" />
            <span>Find Care Near You</span>
          </button>

          <button
            className={`patient-nav-item ${activeTab === "health_id" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("health_id");
              setMobileSidebarOpen(false);
            }}
          >
            <CreditCard className="w-4 h-4" />
            <span>Health ID Card</span>
          </button>

          <button
            className={`patient-nav-item ${activeTab === "ask_sahara" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("ask_sahara");
              setMobileSidebarOpen(false);
            }}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-teal-700">Ask SAHARA</span>
          </button>

          <button
            className={`patient-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("profile");
              setMobileSidebarOpen(false);
            }}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Urgent Help Card */}
        <div
          className="patient-urgent-card"
          onClick={() => {
            setActiveTab("emergency");
            setMobileSidebarOpen(false);
          }}
        >
          <div className="patient-urgent-icon">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="patient-urgent-text">
            <div className="patient-urgent-title">Need urgent help?</div>
            <div className="patient-urgent-desc">Find the nearest emergency hospital.</div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-600" />
        </div>

        {/* Logout Button */}
        <button
          className="patient-logout-btn"
          onClick={() => {
            logout();
            if (onBack) onBack();
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA & TOP HEADER BAR
          ═══════════════════════════════════════════════════════════ */}
      <div className="patient-content-container">
        {/* Top Header Bar */}
        <header className="patient-header">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden patient-chat-icon-btn"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="patient-search-bar">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                className="patient-search-input"
                placeholder="Search medicines, hospitals, prescriptions, or ask anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Header Right Actions */}
          <div className="patient-header-actions">
            {/* Online / Offline status badge */}
            <div className={`patient-network-badge ${!isOnline ? "offline" : ""}`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (Cached)</span>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <button
              className="patient-bell-btn"
              onClick={() => setActiveTab("notifications")}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="patient-bell-badge">{unreadNotificationsCount}</span>
              )}
            </button>

            {/* Profile Avatar Button */}
            <button
              className="patient-avatar-sp"
              onClick={() => setActiveTab("profile")}
              style={{ width: "36px", height: "36px", fontSize: "0.85rem", cursor: "pointer" }}
              title="My Profile"
            >
              SP
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Body Split: Primary Pane + Right Rail */}
        <div className="patient-body-split">
          {/* ═════════════════════════════════════════════════════════
              VIEW 1: ASK SAHARA (Image 1 Exact Match)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "ask_sahara" && (
            <>
              <main className="patient-primary-pane">
                {/* Breadcrumbs */}
                <div className="patient-breadcrumbs">
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => setActiveTab("home")}
                  >
                    Home
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Ask SAHARA</span>
                </div>

                {/* Page Header */}
                <div className="patient-page-header">
                  <div>
                    <h1 className="patient-page-title">Ask SAHARA</h1>
                    <p className="patient-page-sub">
                      Your AI health assistant for a healthier tomorrow.
                    </p>
                  </div>
                  <div className="patient-header-tagline">
                    <span>Simple questions.</span>
                    <span>Helpful answers.</span>
                    <div className="patient-header-tagline-line" />
                  </div>
                </div>

                {/* Sparkle Hero Card */}
                <div className="patient-hero-card">
                  <div className="patient-hero-icon-wrap">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2>How can I help you today?</h2>
                  <p>Get instant guidance on your health, prescriptions, and nearby care.</p>

                  {/* 5 Suggestion Prompt Chips */}
                  <div className="patient-prompt-chips">
                    <button
                      className="patient-chip"
                      onClick={() => handleSendChat("Find a pharmacy near me")}
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>Find a pharmacy near me</span>
                    </button>
                    <button
                      className="patient-chip"
                      onClick={() => handleSendChat("Show my latest prescription")}
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Show my latest prescription</span>
                    </button>
                    <button
                      className="patient-chip"
                      onClick={() => handleSendChat("Nearest hospital")}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nearest hospital</span>
                    </button>
                    <button
                      className="patient-chip"
                      onClick={() => handleSendChat("What is my health ID?")}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>What is my health ID?</span>
                    </button>
                    <button
                      className="patient-chip"
                      onClick={() => handleSendChat("General health information")}
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>General health information</span>
                    </button>
                  </div>
                </div>

                {/* Conversation Message Stream */}
                <div className="patient-chat-thread">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`patient-msg-row ${msg.sender === "user" ? "user" : ""}`}
                    >
                      {msg.sender === "sahara" && (
                        <div className="patient-ai-avatar">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={
                          msg.sender === "sahara" ? "patient-ai-bubble" : "patient-user-bubble"
                        }
                      >
                        {msg.sender === "sahara" && (
                          <div className="patient-ai-label">SAHARA</div>
                        )}
                        <p>{msg.text}</p>

                        {/* If message returned facility cards */}
                        {msg.facilities && (
                          <div className="mt-3 flex flex-col gap-2">
                            {msg.facilities.map((f, i) => (
                              <div
                                key={i}
                                className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{f.name}</div>
                                  <div className="text-xs text-slate-500">{f.address}</div>
                                  <div className="text-xs font-semibold text-emerald-700 mt-1">
                                    {f.discount}
                                  </div>
                                </div>
                                <button
                                  className="btn-clinical-primary text-xs py-1.5 px-3"
                                  onClick={() => setActiveTab("map")}
                                >
                                  View Map
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="patient-msg-time">{msg.time}</div>
                      </div>

                      {msg.sender === "user" && (
                        <div
                          className="patient-avatar-sp"
                          style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}
                        >
                          SP
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="patient-msg-row">
                      <div className="patient-ai-avatar">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="patient-typing-bubble">
                        <div className="patient-typing-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span>Consulting Gemini Clinical AI...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Chat Input Bar */}
                <div className="patient-chat-input-bar">
                  <button
                    className="patient-chat-icon-btn"
                    title="Attach file"
                    onClick={() => showToast("Attachment upload ready")}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    className="patient-chat-input"
                    placeholder="Type your message or use the microphone..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChat();
                    }}
                  />

                  <button
                    className={`patient-chat-icon-btn ${isListening ? "active-mic" : ""}`}
                    title="Voice search (Web Speech API)"
                    onClick={() => handleVoiceSearch("chat")}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    className="patient-chat-send-btn"
                    onClick={() => handleSendChat()}
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="patient-chat-footer-text">
                  <span>
                    You can ask about medicines, prescriptions, hospitals, your health ID, or
                    general health guidance.
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <Sparkles className="w-3 h-3" /> Powered by SAHARA AI
                  </span>
                </div>
              </main>

              {/* Right Rail (320px) — Image 1 Exact */}
              <aside className="patient-right-rail">
                {/* Suggested for you */}
                <div className="patient-widget">
                  <h3 className="patient-widget-title">Suggested for you</h3>
                  <p className="patient-widget-sub">Popular things people ask</p>

                  <div className="patient-widget-list">
                    {[
                      "Find the nearest Jan Aushadhi Kendra",
                      "Show my active medicines",
                      "Locate a district hospital",
                      "What is ABHA ID and how to use it?",
                      "Tips for blood pressure control",
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        className="patient-widget-item"
                        onClick={() => handleSendChat(item)}
                      >
                        <span>{item}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Your Health Overview (2x2 Grid) */}
                <div className="patient-widget">
                  <h3 className="patient-widget-title">Your Health Overview</h3>
                  <p className="patient-widget-sub">Quick access to your health information</p>

                  <div className="patient-overview-grid">
                    <div
                      className="patient-mini-stat green"
                      onClick={() => setActiveTab("prescriptions")}
                    >
                      <div>
                        <div className="patient-mini-label">Active Prescription</div>
                        <div className="patient-mini-val">{activePrescription ? 1 : 0}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>

                    <div className="patient-mini-stat blue" onClick={() => setActiveTab("map")}>
                      <div>
                        <div className="patient-mini-label">Nearby Facilities</div>
                        <div className="patient-mini-val">{facilities?.length || 0}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>

                    <div
                      className="patient-mini-stat blue"
                      onClick={() => setActiveTab("health_id")}
                    >
                      <div>
                        <div className="patient-mini-label">Health ID</div>
                        <div className="patient-mini-val" style={{ fontSize: "0.95rem" }}>
                          Available
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>

                    <div
                      className="patient-mini-stat green"
                      onClick={() => setActiveTab("prescriptions")}
                    >
                      <div>
                        <div className="patient-mini-label">Consultation Status</div>
                        <div className="patient-mini-val" style={{ fontSize: "0.85rem" }}>
                          {patientHistory.length > 0 ? (activePrescription ? "Prescribed" : "Queued") : "None"}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Recent Conversations */}
                <div className="patient-widget">
                  <h3 className="patient-widget-title">Recent Conversations</h3>
                  <p className="patient-widget-sub">Pick up where you left off</p>

                  <div className="patient-widget-list">
                    {[
                      { query: "Find a pharmacy near me", time: "Today, 10:25 AM" },
                      { query: "Show my latest prescription", time: "Today, 10:10 AM" },
                      { query: "What is my ABHA ID?", time: "Yesterday, 5:32 PM" },
                      { query: "Nearest hospital", time: "Yesterday, 4:18 PM" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        className="patient-widget-item"
                        onClick={() => handleSendChat(item.query)}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                          <div className="truncate">
                            <div className="truncate text-slate-800 font-semibold text-xs">
                              {item.query}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.time}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 2: HOME (Image 2 Panel 1)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "home" && (
            <main className="patient-primary-pane wide">
              {/* Header */}
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Welcome, Savita</h1>
                  <p className="patient-page-sub">
                    Your health, simplified. Better care, brighter tomorrow.
                  </p>
                </div>
                <div className="patient-header-tagline">
                  <span className="font-semibold text-slate-700">Monday, 8 September 2025</span>
                  <span className="text-teal-700 font-bold">Stay healthy!</span>
                </div>
              </div>

              {/* 4 Stat Cards in a Row */}
              <div className="patient-stats-row">
                <div
                  className="patient-stat-card"
                  onClick={() => setActiveTab("prescriptions")}
                >
                  <div className="patient-stat-top">
                    <span className="patient-stat-label">Active Prescriptions</span>
                    <div className="patient-stat-icon-wrap green">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="patient-stat-num">{activePrescription ? 1 : 0}</div>
                  <div className="patient-stat-link">
                    <span>{activePrescription ? `${activePrescription.medicines?.length || 0} Current medicine(s)` : "No active medicines"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div
                  className="patient-stat-card"
                  onClick={() => setActiveTab("prescriptions")}
                >
                  <div className="patient-stat-top">
                    <span className="patient-stat-label">Consultation Status</span>
                    <div className="patient-stat-icon-wrap blue">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="patient-stat-num" style={{ fontSize: "1.2rem" }}>
                    {patientHistory.length > 0 ? (activePrescription ? "Prescribed" : "In Review") : "No Visits"}
                  </div>
                  <div className="patient-stat-link">
                    <span>{patientHistory.length > 0 ? `${patientHistory.length} recorded intake(s)` : "Zero records"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="patient-stat-card" onClick={() => setActiveTab("map")}>
                  <div className="patient-stat-top">
                    <span className="patient-stat-label">Nearby Facilities</span>
                    <div className="patient-stat-icon-wrap green">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="patient-stat-num">{facilities?.length || 0}</div>
                  <div className="patient-stat-link">
                    <span>Near your location</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div
                  className="patient-stat-card"
                  onClick={() => setActiveTab("health_id")}
                >
                  <div className="patient-stat-top">
                    <span className="patient-stat-label">Health ID</span>
                    <div className="patient-stat-icon-wrap blue">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="patient-stat-num" style={{ fontSize: "1.25rem" }}>
                    Available
                  </div>
                  <div className="patient-stat-link">
                    <span>ABHA ID</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Dynamic Functional Medication Adherence Banner */}
              <MedicationBanner
                prescription={activePrescription}
                onOpenSchedule={() => setIsScheduleModalOpen(true)}
                onNavigateToRx={() => setActiveTab("prescriptions")}
              />

              {/* Quick Actions (4 Cards) */}
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Quick Actions</h3>
                <div className="patient-quick-actions-grid">
                  <div
                    className="patient-action-box"
                    onClick={() => setActiveTab("prescriptions")}
                  >
                    <div className="patient-action-icon-wrap bg-teal-50 text-teal-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3>View Prescriptions</h3>
                    <p>Check your medicines</p>
                  </div>

                  <div className="patient-action-box" onClick={() => setActiveTab("map")}>
                    <div className="patient-action-icon-wrap bg-emerald-50 text-emerald-700">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3>Find Nearby Care</h3>
                    <p>Hospitals, pharmacies</p>
                  </div>

                  <div
                    className="patient-action-box"
                    onClick={() => setActiveTab("health_id")}
                  >
                    <div className="patient-action-icon-wrap bg-blue-50 text-blue-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3>Health ID Card</h3>
                    <p>Show or share your ABHA</p>
                  </div>

                  <div
                    className="patient-action-box"
                    onClick={() => setActiveTab("ask_sahara")}
                  >
                    <div className="patient-action-icon-wrap bg-teal-100 text-teal-800">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3>Ask SAHARA</h3>
                    <p>Get instant help</p>
                  </div>
                </div>
              </div>

              {/* Coordinated 2-Column Bottom Section: Recent Activity + Health Companion */}
              <div className="patient-dashboard-bottom-grid">
                {/* Card 1: Recent Activity */}
                <div className="patient-dashboard-card">
                  <div className="patient-card-header">
                    <div>
                      <h3 className="patient-card-title">Recent Activity</h3>
                      <p className="patient-card-subtitle">Your latest consultations & health events</p>
                    </div>
                    <button
                      className="patient-card-action-link"
                      onClick={() => setActiveTab("notifications")}
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="patient-activity-list">
                    <div className="patient-activity-row">
                      <div className="patient-activity-icon coral">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="patient-activity-content">
                        <h4 className="patient-activity-title">
                          {activePrescription
                            ? `Prescription issued by ${activePrescription.doctor_name}`
                            : patientHistory[0]?.assigned_doctor
                            ? `Specialist assigned: ${patientHistory[0].assigned_doctor}`
                            : "Patient intake recorded by ASHA"}
                        </h4>
                        <p className="patient-activity-sub">
                          {activePrescription
                            ? `${activePrescription.speciality} • ${activePrescription.diagnosis}`
                            : `${patientHistory[0]?.department || "General Medicine"} clinical triage`}
                        </p>
                      </div>
                      <div className="patient-activity-timestamp">
                        {activePrescription ? activePrescription.date : "Today"}
                      </div>
                    </div>

                    <div className="patient-activity-row">
                      <div className="patient-activity-icon teal">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="patient-activity-content">
                        <h4 className="patient-activity-title">
                          {activePrescription
                            ? "Consultation completed"
                            : patientHistory[0]?.scheduled_date
                            ? "Consultation scheduled"
                            : "Vitals & symptoms queued"}
                        </h4>
                        <p className="patient-activity-sub">
                          {activePrescription
                            ? `${activePrescription.hospital} — ${activePrescription.doctor_name}`
                            : patientHistory[0]?.scheduled_date
                            ? `${patientHistory[0].facility || "Telemedicine Node"} — ${patientHistory[0].scheduled_date} at ${patientHistory[0].scheduled_time}`
                            : "Transferred to specialist workstation"}
                        </p>
                      </div>
                      <div className="patient-activity-timestamp">Today</div>
                    </div>

                    <div className="patient-activity-row">
                      <div className="patient-activity-icon blue">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="patient-activity-content">
                        <h4 className="patient-activity-title">Your health ID is now available</h4>
                        <p className="patient-activity-sub">ABDM verified: PATIENT-MH-6562</p>
                      </div>
                      <div className="patient-activity-timestamp">5 Sep, 2025</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Health Companion (Light, Premium, Matching Palette) */}
                <div className="patient-dashboard-card patient-companion-card">
                  <div className="patient-card-header">
                    <div>
                      <h3 className="patient-card-title">Your Health Companion</h3>
                      <p className="patient-card-subtitle">A simple reminder for your health journey.</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="patient-companion-body">
                    <div className="patient-companion-tip-pill">
                      <Heart className="w-3 h-3 fill-emerald-600" />
                      <span>Health Tip</span>
                    </div>
                    <div className="patient-companion-msg">
                      "Small steps today can support a healthier tomorrow."
                    </div>
                    <p className="patient-companion-desc">
                      Stay connected with your local ASHA worker and maintain regular checks for blood pressure and general vitality.
                    </p>
                  </div>

                  <div className="patient-companion-footer">
                    <button
                      className="patient-card-action-link"
                      onClick={() => showToast("Health guidance: Stay hydrated and adhere to daily Telmisartan.")}
                    >
                      <span>View health guidance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium">SAHARA Companion</span>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 3: MY PRESCRIPTIONS (Image 2 Panel 3)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "prescriptions" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">My Prescriptions</h1>
                  <p className="patient-page-sub">View and manage your medicines</p>
                </div>
                <button
                  className="btn-clinical-primary text-xs py-2 px-4 flex items-center gap-2"
                  onClick={() => showToast("Medication reminders configured!")}
                >
                  <Bell className="w-4 h-4" />
                  <span>+ Add to Reminders</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div className="patient-pill-tabs">
                <button
                  className={`patient-pill-tab ${rxTab === "active" ? "active" : ""}`}
                  onClick={() => setRxTab("active")}
                >
                  Active ({activeCases.length})
                </button>
                <button
                  className={`patient-pill-tab ${rxTab === "past" ? "active" : ""}`}
                  onClick={() => setRxTab("past")}
                >
                  Consultation History ({historyCases.length})
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Prescription or History Card */}
                {rxTab === "active" ? (
                  activeCases.length > 0 ? (
                    <div className="lg:col-span-2 space-y-6">
                      {activeCases.map((currentCase: any, idx: number) => {
                        const isCompleted = currentCase.status === "completed";
                        const isSlotConfirmed = Boolean(currentCase.scheduled_date && currentCase.scheduled_time);
                        const isDoctorAssigned = Boolean(currentCase.assigned_doctor) && !isSlotConfirmed;
                        
                        if (isCompleted && currentCase.prescription) {
                          const rx = currentCase.prescription;
                          const consult = currentCase.consultation || currentCase.vitals?.consultation || {};
                          
                          const doctor_name = rx.doctor_name || rx.prescribed_by || consult.assigned_doctor || currentCase.assigned_doctor || "Attending Specialist";
                          const speciality = consult.doctor_speciality || currentCase.doctor_speciality || currentCase.department || "General Medicine";
                          const hospital = consult.facility || currentCase.facility || "District Civil Hospital & Telemedicine Hub";
                          const facility_address = consult.facility_address || currentCase.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001";
                          const diagnosis = rx.diagnosis || currentCase.translated_symptoms || "Consultation Completed";
                          const doctor_advice = rx.notes || "Follow prescribed dosage and take medicines with water after food.";
                          
                          const medicines = (rx.medicines || []).map((m: any) => ({
                            name: m.name,
                            dosage: m.dosage,
                            duration: m.duration,
                            originalPrice: "₹45",
                            janAushadhiPrice: "₹12",
                            savings: "73% off",
                            alternative: m.generic_alternative || `${m.name} IP (PMBJP Generic)`,
                          }));

                          return (
                            <div key={idx} className="patient-rx-card">
                              <div className="patient-rx-doctor-row">
                                <div>
                                  <div className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                                    Case #{String(currentCase.case_id || currentCase.id).replace("case-", "").slice(0, 8)}
                                  </div>
                                  <div className="patient-rx-doctor-name">
                                    {doctor_name}
                                  </div>
                                  <div className="patient-rx-hospital">
                                    {hospital} • {currentCase.created_at ? new Date(currentCase.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"}
                                  </div>
                                </div>
                                <span className="patient-verified-badge">
                                  <Check className="w-3.5 h-3.5" />
                                  Consultation Completed
                                </span>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Doctor</span>
                                  <span className="font-bold text-slate-800">{doctor_name}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Speciality</span>
                                  <span className="font-bold text-slate-800">{speciality}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Facility</span>
                                  <span className="font-bold text-slate-800 truncate block">{hospital}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Status</span>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                                    Completed
                                  </span>
                                </div>
                              </div>

                              {facility_address && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Facility Location: <strong>{facility_address}</strong></span>
                                </div>
                              )}

                              <div className="mb-4">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                  Diagnosis
                                </span>
                                <div className="text-sm font-bold text-slate-800">
                                  {diagnosis}
                                </div>
                              </div>

                              <div className="mb-6">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                                  Medicines
                                </span>

                                {medicines.map((med: any, i: number) => (
                                  <div key={i} className="patient-medicine-item">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mt-0.5">
                                        <Pill className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="patient-medicine-name">{med.name}</div>
                                        <div className="patient-medicine-dosage">
                                          {med.dosage} • {med.duration}
                                        </div>
                                        <div className="text-xs text-emerald-700 font-semibold mt-1">
                                          Jan Aushadhi: {med.alternative}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="patient-price-comparison">
                                      <div className="patient-original-price">{med.originalPrice}</div>
                                      <div className="patient-generic-price-tag">
                                        {med.janAushadhiPrice} ({med.savings})
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                                  Doctor's Advice
                                </div>
                                <p className="text-sm text-amber-950">{doctor_advice}</p>
                              </div>

                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                      Nearest Medicine Source
                                    </span>
                                    <span className="text-xs font-bold text-emerald-800">0.8 km</span>
                                    <span className="text-xs font-semibold text-emerald-600">• In Stock</span>
                                  </div>
                                  <div className="font-bold text-slate-900 text-sm mt-1">
                                    PMBJP Jan Aushadhi Kendra
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    Main Market Road, Near Panchayat Office • 80% Generic Savings
                                  </div>
                                </div>

                                <button
                                  className="btn-clinical-primary text-xs py-2 px-3.5 flex items-center gap-1.5 !bg-emerald-700 hover:!bg-emerald-800"
                                  onClick={() => setActiveTab("map")}
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>View on Map / Directions</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  className="btn-clinical-primary text-xs py-2.5 px-4 flex items-center gap-2"
                                  onClick={() => showToast("Prescription PDF downloaded successfully!")}
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  className="btn-clinical-outline text-xs py-2.5 px-4 flex items-center gap-2"
                                  onClick={() => showToast("Daily reminder active for prescribed medicines")}
                                >
                                  <Bell className="w-4 h-4" />
                                  <span>Set Reminder</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        if (isSlotConfirmed) {
                          const consult = currentCase.consultation || currentCase.vitals?.consultation || {};
                          const docName = currentCase.assigned_doctor || consult.assigned_doctor || "Dr. Arvind Kulkarni (MD)";
                          const docSpeciality = currentCase.doctor_speciality || consult.doctor_speciality || currentCase.department || "General Medicine";
                          const facilityName = currentCase.facility || consult.facility || "District Civil Hospital & Telemedicine Hub";
                          const facilityAddr = currentCase.facility_address || consult.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001";
                          const consultSchedule = `${currentCase.scheduled_date} at ${currentCase.scheduled_time}`;

                          return (
                            <div key={idx} className="bg-gradient-to-br from-sky-50/80 to-blue-50/60 rounded-2xl p-6 border-2 border-sky-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-sky-200 flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-black text-sky-800 uppercase tracking-wider">
                                      SPECIALIST CARE DESTINATION
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">
                                      Consultation Scheduled
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">
                                      Case #{String(currentCase.case_id || currentCase.id).replace("case-", "").slice(0, 8)}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                                  Slot Confirmed
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-sky-200 shadow-xs">
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Doctor</span>
                                  <span className="font-extrabold text-slate-900 text-sm block">{docName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Speciality</span>
                                  <span className="font-bold text-slate-800 block">{docSpeciality}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Hospital / Centre</span>
                                  <span className="font-bold text-slate-800 block truncate">{facilityName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Consultation / Visit</span>
                                  <span className="font-bold text-sky-700 block">{consultSchedule}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-sky-200">
                                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                                <span>Full Address: <strong>{facilityAddr}</strong></span>
                              </div>

                              <div className="p-3.5 bg-white border border-sky-200 rounded-xl text-xs text-sky-950 leading-relaxed font-medium">
                                Please visit <strong>{facilityName}</strong> on <strong>{currentCase.scheduled_date}</strong> at <strong>{currentCase.scheduled_time}</strong> to consult Dr. <strong>{docName}</strong>.
                              </div>
                            </div>
                          );
                        }

                        if (isDoctorAssigned) {
                          const consult = currentCase.consultation || currentCase.vitals?.consultation || {};
                          const docName = currentCase.assigned_doctor || consult.assigned_doctor || "Dr. Arvind Kulkarni (MD)";
                          const docSpeciality = currentCase.doctor_speciality || consult.doctor_speciality || currentCase.department || "General Medicine";
                          const facilityName = currentCase.facility || consult.facility || "District Civil Hospital & Telemedicine Hub";
                          const facilityAddr = currentCase.facility_address || consult.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001";
                          const consultSchedule = (currentCase.scheduled_date && currentCase.scheduled_time)
                            ? `${currentCase.scheduled_date} at ${currentCase.scheduled_time}`
                            : "Consultation time will be shown once assigned";

                          return (
                            <div key={idx} className="bg-gradient-to-br from-teal-50/80 to-blue-50/60 rounded-2xl p-6 border-2 border-teal-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-teal-200 flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-black text-teal-800 uppercase tracking-wider">
                                      SPECIALIST CARE DESTINATION
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">
                                      Specialist Assigned
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">
                                      Case #{String(currentCase.case_id || currentCase.id).replace("case-", "").slice(0, 8)}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                                  Synced / Specialist Assigned / Awaiting Slot
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Doctor</span>
                                  <span className="font-extrabold text-slate-900 text-sm block">{docName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Speciality</span>
                                  <span className="font-bold text-slate-800 block">{docSpeciality}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Hospital / Centre</span>
                                  <span className="font-bold text-slate-800 block truncate">{facilityName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Consultation / Visit</span>
                                  <span className="font-bold text-teal-700 block">{consultSchedule}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-teal-200">
                                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                                <span>Full Address: <strong>{facilityAddr}</strong></span>
                              </div>

                              <div className="p-3.5 bg-white border border-teal-200 rounded-xl text-xs text-teal-950 leading-relaxed font-medium">
                                Please visit <strong>{facilityName}</strong> at <strong>{facilityAddr}</strong> for your consultation with Dr. <strong>{docName}</strong>. Consultation time will be shown once assigned.
                              </div>
                            </div>
                          );
                        }

                        const consult = currentCase.consultation || currentCase.vitals?.consultation || {};
                        const fallbackDoc = currentCase.assigned_doctor || consult.assigned_doctor || "Dr. Arvind Kulkarni (MD)";
                        const fallbackSpec = currentCase.doctor_speciality || consult.doctor_speciality || currentCase.department || "General Medicine";
                        const fallbackFacility = currentCase.facility || consult.facility || "District Civil Hospital & Telemedicine Hub";
                        const fallbackAddr = currentCase.facility_address || consult.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001";

                        return (
                          <div key={idx} className="bg-gradient-to-br from-amber-50/80 to-yellow-50/60 rounded-2xl p-6 border-2 border-amber-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-amber-200 flex-wrap gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                                    SPECIALIST CARE DESTINATION
                                  </div>
                                  <h3 className="text-base font-black text-slate-900">
                                    Awaiting Specialist Slot
                                  </h3>
                                  <p className="text-xs text-slate-500 font-mono">
                                    Case #{String(currentCase.case_id || currentCase.id).replace("case-", "").slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                Synced / Specialist Assigned / Awaiting Slot
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[10px] block">Doctor</span>
                                <span className="font-extrabold text-slate-900 text-sm block">{fallbackDoc}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[10px] block">Speciality</span>
                                <span className="font-bold text-slate-800 block">{fallbackSpec}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[10px] block">Hospital / Centre</span>
                                <span className="font-bold text-slate-800 block truncate">{fallbackFacility}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[10px] block">Consultation / Visit</span>
                                <span className="font-bold text-amber-700 block">Consultation time will be shown once assigned</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-200">
                              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Full Address: <strong>{fallbackAddr}</strong></span>
                            </div>

                            <div className="p-3.5 bg-white border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed font-medium">
                              Please visit <strong>{fallbackFacility}</strong> at <strong>{fallbackAddr}</strong> for your consultation with Dr. <strong>{fallbackDoc}</strong>. Consultation time will be shown once assigned.
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">No Active Prescriptions</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        No active prescriptions or pending consultations on record.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="lg:col-span-2 space-y-4">
                    {historyCases.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
                        No previous consultation history found.
                      </div>
                    ) : (
                      historyCases.map((item: any, idx: number) => {
                        const consult = item.consultation || item.vitals?.consultation || {};
                        const doctor_name = item.assigned_doctor || (item.prescription && (item.prescription.doctor_name || item.prescription.prescribed_by)) || consult.assigned_doctor || "Dr. Arvind Kulkarni (MD)";
                        const speciality = item.doctor_speciality || consult.doctor_speciality || item.department || "General Medicine";
                        const facility = item.facility || consult.facility || "District Civil Hospital & Telemedicine Hub";
                        const facility_address = item.facility_address || consult.facility_address || "Civil Hospital Road, Wardha, Maharashtra 442001";
                        const caseDate = item.created_at ? new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recorded";
                        const appointmentTime = (item.scheduled_date && item.scheduled_time) ? `${item.scheduled_date} at ${item.scheduled_time}` : (item.scheduled_date || "Consultation time will be shown once assigned");
                        const isDone = item.status === "completed";
                        const isSched = item.status === "scheduled";

                        return (
                          <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {item.prescription?.diagnosis || item.translated_symptoms || "Clinical Consultation"}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  Case #{String(item.case_id || item.id).replace("case-", "").slice(0, 8)} • {caseDate}
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDone
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isSched ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-teal-50 text-teal-700 border-teal-200"
                                }`}>
                                {isDone ? "Completed" : isSched ? "Scheduled" : "Specialist Assigned / Awaiting Slot"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Specialist</span>
                                <span className="font-bold text-slate-800 block">{doctor_name}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Department</span>
                                <span className="font-bold text-slate-800 block">{speciality}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Facility</span>
                                <span className="font-bold text-slate-800 block truncate">{facility}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Consultation / Visit</span>
                                <span className="font-bold text-slate-800 block">{appointmentTime}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Full Address: <strong>{facility_address}</strong></span>
                            </div>

                            {item.prescription?.diagnosis && (
                              <div className="text-xs text-slate-700">
                                <span className="font-bold text-slate-800">Doctor Diagnosis:</span> {item.prescription.diagnosis}
                              </div>
                            )}

                            {item.prescription?.medicines && item.prescription.medicines.length > 0 ? (
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-slate-500 font-bold uppercase text-[10px] block mb-2">Prescribed Medicines</span>
                                <div className="space-y-2">
                                  {item.prescription.medicines.map((m: any, mIdx: number) => (
                                    <div key={mIdx} className="flex justify-between items-start text-xs border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                                      <div className="font-semibold text-slate-800">{m.name}</div>
                                      <div className="text-slate-600 text-right">{m.dosage} • {m.duration}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-600 bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                                Please visit <strong>{facility}</strong> at <strong>{facility_address}</strong> for your consultation with Dr. <strong>{doctor_name}</strong>.
                              </div>
                            )}

                            {item.prescription?.notes && (
                              <div className="text-xs text-slate-600">
                                <span className="font-bold text-slate-700">Notes:</span> {item.prescription.notes}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
{/* Right Rail: Safety Tips & Refill */}
                <div className="flex flex-col gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-3">Medicine Safety Tips</h3>
                    <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Take medicines exactly as prescribed by the doctor</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Do not stop blood pressure medicine without consulting</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Check for generic alternatives at Jan Aushadhi Kendras</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Store medicines in a cool, dry place away from sunlight</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Consult a doctor immediately if side effects occur</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                    <h3 className="font-bold text-teal-950 text-sm mb-1">
                      Need a refill or new consultation?
                    </h3>
                    <p className="text-xs text-teal-800 mb-4">
                      Visit a nearby PHC or connect with an ASHA worker for an asynchronous referral.
                    </p>
                    <button
                      className="btn-clinical-primary text-xs w-full py-2"
                      onClick={() => setActiveTab("map")}
                    >
                      Find Care Near You
                    </button>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 4: FIND CARE NEAR YOU (Image 2 Panel 4)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "map" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Find Care Near You</h1>
                  <p className="patient-page-sub">
                    Locate hospitals, pharmacies and care centres
                  </p>
                </div>
                <button
                  className="btn-clinical-primary text-xs py-2 px-4 flex items-center gap-2"
                  onClick={() => {
                    getUserLocation();
                    showToast("Refreshed location coordinates!");
                  }}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Near Me</span>
                </button>
              </div>

              {/* Search Bar + Filter Pills */}
              <div className="mb-4 flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full relative">
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 pr-10 focus:outline-none focus:border-teal-600"
                    placeholder="Search hospitals, pharmacies or care centres..."
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                  />
                  <button
                    className={`absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 ${isListening ? "text-rose-600 bg-rose-50" : ""
                      }`}
                    onClick={() => handleVoiceSearch("map")}
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                  {[
                    { key: "all", label: "All" },
                    { key: "jan_aushadhi", label: "Jan Aushadhi" },
                    { key: "hospital", label: "District Hospital" },
                    { key: "phc", label: "PHC" },
                    { key: "specialist", label: "Specialist" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      className={`patient-pill-tab ${mapCategory === cat.key ? "active" : ""}`}
                      onClick={() => setMapCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map & Facility Results Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Columns: Leaflet Interactive Map */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live location enabled
                    </span>
                    <span className="text-slate-500">
                      Blue: You • Green: Jan Aushadhi • Red: Hospital • Purple: PHC
                    </span>
                  </div>
                  <div className="flex-1 w-full h-full relative">
                    <FacilityMap />
                  </div>
                </div>

                {/* Right 5 Columns: Facility Result Cards */}
                <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[520px]">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Nearby Facilities ({filteredFacilities.length})</span>
                    <span className="text-teal-700">Sort by: Nearest</span>
                  </div>

                  {filteredFacilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-500 transition cursor-pointer"
                      onClick={() => {
                        setSelectedFacility(fac);
                        showToast(`Selected: ${fac.name}`);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${fac.badgeColor === "green"
                                  ? "bg-emerald-500"
                                  : fac.badgeColor === "red"
                                    ? "bg-rose-500"
                                    : "bg-purple-500"
                                }`}
                            />
                            {fac.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{fac.address}</div>
                          <div className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {fac.badge}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md">
                          {fac.distance}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          className="btn-clinical-outline text-[11px] py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`Centering on ${fac.name}`);
                          }}
                        >
                          View
                        </button>
                        <button
                          className="btn-clinical-primary text-[11px] py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`Opening directions to ${fac.name}`);
                          }}
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 5: DIGITAL HEALTH ID (Image 2 Panel 5)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "health_id" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Digital Health ID</h1>
                  <p className="patient-page-sub">Your ABDM enabled health identity</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Official ABDM Digital Health ID Card */}
                <div className="lg:col-span-2">
                  <div className="patient-digital-id-card">
                    {/* Header */}
                    <div className="patient-id-card-header">
                      <div className="patient-id-gov-logo">
                        <ShieldCheck className="w-6 h-6 text-teal-700" />
                        <div className="patient-id-gov-text">
                          <h4>Ayushman Bharat Digital Mission</h4>
                          <p>Government of India</p>
                        </div>
                      </div>
                      <span className="patient-id-abdm-badge">ABDM</span>
                    </div>

                    {/* Body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
                      <div className="md:col-span-2 flex flex-col gap-3">
                        <div>
                          <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                            <span>Savita Patil</span>
                            <span className="patient-verified-badge text-[11px] py-0.5 px-2">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-slate-500 font-semibold block">
                            ABHA ID
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-teal-800 tracking-wide">
                              PATIENT-MH-6562
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText("PATIENT-MH-6562");
                                showToast("Copied ABHA ID: PATIENT-MH-6562");
                              }}
                              className="text-slate-400 hover:text-slate-600"
                              title="Copy ABHA ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block">Mobile</span>
                            <span className="font-semibold text-slate-800">+91 98200 12345</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Date of Birth</span>
                            <span className="font-semibold text-slate-800">12 Mar 1998</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Gender</span>
                            <span className="font-semibold text-slate-800">Female</span>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200">
                        <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-white">
                          {/* Stylized QR Code */}
                          <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white">
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-teal-700 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-white" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-2 font-semibold">
                          Scan to share
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <button
                        className="btn-clinical-outline text-xs py-2 px-4 flex items-center gap-2"
                        onClick={() => {
                          navigator.clipboard?.writeText("PATIENT-MH-6562");
                          showToast("Copied ABHA ID to clipboard!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy ID</span>
                      </button>
                      <button
                        className="btn-clinical-outline text-xs py-2 px-4 flex items-center gap-2"
                        onClick={() => showToast("Downloading Digital Health ID Card PDF...")}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        className="btn-clinical-outline text-xs py-2 px-4 flex items-center gap-2"
                        onClick={() => showToast("Share dialog opened for ABHA card")}
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Informational Banner */}
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                    <span>
                      Show this card at any government hospital or Jan Aushadhi Kendra for seamless, paperless treatment.
                    </span>
                  </div>
                </div>

                {/* Right Rail: Benefits & FAQs */}
                <div className="flex flex-col gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-3">Why this is important?</h3>
                    <div className="flex flex-col gap-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>One ID for all your health records across India</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>Access to better, integrated healthcare services</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>Use at all government and participating clinics</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>Keeps your medical history connected securely</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs">
                    <h4 className="font-bold text-slate-800 mb-2">Keep your health ID private</h4>
                    <p className="text-slate-500 mb-4">
                      Share only with authorised healthcare providers during consultations.
                    </p>

                    <div className="font-bold text-slate-800 mb-2">Need help?</div>
                    <div className="flex flex-col gap-1.5 text-teal-700 font-semibold">
                      <button className="text-left hover:underline">What is ABHA ID?</button>
                      <button className="text-left hover:underline">How to use it?</button>
                      <button className="text-left hover:underline">Where can I use it?</button>
                      <button className="text-left hover:underline">Is it safe?</button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 6: NOTIFICATIONS (Image 2 Panel 6)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Notifications</h1>
                  <p className="patient-page-sub">Stay updated on your health journey</p>
                </div>
                <button
                  className="text-xs font-bold text-teal-700 hover:underline"
                  onClick={() => {
                    setUnreadNotificationsCount(0);
                    showToast("All notifications marked as read");
                  }}
                >
                  Mark all as read
                </button>
              </div>

              {/* Tabs */}
              <div className="patient-pill-tabs">
                {["all", "prescriptions", "consultations", "nearby_care", "system"].map((t) => (
                  <button
                    key={t}
                    className={`patient-pill-tab ${notificationTab === t ? "active" : ""}`}
                    onClick={() => setNotificationTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Grouped Notifications List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Today
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {activePrescription ? "Prescription received" : "Clinical intake active"}
                          </span>
                          <span className="text-xs text-slate-400">{activePrescription ? activePrescription.date : "Today"}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activePrescription
                            ? `Your prescription from ${activePrescription.doctor_name} is available in your portal.`
                            : "Your clinical case is queued with the specialist medical team."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {activePrescription
                              ? "Consultation completed"
                              : patientHistory[0]?.scheduled_date
                              ? "Consultation scheduled"
                              : "Intake recorded"}
                          </span>
                          <span className="text-xs text-slate-400">Today</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activePrescription
                            ? `Teleconsultation with ${activePrescription.doctor_name} was completed successfully.`
                            : patientHistory[0]?.scheduled_date
                            ? `Teleconsultation scheduled with ${patientHistory[0].assigned_doctor || "Specialist"} for ${patientHistory[0].scheduled_date} at ${patientHistory[0].scheduled_time}.`
                            : "Your health records have been safely recorded by your ASHA worker."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            Nearby facility update
                          </span>
                          <span className="text-xs text-slate-400">9:12 AM</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          A new PMBJP Jan Aushadhi Kendra is available near your location.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Yesterday
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            Your health ID is now available
                          </span>
                          <span className="text-xs text-slate-400">5 Sept, 6:30 PM</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Your ABHA ID PATIENT-MH-6562 has been generated securely.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            Offline data synced
                          </span>
                          <span className="text-xs text-slate-400">5 Sept, 4:18 PM</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Your records have been synced with local offline cache.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 7: YOUR PROFILE (Image 2 Panel 7)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Your Profile</h1>
                  <p className="patient-page-sub">Manage your personal information</p>
                </div>
                <button
                  className="btn-clinical-outline text-xs py-2 px-4 flex items-center gap-2"
                  onClick={() => showToast("Profile edit mode enabled")}
                >
                  <User className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card & Demographics */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
                    <div
                      className="patient-avatar-sp"
                      style={{ width: "56px", height: "56px", fontSize: "1.3rem" }}
                    >
                      SP
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Savita Patil</h2>
                      <p className="text-xs text-slate-500">ABHA: PATIENT-MH-6562</p>
                      <div className="patient-online-pill mt-1">
                        <span className="patient-online-dot" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Savita Patil"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        defaultValue="+91 98200 12345"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Gender
                      </label>
                      <input
                        type="text"
                        defaultValue="Female"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        defaultValue="Pune, Maharashtra"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Language Preference
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm"
                        value={language}
                        onChange={(e: any) => onLanguageChange && onLanguageChange(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="हिंदी">हिंदी</option>
                        <option value="मराठी">मराठी</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Account & App Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Account & App</h3>
                    <div className="flex flex-col gap-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span>App Version</span>
                        <span className="font-bold text-slate-900">v2.4.0</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span>Data Sync</span>
                        <span className="font-bold text-emerald-600">Last synced 5 mins ago</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span>Storage</span>
                        <span className="text-slate-500">Cached for offline access</span>
                      </div>

                      <button
                        className="text-left py-2 font-semibold text-teal-700 hover:underline"
                        onClick={() => showToast("Support desk opened")}
                      >
                        Help & Support
                      </button>
                      <button
                        className="text-left py-2 font-semibold text-teal-700 hover:underline"
                        onClick={() => showToast("Security & ABDM consent verified")}
                      >
                        Privacy & Security
                      </button>
                      <button
                        className="text-left py-2 font-semibold text-teal-700 hover:underline"
                        onClick={() => showToast("Terms of service displayed")}
                      >
                        Terms & Policies
                      </button>
                    </div>
                  </div>

                  <button
                    className="patient-logout-btn mt-6"
                    onClick={() => {
                      logout();
                      if (onBack) onBack();
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 8: SEARCH RESULTS (Image 2 Panel 8)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "search" && (
            <main className="patient-primary-pane wide">
              <div className="patient-breadcrumbs">
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => setActiveTab("home")}
                >
                  Home
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Search Results</span>
              </div>

              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title">Search Results</h1>
                  <p className="patient-page-sub">
                    Results for "{searchQuery || "telmisartan"}"
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">4 results found</div>
              </div>

              {/* Tabs */}
              <div className="patient-pill-tabs">
                <button className="patient-pill-tab active">All Results (4)</button>
                <button className="patient-pill-tab">Medicines (1)</button>
                <button className="patient-pill-tab">Prescriptions (1)</button>
                <button className="patient-pill-tab">Health ID (1)</button>
                <button className="patient-pill-tab">Hospitals (1)</button>
              </div>

              {/* Search Result Cards */}
              <div className="flex flex-col gap-3">
                <div
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition"
                  onClick={() => setActiveTab("prescriptions")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Telmisartan 40mg</div>
                      <div className="text-xs text-slate-500">
                        Prescribed in your latest consultation • 30 days
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                    Medicine →
                  </span>
                </div>

                <div
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition"
                  onClick={() => setActiveTab("prescriptions")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Active Prescription</div>
                      <div className="text-xs text-slate-500">
                        {activePrescription
                          ? `${activePrescription.doctor_name} • ${activePrescription.diagnosis}`
                          : patientHistory[0]?.scheduled_date
                          ? `Scheduled: ${patientHistory[0].assigned_doctor || "Specialist"} (${patientHistory[0].scheduled_date})`
                          : "No active prescription on record"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                    Prescription →
                  </span>
                </div>

                <div
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition"
                  onClick={() => setActiveTab("map")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        PMBJP Jan Aushadhi Kendra
                      </div>
                      <div className="text-xs text-slate-500">
                        Stock available for Telmisartan 40mg IP (88% off)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                    Pharmacy →
                  </span>
                </div>
              </div>
            </main>
          )}

          {/* ═════════════════════════════════════════════════════════
              VIEW 9: EMERGENCY CARE (Image 2 Panel 9)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === "emergency" && (
            <main className="patient-primary-pane wide">
              <div className="patient-page-header">
                <div>
                  <h1 className="patient-page-title text-rose-600">Emergency Care</h1>
                  <p className="patient-page-sub">Get help when you need it most</p>
                </div>
              </div>

              {/* Red Urgent Medical Care Banner */}
              <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-6 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-rose-950">
                      Need urgent medical care?
                    </h2>
                    <p className="text-xs text-rose-800">
                      Find the nearest emergency hospital immediately with verified 24/7 casualty beds.
                    </p>
                  </div>
                </div>

                <button
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition whitespace-nowrap"
                  onClick={() => {
                    setMapCategory("hospital");
                    setActiveTab("map");
                  }}
                >
                  Find Nearest Emergency Hospital
                </button>
              </div>

              {/* 4 Guidelines in Case of Emergency */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4">
                  In case of medical emergency
                </h3>
                <div className="flex flex-col gap-4 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">
                        Tap the button above to locate the nearest emergency hospital.
                      </div>
                      <div className="text-xs text-slate-500">
                        District Civil Hospital has full trauma and intensive care facilities.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">
                        Share your location with a family member or ASHA worker.
                      </div>
                      <div className="text-xs text-slate-500">
                        Local community health volunteers can assist with immediate transport.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">
                        Contact local emergency services if available (Dial 108).
                      </div>
                      <div className="text-xs text-slate-500">
                        Government ambulance service is connected with ABHA emergency triage.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      4
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">Stay calm. Help is nearby.</div>
                      <div className="text-xs text-slate-500">
                        SAHARA keeps your vital medical records accessible offline for the attending doctor.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          )}
        </div>
      </div>

      {/* Dynamic Medication Schedule Modal */}
      <MedicationScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        prescription={activePrescription}
        onNavigateToRx={() => setActiveTab("prescriptions")}
        onShowToast={showToast}
      />
    </div>
  );
};
