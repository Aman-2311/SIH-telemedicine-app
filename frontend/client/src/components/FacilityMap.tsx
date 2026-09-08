import { useEffect, useState, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Facility, api } from "../utils/api";
import { Navigation, Building2, Pill, Stethoscope, ArrowRight } from "lucide-react";

const fallbackLocation: [number, number] = [18.5204, 73.8567];

// Leaflet child controller to smoothly fly to selected facility coordinates and invalidate size
function MapViewController({ center, target }: { center: [number, number]; target?: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.2 });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, target, map]);
  return null;
}

interface FacilityMapProps {
  facilities?: Facility[];
  selectedFacilityId?: string | null;
  onSelectFacility?: (facility: Facility) => void;
  customCenter?: [number, number];
}

export function FacilityMap({
  facilities: propFacilities,
  selectedFacilityId,
  onSelectFacility,
  customCenter,
}: FacilityMapProps) {
  const [center, setCenter] = useState<[number, number]>(customCenter || fallbackLocation);
  const [facilities, setFacilities] = useState<Facility[]>(propFacilities || []);
  const [loading, setLoading] = useState(!propFacilities);
  const [targetCoord, setTargetCoord] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (customCenter) {
      setCenter(customCenter);
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      (position) => setCenter([position.coords.latitude, position.coords.longitude]),
      () => setCenter(fallbackLocation),
      { timeout: 6000 }
    );
  }, [customCenter]);

  // If facilities passed as prop, use them; otherwise fetch from backend
  useEffect(() => {
    if (propFacilities && propFacilities.length > 0) {
      setFacilities(propFacilities);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .get<{ facilities: Facility[] }>(
        `/api/facilities/nearby?lat=${center[0]}&lon=${center[1]}`
      )
      .then((response) => {
        if (!cancelled) {
          const raw = (response.data as any)?.facilities || response.data;
          setFacilities(Array.isArray(raw) ? raw : []);
        }
      })
      .catch(() => {
        // Handled gracefully
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [center, propFacilities]);

  // Handle selected facility fly-to
  useEffect(() => {
    if (selectedFacilityId && facilities.length > 0) {
      const match = facilities.find((f) => f.id === selectedFacilityId);
      if (match && match.lat && match.lon) {
        setTargetCoord([match.lat, match.lon]);
      }
    }
  }, [selectedFacilityId, facilities]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Top Legend Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "white", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Navigation className="w-4 h-4 text-teal-600" />
          <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "#0f172a" }}>
            Geospatial Telemedicine Radar
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.72rem", fontWeight: 700 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span>You (Live GPS)</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            <span>Jan Aushadhi (Generic)</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
            <span>District Hospital</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />
            <span>PHC & Doctor</span>
          </span>
        </div>
      </div>

      {/* Map Body */}
      <div style={{ position: "relative", flex: 1, minHeight: "440px", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", minHeight: "440px" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController center={center} target={targetCoord} />

          {/* User Live GPS Marker: Blue */}
          <CircleMarker
            center={center}
            radius={11}
            pathOptions={{
              color: "#1e40af",
              fillColor: "#3b82f6",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ fontSize: "0.78rem", padding: "2px 4px" }}>
                <strong style={{ color: "#1e3a8a", display: "block" }}>Patient / ASHA Worker Live GPS</strong>
                <span style={{ color: "#64748b" }}>Coordinates: {center[0].toFixed(4)}, {center[1].toFixed(4)}</span>
              </div>
            </Popup>
          </CircleMarker>

          {/* Dynamic Facilities Markers */}
          {facilities.map((fac, idx) => {
            const category = (fac.type || (fac as any).category || "pharmacy").toLowerCase();
            const isHosp = category.includes("hospital");
            const isPharm = category.includes("pharmacy") || category.includes("jan_aushadhi");
            const isDoc = category.includes("doctor");

            const markerColor = isHosp ? "#dc2626" : isPharm ? "#16a34a" : isDoc ? "#4f46e5" : "#7c3aed";
            const isSelected = selectedFacilityId === fac.id;

            if (!fac.lat || !fac.lon) return null;

            return (
              <CircleMarker
                key={fac.id || idx}
                center={[fac.lat, fac.lon]}
                radius={isSelected ? 13 : 9}
                pathOptions={{
                  color: isSelected ? "#0284c7" : markerColor,
                  fillColor: markerColor,
                  fillOpacity: isSelected ? 1 : 0.85,
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectFacility) onSelectFacility(fac);
                  },
                }}
              >
                <Popup>
                  <div style={{ fontSize: "0.8rem", minWidth: 200, padding: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {isPharm ? (
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isHosp ? (
                        <Building2 className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      <strong style={{ color: "#0f172a" }}>{fac.name}</strong>
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 6 }}>
                      {fac.address || "District Healthcare Network"}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>
                        {fac.distance_km ? `${fac.distance_km} km away` : "Nearby"}
                      </span>
                      {(fac as any).emergency_services && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#b91c1c" }}>
                          24/7 EMERGENCY
                        </span>
                      )}
                    </div>

                    {/* Generic Medicines Savings callout if Jan Aushadhi */}
                    {(fac as any).generic_medicines && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 8px", borderRadius: 6, marginTop: 4 }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#15803d", marginBottom: 2 }}>
                          PMBJP Generic Savings (80%+ Off):
                        </div>
                        {((fac as any).generic_medicines as any[]).slice(0, 2).map((m: any, mi: number) => (
                          <div key={mi} style={{ fontSize: "0.66rem", color: "#166534", display: "flex", justifyContent: "space-between" }}>
                            <span>{m.name}</span>
                            <strong>{m.generic_price} <s style={{ color: "#9ca3af" }}>{m.brand_price}</s></strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {(fac as any).contact && (
                      <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: 6 }}>
                        Contact: <strong>{(fac as any).contact}</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", zIndex: 999 }}>
            Resolving live GPS & nearby care facilities...
          </div>
        )}
      </div>
    </div>
  );
}
