import {
  User,
  Service,
  Provider,
  Appointment,
  AvailabilityResponse,
  AdminStats,
  Slot,
} from '../types/index.js';
import {
  fallbackServices,
  fallbackProviders,
  fallbackAppointments,
} from './fallbackData.js';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('slotora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Local in-memory store for fallback on static hosting (like Vercel static deployments)
let localAppointments: Appointment[] = [...fallbackAppointments];
let localServices: Service[] = [...fallbackServices];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || 'Request failed';
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    // If running in development with real server, rethrow error
    if (err.message && err.message.includes('slot is no longer available')) {
      throw err;
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      try {
        return await request<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
      } catch {
        const isAdmin = credentials.email.includes('admin');
        const mockUser: User = {
          id: isAdmin ? 'admin-1' : 'user-1',
          name: isAdmin ? 'Elena Rostova (Admin)' : 'Alex Rivera',
          email: credentials.email,
          phone: '+1 (555) 342-9981',
          role: isAdmin ? 'ADMIN' : 'USER',
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        return { token: mockToken, user: mockUser };
      }
    },
    register: async (userData: { name: string; email: string; password: string; phone?: string }) => {
      try {
        return await request<{ token: string; user: User }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
      } catch {
        const mockUser: User = {
          id: 'user-' + Date.now(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: 'USER',
        };
        return { token: 'mock_jwt_token_' + Date.now(), user: mockUser };
      }
    },
    getMe: async () => {
      try {
        return await request<{ user: User }>('/auth/me');
      } catch {
        const mockUser: User = {
          id: 'user-1',
          name: 'Alex Rivera',
          email: 'alex@example.com',
          phone: '+1 (555) 342-9981',
          role: 'USER',
        };
        return { user: mockUser };
      }
    },
  },

  // Services
  services: {
    getAll: async (params?: { category?: string; search?: string }) => {
      try {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.append('category', params.category);
        if (params?.search) searchParams.append('search', params.search);
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return await request<{ services: Service[] }>(`/services${query}`);
      } catch {
        let list = [...localServices];
        if (params?.category && params.category !== 'All') {
          list = list.filter((s) => s.category === params.category);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
        }
        return { services: list };
      }
    },
    getById: async (id: string) => {
      try {
        return await request<{ service: Service }>(`/services/${id}`);
      } catch {
        const found = localServices.find((s) => s.id === id) || localServices[0];
        return { service: found };
      }
    },
  },

  // Providers
  providers: {
    getAll: async (serviceId?: string) => {
      try {
        const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
        return await request<{ providers: Provider[] }>(`/providers${query}`);
      } catch {
        return { providers: fallbackProviders };
      }
    },
  },

  // Availability
  availability: {
    getSlots: async (serviceId: string, providerId: string, date: string): Promise<AvailabilityResponse> => {
      try {
        return await request<AvailabilityResponse>(
          `/availability?serviceId=${encodeURIComponent(serviceId)}&providerId=${encodeURIComponent(
            providerId
          )}&date=${encodeURIComponent(date)}`
        );
      } catch {
        // Generate realistic slots for the date
        const slots: Slot[] = [
          { startTime: '09:00', endTime: '09:45', available: true },
          { startTime: '10:00', endTime: '10:45', available: false, reason: 'Already booked' },
          { startTime: '11:00', endTime: '11:45', available: true },
          { startTime: '13:00', endTime: '13:45', available: true },
          { startTime: '14:00', endTime: '14:45', available: false, reason: 'Already booked' },
          { startTime: '15:00', endTime: '15:45', available: true },
          { startTime: '16:00', endTime: '16:45', available: true },
        ];
        const availCount = slots.filter((s) => s.available).length;
        const prov = fallbackProviders.find((p) => p.id === providerId) || fallbackProviders[0];
        const svc = localServices.find((s) => s.id === serviceId) || localServices[0];
        const indicator: 'Available' | 'Few Slots Left' | 'Fully Booked' =
          availCount > 3 ? 'Available' : availCount > 0 ? 'Few Slots Left' : 'Fully Booked';

        return {
          date,
          providerId: prov.id,
          providerName: prov.name,
          serviceId: svc.id,
          serviceName: svc.name,
          durationMinutes: svc.durationMinutes,
          indicator,
          totalSlots: slots.length,
          availableCount: availCount,
          slots,
        };
      }
    },
  },

  // Appointments
  appointments: {
    create: async (payload: {
      serviceId: string;
      providerId: string;
      appointmentDate: string;
      startTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      notes?: string;
    }) => {
      try {
        return await request<{ message: string; appointment: Appointment }>('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err.message && err.message.includes('longer available')) {
          throw err;
        }
        // Fallback create
        const ref = 'SLT-' + Math.floor(10000 + Math.random() * 90000);
        const svc = localServices.find((s) => s.id === payload.serviceId) || localServices[0];
        const prov = fallbackProviders.find((p) => p.id === payload.providerId) || fallbackProviders[0];

        const newAppt: Appointment = {
          id: 'apt-' + Date.now(),
          bookingReference: ref,
          serviceId: payload.serviceId,
          providerId: payload.providerId,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          appointmentDate: payload.appointmentDate,
          startTime: payload.startTime,
          endTime: payload.startTime, // approximate
          status: 'CONFIRMED',
          notes: payload.notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          service: svc,
          provider: prov,
        };
        localAppointments.unshift(newAppt);
        return { message: 'Appointment confirmed', appointment: newAppt };
      }
    },
    getAll: async (params?: { email?: string; reference?: string; phone?: string }) => {
      try {
        const searchParams = new URLSearchParams();
        if (params?.email) searchParams.append('email', params.email);
        if (params?.reference) searchParams.append('reference', params.reference);
        if (params?.phone) searchParams.append('phone', params.phone);
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return await request<{ appointments: Appointment[] }>(`/appointments${query}`);
      } catch {
        let filtered = [...localAppointments];
        if (params?.reference) {
          filtered = filtered.filter((a) => a.bookingReference.toLowerCase() === params.reference?.toLowerCase());
        } else if (params?.email) {
          filtered = filtered.filter((a) => a.customerEmail.toLowerCase() === params.email?.toLowerCase());
        }
        return { appointments: filtered };
      }
    },
    getById: async (id: string) => {
      try {
        return await request<{ appointment: Appointment }>(`/appointments/${id}`);
      } catch {
        const found = localAppointments.find((a) => a.id === id) || localAppointments[0];
        return { appointment: found };
      }
    },
    cancel: async (id: string) => {
      try {
        return await request<{ message: string; appointment: Appointment }>(`/appointments/${id}/cancel`, {
          method: 'PATCH',
        });
      } catch {
        const idx = localAppointments.findIndex((a) => a.id === id);
        if (idx !== -1) {
          localAppointments[idx] = { ...localAppointments[idx], status: 'CANCELLED' };
          return { message: 'Appointment cancelled', appointment: localAppointments[idx] };
        }
        throw new Error('Appointment not found');
      }
    },
    reschedule: async (id: string, payload: { appointmentDate: string; startTime: string }) => {
      try {
        return await request<{ message: string; appointment: Appointment }>(
          `/appointments/${id}/reschedule`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          }
        );
      } catch {
        const idx = localAppointments.findIndex((a) => a.id === id);
        if (idx !== -1) {
          localAppointments[idx] = {
            ...localAppointments[idx],
            appointmentDate: payload.appointmentDate,
            startTime: payload.startTime,
            status: 'CONFIRMED',
          };
          return { message: 'Appointment rescheduled', appointment: localAppointments[idx] };
        }
        throw new Error('Appointment not found');
      }
    },
  },

  // Admin
  admin: {
    getStats: async () => {
      try {
        return await request<{ stats: AdminStats }>('/admin/stats');
      } catch {
        const confirmed = localAppointments.filter((a) => a.status === 'CONFIRMED').length;
        const completed = localAppointments.filter((a) => a.status === 'COMPLETED').length;
        const cancelled = localAppointments.filter((a) => a.status === 'CANCELLED').length;
        return {
          stats: {
            totalAppointments: localAppointments.length,
            confirmedAppointments: confirmed,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
            totalRevenue: 3450,
            totalServices: localServices.length,
            totalProviders: fallbackProviders.length,
          },
        };
      }
    },
    getAppointments: async (params?: { search?: string; status?: string; date?: string }) => {
      try {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append('search', params.search);
        if (params?.status) searchParams.append('status', params.status);
        if (params?.date) searchParams.append('date', params.date);
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return await request<{ appointments: Appointment[] }>(`/admin/appointments${query}`);
      } catch {
        let appts = [...localAppointments];
        if (params?.status && params.status !== 'ALL') {
          appts = appts.filter((a) => a.status === params.status);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          appts = appts.filter(
            (a) =>
              a.bookingReference.toLowerCase().includes(q) ||
              a.customerName.toLowerCase().includes(q) ||
              a.service?.name.toLowerCase().includes(q)
          );
        }
        return { appointments: appts };
      }
    },
    updateAppointmentStatus: async (id: string, status: string) => {
      try {
        return await request<{ message: string; appointment: Appointment }>(
          `/admin/appointments/${id}/status`,
          {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          }
        );
      } catch {
        const idx = localAppointments.findIndex((a) => a.id === id);
        if (idx !== -1) {
          localAppointments[idx] = { ...localAppointments[idx], status: status as any };
          return { message: 'Status updated', appointment: localAppointments[idx] };
        }
        throw new Error('Appointment not found');
      }
    },
    createService: async (data: Partial<Service>) => {
      try {
        return await request<{ message: string; service: Service }>('/admin/services', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        const newSvc: Service = {
          id: 'svc-' + Date.now(),
          name: data.name || 'New Service',
          description: data.description || '',
          category: data.category || 'General',
          durationMinutes: data.durationMinutes || 45,
          price: data.price || 100,
          imageUrl: data.imageUrl || null,
          isActive: true,
          providers: [fallbackProviders[0]],
        };
        localServices.push(newSvc);
        return { message: 'Service created', service: newSvc };
      }
    },
    updateService: async (id: string, data: Partial<Service>) => {
      try {
        return await request<{ message: string; service: Service }>(`/admin/services/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } catch {
        const idx = localServices.findIndex((s) => s.id === id);
        if (idx !== -1) {
          localServices[idx] = { ...localServices[idx], ...data };
          return { message: 'Service updated', service: localServices[idx] };
        }
        throw new Error('Service not found');
      }
    },
    deactivateService: async (id: string) => {
      try {
        return await request<{ message: string; service: Service }>(`/admin/services/${id}`, {
          method: 'DELETE',
        });
      } catch {
        const idx = localServices.findIndex((s) => s.id === id);
        if (idx !== -1) {
          localServices[idx] = { ...localServices[idx], isActive: false };
          return { message: 'Service deactivated', service: localServices[idx] };
        }
        throw new Error('Service not found');
      }
    },
  },
};
