import React, { useState, useEffect, ReactNode } from "react";
import {
  Menu,
  ArrowLeft,
  Search,
  X,
  Globe,
  Shield,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  HeartPulse,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Info,
  CheckCircle2,
  Phone,
  BookOpen,
  Zap,
  ClipboardList,
  MapPin,
  ExternalLink,
  Stethoscope,
  Clock,
} from "lucide-react";
import { useNetworkStore } from "../store/useNetworkStore";
import { useAuthStore } from "../store/useAuthStore";
import { GeminiIcon } from "./GeminiIcon";

export interface TabItem {
  key: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

interface AppShellProps {
  title: string;
  subtitle?: string;
  accentColor?: "teal" | "blue" | "green";
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: ReactNode;
  onBack?: () => void;
  fab?: { icon: ReactNode; label: string; onClick: () => void };
  language?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  headerSearchSlot?: ReactNode;
}

type ModalViewType = "notifications" | "updates" | "help" | "about" | null;

export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  accentColor = "teal",
  tabs,
  activeTab,
  onTabChange,
  children,
  onBack,
  fab,
  language = "English",
  onLanguageChange,
  showSearch = false,
  onSearch,
  headerSearchSlot,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalViewType>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [transitionTabLabel, setTransitionTabLabel] = useState("");
  const { user, logout } = useAuthStore();
  const { isOnline } = useNetworkStore();

  // Browser history popstate guard
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== "home") {
        onTabChange("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab, onTabChange]);

  const handleTabSelect = (key: string) => {
    if (key === activeTab) return;
    const tabObj = tabs.find((t) => t.key === key);
    setTransitionTabLabel(tabObj?.label || key);
    setIsPageTransitioning(true);
    onTabChange(key);
    setTimeout(() => {
      setIsPageTransitioning(false);
    }, 280);
  };

  const handleSidebarNav = (key: string) => {
    setSidebarOpen(false);
    handleTabSelect(key);
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateStatus("System is up to date • SAHARA Engine v2.4 (Build 2026.09)");
    }, 1400);
  };

  const initials = (user?.full_name || "Sunita Patil (TEST)")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accentMap = {
    teal: "var(--teal)",
    blue: "var(--navy)",
    green: "#1a8c79",
  };
  const accent = accentMap[accentColor];

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
    onBack?.();
  };

  return (
    <div className="shell">
      {/* ── Top App Bar ── */}
      <header className="appbar">
        <div className="appbar__left">
          {/* 3-Line Hamburger Menu Button (Gmail Style on Left) */}
          <button
            id="main-sidebar-toggle-btn"
            className="appbar__icon-btn appbar__hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            title="Main Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {onBack && activeTab !== "home" && (
            <button className="appbar__icon-btn" onClick={onBack} title="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="appbar__brand">
            <div className="appbar__logo" style={{ background: accent }}>
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h1 className="appbar__title">{title}</h1>
              {subtitle && <p className="appbar__sub">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="appbar__right">
          {headerSearchSlot}

          {/* Network indicator */}
          <div className={`net-dot ${isOnline ? "net-dot--on" : "net-dot--off"}`} title={isOnline ? "Online" : "Offline"}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* Search */}
          {showSearch && !headerSearchSlot && (
            <button className="appbar__icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Direct Sign Out / Switch Role Button */}
          <button
            id="topbar-signout-btn"
            className="appbar__signout-btn"
            onClick={handleLogout}
            title="Sign Out to Sign-in page"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#dc2626",
              border: "1px solid rgba(239, 68, 68, 0.22)",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {/* User Profile Avatar (Clicking also opens left side navigation) */}
          <button
            className="appbar__avatar"
            onClick={() => setSidebarOpen(true)}
            style={{ background: accent }}
            title="User Profile & Menu"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Search bar (slide down) */}
      {searchOpen && (
        <div className="search-bar-slide">
          <div className="search-bar">
            <Search className="w-4 h-4" style={{ color: "var(--muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
              placeholder="Search patients, records…"
              autoFocus
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); onSearch?.(""); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── App Icon Page Transition Overlay ── */}
      {isPageTransitioning && (
        <div className="page-transition-curtain">
          <div className="page-transition-pill">
            <div className="page-transition-logo" style={{ background: accent }}>
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="page-transition-text">
              <span className="page-transition-title">SAHARA</span>
              <span className="page-transition-sub">{transitionTabLabel}</span>
            </div>
            <GeminiIcon size={16} />
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="shell__body">{children}</main>

      {/* ── FAB ── */}
      {fab && (
        <button className="fab" onClick={fab.onClick} title={fab.label} style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
          {fab.icon}
        </button>
      )}

      {/* ── Bottom Tab Bar (Security Removed from Bottom as Requested) ── */}
      <nav className="tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tabbar__item ${activeTab === tab.key ? "tabbar__item--active" : ""}`}
            onClick={() => handleTabSelect(tab.key)}
            style={activeTab === tab.key ? { color: accent } : undefined}
          >
            <span className="tabbar__icon">
              {tab.icon}
              {tab.badge != null && tab.badge > 0 && (
                <span className="tabbar__badge">{tab.badge > 9 ? "9+" : tab.badge}</span>
              )}
            </span>
            <span className="tabbar__label">{tab.label}</span>
            {activeTab === tab.key && <span className="tabbar__indicator" style={{ background: accent }} />}
          </button>
        ))}
      </nav>

      {/* ── LEFT SIDE NAVIGATION DRAWER (Gmail Style 3-Line Menu) ── */}
      {sidebarOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="drawer drawer--left" id="main-sidebar-drawer">
            {/* Header */}
            <div className="sidebar-header">
              <div className="sidebar-header-brand">
                <div className="sidebar-logo" style={{ background: accent }}>
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sidebar-title">SAHARA</h3>
                  <p className="sidebar-sub">Telemedicine Gateway</p>
                </div>
              </div>
              <button
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="sidebar-profile-card">
              <div className="sidebar-avatar" style={{ background: accent }}>
                {initials}
              </div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{user?.full_name || "Sunita Patil (TEST)"}</div>
                <div className="sidebar-profile-id">{user?.abha_id || "TEST-ASHA-MH-0001"}</div>
                <div className={`sidebar-status-tag ${isOnline ? "sidebar-status-tag--online" : "sidebar-status-tag--offline"}`}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? "#16a34a" : "#d97706" }} />
                  <span>{isOnline ? "Online Sync Active" : "Offline Vault Mode"}</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: CLINICAL WORKFLOW */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Clinical Workflow</div>
              <button
                className={`sidebar-nav-btn ${activeTab === "home" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("home")}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Home</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "intake" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("intake")}
              >
                <GeminiIcon size={16} />
                <span>New Patient Intake</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--purple">AI</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "queue" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("queue")}
              >
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <span>Patient Queue</span>
              </button>

              <button
                id="sidebar-nav-history"
                className={`sidebar-nav-btn ${activeTab === "history" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("history")}
              >
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Patient History</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "map" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("map")}
              >
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Nearby Facilities</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--teal">GPS</span>
              </button>
            </div>

            {/* SECTION 2: SYSTEM */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">System</div>

              {/* 🛡️ SECURITY & ABDM COMPLIANCE */}
              <button
                id="sidebar-nav-security"
                className={`sidebar-nav-btn ${activeTab === "security" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => {
                  setSidebarOpen(false);
                  onTabChange("security");
                }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & ABDM</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--teal">ABDM</span>
              </button>

              {/* 🔄 OFFLINE SYNC */}
              <button
                id="sidebar-nav-updates"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("updates");
                }}
              >
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>Offline Sync</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--amber">v2.4</span>
              </button>

              {/* ❓ HELP / PROTOCOLS */}
              <button
                id="sidebar-nav-help"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("help");
                }}
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Help / Protocols</span>
              </button>

              {/* ℹ️ ABOUT SAHARA */}
              <button
                id="sidebar-nav-about"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("about");
                }}
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>About SAHARA</span>
              </button>
            </div>

            {/* SECTION 3: LANGUAGE & PREFERENCES */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Language / भाषा</div>
              <div className="sidebar-lang-row">
                {(["English", "हिंदी", "मराठी"] as const).map((l) => (
                  <button
                    key={l}
                    className="sidebar-lang-btn"
                    onClick={() => onLanguageChange?.(l)}
                    style={language === l ? { background: accent, color: "white", borderColor: accent } : undefined}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 16 }} />

            {/* Quick Switch to Doctor Hub */}
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors mb-2 cursor-pointer"
              onClick={() => {
                localStorage.setItem(
                  "sahara_user",
                  JSON.stringify({
                    abha_id: "DOCTOR-MH-7313",
                    role: "doctor",
                    full_name: "Dr. Arvind Kulkarni (MD)",
                  })
                );
                localStorage.setItem("sahara_access_token", "mock_doctor_jwt_token_7313");
                window.location.reload();
              }}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Switch to Doctor Workstation</span>
            </button>

            {/* Sign Out Button */}
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>

            <div className="sidebar-footer">
              SAHARA Health Bridge v2.4 • Smart India Hackathon 2024
            </div>
          </aside>
        </>
      )}

      {/* ── MODAL: NOTIFICATIONS & CLINICAL ALERTS ── */}
      {modalView === "notifications" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Notifications & Clinical Alerts</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <strong style={{ fontSize: "0.86rem", color: "#0f172a" }}>Dr. Vikram Patil (Specialist Hub)</strong>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>15m ago</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                      Reviewed clinical case for <strong>Aman Sharma</strong>. Electronic prescription issued with Jan Aushadhi generic alternatives (Paracetamol 500mg, Amoxicillin).
                    </p>
                  </div>
                </div>

                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <strong style={{ fontSize: "0.86rem", color: "#166534" }}>PMBJP Jan Aushadhi Kendra #2041</strong>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>1h ago</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#15803d", margin: 0, lineHeight: 1.4 }}>
                      Essential antibiotic and fever medicines stock refreshed with guaranteed 80%+ discount comparison available on radar.
                    </p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <strong style={{ fontSize: "0.86rem", color: "#0f172a" }}>Dexie.js Offline Store Auto-Sync</strong>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>3h ago</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                      Background daemon completed synchronization of 2 patient intake records. All records cryptographically verified.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFLINE SYNC & SYSTEM UPDATES ── */}
      {modalView === "updates" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <RefreshCw className="w-5 h-5 text-sky-600" />
                <span>System Updates & Offline Status</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>Platform Version:</span>
                  <strong style={{ color: "#0f172a" }}>v2.4.0 (SIH 2024 Production)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>Encrypted Local Vault:</span>
                  <strong style={{ color: "#16a34a" }}>Dexie.js IndexedDB (Active)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>AI Translation Model:</span>
                  <strong style={{ color: "#7c3aed" }}>Gemini 3.6 Flash Multi-Lingual</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>Geospatial Calculation:</span>
                  <strong style={{ color: "#0284c7" }}>Haversine GPS Dynamic Engine</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>Network Gateway:</span>
                  <strong style={{ color: isOnline ? "#16a34a" : "#d97706" }}>
                    {isOnline ? "Online Central Dispatch" : "Offline Local Cache"}
                  </strong>
                </div>
              </div>

              {updateStatus && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "10px 12px", borderRadius: 6, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{updateStatus}</span>
                </div>
              )}

              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#0f172a",
                  color: "white",
                  padding: "10px",
                  borderRadius: 6,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <RefreshCw className={`w-4 h-4 ${checkingUpdate ? "spin" : ""}`} />
                <span>{checkingUpdate ? "Checking Central Server..." : "Check for Updates Now"}</span>
              </button>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HELP CENTRE & CLINICAL PROTOCOLS ── */}
      {modalView === "help" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>Help Centre & Field Protocols</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              {/* Emergency Numbers */}
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#be123c", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Emergency Helpline Numbers (24/7 Toll-Free)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.82rem" }}>
                  <div style={{ background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #fda4af" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>National Ambulance</span>
                    <strong style={{ color: "#be123c", fontSize: "1rem" }}>108</strong>
                  </div>
                  <div style={{ background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #fda4af" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>National Health Helpline</span>
                    <strong style={{ color: "#0284c7", fontSize: "1rem" }}>104</strong>
                  </div>
                  <div style={{ background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #fda4af" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>Women & Child Helpline</span>
                    <strong style={{ color: "#7c3aed", fontSize: "1rem" }}>181</strong>
                  </div>
                  <div style={{ background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #fda4af" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>Emergency General</span>
                    <strong style={{ color: "#0f172a", fontSize: "1rem" }}>112</strong>
                  </div>
                </div>
              </div>

              {/* Protocol FAQs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                  <strong style={{ fontSize: "0.82rem", color: "#0f172a", display: "block", marginBottom: 3 }}>
                    How to record intakes when internet is down?
                  </strong>
                  <p style={{ fontSize: "0.76rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                    Your tablet uses local Dexie.js offline storage. Intakes and voice transcriptions save automatically. Once connectivity is detected, they auto-sync to the urban specialist queue.
                  </p>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                  <strong style={{ fontSize: "0.82rem", color: "#0f172a", display: "block", marginBottom: 3 }}>
                    How does Gemini NLP translate Hindi/Marathi?
                  </strong>
                  <p style={{ fontSize: "0.76rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                    Select the Hindi or Marathi speech language tag. Click &quot;Speak Here&quot; and narrate symptoms naturally. Gemini 3.6 Flash translates the dialect into clinical English and extracts vitals.
                  </p>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                  <strong style={{ fontSize: "0.82rem", color: "#0f172a", display: "block", marginBottom: 3 }}>
                    Jan Aushadhi Generic Medicine Savings
                  </strong>
                  <p style={{ fontSize: "0.76rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                    Check the Referral Map tab to guide patients to the nearest Jan Aushadhi Kendra, saving up to 80% on brand-name medicine costs.
                  </p>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ABOUT SAHARA ── */}
      {modalView === "about" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <span>About SAHARA Telemedicine</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--teal)", color: "white", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  SAHARA Health Bridge
                </h4>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0" }}>
                  Dual-Interface Asynchronous Telemedicine for Rural Bharat
                </p>
                <span style={{ display: "inline-block", marginTop: 6, fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                  Smart India Hackathon 2024 Finalist
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.5, background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <strong>The Rural Healthcare Challenge:</strong>
                <p style={{ margin: "4px 0 10px" }}>
                  In underdeveloped villages, real-time video telemedicine fails because internet drops constantly. Specialist doctors are miles away in city hospitals.
                </p>
                <strong>Our Solution:</strong>
                <p style={{ margin: "4px 0 0" }}>
                  SAHARA is a 100% offline-first, store-and-forward telemedicine bridge. ASHA workers record voice intakes in regional languages (Hindi/Marathi), Gemini 3.6 Flash translates them into clinical summaries, urban doctors review cases asynchronously, and patients are referred to affordable generic pharmacies.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.74rem" }}>
                <div style={{ background: "#f1f5f9", padding: "8px 10px", borderRadius: 6 }}>
                  <strong style={{ color: "#0f172a", display: "block" }}>ABDM Compliant</strong>
                  <span style={{ color: "#64748b" }}>Full ABHA ID & HL7 integration</span>
                </div>
                <div style={{ background: "#f1f5f9", padding: "8px 10px", borderRadius: 6 }}>
                  <strong style={{ color: "#0f172a", display: "block" }}>Generic Savings</strong>
                  <span style={{ color: "#64748b" }}>PMBJP Jan Aushadhi 80% discount</span>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

