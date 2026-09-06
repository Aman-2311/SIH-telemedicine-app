import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const pharmacyIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ResetCenterView({ userLat, userLon }) {
    const map = useMap();
    useEffect(() => {
        if (userLat && userLon) {
            map.setView([userLat, userLon], 13);
        }
    }, [userLat, userLon, map]);
    return null;
}

export default function FacilityMap({ userLat, userLon, facilities }) {
    const center = [userLat || 18.5204, userLon || 73.8567]; 

    return (
        <div className="h-64 w-full rounded-xl z-0 overflow-hidden relative border border-slate-200">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <ResetCenterView userLat={userLat} userLon={userLon} />

                {userLat && userLon && (
                    <Marker position={[userLat, userLon]} icon={userIcon}>
                        <Popup>
                            <strong>Patient Location</strong>
                        </Popup>
                    </Marker>
                )}

                {facilities && facilities.map((facility, index) => {
                    const isHospital = facility.type && facility.type.toLowerCase() === 'hospital';
                    const icon = isHospital ? hospitalIcon : pharmacyIcon;

                    return (
                        <Marker 
                            key={index} 
                            position={[facility.lat, facility.lon]} 
                            icon={icon}
                        >
                            <Popup>
                                <strong>{facility.name}</strong><br />
                                Type: {facility.type}<br />
                                {facility.distance_km && `Distance: ${facility.distance_km} km`}
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
