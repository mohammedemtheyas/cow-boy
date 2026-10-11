export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'USER';
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  services?: Service[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
  providers?: Provider[];
}

export interface Slot {
  startTime: string; // "09:30"
  endTime: string;   // "10:15"
  available: boolean;
  reason?: string;
}

export interface AvailabilityResponse {
  date: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  indicator: 'Available' | 'Few Slots Left' | 'Fully Booked';
  totalSlots: number;
  availableCount: number;
  slots: Slot[];
  message?: string;
}

export interface Appointment {
  id: string;
  bookingReference: string;
  userId?: string | null;
  serviceId: string;
  providerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string;       // "09:30"
  endTime: string;         // "10:15"
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  service?: Service;
  provider?: Provider;
}

export interface AdminStats {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  totalServices: number;
  totalProviders: number;
}
