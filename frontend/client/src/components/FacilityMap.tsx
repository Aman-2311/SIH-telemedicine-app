import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Facility, api } from "../utils/api";
import { MapPin, Navigation, Building2, Pill } from "lucide-react";

const fallbackLocation: [number, number] = [18.5204, 73.8567];

export function FacilityMap() {
  const [center, setCenter] = useState<[number, number]>(fallbackLocation);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) =>
        setCenter([position.coords.latitude, position.coords.longitude]),
      () => setCenter(fallbackLocation),
      { timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Facility[]>(
        `/api/facilities/nearby?lat=${center[0]}&lon=${center[1]}`
      )
      .then((response: any) => {
        if (!cancelled) {
          const raw = response.data?.facilities || response.data?.data || response.data;
          setFacilities(Array.isArray(raw) ? raw : []);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [center]);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 shadow-sm space-y-4 font-sans text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-800" />
            OpenStreetMap Geolocation Radar
          </span>
          <h3 className="text-base font-extrabold text-blue-950 mt-0.5">
            Nearby PMBJP Generic Pharmacies & Hospitals
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border"></span>
            <span>You</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border"></span>
            <span>Jan Aushadhi</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border"></span>
            <span>Hospital</span>
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-gray-300 relative shadow-inner" style={{ height: "300px", minHeight: "300px" }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", minHeight: "300px" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* User Pin: Blue */}
          <CircleMarker
            center={center}
            radius={10}
            pathOptions={{
              color: "#1e3a8a",
              fillColor: "#2563eb",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="text-xs p-1 font-sans">
                <strong className="text-blue-900">Your Current Location</strong>
                <div className="text-gray-600">GPS Active</div>
              </div>
            </Popup>
          </CircleMarker>

          {facilities.map((facility, index) => {
            const category = facility.type || "pharmacy";
            const isHospital =
              category.toLowerCase().includes("hospital") ||
              category.toLowerCase() === "phc";
            const lat = facility.lat;
            const lon = facility.lon;
            const distance =
              facility.distance_km !== undefined
                ? `${facility.distance_km.toFixed(1)} km away`
                : "Nearby";

            if (!lat || !lon) return null;

            return (
              <CircleMarker
                key={facility.id || `${facility.name}-${index}`}
                center={[lat, lon]}
                radius={8}
                pathOptions={{
                  color: isHospital ? "#991b1b" : "#065f46",
                  fillColor: isHospital ? "#dc2626" : "#059669",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans space-y-1">
                    <strong className="text-gray-900 font-extrabold block">
                      {facility.name}
                    </strong>
                    <div className="text-gray-600 font-medium">
                      {facility.address ||
                        (isHospital ? "District Hospital / PHC" : "Generic Pharmacy (Jan Aushadhi)")}
                    </div>
                    <div className="text-xs font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded inline-block border border-blue-200">
                      {distance}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center text-xs font-extrabold text-blue-950 z-1000">
            Finding nearby care facilities...
          </div>
        )}
      </div>
    </div>
  );
}
