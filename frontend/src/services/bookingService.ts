// src/services/bookingService.ts
import api from './api';

export interface BookingTimeslot {
  date: string; // ISO format date (YYYY-MM-DD)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
}

export interface MonthlyBookingConfig {
  weekdays: number[]; // 0 = Segunda, 6 = Domingo
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  start_date: string; // ISO format date (YYYY-MM-DD)
  end_date?: string; // ISO format date, optional
}

export interface BookingExtraService {
  service_id: string;
  quantity: number;
}

export interface BookingCreate {
  court_id: string;
  booking_type: 'single' | 'monthly';
  timeslot?: BookingTimeslot;
  monthly_config?: MonthlyBookingConfig;
  extra_services?: BookingExtraService[];
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  arena_id: string;
  booking_type: 'single' | 'monthly';
  timeslot?: BookingTimeslot;
  monthly_config?: MonthlyBookingConfig;
  status: 'pending' | 'waiting_payment' | 'confirmed' | 'cancelled' | 'completed';
  price_per_hour: number;
  total_hours: number;
  subtotal: number;
  extra_services: any[];
  total_amount: number;
  discount_amount: number;
  requires_payment: boolean;
  payment_deadline?: string;
  confirmation_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  court?: any;
  arena?: any;
  user?: any;
}

export interface BookingStatusUpdate {
  status: 'pending' | 'waiting_payment' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface BookingCancellation {
  reason?: string;
  request_refund: boolean;
}

const bookingService = {
  // Criar uma nova reserva
  createBooking: async (bookingData: BookingCreate): Promise<Booking> => {
    try {
      const response = await api.post('/bookings/', bookingData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      throw error;
    }
  },

  // Obter lista de reservas do usuário
  getUserBookings: async (status?: string, page: number = 1): Promise<Booking[]> => {
    try {
      const params = { status, page };
      const response = await api.get('/bookings/user/me', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar reservas do usuário:', error);
      throw error;
    }
  },

  // Obter detalhes de uma reserva específica
  getBooking: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar reserva ${bookingId}:`, error);
      throw error;
    }
  },

  // Atualizar status de uma reserva
  updateBookingStatus: async (
    bookingId: string,
    statusData: BookingStatusUpdate
  ): Promise<Booking> => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status da reserva ${bookingId}:`, error);
      throw error;
    }
  },

  // Cancelar uma reserva
  cancelBooking: async (
    bookingId: string,
    cancellationData: BookingCancellation
  ): Promise<Booking> => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, cancellationData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao cancelar reserva ${bookingId}:`, error);
      throw error;
    }
  },

  // Obter status de pagamento de uma reserva
  getBookingPaymentStatus: async (bookingId: string): Promise<any> => {
    try {
      const response = await api.get(`/bookings/${bookingId}/payment-status`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar status de pagamento da reserva ${bookingId}:`, error);
      throw error;
    }
  },
};

export default bookingService;
