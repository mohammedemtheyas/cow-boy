import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Service, Provider, Slot, AvailabilityResponse } from '../types/index.js';
import { api } from '../services/api.js';

interface QuickBookingWidgetProps {
  onProceedToForm: (serviceId: string, providerId: string, date: string, slot: Slot) => void;
}

export const QuickBookingWidget: React.FC<QuickBookingWidgetProps> = ({ onProceedToForm }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Set default date to tomorrow or today
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const ymd = tomorrow.toISOString().split('T')[0];
    setDate(ymd);

    async function loadServices() {
      try {
        const res = await api.services.getAll();
        setServices(res.services);
        if (res.services.length > 0) {
          setSelectedServiceId(res.services[0].id);
          if (res.services[0].providers && res.services[0].providers.length > 0) {
            setProviders(res.services[0].providers);
            setSelectedProviderId(res.services[0].providers[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading services in quick widget:', e);
      }
    }
    loadServices();
  }, []);

  // When service changes, update provider
  const handleServiceChange = (svcId: string) => {
    setSelectedServiceId(svcId);
    setSelectedSlot(null);
    const match = services.find((s) => s.id === svcId);
    if (match && match.providers && match.providers.length > 0) {
      setProviders(match.providers);
      setSelectedProviderId(match.providers[0].id);
    }
  };

  // Fetch slots whenever service, provider, or date changes
  useEffect(() => {
    if (selectedServiceId && selectedProviderId && date) {
      async function fetchSlots() {
        try {
          setLoadingSlots(true);
          setSelectedSlot(null);
          const res = await api.availability.getSlots(selectedServiceId, selectedProviderId, date);
          setAvailability(res);
        } catch (e) {
          console.error('Error fetching slots:', e);
          setAvailability(null);
        } finally {
          setLoadingSlots(false);
        }
      }
      fetchSlots();
    }
  }, [selectedServiceId, selectedProviderId, date]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleContinue = () => {
    if (selectedServiceId && selectedProviderId && date && selectedSlot) {
      onProceedToForm(selectedServiceId, selectedProviderId, date, selectedSlot);
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl relative overflow-hidden bg-radial-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Live Scheduling Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Instant Smart Booking Widget
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time server availability check with instant conflict prevention.
          </p>
        </div>

        {availability && (
          <div
            className={`self-start md:self-auto text-xs px-3.5 py-1.5 rounded-full font-semibold border flex items-center gap-2 ${
              availability.indicator === 'Available'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : availability.indicator === 'Few Slots Left'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {availability.indicator} ({availability.availableCount} slots open)
          </div>
        )}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Service selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Select Service
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (${s.price} • {s.durationMinutes}m)
              </option>
            ))}
          </select>
        </div>

        {/* Provider selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            2. Specialist / Provider
          </label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.title})
              </option>
            ))}
          </select>
        </div>

        {/* Date input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            3. Choose Date
          </label>
          <div className="relative">
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Time Slots Preview Section */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>4. Live Available Slots</span>
          <span className="text-[11px] text-slate-400 normal-case">
            Select a slot to continue
          </span>
        </label>

        {loadingSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : availability?.slots && availability.slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {availability.slots.slice(0, 12).map((s, idx) => {
              const isSelected = selectedSlot?.startTime === s.startTime;
              return (
                <button
                  key={idx}
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    !s.available
                      ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-violet-600 border-violet-400 text-white font-bold shadow-glow-violet scale-105'
                      : 'bg-navy-900/80 border-white/[0.08] text-slate-200 hover:border-violet-500/50 hover:bg-violet-600/10'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold">{s.startTime}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {s.available ? 'Open' : (s.reason || 'Booked')}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3 text-xs text-slate-400">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>{availability?.message || 'No available slots for the selected date.'}</span>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>
            {selectedSlot
              ? `Selected slot: ${selectedSlot.startTime} - ${selectedSlot.endTime}`
              : 'Choose a time slot above to proceed'}
          </span>
        </div>

        <button
          disabled={!selectedSlot}
          onClick={handleContinue}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white font-bold text-sm shadow-glow-violet hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
        >
          <span>Continue to Reservation Details</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
