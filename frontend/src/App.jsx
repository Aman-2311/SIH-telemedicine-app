import DoctorDashboard from './features/dashboard/DoctorDashboard'
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AshaDashboard from './features/intake/AshaDashboard'

const LandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-800">Telemedicine Gateway</h1>
        <div className="flex gap-4">
            <Link to="/asha" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                Launch Tablet Mode
            </Link>
            <Link to="/doctor" className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                Launch Doctor Portal
            </Link>
        </div>
    </div>
)

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/asha/*" element={<AshaDashboard />} />
                <Route path="/doctor/*" element={<DoctorDashboard />} />
            </Routes>
        </Router>
    )
}