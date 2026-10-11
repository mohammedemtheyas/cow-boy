import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User as UserIcon,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CalendarDays,
  List,
  CalendarRange,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import { Appointment, Slot } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Footer } from '../components/Footer.js';

export const MyAppointmentsPage: React.FC = () => {
  const { user, isAuthenticated, loginAsDemoUser } = useAuth();
  const { success, error: showError } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Guest lookup inputs
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestReference, setGuestReference] = useState<string>('');

  // Filters & Views
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'calendar'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedDetailsAppt, setSelectedDetailsAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Reschedule state
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState<boolean>(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<Slot | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);

  // Copied token state
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        const res = await api.appointments.getAll();
        setAppointments(res.appointments);
      } else if (guestReference.trim()) {
        const res = await api.appointments.getAll({ reference: guestReference.trim() });
        setAppointments(res.appointments);
      } else if (guestEmail.trim()) {
        const res = await api.appointments.getAll({ email: guestEmail.trim() });
        setAppointments(res.appointments);
      } else {
        // Default: try demo user appointments if guest hasn't searched yet
        const res = await api.appointments.getAll({ email: 'alex@example.com' });
        setAppointments(res.appointments);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated]);

  // KPI Calculations
  const totalCount = appointments.length;
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingCount = appointments.filter(
    (a) => a.status === 'CONFIRMED' && a.appointmentDate >= todayStr
  ).length;

  const completedCount = appointments.filter(
    (a) => a.status === 'COMPLETED' || (a.status === 'CONFIRMED' && a.appointmentDate < todayStr)
  ).length;

  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    // Tab filter
    if (activeTab === 'UPCOMING') {
      if (appt.status !== 'CONFIRMED' || appt.appointmentDate < todayStr) return false;
    } else if (activeTab === 'COMPLETED') {
      if (appt.status === 'CANCELLED') return false;
      if (appt.status !== 'COMPLETED' && appt.appointmentDate >= todayStr) return false;
    } else if (activeTab === 'CANCELLED') {
      if (appt.status !== 'CANCELLED') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = appt.bookingReference.toLowerCase().includes(q);
      const matchService = appt.service?.name.toLowerCase().includes(q);
      const matchProvider = appt.provider?.name.toLowerCase().includes(q);
      const matchCust = appt.customerName.toLowerCase().includes(q);
      return matchRef || matchService || matchProvider || matchCust;
    }

    return true;
  });

  // Calculate Countdown
  const getCountdownText = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, min] = timeStr.split(':').map(Number);
    const apptDate = new Date(y, m - 1, d, h, min);
    const now = new Date();

    const diffMs = apptDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'In progress / Past';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) return `Starts in ${diffDays} days`;
    if (diffDays === 1) return `Starts tomorrow`;
    if (diffHours > 1) return `Starts in ${diffHours} hours`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `Starts in ${diffMins} minutes`;
  };

  // Cancellation handler
  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;

    try {
      setIsCancelling(true);
      await api.appointments.cancel(cancellingAppt.id);
      success(
        `Appointment ${cancellingAppt.bookingReference} has been cancelled and the time slot is now released.`
      );
      setCancellingAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      showError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (appt: Appointment) => {
    setReschedulingAppt(appt);
    setRescheduleDate(appt.appointmentDate);
    setSelectedRescheduleSlot(null);
  };

  // Fetch Slots for Reschedule
  useEffect(() => {
    if (reschedulingAppt && rescheduleDate) {
      async function loadRescheduleSlots() {
        try {
          setLoadingRescheduleSlots(true);
          const res = await api.availability.getSlots(
            reschedulingAppt!.serviceId,
            reschedulingAppt!.providerId,
            rescheduleDate
          );
          setRescheduleSlots(res.slots);
        } catch (e) {
          console.error('Error fetching reschedule slots:', e);
        } finally {
          setLoadingRescheduleSlots(false);
        }
      }
      loadRescheduleSlots();
    }
  }, [reschedulingAppt, rescheduleDate]);

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!reschedulingAppt || !rescheduleDate || !selectedRescheduleSlot) return;

    try {
      setIsSubmittingReschedule(true);
      await api.appointments.reschedule(reschedulingAppt.id, {
        appointmentDate: rescheduleDate,
        startTime: selectedRescheduleSlot.startTime,
      });
      success(`Appointment successfully moved to ${rescheduleDate} at ${selectedRescheduleSlot.startTime}`);
      setReschedulingAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      showError(err.message || 'Slot collision: could not reschedule');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const copyRefToClipboard = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Client Reservation Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isAuthenticated ? `Welcome back, ${user?.name}` : 'My Appointments Dashboard'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your upcoming sessions, reschedule times, or review past consultation history.
            </p>
          </div>

          {/* Guest Search Controls if not authenticated */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 rounded-2xl glass-panel border border-white/[0.08]">
              <input
                type="text"
                placeholder="Find booking ref (e.g. SLT-89214)"
                value={guestReference}
                onChange={(e) => setGuestReference(e.target.value)}
                className="px-3 py-2 rounded-xl bg-navy-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={fetchAppointments}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors"
              >
                Lookup
              </button>
              <button
                onClick={loginAsDemoUser}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-lavender-200 text-xs font-semibold transition-colors"
              >
                Sign In Demo User
              </button>
            </div>
          )}
        </div>

        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Bookings
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">{totalCount}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">All registered sessions</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/10">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Upcoming
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{upcomingCount}</div>
            <span className="text-[11px] text-emerald-300/70 mt-1 block">Active future sessions</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-3xl font-extrabold text-slate-200 mt-1">{completedCount}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Concluded consultations</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-rose-500/20 bg-rose-950/10">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
              Cancelled
            </span>
            <div className="text-3xl font-extrabold text-rose-400 mt-1">{cancelledCount}</div>
            <span className="text-[11px] text-rose-300/70 mt-1 block">Released slots</span>
          </div>
        </div>

        {/* View Switcher, Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-navy-900 border border-white/[0.08] overflow-x-auto">
            {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white shadow-glow-subtle'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL'
                  ? `All (${totalCount})`
                  : tab === 'UPCOMING'
                  ? `Upcoming (${upcomingCount})`
                  : tab === 'COMPLETED'
                  ? `Completed (${completedCount})`
                  : `Cancelled (${cancelledCount})`}
              </button>
            ))}
          </div>

          {/* Search bar & View mode triggers */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search booking ref, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-navy-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-navy-900 border border-white/[0.08]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Card View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chronological Timeline View"
              >
                <CalendarRange className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div>
            {/* VIEW 1: CARDS / LIST VIEW */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAppointments.map((appt) => {
                  const isUpcoming = appt.status === 'CONFIRMED' && appt.appointmentDate >= todayStr;

                  return (
                    <div
                      key={appt.id}
                      className="glass-panel rounded-3xl p-6 border border-white/[0.08] hover:border-violet-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header strip */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-violet-300">
                              {appt.bookingReference}
                            </span>
                            <button
                              onClick={() => copyRefToClipboard(appt.bookingReference)}
                              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                              title="Copy Reference"
                            >
                              {copiedRef === appt.bookingReference ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                : appt.status === 'CANCELLED'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                : 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        {/* Service Title */}
                        <div className="mt-4">
                          <h3 className="text-lg font-bold text-white line-clamp-1">
                            {appt.service?.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Specialist: {appt.provider?.name} ({appt.provider?.title})
                          </p>
                        </div>

                        {/* Date & Time pill */}
                        <div className="my-4 p-3 rounded-2xl bg-navy-900/90 border border-white/[0.06] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-slate-200">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <span>{appt.appointmentDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-lavender-300 font-semibold">
                            <Clock className="w-4 h-4 text-electric" />
                            <span>
                              {appt.startTime} - {appt.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Countdown Badge if upcoming */}
                        {isUpcoming && (
                          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            {getCountdownText(appt.appointmentDate, appt.startTime)}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedDetailsAppt(appt)}
                          className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          View Details
                        </button>

                        {appt.status === 'CONFIRMED' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenReschedule(appt)}
                              className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reschedule
                            </button>

                            <button
                              onClick={() => setCancellingAppt(appt)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: VISUAL TIMELINE VIEW */}
            {viewMode === 'timeline' && (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-violet-500/30 space-y-8 my-4">
                {filteredAppointments.map((appt) => (
                  <div key={appt.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 rounded-full bg-navy-950 border-2 border-violet-500 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                      <Clock className="w-3.5 h-3.5" />
                    </div>

                    <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] hover:border-violet-500/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-violet-400">
                          {appt.appointmentDate} • {appt.startTime} - {appt.endTime}
                        </span>
                        <span
                          className={`self-start text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            appt.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-rose-500/10 text-rose-300'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{appt.service?.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Specialist: {appt.provider?.name} • Ref: {appt.bookingReference}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => setSelectedDetailsAppt(appt)}
                          className="text-xs font-semibold text-slate-300 hover:text-white"
                        >
                          Details →
                        </button>
                        {appt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center glass-panel rounded-3xl border border-white/[0.08]">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No Appointments Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no bookings under this status. Explore our services to book your
              next session.
            </p>
          </div>
        )}
      </main>

      {/* MODAL 1: VIEW DETAILS MODAL */}
      {selectedDetailsAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/[0.1] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  Appointment Details
                </span>
                <span className="text-base font-mono font-bold text-violet-300">
                  {selectedDetailsAppt.bookingReference}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailsAppt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Service Name</span>
                <span className="text-sm font-bold text-white">
                  {selectedDetailsAppt.service?.name}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {selectedDetailsAppt.service?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Specialist</span>
                  <span className="font-semibold text-white">
                    {selectedDetailsAppt.provider?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                  <span className="font-bold text-emerald-400">
                    {selectedDetailsAppt.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Date</span>
                  <span className="font-semibold text-white">
                    {selectedDetailsAppt.appointmentDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Time</span>
                  <span className="font-semibold text-white">
                    {selectedDetailsAppt.startTime} - {selectedDetailsAppt.endTime}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400 block text-[10px] uppercase">Client Details</span>
                <span className="text-white block font-medium">
                  {selectedDetailsAppt.customerName} • {selectedDetailsAppt.customerEmail}
                </span>
                <span className="text-slate-400 block">{selectedDetailsAppt.customerPhone}</span>
              </div>

              {selectedDetailsAppt.notes && (
                <div className="p-3 rounded-xl bg-navy-900 border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] uppercase mb-1">Session Notes</span>
                  <p className="text-slate-300 italic">{selectedDetailsAppt.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDetailsAppt(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CANCELLATION CONFIRMATION MODAL */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/30 shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Cancel Appointment?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel booking{' '}
                <span className="font-mono text-white font-bold">
                  {cancellingAppt.bookingReference}
                </span>
                ? This action will immediately release the time slot ({cancellingAppt.startTime} -{' '}
                {cancellingAppt.endTime} on {cancellingAppt.appointmentDate}) for other clients to
                book.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-navy-900/90 border border-white/[0.08] text-xs space-y-1.5">
              <div className="text-slate-300">
                <span className="text-slate-500">Service:</span> {cancellingAppt.service?.name}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Specialist:</span> {cancellingAppt.provider?.name}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Releasing Slot...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK RESCHEDULE MODAL */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-violet-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-violet-400" />
                  Quick Reschedule
                </h3>
                <p className="text-xs text-slate-400">
                  Select a new available date & time for {reschedulingAppt.bookingReference}
                </p>
              </div>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select New Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. Select New Slot
                </label>
                {loadingRescheduleSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : rescheduleSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {rescheduleSlots.map((s, idx) => {
                      const isSel = selectedRescheduleSlot?.startTime === s.startTime;
                      return (
                        <button
                          key={idx}
                          disabled={!s.available}
                          onClick={() => setSelectedRescheduleSlot(s)}
                          className={`p-2 rounded-xl text-xs font-semibold transition-all border ${
                            !s.available
                              ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-50'
                              : isSel
                              ? 'bg-violet-600 border-violet-400 text-white font-bold'
                              : 'bg-navy-900 border-white/[0.08] text-slate-200 hover:bg-violet-500/10'
                          }`}
                        >
                          {s.startTime}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No open slots on this date.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReschedulingAppt(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedRescheduleSlot || isSubmittingReschedule}
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white text-xs font-bold shadow-glow-subtle disabled:opacity-50"
              >
                {isSubmittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
