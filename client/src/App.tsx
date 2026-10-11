import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { ExploreServicesPage } from './pages/ExploreServicesPage.js';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { BookingModal } from './components/BookingModal.js';

export function App() {
  const [globalBookingOpen, setGlobalBookingOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
            <Navbar onOpenBookingModal={() => setGlobalBookingOpen(true)} />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/services" element={<ExploreServicesPage />} />
                <Route path="/appointments" element={<MyAppointmentsPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Routes>
            </div>

            <BookingModal
              isOpen={globalBookingOpen}
              onClose={() => setGlobalBookingOpen(false)}
            />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
