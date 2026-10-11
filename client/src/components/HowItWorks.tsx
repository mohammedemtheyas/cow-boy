import React from 'react';
import { Layers, CalendarCheck, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Layers,
      title: 'Choose Your Service',
      description:
        'Explore curated services across advisory, technical consultation, health, or tutoring. Select the right specialist tailored to your goals.',
    },
    {
      num: '02',
      icon: CalendarCheck,
      title: 'Select Your Perfect Time',
      description:
        'Browse real-time available calendar slots. Filter by morning, afternoon, or evening. The system guarantees zero scheduling collisions.',
    },
    {
      num: '03',
      icon: CheckCircle2,
      title: 'Confirm & Manage',
      description:
        'Get an instant confirmation reference with full coordinates. View, reschedule, or cancel anytime from your personal client dashboard.',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            Simple 3-Step Flow
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            A frictionless, transparent booking journey designed for modern clients and providers.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-violet-600/40 via-electric/40 to-violet-600/40 -translate-y-12 z-0" />

          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="relative z-10 glass-panel rounded-3xl p-8 border border-white/[0.08] hover:border-violet-500/30 transition-all flex flex-col items-center text-center group"
              >
                {/* Step badge */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-electric flex items-center justify-center text-white shadow-glow-violet mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8 text-lavender-100" />
                </div>

                <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest mb-2">
                  Step {st.num}
                </span>

                <h3 className="text-xl font-bold text-white mb-3">{st.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{st.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
