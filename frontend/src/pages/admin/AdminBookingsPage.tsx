// src/pages/admin/AdminBookingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  Loader,
  User,
  Building,
  Clock,
  ChevronDown,
  RefreshCw,
  Eye,
  CheckCircle,
  X,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';

interface BookingData {
  id: string;
  user_id: string;
  arena_id: string;
  court_id: string;
  status: 'pending' | 'waiting_payment' | 'confirmed' | 'cancelled' | 'completed';
  booking_type: 'single' | 'monthly';
  timeslot?: {
    date: string;
    start_time: string;
    end_time: string;
  };
  monthly_config?: {
    weekdays: number[];
    start_time: string;
    end_time: string;
    start_date: string;
    end_date?: string;
  };
  total_amount: number;
  requires_payment: boolean;
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  court?: {
    name: string;
    type: string;
  };
  arena?: {
    name: string;
    address: {
      city: string;
      state: string;
    };
  };
}

const AdminBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado para ações em progresso
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/bookings');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar reservas
    fetchBookings();
  }, [isAuthenticated, user, navigate, currentPage, statusFilter]);

  // Buscar reservas com filtros
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Preparar parâmetros de filtro
      const params: Record<string, any> = {
        page: currentPage,
        items_per_page: 10,
      };

      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // Buscar reservas
      const response = await adminService.getBookings(params);

      setBookings(response.bookings || response);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      console.error('Erro ao carregar reservas:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar a lista de reservas');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros de busca
  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Resetar para primeira página
    fetchBookings();
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setShowFilterMenu(false);
    // Recarregar reservas com filtros limpos
    fetchBookings();
  };

  // Atualizar status de uma reserva
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (actionInProgress) return; // Evitar ações simultâneas

    setActionInProgress(bookingId);

    try {
      await adminService.updateBookingStatus(bookingId, newStatus);

      // Atualizar lista de reservas após a ação
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus as BookingData['status'] } : b
        )
      );
    } catch (err: any) {
      console.error('Erro ao atualizar status da reserva:', err);
      const errorMsg = err.response?.data?.detail || 'Erro ao atualizar o status da reserva';
      setError(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Navegar para detalhes da reserva
  const handleViewBookingDetails = (bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}`);
  };

  // Componente para paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <nav className="flex items-center">
          <button
            className="px-3 py-1 mr-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Cálculo para mostrar a página atual mais 2 páginas antes e depois
            const pageNum = Math.min(Math.max(currentPage - 2 + i, 1), totalPages);

            return (
              <button
                key={pageNum}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === pageNum ? 'bg-primary text-white' : 'border hover:bg-gray-100'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="px-3 py-1 ml-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </nav>
      </div>
    );
  };

  // Componente de menu de ações da reserva
  const BookingActionMenu = ({ bookingData }: { bookingData: BookingData }) => {
    const [showMenu, setShowMenu] = useState(false);

    // Verificar quais ações são possíveis com base no status atual
    const canConfirm = bookingData.status === 'pending' || bookingData.status === 'waiting_payment';
    const canComplete = bookingData.status === 'confirmed';
    const canCancel = bookingData.status !== 'cancelled' && bookingData.status !== 'completed';

    return (
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded hover:bg-gray-100">
          <ChevronDown size={16} />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowMenu(false);
                handleViewBookingDetails(bookingData.id);
              }}
            >
              <Eye size={16} className="mr-2" />
              Ver detalhes
            </button>

            {canConfirm && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleUpdateBookingStatus(bookingData.id, 'confirmed');
                }}
                disabled={actionInProgress === bookingData.id}
              >
                <CheckCircle size={16} className="mr-2" />
                Confirmar
              </button>
            )}

            {canComplete && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleUpdateBookingStatus(bookingData.id, 'completed');
                }}
                disabled={actionInProgress === bookingData.id}
              >
                <CheckCircle size={16} className="mr-2" />
                Marcar como Concluída
              </button>
            )}

            {canCancel && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleUpdateBookingStatus(bookingData.id, 'cancelled');
                }}
                disabled={actionInProgress === bookingData.id}
              >
                <X size={16} className="mr-2" />
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Função para formatar data e hora da reserva
  const formatBookingDateTime = (booking: BookingData) => {
    if (booking.booking_type === 'single' && booking.timeslot) {
      return `${booking.timeslot.date} · ${booking.timeslot.start_time} - ${booking.timeslot.end_time}`;
    } else if (booking.booking_type === 'monthly' && booking.monthly_config) {
      const weekdays = booking.monthly_config.weekdays
        .map((day) => {
          const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
          return days[day];
        })
        .join(', ');

      return `${booking.monthly_config.start_date} a ${
        booking.monthly_config.end_date || 'Indefinido'
      } · ${weekdays} · ${booking.monthly_config.start_time} - ${booking.monthly_config.end_time}`;
    }

    return 'Dados indisponíveis';
  };

  // Função para renderizar o status com cores
  const renderStatus = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_payment: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      waiting_payment: 'Aguardando Pagamento',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/admin')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Gerenciar Reservas</h1>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleApplySearch} className="flex flex-wrap items-center gap-3">
          <div className="flex-grow min-w-[200px]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar reservas..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg"
            >
              <Filter size={18} className="mr-2" />
              Filtros
              <ChevronDown
                size={16}
                className={`ml-2 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="waiting_payment">Aguardando Pagamento</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Concluídas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Limpar filtros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFilterMenu(false);
                      fetchBookings();
                    }}
                    className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={() => fetchBookings()}
            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200"
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </form>
      </div>

      {/* Lista de reservas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando reservas...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
          <p className="text-gray-500 mb-6">
            Não encontramos reservas com os filtros selecionados.
          </p>
          <button
            onClick={handleClearFilters}
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Reserva
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Arena / Quadra
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Data / Horário
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Valor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((bookingData) => (
                  <tr key={bookingData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          #{bookingData.id.substring(0, 8)}
                        </div>
                        <div className="text-gray-500">
                          {new Date(bookingData.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bookingData.user ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{bookingData.user.name}</div>
                          <div className="text-gray-500">{bookingData.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Não definido</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {bookingData.arena && (
                          <div className="font-medium text-gray-900">{bookingData.arena.name}</div>
                        )}
                        {bookingData.court && (
                          <div className="text-gray-500">{bookingData.court.name}</div>
                        )}
                        {bookingData.arena && bookingData.arena.address && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin size={12} className="mr-1" />
                            {bookingData.arena.address.city}, {bookingData.arena.address.state}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-start">
                        <Clock size={16} className="text-gray-400 mr-1 mt-1 flex-shrink-0" />
                        <div>
                          {formatBookingDateTime(bookingData)}
                          <div className="text-xs text-gray-500 mt-1">
                            {bookingData.booking_type === 'single'
                              ? 'Reserva única'
                              : 'Reserva mensal'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {bookingData.total_amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bookingData.requires_payment ? 'Pagamento antecipado' : 'Pago no local'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatus(bookingData.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleViewBookingDetails(bookingData.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye size={16} />
                        </button>

                        {actionInProgress === bookingData.id ? (
                          <Loader size={16} className="animate-spin text-gray-500 mr-3" />
                        ) : bookingData.status === 'pending' ? (
                          <button
                            onClick={() => handleUpdateBookingStatus(bookingData.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Confirmar"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : bookingData.status === 'confirmed' ? (
                          <button
                            onClick={() => handleUpdateBookingStatus(bookingData.id, 'completed')}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Marcar como Concluída"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : null}

                        <BookingActionMenu bookingData={bookingData} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {renderPagination()}
    </div>
  );
};

export default AdminBookingsPage;
