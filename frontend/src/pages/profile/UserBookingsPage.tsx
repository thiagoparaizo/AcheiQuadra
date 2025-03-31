// src/pages/profile/UserBookingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import bookingService, { Booking } from '../../services/bookingService';

const UserBookingsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile/bookings');
    }
  }, [isAuthenticated, navigate]);

  // Carregar reservas do usuário
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const status = activeTab !== 'all' ? activeTab : undefined;
        const bookingsData = await bookingService.getUserBookings(status);
        setBookings(bookingsData);
      } catch (err) {
        console.error('Erro ao buscar reservas:', err);
        setError('Não foi possível carregar suas reservas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, activeTab]);

  // Função para cancelar uma reserva
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId, { request_refund: true });

      // Atualizar a lista após cancelamento
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
    } catch (err) {
      console.error('Erro ao cancelar reserva:', err);
      alert('Não foi possível cancelar a reserva. Tente novamente mais tarde.');
    }
  };

  // Renderizar um card de reserva
  const renderBookingCard = (booking: Booking) => {
    const isUpcoming = ['pending', 'confirmed', 'waiting_payment'].includes(booking.status);
    const date = booking.timeslot
      ? new Date(booking.timeslot.date)
      : booking.monthly_config
      ? new Date(booking.monthly_config.start_date)
      : new Date();

    const formattedDate = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const time = booking.timeslot
      ? `${booking.timeslot.start_time} às ${booking.timeslot.end_time}`
      : booking.monthly_config
      ? `${booking.monthly_config.start_time} às ${booking.monthly_config.end_time}`
      : '';

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_payment: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      pending: 'Aguardando confirmação',
      waiting_payment: 'Aguardando pagamento',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      completed: 'Concluído',
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">{booking.court?.name || 'Quadra'}</h3>
            <span
              className={`px-2 py-1 rounded-full text-sm ${
                statusColors[booking.status as keyof typeof statusColors]
              }`}
            >
              {statusLabels[booking.status as keyof typeof statusLabels]}
            </span>
          </div>

          {/* Arena */}
          {booking.arena && (
            <div className="flex items-start mb-2">
              <MapPin size={18} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700">{booking.arena.name}</p>
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div className="flex items-center mb-2">
            <Calendar size={18} className="text-gray-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700">{formattedDate}</span>
          </div>

          <div className="flex items-center mb-3">
            <Clock size={18} className="text-gray-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700">{time}</span>
          </div>

          {/* Valor */}
          <div className="flex justify-between items-center border-t pt-3">
            <div>
              <span className="text-gray-500 text-sm">Valor Total:</span>
              <span className="ml-2 font-semibold">R$ {booking.total_amount.toFixed(2)}</span>
            </div>

            {/* Ações */}
            <div className="flex space-x-2">
              {booking.status === 'waiting_payment' && (
                <Link
                  to={`/payment/${booking.id}`}
                  className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
                >
                  Pagar
                </Link>
              )}

              {isUpcoming && booking.status !== 'waiting_payment' && (
                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                >
                  Cancelar
                </button>
              )}

              <Link
                to={`/bookings/${booking.id}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Detalhes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tabs para filtrar por status
  const renderTabs = () => {
    const tabs = [
      { id: 'all', label: 'Todas' },
      { id: 'pending', label: 'Pendentes' },
      { id: 'confirmed', label: 'Confirmadas' },
      { id: 'completed', label: 'Concluídas' },
      { id: 'cancelled', label: 'Canceladas' },
    ];

    return (
      <div className="mb-6">
        {/* Versão desktop */}
        <div className="hidden md:flex space-x-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Versão mobile */}
        <div className="md:hidden">
          <button
            className="w-full flex items-center justify-between p-3 border rounded-lg bg-white"
            onClick={() => setShowFilter(!showFilter)}
          >
            <div className="flex items-center">
              <Filter size={18} className="mr-2 text-gray-500" />
              <span>{tabs.find((tab) => tab.id === activeTab)?.label || 'Todas'}</span>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform ${showFilter ? 'rotate-180' : ''}`}
            />
          </button>

          {showFilter && (
            <div className="mt-2 border rounded-lg bg-white overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`w-full text-left px-4 py-2 ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowFilter(false);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile" className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Minhas Reservas</h1>
      </div>

      {/* Tabs de filtro */}
      {renderTabs()}

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando reservas...</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Lista de reservas */}
      {!loading && !error && (
        <>
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <Calendar size={48} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-gray-500 mb-6">
                {activeTab !== 'all'
                  ? `Você não possui reservas com status "${
                      activeTab === 'pending'
                        ? 'pendente'
                        : activeTab === 'confirmed'
                        ? 'confirmada'
                        : activeTab === 'completed'
                        ? 'concluída'
                        : 'cancelada'
                    }".`
                  : 'Você ainda não fez nenhuma reserva.'}
              </p>
              <Link
                to="/courts"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
              >
                Encontrar quadras
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <div key={booking.id}>{renderBookingCard(booking)}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserBookingsPage;
