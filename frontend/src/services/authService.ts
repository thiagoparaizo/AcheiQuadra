// src/services/authService.ts
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  cpf: string;
  birth_date: string;
  role?: 'customer' | 'arena_owner' | 'admin';
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  cpf: string;
  birth_date: string;
  role: 'customer' | 'arena_owner' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  password: string;
}

const authService = {
  // Login do usuário
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // A API espera um formato de form-data para login
      const formData = new FormData();
      formData.append('username', credentials.email); // API usa username para o email
      formData.append('password', credentials.password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Salvar token no localStorage
      localStorage.setItem('token', response.data.access_token);

      return response.data;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },

  // Registrar novo usuário
  register: async (userData: RegisterData): Promise<User> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  },

  // Verificar email por token
  verifyEmail: async (token: string): Promise<any> => {
    try {
      const response = await api.post(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }
  },

  // Solicitar recuperação de senha
  requestPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  },

  // Redefinir senha com token
  resetPassword: async (token: string, password: string): Promise<any> => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw error;
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // Verificar se o usuário está autenticado
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Obter token do localStorage
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Obter usuário atual (para contexto de autenticação)
  getCurrentUser: async (): Promise<User | null> => {
    try {
      if (!authService.isAuthenticated()) {
        return null;
      }

      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      // Se houver erro na requisição, pode ser que o token esteja inválido
      authService.logout();
      return null;
    }
  },
};

export default authService;
