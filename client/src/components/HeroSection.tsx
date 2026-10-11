import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Users,
  Zap,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenBookingModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBookingModal }) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-radial-glow">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-electric/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Subtle Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-violet-500/30 text-lavender-200 text-xs font-semibold shadow-glow-subtle animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span>SLOTORA 2.0 • Intelligent Real-Time Booking Engine</span>
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Your Time. <br />
              <span className="gradient-text-brand">Your Schedule.</span> <br />
              Your Rules.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Book appointments effortlessly. Discover available slots, avoid scheduling
              conflicts, and manage every booking in one beautiful place.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onOpenBookingModal}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-700 to-electric text-white text-base font-bold shadow-glow-violet hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span>Book an Appointment</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel text-slate-200 hover:text-white hover:bg-white/[0.08] text-base font-semibold border border-white/[0.1] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Explore Services
              </Link>
            </div>

            {/* Trust and Social Proof Badges */}
            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">100%</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Overlap Protected</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-violet-300">&lt; 100ms</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Instant Sync</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">Zero</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Double-Bookings</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Mini Calendar & Floating Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Calendar Card */}
              <div className="glass-panel rounded-3xl p-6 border border-white/[0.12] shadow-2xl relative overflow-hidden bg-radial-card">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Schedule Overview</h4>
                      <p className="text-xs text-slate-400">Live Provider Availability</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>

                {/* Calendar Days Row */}
                <div className="grid grid-cols-5 gap-2 my-5 text-center">
                  {[
                    { day: 'Mon', num: '12', active: false },
                    { day: 'Tue', num: '13', active: false },
                    { day: 'Wed', num: '14', active: true },
                    { day: 'Thu', num: '15', active: false },
                    { day: 'Fri', num: '16', active: false },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border transition-all ${
                        d.active
                          ? 'bg-violet-600 border-violet-400 text-white font-bold shadow-glow-subtle'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-semibold">{d.day}</div>
                      <div className="text-base font-bold mt-0.5">{d.num}</div>
                    </div>
                  ))}
                </div>

                {/* Slots Demo */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Selected Slots Today
                  </div>

                  <div className="p-3 rounded-xl bg-navy-900/90 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">10:00 AM – 10:45 AM</div>
                        <div className="text-[11px] text-slate-400">Dr. Marcus Vance (AI Review)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                      Confirmed
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-900/90 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <div>
                        <div className="text-xs font-bold text-white">02:00 PM – 02:45 PM</div>
                        <div className="text-[11px] text-slate-400">Sophia Chen (Strategy Advisory)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">
                      Few Slots Left
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Realistic Appointment Card 1 */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 glass-panel rounded-2xl p-4 border border-white/[0.15] shadow-2xl items-center gap-3 animate-float max-w-xs z-20">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Ref: SLT-89214
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-slate-300">ACID Concurrency Protected</div>
                </div>
              </div>

              {/* Floating Realistic Appointment Card 2 */}
              <div className="hidden sm:flex absolute -top-6 -right-6 glass-panel rounded-2xl p-3.5 border border-white/[0.15] shadow-2xl items-center gap-3 animate-float [animation-delay:2s] max-w-xs z-20">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
                  <Zap className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Instant Rescheduling</div>
                  <div className="text-[11px] text-slate-300">Releases prior slot in real time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
