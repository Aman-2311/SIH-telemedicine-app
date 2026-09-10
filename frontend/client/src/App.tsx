import React, { useState, useEffect } from "react";
import { HeartPulse } from "lucide-react";
import { AuthScreen } from "./features/auth/AuthScreen";
import { AshaWorkerTablet } from "./features/asha/AshaWorkerTablet";
import { DoctorDashboard } from "./features/doctor/DoctorDashboard";
import { PatientPortal } from "./features/patient/PatientPortal";
import { useAuthStore } from "./store/useAuthStore";
import { useNetworkStore } from "./store/useNetworkStore";
import { UserRole } from "./utils/api";
import { startSyncManager } from "./db/syncManager";
import { useLanguageStore } from "./store/useLanguageStore";

export default function App() {
  const { isAuthenticated, role, logout } = useAuthStore();
  const { initNetworkListeners } = useNetworkStore();
  
  const { language, setLanguage } = useLanguageStore();
  const [activeRole, setActiveRole] = useState<UserRole | null>(role || null);

  // ─── Splash Screen State ───
  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setSplashExiting(true), 2000);
    const removeTimer = setTimeout(() => setShowSplash(false), 2500);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Network & sync init
  useEffect(() => {
    const cleanup = initNetworkListeners();
    return () => cleanup();
  }, [initNetworkListeners]);

  useEffect(() => {
    const cancel = startSyncManager();
    return cancel;
  }, []);

  // When authenticated, set active role
  useEffect(() => {
    if (isAuthenticated && role) {
      setActiveRole(role);
    }
  }, [isAuthenticated, role]);

  const handleAuthSuccess = (r: UserRole) => {
    setActiveRole(r);
  };

  const handleLogout = () => {
    logout();
    setActiveRole(null);
  };

  // ─── Splash Screen ───
  if (showSplash) {
    return (
      <div className={`splash-screen ${splashExiting ? "splash-exit" : ""}`}>
        <div className="splash-logo-container">
          <div className="splash-logo-ring" />
          <div className="splash-logo-icon">
            <HeartPulse />
          </div>
        </div>
        <div className="splash-wordmark">
          <h1>SAHARA</h1>
          <p>Care, Connected</p>
        </div>
        <div className="splash-progress">
          <div className="splash-progress-bar" />
        </div>
        <div className="splash-version">SAHARA Healthcare Engine v2.4</div>
      </div>
    );
  }

  // ─── Not logged in → Auth Screen ───
  if (!isAuthenticated || !activeRole) {
    return (
      <AuthScreen
        onSuccessRole={handleAuthSuccess}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  // ─── Logged in → Role Portal ───
  return (
    <>
      {activeRole === "asha" && (
        <AshaWorkerTablet
          onBack={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
      {activeRole === "doctor" && (
        <DoctorDashboard
          onBack={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
      {activeRole === "patient" && (
        <PatientPortal
          onBack={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
    </>
  );
}
