import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  Copy,
  Check,
  CalendarCheck2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Service, Provider, Slot, AvailabilityResponse, Appointment } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  onBookingSuccess?: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedServiceId,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  // Wizard Step (1 to 5)
  const [step, setStep] = useState<number>(1);

  // Data sources
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

  // Selection states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Calendar states
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  // Slot states
  const [availabilityData, setAvailabilityData] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Customer Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Load initial services
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoadingServices(true);
        const res = await api.services.getAll();
        setServices(res.services);

        if (preselectedServiceId) {
          const match = res.services.find((s) => s.id === preselectedServiceId);
          if (match) {
            setSelectedService(match);
            if (match.providers && match.providers.length > 0) {
              setSelectedProvider(match.providers[0]);
            }
          }
        } else if (res.services.length > 0) {
          setSelectedService(res.services[0]);
          if (res.services[0].providers && res.services[0].providers.length > 0) {
            setSelectedProvider(res.services[0].providers[0]);
          }
        }
      } catch (err: any) {
        showError('Failed to load services: ' + err.message);
      } finally {
        setLoadingServices(false);
      }
    }
    loadData();
  }, [isOpen, preselectedServiceId]);

  // Keep form data in sync with logged in user
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Whenever service changes, update provider list
  useEffect(() => {
    if (selectedService?.providers && selectedService.providers.length > 0) {
      setProviders(selectedService.providers);
      if (!selectedProvider || !selectedService.providers.some((p) => p.id === selectedProvider.id)) {
        setSelectedProvider(selectedService.providers[0]);
      }
    }
  }, [selectedService]);

  // Fetch slots whenever service, provider, or selectedDate changes
  useEffect(() => {
    if (selectedService && selectedProvider && selectedDate) {
      async function fetchSlots() {
        try {
          setLoadingSlots(true);
          setSelectedSlot(null);
          const res = await api.availability.getSlots(
            selectedService!.id,
            selectedProvider!.id,
            selectedDate
          );
          setAvailabilityData(res);
        } catch (err: any) {
          showError('Could not load slots: ' + err.message);
          setAvailabilityData(null);
        } finally {
          setLoadingSlots(false);
        }
      }
      fetchSlots();
    }
  }, [selectedService, selectedProvider, selectedDate]);

  if (!isOpen) return null;

  // Calendar helpers
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      errors.phone = 'Valid phone number required (min 7 digits)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!validateForm()) return;
    if (!selectedService || !selectedProvider || !selectedDate || !selectedSlot) {
      showError('Incomplete booking parameters. Please review your selections.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.appointments.create({
        serviceId: selectedService.id,
        providerId: selectedProvider.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: formData.phone.trim(),
        notes: formData.notes.trim() || undefined,
      });

      setConfirmedBooking(res.appointment);
      setStep(5);
      success('Your appointment is confirmed! Reference: ' + res.appointment.bookingReference);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#6366F1', '#38BDF8', '#EDE9FE'],
      });

      if (onBookingSuccess) {
        onBookingSuccess(res.appointment);
      }
    } catch (err: any) {
      showError(err.message || 'Slot collision: could not complete reservation');
      // If conflict, refresh slots
      if (selectedService && selectedProvider && selectedDate) {
        const refreshed = await api.availability.getSlots(
          selectedService.id,
          selectedProvider.id,
          selectedDate
        ).catch(() => null);
        if (refreshed) setAvailabilityData(refreshed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBookingRef = () => {
    if (confirmedBooking?.bookingReference) {
      navigator.clipboard.writeText(confirmedBooking.bookingReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedSlot(null);
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-navy-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl shadow-2xl border border-white/[0.1] overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="relative px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Smart Appointment Booking</h2>
              <p className="text-xs text-slate-400">Step {step} of 5 — {
                step === 1 ? 'Choose Service & Specialist' :
                step === 2 ? 'Select Preferred Date' :
                step === 3 ? 'Choose Available Time Slot' :
                step === 4 ? 'Confirm Client Details' :
                'Reservation Confirmed'
              }</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="w-full bg-white/[0.04] h-1.5 flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-500 h-full ${
                s <= step
                  ? 'bg-gradient-to-r from-violet-600 to-electric'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: SELECT SERVICE & PROVIDER */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-300 uppercase mb-3">
                  1. Select Service Experience
                </label>
                {loadingServices ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          selectedService?.id === svc.id
                            ? 'bg-violet-600/15 border-violet-500 shadow-glow-subtle'
                            : 'bg-navy-900/60 border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm sm:text-base">
                              {svc.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-lavender-300 border border-white/[0.1]">
                              {svc.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                            {svc.description}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-violet-300">${svc.price}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {svc.durationMinutes} min
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Provider selection */}
              {selectedService && (
                <div>
                  <label className="block text-xs font-bold tracking-wider text-slate-300 uppercase mb-3">
                    2. Select Specialist / Provider
                  </label>
                  {selectedService.providers && selectedService.providers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedService.providers.map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => setSelectedProvider(prov)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                            selectedProvider?.id === prov.id
                              ? 'bg-violet-600/20 border-violet-500 shadow-glow-subtle'
                              : 'bg-navy-900/60 border-white/[0.06] hover:bg-white/[0.04]'
                          }`}
                        >
                          <img
                            src={prov.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt={prov.name}
                            className="w-11 h-11 rounded-xl object-cover border border-white/10"
                          />
                          <div className="overflow-hidden">
                            <p className="font-semibold text-white text-sm truncate">{prov.name}</p>
                            <p className="text-xs text-violet-300 truncate">{prov.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Any available specialist will be assigned.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT DATE */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-violet-400" />
                    Select an Available Date
                  </h3>
                  <p className="text-xs text-slate-400">
                    With {selectedProvider?.name} ({selectedService?.name})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-200 min-w-[120px] text-center">
                    {monthNames[month]} {year}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4 rounded-2xl bg-navy-900/60 border border-white/[0.08]">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days matrix */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                      dayNum
                    ).padStart(2, '0')}`;
                    const isPast = dateStr < todayStr;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dayNum}
                        disabled={isPast}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`h-11 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center relative ${
                          isPast
                            ? 'text-slate-600 cursor-not-allowed bg-transparent'
                            : isSelected
                            ? 'bg-violet-600 text-white font-bold shadow-glow-violet scale-105 z-10'
                            : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {dateStr === todayStr && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-electric-cyan absolute bottom-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-lavender-200">
                  <span>Selected Date:</span>
                  <span className="font-bold text-white text-sm">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SELECT TIME SLOT */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    Available Time Slots
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} • {selectedService?.durationMinutes} min session
                  </p>
                </div>

                {/* Smart Availability Indicator */}
                {availabilityData && (
                  <div
                    className={`text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                      availabilityData.indicator === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : availabilityData.indicator === 'Few Slots Left'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {availabilityData.indicator} ({availabilityData.availableCount} open)
                  </div>
                )}
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
                  ))}
                </div>
              ) : availabilityData?.slots && availabilityData.slots.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {availabilityData.slots.map((s, idx) => {
                      const isSelected = selectedSlot?.startTime === s.startTime;

                      return (
                        <button
                          key={idx}
                          disabled={!s.available}
                          onClick={() => setSelectedSlot(s)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                            !s.available
                              ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-violet-600 border-violet-400 text-white font-bold shadow-glow-violet scale-105'
                              : 'bg-navy-900/80 border-white/[0.08] text-slate-200 hover:border-violet-500/50 hover:bg-violet-600/10'
                          }`}
                        >
                          <span className="text-sm font-semibold">{s.startTime}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {s.available ? `${s.endTime}` : (s.reason || 'Reserved')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    ⚡ Times are displayed in your local time zone. Slots are protected against duplicate bookings.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">No Slots Available</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {availabilityData?.message ||
                      'All slots for this provider on this day are currently booked or outside working hours. Please choose another date.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS FORM */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  Customer Information & Notes
                </h3>
                <p className="text-xs text-slate-400">
                  Please verify your contact details so we can send your instant booking confirmation.
                </p>
              </div>

              {/* Appointment Summary Strip */}
              <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Service</span>
                  <span className="font-semibold text-white truncate block">{selectedService?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Specialist</span>
                  <span className="font-semibold text-white truncate block">{selectedProvider?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Date & Time</span>
                  <span className="font-semibold text-lavender-300 block">
                    {selectedDate} • {selectedSlot?.startTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      formErrors.name
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-white/[0.1] focus:border-violet-500'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      formErrors.email
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-white/[0.1] focus:border-violet-500'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 342-9981"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      formErrors.phone
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-white/[0.1] focus:border-violet-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Notes / Goals for this session (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific topics or objectives you wish to cover..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION SCREEN */}
          {step === 5 && confirmedBooking && (
            <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-violet-400">
                  Appointment Confirmed
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  You’re all booked, {confirmedBooking.customerName}!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A verification confirmation has been recorded in the database.
                </p>
              </div>

              {/* Reference card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-navy-900/90 border border-white/[0.1] space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Booking Reference
                    </span>
                    <span className="text-lg font-mono font-bold text-violet-300">
                      {confirmedBooking.bookingReference}
                    </span>
                  </div>
                  <button
                    onClick={copyBookingRef}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-200 transition-colors"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRef ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Service</span>
                    <span className="font-semibold text-white block">{confirmedBooking.service?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Provider</span>
                    <span className="font-semibold text-white block">{confirmedBooking.provider?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Date</span>
                    <span className="font-semibold text-white block">{confirmedBooking.appointmentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Time</span>
                    <span className="font-semibold text-white block">
                      {confirmedBooking.startTime} - {confirmedBooking.endTime}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                    {confirmedBooking.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetModal}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-glow-violet transition-all"
                >
                  Done & Return to App
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {step < 5 && (
          <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                type="button"
                disabled={!selectedService || !selectedProvider}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-xs font-bold shadow-glow-violet disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-violet-500/40 transition-all"
              >
                Continue to Date
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={!selectedDate}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-xs font-bold shadow-glow-violet disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-violet-500/40 transition-all"
              >
                Select Time Slot
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-xs font-bold shadow-glow-violet disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-violet-500/40 transition-all"
              >
                Enter Details
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-xs font-bold shadow-glow-violet hover:shadow-violet-500/40 disabled:opacity-60 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Locking Slot...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4" />
                    Confirm & Reserve Slot
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
