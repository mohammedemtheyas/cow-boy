import React from 'react';
import {
  Clock,
  ShieldAlert,
  Zap,
  RotateCcw,
  LayoutDashboard,
  CalendarDays,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Real-Time Slot Availability',
      description:
        'Live synchronization with provider working hours and existing reservations. Always see genuine up-to-the-minute openings.',
      tag: 'Zero Latency',
      color: 'from-violet-500 to-indigo-500',
    },
    {
      icon: ShieldAlert,
      title: 'Smart Duplicate Prevention',
      description:
        'Server-enforced interval overlap calculation and database transactions prevent two clients from reserving overlapping slots simultaneously.',
      tag: 'ACID Guaranteed',
      color: 'from-electric to-cyan-500',
    },
    {
      icon: Zap,
      title: 'Instant Confirmation',
      description:
        'Receive an immediate unique booking reference token (e.g. SLT-89214) with all appointment coordinates verified upon database commit.',
      tag: 'Instant Token',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: RotateCcw,
      title: 'Easy Cancellation & Release',
      description:
        'Non-destructive cancellation frees up time slots instantly for others to book, maintaining complete audit trails and status histories.',
      tag: 'Instant Slot Release',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: LayoutDashboard,
      title: 'Personal Booking Dashboard',
      description:
        'Track upcoming, completed, and cancelled sessions. Filter by status, search by reference, and view countdown timers for sessions.',
      tag: 'Rich Analytics',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: CalendarDays,
      title: 'Responsive Calendar Experience',
      description:
        'Switch effortlessly between list, timeline, and interactive calendar views optimized for desktop, tablet, and mobile screens.',
      tag: 'Adaptive UI',
      color: 'from-blue-500 to-violet-500',
    },
  ];

  return (
    <section className="py-20 relative bg-navy-950/60 border-t border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            Engineered for Reliability
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Why Professionals & Teams Rely on <span className="gradient-text-brand">SLOTORA</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Say goodbye to double bookings, messy email threads, and time-zone confusion.
            SLOTORA gives you complete control over your schedule.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="group relative glass-panel rounded-3xl p-8 border border-white/[0.08] hover:border-violet-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} p-0.5 shadow-lg flex items-center justify-center`}
                    >
                      <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-lavender-200 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                  <span>Learn more</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
