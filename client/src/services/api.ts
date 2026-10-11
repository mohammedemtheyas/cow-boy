import {
  User,
  Service,
  Provider,
  Appointment,
  AvailabilityResponse,
  AdminStats,
} from '../types/index.js';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('slotora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

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
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: { name: string; email: string; password: string; phone?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
  },

  // Services
  services: {
    getAll: (params?: { category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.search) searchParams.append('search', params.search);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<{ services: Service[] }>(`/services${query}`);
    },
    getById: (id: string) => request<{ service: Service }>(`/services/${id}`),
  },

  // Providers
  providers: {
    getAll: (serviceId?: string) => {
      const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
      return request<{ providers: Provider[] }>(`/providers${query}`);
    },
  },

  // Availability
  availability: {
    getSlots: (serviceId: string, providerId: string, date: string) =>
      request<AvailabilityResponse>(
        `/availability?serviceId=${encodeURIComponent(serviceId)}&providerId=${encodeURIComponent(
          providerId
        )}&date=${encodeURIComponent(date)}`
      ),
  },

  // Appointments
  appointments: {
    create: (payload: {
      serviceId: string;
      providerId: string;
      appointmentDate: string;
      startTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      notes?: string;
    }) =>
      request<{ message: string; appointment: Appointment }>('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getAll: (params?: { email?: string; reference?: string; phone?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.email) searchParams.append('email', params.email);
      if (params?.reference) searchParams.append('reference', params.reference);
      if (params?.phone) searchParams.append('phone', params.phone);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<{ appointments: Appointment[] }>(`/appointments${query}`);
    },
    getById: (id: string) => request<{ appointment: Appointment }>(`/appointments/${id}`),
    cancel: (id: string) =>
      request<{ message: string; appointment: Appointment }>(`/appointments/${id}/cancel`, {
        method: 'PATCH',
      }),
    reschedule: (id: string, payload: { appointmentDate: string; startTime: string }) =>
      request<{ message: string; appointment: Appointment }>(`/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  // Admin
  admin: {
    getStats: () => request<{ stats: AdminStats }>('/admin/stats'),
    getAppointments: (params?: { search?: string; status?: string; date?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.date) searchParams.append('date', params.date);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<{ appointments: Appointment[] }>(`/admin/appointments${query}`);
    },
    updateAppointmentStatus: (id: string, status: string) =>
      request<{ message: string; appointment: Appointment }>(`/admin/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    createService: (data: Partial<Service>) =>
      request<{ message: string; service: Service }>('/admin/services', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateService: (id: string, data: Partial<Service>) =>
      request<{ message: string; service: Service }>(`/admin/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deactivateService: (id: string) =>
      request<{ message: string; service: Service }>(`/admin/services/${id}`, {
        method: 'DELETE',
      }),
  },
};
