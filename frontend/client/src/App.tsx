import React, { useState, useEffect } from "react";
import { AuthScreen } from "./features/auth/AuthScreen";
import { AshaWorkerTablet } from "./features/asha/AshaWorkerTablet";
import { DoctorDashboard } from "./features/doctor/DoctorDashboard";
import { PatientPortal } from "./features/patient/PatientPortal";
import { useAuthStore } from "./store/useAuthStore";
import { useNetworkStore } from "./store/useNetworkStore";
import { UserRole } from "./utils/api";
import { startSyncManager } from "./db/syncManager";

type AppLanguage = "English" | "हिंदी" | "मराठी";

export default function App() {
  const { isAuthenticated, role, logout } = useAuthStore();
  const { initNetworkListeners } = useNetworkStore();

  const [language, setLanguage] = useState<AppLanguage>("English");
  const [activeRole, setActiveRole] = useState<UserRole | null>(role || null);

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
