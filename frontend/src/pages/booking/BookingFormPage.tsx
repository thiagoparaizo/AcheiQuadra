// src/pages/booking/BookingFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { courtsService, Court } from '../../services/api';
import bookingService, { BookingCreate, BookingTimeslot } from '../../services/bookingService';
import { useAuth } from '../../contexts/AuthContext';

const BookingFormPage: React.FC = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Estados de formulário
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(
    null
  );
  const [availability, setAvailability] = useState<any>(null);
  const [extraServices, setExtraServices] = useState<{ service_id: string; quantity: number }[]>(
    []
  );

  // Cálculos de valor
  const [hours, setHours] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  // Carregar dados da quadra
  useEffect(() => {
    const fetchCourtData = async () => {
      if (!courtId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar dados da quadra
        const courtData = await courtsService.getCourt(courtId);
        setCourt(courtData);

        // Definir data padrão (hoje)
        const todayString = new Date().toISOString().split('T')[0];
        setSelectedDate(todayString);

        // Buscar disponibilidade inicial
        await fetchAvailability(todayString);
      } catch (err) {
        console.error('Erro ao buscar dados da quadra:', err);
        setError('Não foi possível carregar os dados da quadra. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourtData();
  }, [courtId]);

  // Buscar disponibilidade para uma data
  const fetchAvailability = async (date: string) => {
    if (!courtId) return;

    try {
      const availabilityData = await courtsService.getCourtAvailability(courtId, date);
      setAvailability(availabilityData);
      // Limpar seleção de horário ao mudar a data
      setSelectedTimeSlot(null);
    } catch (err) {
      console.error('Erro ao buscar disponibilidade:', err);
      setError('Não foi possível carregar a disponibilidade. Tente novamente mais tarde.');
    }
  };

  // Atualizar disponibilidade ao mudar a data
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  // Calcular valores ao selecionar horário
  useEffect(() => {
    if (court && selectedTimeSlot) {
      // Calcular horas
      const startTime = selectedTimeSlot.start.split(':').map(Number);
      const endTime = selectedTimeSlot.end.split(':').map(Number);

      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];

      const diffHours = (endMinutes - startMinutes) / 60;
      setHours(diffHours);

      // Calcular subtotal
      const price = court.discounted_price || court.price_per_hour;
      const calculatedSubtotal = price * diffHours;
      setSubtotal(calculatedSubtotal);

      // Por enquanto, total = subtotal (sem extras)
      setTotal(calculatedSubtotal);
    } else {
      setHours(0);
      setSubtotal(0);
      setTotal(0);
    }
  }, [court, selectedTimeSlot]);

  // Manipulador para mudança de data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Manipulador para seleção de horário
  const handleTimeSlotSelect = (slot: { start: string; end: string; is_available: boolean }) => {
    if (!slot.is_available) return;

    if (selectedTimeSlot?.start === slot.start && selectedTimeSlot?.end === slot.end) {
      // Desselecionar se já estiver selecionado
      setSelectedTimeSlot(null);
    } else {
      setSelectedTimeSlot({
        start: slot.start,
        end: slot.end,
      });
    }
  };

  // Realizar reserva
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courtId || !selectedDate || !selectedTimeSlot) {
      setError('Por favor, selecione data e horário para continuar.');
      return;
    }

    // Verificar se usuário está autenticado
    if (!isAuthenticated) {
      // Redirecionar para login com retorno para esta página
      navigate(`/login?redirect=/booking/${courtId}?date=${selectedDate}`);
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      // Criar objeto de reserva
      const bookingData: BookingCreate = {
        court_id: courtId,
        booking_type: 'single',
        timeslot: {
          date: selectedDate,
          start_time: selectedTimeSlot.start,
          end_time: selectedTimeSlot.end,
        },
        extra_services: extraServices.length > 0 ? extraServices : undefined,
      };

      // Enviar solicitação de reserva
      const response = await bookingService.createBooking(bookingData);

      // Exibir mensagem de sucesso e mostrar ID da reserva
      setSuccess(true);
      setBookingId(response.id);

      // Se a reserva requer pagamento, redirecionar para a página de pagamento
      if (response.requires_payment) {
        setTimeout(() => {
          navigate(`/payment/${response.id}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      setError(
        err.response?.data?.detail || 'Ocorreu um erro ao processar sua reserva. Tente novamente.'
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Renderizar slots de horário disponíveis
  const renderAvailabilitySlots = () => {
    if (!availability || !selectedDate || !availability[selectedDate]) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500">Nenhum horário disponível para esta data.</p>
        </div>
      );
    }

    const slots = availability[selectedDate];

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {slots.map((slot: any, index: number) => (
          <button
            key={index}
            disabled={!slot.is_available}
            className={`p-2 text-center rounded-lg border ${
              slot.is_available
                ? selectedTimeSlot?.start === slot.start && selectedTimeSlot?.end === slot.end
                  ? 'bg-primary text-white border-primary'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            }`}
            onClick={() => handleTimeSlotSelect(slot)}
          >
            <span className="text-sm">
              {slot.start} - {slot.end}
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !court) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary hover:underline"
          >
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (success && bookingId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg mb-6 flex items-start">
          <CheckCircle size={24} className="mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold mb-2">Reserva realizada com sucesso!</h3>
            <p className="mb-2">
              Sua reserva foi registrada com o número: <strong>{bookingId}</strong>
            </p>
            <p>Você receberá uma confirmação por e-mail em breve.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/bookings/${bookingId}`}
            className="bg-primary text-white px-6 py-2 rounded-lg text-center hover:bg-primary-dark"
          >
            Ver detalhes da reserva
          </Link>
          <Link
            to="/"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-center hover:bg-gray-100"
          >
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navegação de volta */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft size={18} className="mr-1" />
          Voltar para detalhes da quadra
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Reservar Quadra</h1>

        {/* Resumo da quadra */}
        {court && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 mr-4">
              {court.photos && court.photos.length > 0 ? (
                <img
                  src={court.photos[0]}
                  alt={court.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sem imagem
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold">{court.name}</h2>
              {court.arena && <p className="text-gray-600">{court.arena.name}</p>}
              <p className="text-primary font-semibold">
                {court.discounted_price ? (
                  <>
                    <span className="line-through text-gray-400 text-sm mr-1">
                      R$ {court.price_per_hour.toFixed(2)}
                    </span>
                    R$ {court.discounted_price.toFixed(2)}/hora
                  </>
                ) : (
                  `R$ ${court.price_per_hour.toFixed(2)}/hora`
                )}
              </p>
            </div>
          </div>
        )}

        {/* Mensagem de erro se houver */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Seleção de data */}
          <div className="mb-6">
            <label htmlFor="date" className="block text-lg font-semibold mb-3 flex items-center">
              <Calendar size={20} className="mr-2" />
              Selecione a data
            </label>
            <input
              type="date"
              id="date"
              className="w-full sm:w-64 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Seleção de horário */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3 flex items-center">
              <Clock size={20} className="mr-2" />
              Selecione o horário
            </label>

            {renderAvailabilitySlots()}
          </div>

          {/* Resumo da reserva */}
          {selectedTimeSlot && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Resumo da Reserva</h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-gray-600">Data:</div>
                  <div className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>

                  <div className="text-gray-600">Horário:</div>
                  <div className="font-medium">
                    {selectedTimeSlot.start} às {selectedTimeSlot.end}
                  </div>

                  <div className="text-gray-600">Duração:</div>
                  <div className="font-medium">
                    {hours} hora{hours !== 1 ? 's' : ''}
                  </div>

                  <div className="text-gray-600">Valor da hora:</div>
                  <div className="font-medium">
                    R$ {(court?.discounted_price || court?.price_per_hour || 0).toFixed(2)}
                  </div>
                </div>

                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informações adicionais sobre pagamento */}
          <div className="border-t pt-4 mt-6 text-sm text-gray-600">
            <p>
              {court?.advance_payment_required
                ? '* Esta quadra exige pagamento antecipado para confirmar a reserva.'
                : '* A reserva será confirmada diretamente pela administração da arena.'}
            </p>
            {court?.advance_payment_required && (
              <p className="mt-1">
                * Após a reserva, você será redirecionado para a página de pagamento.
              </p>
            )}
          </div>

          {/* Botão de submissão */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!selectedTimeSlot || loadingSubmit}
              className={`w-full py-3 rounded-lg text-white font-semibold ${
                selectedTimeSlot && !loadingSubmit
                  ? 'bg-primary hover:bg-primary-dark'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loadingSubmit ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                'Reservar Agora'
              )}
            </button>
          </div>
        </form>

        {/* Informações sobre a quadra */}
        {court && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Informações Importantes</h3>

            <div className="space-y-3">
              <p className="text-gray-700">
                <span className="font-medium">Tempo mínimo de reserva:</span>{' '}
                {court.minimum_booking_hours} hora{court.minimum_booking_hours !== 1 ? 's' : ''}
              </p>

              {court.arena && court.arena.cancellation_policy && (
                <div>
                  <p className="font-medium">Política de Cancelamento:</p>
                  <p className="text-gray-700">{court.arena.cancellation_policy}</p>
                </div>
              )}

              {!isAuthenticated && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-blue-700">
                    Para completar sua reserva, você precisará fazer login ou criar uma conta.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFormPage;
