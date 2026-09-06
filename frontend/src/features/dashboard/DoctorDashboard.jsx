import React, { useState } from 'react';
import { Activity, Clock, FileText, CheckCircle, Video, Search, MapPin, AlertTriangle } from 'lucide-react';
import FacilityMap from '../../components/FacilityMap';

// Mock Data from your backend /api/queue
const mockQueue = [
    { id: 'C-1001', name: 'Priya Devi', age: 24, priority: 'High', time: '10:00 AM', status: 'waiting' },
    { id: 'C-1002', name: 'Ramesh Kumar', age: 45, priority: 'Routine', time: '10:30 AM', status: 'waiting' },
    { id: 'C-1003', name: 'Sunita Sharma', age: 28, priority: 'Medium', time: '11:15 AM', status: 'waiting' }
];

export default function DoctorDashboard() {
    const [activePatient, setActivePatient] = useState(mockQueue[0]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

            {/* 1. LEFT PANEL: LIVE QUEUE (3 Columns) */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity className="text-emerald-400" />
                        <h2 className="font-bold text-lg">Clinical Dashboard</h2>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Search queue..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Queue</h3>
                    {mockQueue.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => setActivePatient(patient)}
                            className={`p-4 rounded-xl border cursor-pointer transition ${activePatient.id === patient.id
                                    ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-slate-800">{patient.name}</p>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${patient.priority === 'High' ? 'bg-red-100 text-red-700'
                                        : patient.priority === 'Medium' ? 'bg-amber-100 text-amber-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {patient.priority}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock size={12} /> {patient.time}</span>
                                <span>ID: {patient.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* MIDDLE & RIGHT WRAPPER */}
            <main className="flex-1 flex overflow-hidden">

                {/* 2. MIDDLE PANEL: PATIENT 360 & AI SUMMARY (5 Columns) */}
                <section className="flex-[5] bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                    {/* Patient Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold">
                                {activePatient.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{activePatient.name}</h1>
                                <p className="text-sm text-slate-500">24 years • Female • Pregnant • ABHA: 91-4567-2109-0030</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">
                            <Video size={18} /> Start Consultation
                        </button>
                    </div>

                    {/* AI Clinical Summary */}
                    <div className="p-6 space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                            <h3 className="flex items-center gap-2 text-emerald-400 font-bold mb-4">
                                <AlertTriangle size={20} /> AI Clinical Summary
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                Patient is 24 years old, currently pregnant (3rd trimester).
                                Recent records show declining hemoglobin (8.2 g/dL), indicating high-risk anemia.
                                ASHA worker voice notes complain of extreme fatigue and dizziness.
                            </p>
                            <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4">
                                <div><p className="text-slate-400 text-xs">Blood Pressure</p><p className="font-bold text-lg">145/95 <span className="text-red-400 text-xs">↑ High</span></p></div>
                                <div><p className="text-slate-400 text-xs">Temperature</p><p className="font-bold text-lg">98.2°F</p></div>
                                <div><p className="text-slate-400 text-xs">Pulse</p><p className="font-bold text-lg">92 bpm</p></div>
                            </div>
                        </div>

                        {/* Wound/Prescription Image Placeholder */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={18} /> Attached Visuals</h3>
                            <div className="w-full h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                Patient Uploaded Image Will Appear Here
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. RIGHT PANEL: E-PRESCRIPTION & MAP (4 Columns) */}
                <section className="flex-[4] bg-slate-50 flex flex-col p-6 overflow-y-auto">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Prescription / Treatment</h2>

                    {/* E-Prescription Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Medicine Search (Generic)</label>
                            <input type="text" placeholder="Type medicine name..." className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm" />
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-slate-800 text-sm">Iron Folic Acid (IFA)</p>
                                <CheckCircle size={16} className="text-emerald-600" />
                            </div>
                            <p className="text-xs text-slate-600">1 Tablet - Twice a day (After meals)</p>
                            <p className="text-xs text-emerald-700 font-bold mt-2">✨ Jan Aushadhi Generic Available (₹12)</p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Clinical Notes</label>
                            <textarea placeholder="Add rest/dietary advice..." rows="3" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm"></textarea>
                        </div>

                        <button className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">
                            Save & Send Prescription
                        </button>
                    </div>

                    {/* Leaflet Map Placeholder Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" /> Nearest Jan Aushadhi Pharmacy
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">Routing patient to nearest facility with generic stock.</p>
                        <FacilityMap 
                            userLat={18.5204} 
                            userLon={73.8567} 
                            facilities={[
                                { lat: 18.5314, lon: 73.8446, name: 'Pradhan Mantri Bhartiya Janaushadhi Kendra', type: 'Pharmacy', distance_km: 1.5 },
                                { lat: 18.5074, lon: 73.8197, name: 'District Civil Hospital, Pune', type: 'Hospital', distance_km: 3.2 }
                            ]} 
                        />
                    </div>

                </section>
            </main>
        </div>
    );
}