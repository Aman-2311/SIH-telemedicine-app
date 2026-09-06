import React, { useState } from 'react';
import { Home, Users, AlertCircle, Calendar, Settings, Mic, Activity, Search, WifiOff, Wifi } from 'lucide-react';
import useIntakeStore from '../../store/useIntakeStore';

export default function AshaDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const { isOffline, submitIntake } = useIntakeStore();

    return (
        <div className="flex h-screen bg-slate-50 font-sans">

            {/* 1. LEFT SIDEBAR */}
            <aside className="w-64 bg-blue-900 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-blue-800">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="text-blue-300" /> ASHA
                    </h2>
                    <p className="text-blue-300 text-sm mt-1">Rural Healthcare</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="#" className="flex items-center gap-3 bg-blue-800 text-white p-3 rounded-lg font-medium"><Home size={20} /> Home</a>
                    <a href="#" className="flex items-center gap-3 text-blue-200 hover:bg-blue-800 hover:text-white p-3 rounded-lg transition"><Users size={20} /> Patients</a>
                    <a href="#" className="flex items-center gap-3 text-blue-200 hover:bg-blue-800 hover:text-white p-3 rounded-lg transition"><Mic size={20} /> Voice Assistant</a>
                    <a href="#" className="flex items-center gap-3 text-blue-200 hover:bg-blue-800 hover:text-white p-3 rounded-lg transition"><Settings size={20} /> Settings</a>
                </nav>
                <div className="p-4 border-t border-blue-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">A</div>
                    <div>
                        <p className="font-medium text-sm">Anjali Sharma</p>
                        <p className="text-xs text-blue-300">ASHA Worker • Online</p>
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header section */}
                <header className="bg-white p-6 shadow-sm z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Good Morning, Anjali 👋</h1>
                        <p className="text-slate-500">Here is what needs your attention today.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isOffline ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-medium text-sm">
                                <WifiOff size={16} /> Offline Mode - Data Saved Locally
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium text-sm">
                                <Wifi size={16} /> Online
                            </div>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input type="text" placeholder="Search ABHA ID or Name..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4 border-l-4 border-l-red-500">
                            <div className="p-3 bg-red-50 rounded-full text-red-500"><AlertCircle size={24} /></div>
                            <div><p className="text-3xl font-bold text-slate-800">2</p><p className="text-sm font-medium text-red-500">High Risk Cases</p></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4 border-l-4 border-l-amber-500">
                            <div className="p-3 bg-amber-50 rounded-full text-amber-500"><Users size={24} /></div>
                            <div><p className="text-3xl font-bold text-slate-800">5</p><p className="text-sm font-medium text-amber-500">Pending Follow-ups</p></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4 border-l-4 border-l-blue-500">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-500"><Calendar size={24} /></div>
                            <div><p className="text-3xl font-bold text-slate-800">12</p><p className="text-sm font-medium text-blue-500">Scheduled Visits</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">

                        {/* Patient List (Takes up 2 columns) */}
                        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Visits</h3>
                            <div className="space-y-4">
                                {/* Mock Patient Card 1 */}
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                        <div>
                                            <p className="font-bold text-slate-800">Priya Devi <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2">High Risk</span></p>
                                            <p className="text-sm text-slate-500">ABHA: 91-4567-2109-0030</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg">View Patient</button>
                                </div>
                                {/* Mock Patient Card 2 */}
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                        <div>
                                            <p className="font-bold text-slate-800">Ramesh Kumar <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full ml-2">Routine</span></p>
                                            <p className="text-sm text-slate-500">ABHA: 91-2231-8877-4455</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg">View Patient</button>
                                </div>
                            </div>
                        </div>

                        {/* THE ASHA AI VOICE PANEL */}
                        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-700 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                            <h3 className="text-xl font-bold text-white mb-2">ASHA AI Assistant</h3>
                            <p className="text-slate-400 text-sm mb-8">Tap to record patient symptoms in Hindi or Marathi. AI will auto-fill the forms.</p>

                            <button
                                onClick={() => setIsRecording(!isRecording)}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                            >
                                <Mic size={40} />
                            </button>

                            <p className="mt-6 font-medium text-blue-300">
                                {isRecording ? "Recording... (Listening for symptoms)" : "Tap to Speak"}
                            </p>
                            
                            <button 
                                onClick={() => submitIntake()} 
                                className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-md"
                            >
                                Submit Patient Vitals (Test)
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}