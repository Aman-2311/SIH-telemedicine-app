import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  QrCode,
  Pill,
  MapPin,
  Hospital,
  Sparkles,
  FileText,
  UserCheck,
  HeartPulse,
  Home,
  User,
  Download,
} from "lucide-react";
import { AppShell, TabItem } from "../../components/AppShell";
import { FacilityMap } from "../../components/FacilityMap";
import { useAuthStore } from "../../store/useAuthStore";
import { useFacilityStore } from "../../store/useFacilityStore";

interface PatientPortalProps {
  language?: "English" | "हिंदी" | "मराठी";
  onBack?: () => void;
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
}

type PatientTab = "home" | "rx" | "map" | "profile";

export const PatientPortal: React.FC<PatientPortalProps> = ({
  language = "English",
  onBack,
  onLanguageChange,
}) => {
  const { user } = useAuthStore();
  const { facilities, getUserLocation, fetchNearbyFacilities } = useFacilityStore();
  const [activeTab, setActiveTab] = useState<PatientTab>("home");

  const [activePrescription] = useState<any>({
    doctor_name: "Dr. Arvind Kulkarni (MD, Cardiology)",
    hospital: "Sub-District Hospital, Telemedicine Node",
    diagnosis: "Stage 1 Essential Hypertension & Dehydration",
    date: "Today, 10:45 AM",
    medicines: [
      { name: "Telmisartan 40mg", dosage: "1 tab daily after breakfast", duration: "30 days", brand_price: "₹118", generic_alternative: "Telmisartan 40mg IP (PMBJP-088)", generic_price: "₹14 (88% off)" },
      { name: "ORS Electrolyte", dosage: "1 sachet in 1L boiled water", duration: "5 days", brand_price: "₹35", generic_alternative: "ORS Powder IP", generic_price: "₹8 (77% off)" },
    ],
    doctor_advice: "Measure BP twice weekly. Reduce dietary salt. Walk 30 mins daily.",
  });

  useEffect(() => {
    void (async () => {
      const loc = await getUserLocation();
      if (loc) await fetchNearbyFacilities(loc.lat, loc.lon);
    })();
  }, [getUserLocation, fetchNearbyFacilities]);

  const firstName = (user?.full_name || "Patient").split(" ")[0];

  const tabs: TabItem[] = [
    { key: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
    { key: "rx", icon: <FileText className="w-5 h-5" />, label: "Rx" },
    { key: "map", icon: <MapPin className="w-5 h-5" />, label: "Map" },
    { key: "profile", icon: <User className="w-5 h-5" />, label: "Profile" },
  ];

  return (
    <AppShell
      title="SAHARA"
      subtitle={language === "English" ? "My Health Portal" : language === "हिंदी" ? "मेरा स्वास्थ्य पोर्टल" : "माझे आरोग्य पोर्टल"}
      accentColor="green"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(k) => setActiveTab(k as PatientTab)}
      onBack={activeTab !== "home" ? () => setActiveTab("home") : undefined}
      language={language}
      onLanguageChange={onLanguageChange}
    >
      {/* ═══ HOME ═══ */}
      {activeTab === "home" && (
        <div className="page fade-in">
          {/* Welcome banner */}
          <div className="welcome-banner">
            <div className="welcome-banner__text">
              <h2>{language === "English" ? `Welcome, ${firstName}` : language === "हिंदी" ? `नमस्ते, ${firstName}` : `नमस्कार, ${firstName}`}</h2>
              <p>{language === "English" ? "Your health, simplified" : language === "हिंदी" ? "आपका स्वास्थ्य, सरलीकृत" : "तुमचे आरोग्य, सोपे"}</p>
            </div>
            <div className="welcome-banner__icon">
              <HeartPulse className="w-8 h-8" />
            </div>
          </div>

          {/* Quick stat cards */}
          <div className="stat-row">
            <div className="stat-card stat-card--teal">
              <div className="stat-card__icon"><FileText className="w-5 h-5" /></div>
              <div className="stat-card__value">1</div>
              <div className="stat-card__label">{language === "English" ? "Active Rx" : "सक्रिय Rx"}</div>
            </div>
            <div className="stat-card stat-card--blue">
              <div className="stat-card__icon"><MapPin className="w-5 h-5" /></div>
              <div className="stat-card__value">{facilities.length}</div>
              <div className="stat-card__label">{language === "English" ? "Nearby" : "नज़दीकी"}</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="section-label">{language === "English" ? "Quick Actions" : "त्वरित कार्य"}</div>
          <div className="action-cards">
            <button className="action-card action-card--primary" onClick={() => setActiveTab("rx")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--teal">
                <FileText className="w-6 h-6" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{language === "English" ? "View Prescriptions" : "दवाइयाँ देखें"}</div>
                <div className="action-card__desc">{language === "English" ? "Active medicines & generic options" : "सक्रिय दवाइयाँ"}</div>
              </div>
            </button>

            <button className="action-card" onClick={() => setActiveTab("map")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--green">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{language === "English" ? "Find Pharmacy" : "दवाखाना खोजें"}</div>
                <div className="action-card__desc">{language === "English" ? "Jan Aushadhi & hospitals near you" : "जन औषधि और अस्पताल"}</div>
              </div>
            </button>

            <button className="action-card" onClick={() => setActiveTab("profile")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--blue">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{language === "English" ? "Health ID Card" : "स्वास्थ्य कार्ड"}</div>
                <div className="action-card__desc">{language === "English" ? "Your ABHA digital health ID" : "डिजिटल ABHA कार्ड"}</div>
              </div>
            </button>
          </div>

          {/* Latest prescription preview */}
          <div className="section-label">{language === "English" ? "Latest Prescription" : "नवीनतम नुस्खा"}</div>
          <div className="glass-panel">
            <div className="rx-preview-header">
              <div>
                <strong>{activePrescription.doctor_name}</strong>
                <span>{activePrescription.date}</span>
              </div>
              <span className="verified-pill">✓ Verified</span>
            </div>
            <div className="rx-preview-diag">{activePrescription.diagnosis}</div>
            <button className="see-all-btn" onClick={() => setActiveTab("rx")}>View full prescription →</button>
          </div>
        </div>
      )}

      {/* ═══ PRESCRIPTIONS ═══ */}
      {activeTab === "rx" && (
        <div className="page fade-in">
          <div className="section-label">{language === "English" ? "Active Prescription" : "सक्रिय नुस्खा"}</div>

          <div className="glass-panel">
            <div className="rx-preview-header">
              <div>
                <strong>{activePrescription.doctor_name}</strong>
                <span>{activePrescription.hospital} • {activePrescription.date}</span>
              </div>
              <span className="verified-pill">✓ Verified</span>
            </div>

            <div className="rx-preview-diag">
              <span className="rx-diag-label">{language === "English" ? "Diagnosis" : "निदान"}</span>
              {activePrescription.diagnosis}
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 16 }}>{language === "English" ? "Medicines" : "दवाइयाँ"}</div>

          <div className="medicine-card-list">
            {activePrescription.medicines.map((med: any, idx: number) => (
              <div key={idx} className="med-card">
                <div className="med-card__header">
                  <div className="med-card__pill-icon">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="med-card__info">
                    <div className="med-card__name">{med.name}</div>
                    <div className="med-card__dosage">{med.dosage} • {med.duration}</div>
                  </div>
                  <div className="med-card__brand-price">{med.brand_price}</div>
                </div>
                {med.generic_alternative && (
                  <div className="med-card__generic">
                    <div className="med-card__generic-info">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === "English" ? "Jan Aushadhi" : "जन औषधि"}: <strong>{med.generic_alternative}</strong></span>
                    </div>
                    <span className="med-card__generic-price">{med.generic_price}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {activePrescription.doctor_advice && (
            <div className="advice-panel">
              <strong>{language === "English" ? "Doctor's Advice" : "डॉक्टर की सलाह"}:</strong>{" "}
              {activePrescription.doctor_advice}
            </div>
          )}

          <button className="download-btn">
            <Download className="w-4 h-4" />
            {language === "English" ? "Download Prescription PDF" : "PDF डाउनलोड करें"}
          </button>
        </div>
      )}

      {/* ═══ MAP ═══ */}
      {activeTab === "map" && (
        <div className="page fade-in">
          <div className="section-label">{language === "English" ? "Nearby Facilities" : "पास की सुविधाएं"}</div>
          <div className="map-container">
            <FacilityMap />
          </div>
          <div className="facility-list-v2">
            {facilities.map((fac, i) => {
              const isHosp = fac.type?.toLowerCase().includes("hospital") || fac.type?.toLowerCase() === "phc";
              return (
                <div key={fac.id || i} className="fac-card-v2">
                  <div className={`fac-card-v2__type ${isHosp ? "fac-card-v2__type--hosp" : ""}`}>
                    {isHosp ? "🏥" : "💊"}
                  </div>
                  <div className="fac-card-v2__info">
                    <div className="fac-card-v2__name">{fac.name}</div>
                    <div className="fac-card-v2__addr">{fac.address || "District Center"}</div>
                  </div>
                  <div className="fac-card-v2__dist">
                    {fac.distance_km ? `${fac.distance_km.toFixed(1)} km` : "Nearby"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PROFILE ═══ */}
      {activeTab === "profile" && (
        <div className="page fade-in">
          <div className="section-label">{language === "English" ? "Digital Health ID" : "डिजिटल स्वास्थ्य कार्ड"}</div>

          {/* ABHA Card — gorgeous gradient */}
          <div className="abha-card">
            <div className="abha-card__header">
              <div className="abha-card__gov">
                <ShieldCheck className="w-5 h-5" />
                <span>{language === "English" ? "National Digital Health ID" : "राष्ट्रीय डिजिटल स्वास्थ्य कार्ड"}</span>
              </div>
              <span className="abha-card__badge">ABDM</span>
            </div>

            <div className="abha-card__body">
              <div className="abha-card__fields">
                <div className="abha-card__field">
                  <label>{language === "English" ? "Name" : "नाम"}</label>
                  <strong>{user?.full_name || "Savita Patil"}</strong>
                </div>
                <div className="abha-card__field">
                  <label>{language === "English" ? "Mobile" : "मोबाइल"}</label>
                  <span>+91 {user?.phone_number || "98200 12345"}</span>
                </div>
                <div className="abha-card__field abha-card__field--highlight">
                  <label>ABHA ID</label>
                  <strong className="abha-card__id">{user?.abha_id || "91-4455-8899-1023"}</strong>
                </div>
              </div>

              <div className="abha-card__qr">
                <QrCode className="w-16 h-16" />
              </div>
            </div>

            <div className="abha-card__footer">
              <UserCheck className="w-3.5 h-3.5" />
              Ayushman Bharat Digital Mission — Govt. of India
            </div>
          </div>

          <div className="info-note-v2">
            <ShieldCheck className="w-4 h-4" />
            <p>{language === "English" ? "Show this card at any government hospital or Jan Aushadhi Kendra for free treatment." : "इस कार्ड को किसी भी सरकारी अस्पताल या जन औषधि केंद्र पर दिखाएं।"}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
};
