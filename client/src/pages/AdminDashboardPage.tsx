import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Appointment, Service, AdminStats } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Footer } from '../components/Footer.js';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loginAsDemoAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');

  // Appointment filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Service form modal
  const [serviceModalOpen, setServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: 'Tech & Architecture',
    durationMinutes: 45,
    price: 120,
    imageUrl: '',
    isActive: true,
  });

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const [statsRes, apptsRes, servicesRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getAppointments({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        api.services.getAll(),
      ]);
      setStats(statsRes.stats);
      setAppointments(apptsRes.appointments);
      setServices(servicesRes.services);
    } catch (err: any) {
      showError(err.message || 'Failed to load admin records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, statusFilter]);

  // Handle appointment status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.admin.updateAppointmentStatus(id, newStatus);
      success(`Status updated to ${newStatus}`);
      await loadAdminData();
    } catch (err: any) {
      showError(err.message || 'Status update failed');
    }
  };

  // Open Service Modal
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      category: 'Tech & Architecture',
      durationMinutes: 45,
      price: 120,
      imageUrl: '',
      isActive: true,
    });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (s: Service) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      description: s.description,
      category: s.category,
      durationMinutes: s.durationMinutes,
      price: s.price,
      imageUrl: s.imageUrl || '',
      isActive: s.isActive,
    });
    setServiceModalOpen(true);
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.admin.updateService(editingService.id, serviceForm);
        success('Service updated successfully');
      } else {
        await api.admin.createService(serviceForm);
        success('New service created successfully');
      }
      setServiceModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      showError(err.message || 'Failed to save service');
    }
  };

  // Toggle Active/Inactive
  const handleToggleActiveService = async (s: Service) => {
    try {
      await api.admin.updateService(s.id, { isActive: !s.isActive });
      success(`Service ${!s.isActive ? 'activated' : 'deactivated'}`);
      await loadAdminData();
    } catch (err: any) {
      showError(err.message || 'Action failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-navy-950">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-8 sm:p-12 max-w-md w-full border border-violet-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 mx-auto">
              <Lock className="w-8 h-8 text-violet-400" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Administrator Access Required</h2>
              <p className="text-xs text-slate-400 mt-2">
                This console is protected by server-side role verification. Please sign in with an
                authorized administrative credential.
              </p>
            </div>

            <button
              onClick={loginAsDemoAdmin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-electric text-white font-bold text-sm shadow-glow-violet hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Sign In as Elena Rostova (Admin)
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              System Administration
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Administrative Control Suite
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as {user?.name} ({user?.email}) • Full CRUD and Schedule Governance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenNewService}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white font-bold text-xs shadow-glow-subtle flex items-center gap-2 hover:shadow-violet-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Service
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total System Revenue
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">From confirmed bookings</span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Reservations
              </span>
              <div className="text-3xl font-extrabold text-violet-300 mt-1">
                {stats.totalAppointments}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.confirmedAppointments} confirmed active
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Completed Consultations
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {stats.completedAppointments}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Finished client sessions</span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Catalog
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {stats.totalServices} Services
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.totalProviders} specialists mapped
              </span>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'appointments'
                ? 'bg-violet-600 text-white shadow-glow-subtle'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'services'
                ? 'bg-violet-600 text-white shadow-glow-subtle'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Service Management ({services.length})
          </button>
        </div>

        {/* TAB 1: ALL APPOINTMENTS TABLE */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer, email, reference, service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAdminData()}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Appointments Table */}
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3.5 px-4">Reference</th>
                      <th className="py-3.5 px-4">Client</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Provider</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-300">
                          {appt.bookingReference}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{appt.customerName}</div>
                          <div className="text-slate-400 text-[11px]">{appt.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">{appt.service?.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{appt.provider?.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {appt.appointmentDate} <br />
                          <span className="text-[11px] text-slate-400">
                            {appt.startTime} - {appt.endTime}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : appt.status === 'COMPLETED'
                                ? 'bg-slate-500/15 text-slate-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold"
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                            )}
                            {appt.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold"
                                title="Cancel and Release Slot"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE MANAGEMENT */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="glass-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">
                      {svc.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        svc.isActive
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {svc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-1">{svc.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{svc.description}</p>

                  <div className="my-4 p-3 rounded-2xl bg-navy-900 border border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      <span className="text-slate-500">Duration:</span> {svc.durationMinutes} min
                    </div>
                    <div className="font-bold text-violet-300">${svc.price}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEditService(svc)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleActiveService(svc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      svc.isActive
                        ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {svc.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: CREATE / EDIT SERVICE */}
        {serviceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/[0.1] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold text-white">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h3>
                <button
                  onClick={() => setServiceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    placeholder="e.g. Quantitative Risk Analysis"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    placeholder="Brief description of objectives and session format..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    >
                      <option value="Tech & Architecture">Tech & Architecture</option>
                      <option value="Strategy & Advisory">Strategy & Advisory</option>
                      <option value="Career & Mentorship">Career & Mentorship</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Salon & Grooming">Salon & Grooming</option>
                      <option value="Education & Tutoring">Education & Tutoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={serviceForm.durationMinutes}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Price ($ USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                    <input
                      type="url"
                      value={serviceForm.imageUrl}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, imageUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setServiceModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-electric text-white font-bold text-xs shadow-glow-subtle"
                  >
                    Save Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
