import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Shield, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  onOpenBookingModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBookingModal }) => {
  return (
    <footer className="relative bg-navy-950 border-t border-white/[0.08] overflow-hidden">
      {/* Final Call to Action Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-violet-500/30 bg-gradient-to-r from-violet-950/60 via-navy-900 to-indigo-950/60 shadow-2xl text-center">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Elevate Your Calendar Experience
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to take complete control of your time?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Experience modern appointment booking without conflicting slots, double-bookings,
              or manual calendar sync headaches.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              {onOpenBookingModal && (
                <button
                  onClick={onOpenBookingModal}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-electric text-white font-bold text-sm shadow-glow-violet hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                >
                  Book an Appointment
                </button>
              )}
              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-sm font-semibold transition-all"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mt-16 pb-12 border-b border-white/[0.08]">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-glow-subtle">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">SLOTORA</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Appointment Experience. High-performance scheduling infrastructure for
              advisors, engineers, educators, and service practitioners.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Explore Services
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-white transition-colors">
                  My Appointments
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-violet-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Service domains */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>Executive Strategy</li>
              <li>AI & Tech Architecture</li>
              <li>Career & Mentorship</li>
              <li>Health & Holistic Wellness</li>
              <li>Artisan Styling & Salon</li>
              <li>Academic STEM Tutoring</li>
            </ul>
          </div>

          {/* Security & Tech Specs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Architecture
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, and Prisma relational ORM.
            </p>
            <div className="text-[11px] text-slate-500">
              Prisma ACID Concurrency • Real-Time Overlap Detection
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SLOTORA Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            Crafted with precision & modern web design aesthetics
          </div>
        </div>
      </div>
    </footer>
  );
};
