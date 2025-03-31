// src/pages/admin/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  LayoutGrid,
  Building,
  LogOut,
  AlertCircle,
  Loader,
  User,
  Calendar,
  DollarSign,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar dados do dashboard
    fetchDashboardData();
  }, [isAuthenticated, user, navigate, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminService.getDashboardData(selectedPeriod);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Navegar para outras páginas do painel admin
  const navigateTo = (path: string) => {
    navigate(`/admin/${path}`);
  };

  // Renderizar os cards de estatísticas
  const renderStatCards = () => {
    if (!dashboardData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Usuários</h3>
              <p className="text-gray-500 text-sm">Total registrado</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold">{dashboardData.users.total}</span>
            <span className="text-green-500 text-sm">
              +{dashboardData.users.new_in_period} no período
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Building size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Arenas</h3>
              <p className="text-gray-500 text-sm">Total registrado</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold">{dashboardData.arenas.total}</span>
            <span className="text-green-500 text-sm">
              +{dashboardData.arenas.new_in_period} no período
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Calendar size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Reservas</h3>
              <p className="text-gray-500 text-sm">Total registrado</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold">{dashboardData.bookings.total}</span>
            <span className="text-green-500 text-sm">
              +{dashboardData.bookings.in_period} no período
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <DollarSign size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Faturamento</h3>
              <p className="text-gray-500 text-sm">Pagamentos aprovados</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold">
              R$ {dashboardData.payments.total_revenue.toFixed(2)}
            </span>
            <span className="text-green-500 text-sm">
              R$ {dashboardData.payments.period_revenue.toFixed(2)} no período
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar distribuição de usuários por papel
  const renderUserRoleDistribution = () => {
    if (!dashboardData || !dashboardData.users.by_role) return null;

    const roleLabels: Record<string, string> = {
      admin: 'Administradores',
      arena_owner: 'Proprietários',
      customer: 'Clientes',
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Usuários por Tipo</h3>
        <div className="space-y-4">
          {dashboardData.users.by_role.map((item: any) => (
            <div key={item.role} className="flex items-center">
              <div className="w-32 text-sm">{roleLabels[item.role] || item.role}</div>
              <div className="flex-grow mx-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        dashboardData.users.total
                          ? (item.count / dashboardData.users.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-right w-12 text-sm font-medium">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar quadras por tipo
  const renderCourtTypeDistribution = () => {
    if (!dashboardData || !dashboardData.courts.by_type) return null;

    const courtTypes: Record<string, string> = {
      soccer: 'Futebol Campo',
      futsal: 'Futsal',
      society: 'Society',
      tennis: 'Tênis',
      beach_tennis: 'Beach Tennis',
      volleyball: 'Vôlei',
      beach_volleyball: 'Vôlei de Praia',
      basketball: 'Basquete',
      paddle: 'Padel',
      squash: 'Squash',
      other: 'Outros',
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Quadras por Tipo</h3>
        <div className="space-y-4">
          {dashboardData.courts.by_type.map((item: any) => (
            <div key={item.type} className="flex items-center">
              <div className="w-32 text-sm truncate">{courtTypes[item.type] || item.type}</div>
              <div className="flex-grow mx-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        dashboardData.courts.total
                          ? (item.count / dashboardData.courts.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-right w-12 text-sm font-medium">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar distribuição de reservas por status
  const renderBookingStatusDistribution = () => {
    if (!dashboardData) return null;

    const { bookings } = dashboardData;
    const total = bookings.total || 1; // Evitar divisão por zero

    const statuses = [
      { key: 'pending', label: 'Pendentes', count: bookings.pending, color: 'bg-yellow-500' },
      { key: 'confirmed', label: 'Confirmadas', count: bookings.confirmed, color: 'bg-blue-500' },
      { key: 'completed', label: 'Concluídas', count: bookings.completed, color: 'bg-green-500' },
      { key: 'cancelled', label: 'Canceladas', count: bookings.cancelled, color: 'bg-red-500' },
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Reservas por Status</h3>
        <div className="space-y-4">
          {statuses.map((status) => (
            <div key={status.key} className="flex items-center">
              <div className="w-32 text-sm">{status.label}</div>
              <div className="flex-grow mx-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${status.color} rounded-full`}
                    style={{ width: `${(status.count / total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right w-12 text-sm font-medium">{status.count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando dados do dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>

        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8">{renderStatCards()}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderUserRoleDistribution()}
        {renderCourtTypeDistribution()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderBookingStatusDistribution()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => navigateTo('users')}
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Gerenciar Usuários</h3>
          </div>
          <p className="text-gray-600">
            Visualize, edite e gerencie todos os usuários da plataforma.
          </p>
        </div>

        <div
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => navigateTo('arenas')}
        >
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Building size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Gerenciar Arenas</h3>
          </div>
          <p className="text-gray-600">Visualize, edite e gerencie todas as arenas cadastradas.</p>
        </div>

        <div
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => navigateTo('bookings')}
        >
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Calendar size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Gerenciar Reservas</h3>
          </div>
          <p className="text-gray-600">Visualize e gerencie todas as reservas da plataforma.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
