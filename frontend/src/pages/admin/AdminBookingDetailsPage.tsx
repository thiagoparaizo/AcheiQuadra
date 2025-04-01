// src/pages/admin/AdminBookingDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  FileText,
  CreditCard,
  Banknote,
  Building,
  CalendarClock,
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
  price_per_hour: number;
  total_hours: number;
  subtotal: number;
  extra_services: Array<{
    service_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  total_amount: number;
  discount_amount: number;
  requires_payment: boolean;
  payment_deadline?: string;
  confirmation_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  court?: {
    id: string;
    name: string;
    type: string;
  };
  arena?: {
    id: string;
    name: string;
    address: {
      city: string;
      state: string;
    };
  };
  payment?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded';
    payment_method: 'pix' | 'credit_card' | 'on_site';
    amount: number;
    payment_date?: string;
  };
}

// Funções auxiliares para formatação
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return (
    date.toLocaleDateString('pt-BR') +
    ' ' +
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getWeekdayName = (day: number) => {
  const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  return weekdays[day];
};

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

// Componente principal
const AdminBookingDetailsPage: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);

  // Estado para ação em andamento
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

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

    if (!bookingId) {
      navigate('/admin/bookings');
      return;
    }

    // Carregar detalhes da reserva
    fetchBookingDetails();
  }, [isAuthenticated, user, navigate, bookingId]);

  // Buscar detalhes da reserva
  const fetchBookingDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminService.getBookingDetails(bookingId!);
      setBooking(data);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da reserva:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar os detalhes da reserva');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status da reserva
  const updateBookingStatus = async (newStatus: string) => {
    if (actionInProgress || !booking) return;

    // Confirmar a ação
    if (newStatus === 'cancelled') {
      if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
        return;
      }
    }

    setActionInProgress(true);
    setActionType(newStatus);
    setError(null);
    setSuccess(null);

    try {
      await adminService.updateBookingStatus(bookingId!, newStatus);

      // Atualizar dados locais
      setBooking((prev) => (prev ? { ...prev, status: newStatus as BookingData['status'] } : null));

      setSuccess(`Status da reserva atualizado para ${getStatusDisplay(newStatus)}!`);
    } catch (err: any) {
      console.error('Erro ao atualizar status da reserva:', err);
      setError(
        err.response?.data?.detail || 'Erro ao atualizar o status da reserva. Tente novamente.'
      );
    } finally {
      setActionInProgress(false);
      setActionType(null);
    }
  };

  // Obter texto de exibição para o status
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      waiting_payment: 'Aguardando Pagamento',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };
    return statusMap[status] || status;
  };

  // Obter classe de cor para o status
  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_payment: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Obter texto de exibição para o método de pagamento
  const getPaymentMethodDisplay = (method: string) => {
    const methodMap: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      on_site: 'No local',
    };
    return methodMap[method] || method;
  };

  // Componente para botão de ação
  const ActionButton = ({
    status,
    targetStatus,
    label,
    icon,
    color,
  }: {
    status: string;
    targetStatus: string;
    label: string;
    icon: React.ReactNode;
    color: string;
  }) => {
    const isDisabled =
      actionInProgress || booking?.status === 'cancelled' || booking?.status === 'completed';
    const isLoading = actionInProgress && actionType === targetStatus;

    return (
      <button
        onClick={() => updateBookingStatus(targetStatus)}
        disabled={isDisabled}
        className={`flex items-center justify-center py-2 px-4 rounded-lg ${color} disabled:opacity-50 disabled:cursor-not-allowed w-full`}
      >
        {isLoading ? <Loader size={18} className="animate-spin mr-2" /> : icon}
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando detalhes da reserva...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/admin/bookings')} className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold">Reserva não encontrada</h1>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          A reserva solicitada não foi encontrada ou você não tem permissão para visualizá-la.
        </div>

        <button
          onClick={() => navigate('/admin/bookings')}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Voltar para lista de reservas
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/bookings')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Detalhes da Reserva</h1>
          <div className="text-gray-600 mt-1">
            #{booking.id.substring(0, 8)} &middot; {formatDateTime(booking.created_at)}
          </div>
        </div>
      </div>

      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-700 hover:text-green-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações da reserva */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informações da Reserva</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {booking.booking_type === 'single' ? 'Reserva Única' : 'Reserva Mensal'}
                    </p>
                    {booking.booking_type === 'single' && booking.timeslot ? (
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.timeslot.date)} &middot; {booking.timeslot.start_time} -{' '}
                        {booking.timeslot.end_time}
                      </p>
                    ) : booking.booking_type === 'monthly' && booking.monthly_config ? (
                      <div className="text-sm text-gray-500">
                        <p>
                          {formatDate(booking.monthly_config.start_date)}
                          {booking.monthly_config.end_date
                            ? ` até ${formatDate(booking.monthly_config.end_date)}`
                            : ' (sem data fim)'}
                        </p>
                        <p>
                          {booking.monthly_config.weekdays
                            .map((day) => getWeekdayName(day))
                            .join(', ')}
                          &middot; {booking.monthly_config.start_time} -{' '}
                          {booking.monthly_config.end_time}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Quadra</p>
                    <p className="text-sm text-gray-500">
                      {booking.court?.name}
                      {booking.court?.type &&
                        ` (${courtTypes[booking.court.type] || booking.court.type})`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">{booking.arena?.name}</span>
                      {booking.arena?.address &&
                        ` • ${booking.arena.address.city}, ${booking.arena.address.state}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Cliente</p>
                    <p className="text-sm text-gray-500">
                      {booking.user?.name || 'Nome não disponível'}
                    </p>
                    <p className="text-sm text-gray-500">{booking.user?.email}</p>
                    <p className="text-sm text-gray-500">{booking.user?.phone}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Detalhes do tempo</p>
                    <p className="text-sm text-gray-500">
                      {booking.total_hours} hora{booking.total_hours !== 1 ? 's' : ''} &middot;
                      {formatCurrency(booking.price_per_hour)} por hora
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Observações</p>
                      <p className="text-sm text-gray-500">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações de pagamento */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Resumo do Pagamento</h2>

              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Valor por hora</span>
                  <span className="font-medium">{formatCurrency(booking.price_per_hour)}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total de horas</span>
                  <span className="font-medium">{booking.total_hours}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(booking.subtotal)}</span>
                </div>

                {booking.extra_services && booking.extra_services.length > 0 && (
                  <div className="py-2">
                    <span className="text-gray-600">Serviços extras</span>
                    {booking.extra_services.map((service, index) => (
                      <div key={index} className="flex justify-between mt-1 pl-4">
                        <span className="text-sm text-gray-500">
                          {service.name} (x{service.quantity})
                        </span>
                        <span className="font-medium">{formatCurrency(service.total_price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {booking.discount_amount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">-{formatCurrency(booking.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t border-gray-200 text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(booking.total_amount)}</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center">
                    {booking.requires_payment ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">
                      {booking.requires_payment
                        ? 'Pagamento antecipado exigido'
                        : 'Pagamento no local (não requer pagamento antecipado)'}
                    </span>
                  </div>

                  {booking.payment_deadline && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <CalendarClock className="h-4 w-4 mr-1" />
                      Prazo para pagamento: {formatDateTime(booking.payment_deadline)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do pagamento realizado */}
          {booking.payment && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Detalhes do Pagamento</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {booking.payment.payment_method === 'pix' ? (
                        <img src="/pix-icon.svg" alt="PIX" className="h-5 w-5" />
                      ) : booking.payment.payment_method === 'credit_card' ? (
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Banknote className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Método de Pagamento</p>
                      <p className="text-sm text-gray-500">
                        {getPaymentMethodDisplay(booking.payment.payment_method)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Valor</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(booking.payment.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <RefreshCw className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Status do Pagamento</p>
                      <p className="text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.payment.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : booking.payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.payment.status === 'refunded'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {booking.payment.status === 'approved'
                            ? 'Aprovado'
                            : booking.payment.status === 'pending'
                            ? 'Pendente'
                            : booking.payment.status === 'refunded'
                            ? 'Reembolsado'
                            : 'Rejeitado'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {booking.payment.payment_date && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Data do Pagamento</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(booking.payment.payment_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Status atual e ações */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Status da Reserva</h2>

              <div className="mb-6">
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                      booking.status
                    )}`}
                  >
                    {getStatusDisplay(booking.status)}
                  </span>
                </div>

                <div className="mt-2 text-sm text-center text-gray-500">
                  Última atualização: {formatDateTime(booking.updated_at)}
                </div>
              </div>

              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Ações disponíveis</h3>

                  {booking.status === 'pending' && (
                    <ActionButton
                      status={booking.status}
                      targetStatus="confirmed"
                      label="Confirmar Reserva"
                      icon={<Check size={18} className="mr-2" />}
                      color="bg-green-600 text-white hover:bg-green-700"
                    />
                  )}

                  {booking.status === 'waiting_payment' && (
                    <ActionButton
                      status={booking.status}
                      targetStatus="pending"
                      label="Marcar Pagamento como Recebido"
                      icon={<DollarSign size={18} className="mr-2" />}
                      color="bg-blue-600 text-white hover:bg-blue-700"
                    />
                  )}

                  {booking.status === 'confirmed' && (
                    <ActionButton
                      status={booking.status}
                      targetStatus="completed"
                      label="Marcar como Concluída"
                      icon={<CheckCircle size={18} className="mr-2" />}
                      color="bg-green-600 text-white hover:bg-green-700"
                    />
                  )}

                  {!['cancelled', 'completed'].includes(booking.status) && (
                    <ActionButton
                      status={booking.status}
                      targetStatus="cancelled"
                      label="Cancelar Reserva"
                      icon={<X size={18} className="mr-2" />}
                      color="bg-red-600 text-white hover:bg-red-700"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informações Adicionais</h2>

              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">ID da Reserva</dt>
                  <dd className="text-sm text-gray-900 ml-2">{booking.id}</dd>
                </div>

                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Criada em</dt>
                  <dd className="text-sm text-gray-900 ml-2">
                    {formatDateTime(booking.created_at)}
                  </dd>
                </div>

                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="text-sm text-gray-900 ml-2">
                    {booking.booking_type === 'single' ? 'Única' : 'Mensal'}
                  </dd>
                </div>

                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Arena</dt>
                  <dd className="text-sm text-right text-gray-900 ml-2">
                    <button
                      onClick={() => navigate(`/admin/arenas/${booking.arena_id}`)}
                      className="text-primary hover:underline"
                    >
                      {booking.arena?.name || 'Ver arena'}
                    </button>
                  </dd>
                </div>

                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                  <dd className="text-sm text-right text-gray-900 ml-2">
                    <button
                      onClick={() => navigate(`/admin/users/${booking.user_id}`)}
                      className="text-primary hover:underline"
                    >
                      {booking.user?.name || 'Ver cliente'}
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Ações adicionais */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FileText size={18} className="mr-2" />
              Imprimir Comprovante
            </button>

            <button
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar para Lista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingDetailsPage;
