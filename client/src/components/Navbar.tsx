import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User as UserIcon, Shield, Menu, X, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  onOpenBookingModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBookingModal }) => {
  const { user, isAuthenticated, isAdmin, logout, loginAsDemoUser, loginAsDemoAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-electric to-violet-700 shadow-glow-violet group-hover:scale-105 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-electric-cyan rounded-full border-2 border-navy-950 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                SLOTORA
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-lavender-300 border border-violet-500/20 tracking-normal">
                  PRO
                </span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-medium text-slate-400">
                Smart Scheduling Experience
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/services')
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Explore Services
            </Link>
            <Link
              to="/appointments"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/appointments')
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              My Appointments
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isActive('/admin')
                    ? 'text-violet-300 bg-violet-500/15 border border-violet-500/30'
                    : 'text-violet-400 hover:text-violet-200 hover:bg-violet-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-violet-400" />
                Admin Suite
              </Link>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onOpenBookingModal && (
              <button
                onClick={onOpenBookingModal}
                className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-sm font-semibold shadow-glow-violet hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="flex items-center gap-2 relative z-10">
                  <Sparkles className="w-4 h-4 text-lavender-200 group-hover:rotate-12 transition-transform" />
                  Book Now
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            )}

            {/* Auth Button or User Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-sm text-slate-200 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-violet-600/50 flex items-center justify-center text-xs font-bold text-lavender-200">
                      {user?.name.charAt(0)}
                    </div>
                    <span className="max-w-[100px] truncate font-medium">{user?.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {authDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-white/[0.1] z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          {user?.role}
                        </span>
                      </div>
                      <Link
                        to="/appointments"
                        onClick={() => setAuthDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-violet-400" />
                        My Reservations
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setAuthDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-violet-300 hover:text-violet-200 hover:bg-violet-500/10 rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4 text-violet-400" />
                          Admin Portal
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.12] text-sm font-medium text-slate-200 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-violet-400" />
                    Sign In
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </button>

                  {authDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl glass-panel p-3 shadow-2xl border border-white/[0.1] z-50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                        Quick Demo Access
                      </p>
                      <button
                        onClick={async () => {
                          await loginAsDemoUser();
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-white/[0.08] text-slate-200 transition-colors flex flex-col mb-1"
                      >
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          👤 Alex Rivera (Client)
                        </span>
                        <span className="text-[11px] text-slate-400">View customer dashboard & slots</span>
                      </button>
                      <button
                        onClick={async () => {
                          await loginAsDemoAdmin();
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-violet-500/20 text-violet-200 transition-colors flex flex-col border border-violet-500/20 bg-violet-500/10"
                      >
                        <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                          🛡️ Elena Rostova (Admin)
                        </span>
                        <span className="text-[11px] text-violet-400/80">Manage services, KPIs, slots</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/[0.08] px-4 py-6 space-y-3 animate-in slide-in-from-top duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:bg-white/[0.08]"
          >
            Home
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:bg-white/[0.08]"
          >
            Explore Services
          </Link>
          <Link
            to="/appointments"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:bg-white/[0.08]"
          >
            My Appointments
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20"
            >
              Admin Suite
            </Link>
          )}

          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            {onOpenBookingModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBookingModal();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white font-semibold text-center shadow-glow-violet"
              >
                Book an Appointment
              </button>
            )}

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={async () => {
                    await loginAsDemoUser();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs bg-white/[0.08] text-slate-200 text-center font-medium"
                >
                  Demo User
                </button>
                <button
                  onClick={async () => {
                    await loginAsDemoAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs bg-violet-500/20 text-violet-200 text-center font-medium border border-violet-500/30"
                >
                  Demo Admin
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm text-rose-300 bg-rose-500/10 rounded-xl"
              >
                Sign Out ({user?.name})
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
