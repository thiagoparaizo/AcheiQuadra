// src/services/paymentService.ts
import api from './api';

export interface PaymentCreate {
  booking_id: string;
  payment_method: 'pix' | 'credit_card' | 'on_site';
  amount: number;
  card_data?: {
    number?: string;
    holder_name?: string;
    expiration_month?: string;
    expiration_year?: string;
    cvv?: string;
    token?: string;
    installments?: number;
  };
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  arena_id: string;
  payment_method: 'pix' | 'credit_card' | 'on_site';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  gateway_id?: string;
  pix_qrcode?: string;
  pix_copy_paste?: string;
  credit_card_last4?: string;
  payment_date?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  booking?: any;
}

const paymentService = {
  // Criar um novo pagamento
  createPayment: async (paymentData: PaymentCreate): Promise<Payment> => {
    try {
      const response = await api.post('/payments/', paymentData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  },

  // Obter detalhes de um pagamento específico
  getPayment: async (paymentId: string): Promise<Payment> => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar pagamento ${paymentId}:`, error);
      throw error;
    }
  },

  // Processar webhook de pagamento (simulado para frontend)
  simulatePaymentApproval: async (paymentId: string): Promise<any> => {
    try {
      // Esta função é apenas para simulação, já que webhooks são geralmente tratados no backend
      // Em um cenário real, você não teria esta função no frontend
      const response = await api.post('/payments/webhook', {
        action: 'payment.updated',
        data: {
          id: paymentId,
          status: 'approved',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao simular aprovação de pagamento ${paymentId}:`, error);
      throw error;
    }
  },
};

export default paymentService;
