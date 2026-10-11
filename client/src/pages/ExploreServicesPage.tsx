import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Service } from '../types/index.js';
import { api } from '../services/api.js';
import { BookingModal } from '../components/BookingModal.js';
import { Footer } from '../components/Footer.js';

export const ExploreServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'price'>('name');

  // Booking modal trigger
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  const categories = [
    'All',
    'Strategy & Advisory',
    'Tech & Architecture',
    'Career & Mentorship',
    'Health & Wellness',
    'Salon & Grooming',
    'Education & Tutoring',
  ];

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await api.services.getAll({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: search.trim() ? search.trim() : undefined,
        });
        setServices(res.services);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchServices();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

  // Sort services
  const sortedServices = [...services].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
    if (sortBy === 'price') return a.price - b.price;
    return 0;
  });

  const handleBookService = (serviceId: string) => {
    setBookingServiceId(serviceId);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Tailored Professional Services
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore Curated Experiences
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Select a verified specialist session, configure your preferred slot, and lock in
            uninterrupted appointment time.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-xl mb-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, topics, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-navy-900 border border-white/[0.1] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-navy-900 border border-white/[0.1] text-xs text-slate-300 w-full md:w-auto">
                <ArrowUpDown className="w-4 h-4 text-violet-400" />
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="name">Service Name</option>
                  <option value="duration">Duration (Shortest first)</option>
                  <option value="price">Price (Lowest first)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-glow-subtle'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : sortedServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedServices.map((service) => (
              <div
                key={service.id}
                className="group glass-panel rounded-3xl overflow-hidden border border-white/[0.08] hover:border-violet-500/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow-subtle flex flex-col justify-between"
              >
                <div>
                  {/* Service Image banner */}
                  <div className="relative h-48 w-full overflow-hidden bg-navy-900">
                    <img
                      src={
                        service.imageUrl ||
                        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
                    <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full glass-panel text-lavender-200 border border-white/[0.1]">
                      {service.category}
                    </span>
                    <div className="absolute bottom-3 right-4 text-lg font-extrabold text-white">
                      ${service.price}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-lavender-200 transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-300 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span>{service.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Instant Confirmation</span>
                      </div>
                    </div>

                    {/* Providers Preview */}
                    {service.providers && service.providers.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                          Assigned Specialists
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {service.providers.map((p) => (
                              <img
                                key={p.id}
                                src={
                                  p.avatarUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                                }
                                alt={p.name}
                                title={`${p.name} (${p.title})`}
                                className="w-7 h-7 rounded-full object-cover border-2 border-navy-950"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-300 truncate">
                            {service.providers.map((p) => p.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Button */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleBookService(service.id)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-electric hover:shadow-violet-500/40 text-white font-bold text-sm shadow-glow-subtle transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center glass-panel rounded-3xl border border-white/[0.08]">
            <Filter className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No Matching Services</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any services matching your filters. Try selecting "All" or altering
              your search query.
            </p>
          </div>
        )}
      </main>

      <Footer onOpenBookingModal={() => setBookingModalOpen(true)} />

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preselectedServiceId={bookingServiceId}
      />
    </div>
  );
};
