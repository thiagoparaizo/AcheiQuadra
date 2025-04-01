// src/services/adminService.ts
import api from './api';

interface DashboardParams {
  period?: 'day' | 'week' | 'month' | 'year';
}

interface UserListParams {
  page?: number;
  items_per_page?: number;
  role?: string;
  search?: string;
  is_active?: boolean;
}

interface SystemSettings {
  email: {
    smtp_server: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    enable_notifications: boolean;
  };
  payment: {
    gateway_api_key: string;
    gateway_secret: string;
    currency: string;
    enable_payments: boolean;
  };
  maps: {
    api_key: string;
    enable_maps: boolean;
  };
  general: {
    site_name: string;
    support_email: string;
    support_phone: string;
    terms_url: string;
    privacy_url: string;
    enable_registration: boolean;
    maintenance_mode: boolean;
  };
  booking: {
    max_booking_advance_days: number;
    min_booking_advance_hours: number;
    default_payment_deadline_hours: number;
    enable_auto_confirmation: boolean;
  };
}

interface EmailSettings {
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  enable_notifications: boolean;
}

interface PaymentSettings {
  gateway_api_key: string;
  gateway_secret: string;
  currency: string;
  enable_payments: boolean;
}

interface UserProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  username?: string;
}

const adminService = {
  // Dashboard
  getDashboardData: async (period: string = 'month') => {
    try {
      const response = await api.get('/admin/dashboard', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      throw error;
    }
  },

  // Usuários
  getUsers: async (params: UserListParams = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      console.log('getUsers: ' + response.data);
      // Adicionar total_pages para paginação (caso a API não retorne)
      if (!response.data.total_pages && response.data.total_count && params.items_per_page) {
        response.data.total_pages = Math.ceil(response.data.total_count / params.items_per_page);
      }

      return {
        users: response.data,
        total_pages: response.data.total_pages || 1,
        total_count: response.data.total_count || response.data.length,
      };
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  getUserDetails: async (userId: string) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do usuário ${userId}:`, error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar papel do usuário ${userId}:`, error);
      throw error;
    }
  },

  activateUser: async (userId: string) => {
    try {
      const response = await api.put(`/admin/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao ativar usuário ${userId}:`, error);
      throw error;
    }
  },

  deactivateUser: async (userId: string) => {
    try {
      const response = await api.put(`/admin/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao desativar usuário ${userId}:`, error);
      throw error;
    }
  },

  updateUserProfile: async (userId: string, userData: UserProfileUpdateData) => {
    try {
      // Usando a API de usuário comum, já que não temos endpoint específico de admin para isso
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar perfil do usuário ${userId}:`, error);
      throw error;
    }
  },

  // Arenas
  getArenas: async (params: any = {}) => {
    try {
      // Use o endpoint correto para listar arenas
      const response = await api.get('/arenas/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar arenas:', error);
      throw error;
    }
  },

  deleteArena: async (arenaId: string) => {
    try {
      const response = await api.delete(`/admin/arenas/${arenaId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir arena ${arenaId}:`, error);
      throw error;
    }
  },

  activateArena: async (arenaId: string) => {
    try {
      const response = await api.post(`/admin/arenas/${arenaId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao ativar arena ${arenaId}:`, error);
      throw error;
    }
  },

  deactivateArena: async (arenaId: string) => {
    try {
      const response = await api.post(`/admin/arenas/${arenaId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao desativar arena ${arenaId}:`, error);
      throw error;
    }
  },

  getArenaDetails: async (arenaId: string) => {
    try {
      const response = await api.get(`/arenas/${arenaId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes da arena ${arenaId}:`, error);
      throw error;
    }
  },

  updateArena: async (arenaId: string, arenaData: any) => {
    try {
      // Criar um FormData para enviar dados multipart corretamente
      const formData = new FormData();

      // Adicionar os dados da arena como um campo JSON
      const jsonData = {};

      // Adicionar campos simples ao objeto JSON
      [
        'name',
        'description',
        'phone',
        'email',
        'address',
        'business_hours',
        'amenities',
        'cancellation_policy',
        'advance_payment_required',
        'payment_deadline_hours',
        'active',
      ].forEach((field) => {
        if (arenaData[field] !== undefined) {
          if (typeof arenaData[field] === 'object' && !(arenaData[field] instanceof File)) {
            formData.append(field, JSON.stringify(arenaData[field]));
          } else {
            formData.append(field, arenaData[field]);
          }
        }
      });

      // Adicionar logo se houver
      if (arenaData.logo && arenaData.logo instanceof File) {
        formData.append('logo', arenaData.logo);
      }

      // Adicionar fotos se houver
      if (arenaData.photos && Array.isArray(arenaData.photos)) {
        arenaData.photos.forEach((photo: File, index: number) => {
          if (photo instanceof File) {
            formData.append(`photos`, photo);
          }
        });
      }

      // Adicionar lista de fotos removidas
      if (arenaData.removed_photos && Array.isArray(arenaData.removed_photos)) {
        formData.append('removed_photos', JSON.stringify(arenaData.removed_photos));
      }

      const response = await api.put(`/admin/arenas/${arenaId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar arena ${arenaId}:`, error);
      throw error;
    }
  },

  createArena: async (arenaData: any) => {
    try {
      // Criar um FormData para enviar dados multipart corretamente
      const formData = new FormData();

      // Adicionar campos simples ao formulário
      [
        'name',
        'description',
        'phone',
        'email',
        'address',
        'business_hours',
        'amenities',
        'cancellation_policy',
        'advance_payment_required',
        'payment_deadline_hours',
        'active',
        'owner_id',
      ].forEach((field) => {
        if (arenaData[field] !== undefined) {
          if (typeof arenaData[field] === 'object' && !(arenaData[field] instanceof File)) {
            formData.append(field, JSON.stringify(arenaData[field]));
          } else {
            formData.append(field, arenaData[field]);
          }
        }
      });

      // Adicionar logo se houver
      if (arenaData.logo && arenaData.logo instanceof File) {
        formData.append('logo', arenaData.logo);
      }

      // Adicionar fotos se houver
      if (arenaData.photos && Array.isArray(arenaData.photos)) {
        arenaData.photos.forEach((photo: File, index: number) => {
          if (photo instanceof File) {
            formData.append(`photos`, photo);
          }
        });
      }

      const response = await api.post(`/admin/arenas/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar arena:', error);
      throw error;
    }
  },

  // Reservas
  getBookings: async (params: any = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      throw error;
    }
  },

  getBookingDetails: async (bookingId: string) => {
    try {
      const response = await api.get(`/admin/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes da reserva ${bookingId}:`, error);
      throw error;
    }
  },

  updateBookingStatus: async (bookingId: string, status: string, notes?: string) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/status`, {
        status,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status da reserva ${bookingId}:`, error);
      throw error;
    }
  },

  // Configurações do sistema
  getSystemSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
      throw error;
    }
  },

  saveSystemSettings: async (settings: SystemSettings) => {
    try {
      const response = await api.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      throw error;
    }
  },

  testEmailConnection: async (emailSettings: EmailSettings) => {
    try {
      const response = await api.post('/admin/settings/test-email', emailSettings);
      return response.data;
    } catch (error) {
      console.error('Erro ao testar conexão de email:', error);
      throw error;
    }
  },

  testPaymentGateway: async (paymentSettings: PaymentSettings) => {
    try {
      const response = await api.post('/admin/settings/test-payment', paymentSettings);
      return response.data;
    } catch (error) {
      console.error('Erro ao testar gateway de pagamento:', error);
      throw error;
    }
  },

  testMapsApi: async (apiKey: string) => {
    try {
      const response = await api.post('/admin/settings/test-maps', { api_key: apiKey });
      return response.data;
    } catch (error) {
      console.error('Erro ao testar API do Google Maps:', error);
      throw error;
    }
  },

  // Inicialização de banco de dados (apenas para desenvolvimento)
  initializeDatabase: async () => {
    try {
      const response = await api.get('/admin/init_db');
      return response.data;
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  },
};

export default adminService;
