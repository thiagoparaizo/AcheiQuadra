// src/services/api.ts
import axios from 'axios';

// Definindo a URL base da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Criando instância do axios com configurações comuns
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tipos de dados
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Arena {
  id: string;
  name: string;
  description: string;
  address: Address;
  phone: string;
  email: string;
  logo_url?: string;
  photos: string[];
  amenities: string[];
  rating: number;
  rating_count: number;
  courts_count?: number;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  business_hours: WeeklySchedule;
  cancellation_policy?: string;
  advance_payment_required?: boolean;
  payment_deadline_hours?: number;
}

export interface WeeklySchedule {
  monday: { start: string; end: string }[];
  tuesday: { start: string; end: string }[];
  wednesday: { start: string; end: string }[];
  thursday: { start: string; end: string }[];
  friday: { start: string; end: string }[];
  saturday: { start: string; end: string }[];
  sunday: { start: string; end: string }[];
}

export interface Court {
  id: string;
  arena_id: string;
  name: string;
  type: string;
  description: string;
  photos: string[];
  price_per_hour: number;
  discounted_price?: number;
  minimum_booking_hours: number;
  is_available: boolean;
  characteristics: string[];
  extra_services: string[];
  advance_payment_required?: boolean;
  arena?: {
    id: string;
    name: string;
    address: Address;
    rating: number;
    cancellation_policy?: string;
  };
  distance?: number;
}

// Interfaces para parâmetros de busca
export interface ArenaSearchParams {
  name?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  amenities?: string[];
  court_type?: string;
  min_rating?: number;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  page?: number;
  items_per_page?: number;
}

export interface CourtSearchParams {
  search?: string;
  court_type?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  sort_by?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  items_per_page?: number;
}

// Serviços de API
const arenasService = {
  // Listar arenas com filtros
  listArenas: async (params: ArenaSearchParams = {}) => {
    try {
      const response = await api.get('/arenas/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar arenas:', error);
      throw error;
    }
  },

  // Buscar detalhes de uma arena específica
  getArena: async (arenaId: string) => {
    try {
      const response = await api.get(`/arenas/${arenaId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar arena ${arenaId}:`, error);
      throw error;
    }
  },

  // Buscar quadras de uma arena específica
  getArenaCourts: async (arenaId: string, courtType?: string) => {
    try {
      const params = courtType ? { court_type: courtType } : {};
      const response = await api.get(`/arenas/${arenaId}/courts`, { params });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar quadras da arena ${arenaId}:`, error);
      throw error;
    }
  },
};

const courtsService = {
  // Listar quadras com filtros
  listCourts: async (params: CourtSearchParams = {}) => {
    try {
      const response = await api.get('/courts', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
      throw error;
    }
  },

  // Buscar detalhes de uma quadra específica
  getCourt: async (courtId: string) => {
    try {
      const response = await api.get(`/courts/${courtId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar quadra ${courtId}:`, error);
      throw error;
    }
  },

  // Buscar disponibilidade de uma quadra
  getCourtAvailability: async (courtId: string, startDate: string, endDate?: string) => {
    try {
      const params = endDate
        ? { start_date: startDate, end_date: endDate }
        : { start_date: startDate };
      const response = await api.get(`/courts/${courtId}/availability`, { params });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar disponibilidade da quadra ${courtId}:`, error);
      throw error;
    }
  },
};

export { arenasService, courtsService };
export default api;
