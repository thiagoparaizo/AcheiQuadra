// src/pages/payment/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import bookingService, { Booking } from '../../services/bookingService';
import paymentService, { PaymentCreate } from '../../services/paymentService';

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Estados do formulário de pagamento
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card' | 'on_site'>('pix');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);

  // Estados do formulário de cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Verificar se usuário está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/payment/${bookingId}`);
    }
  }, [isAuthenticated, bookingId, navigate]);

  // Carregar dados da reserva
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar dados da reserva
        const bookingData = await bookingService.getBooking(bookingId);
        setBooking(bookingData);

        // Verificar status de pagamento
        const paymentStatusData = await bookingService.getBookingPaymentStatus(bookingId);
        setPaymentStatus(paymentStatusData);

        // Se já tiver um pagamento aprovado, mostrar sucesso
        if (paymentStatusData.payment && paymentStatusData.payment.status === 'approved') {
          setSuccess(true);
          setPaymentResponse(paymentStatusData.payment);
        }

        // Se o status da reserva não for 'waiting_payment', redirecionar
        if (bookingData.status !== 'waiting_payment') {
          if (bookingData.status === 'pending' || bookingData.status === 'confirmed') {
            setSuccess(true);
          } else {
            // Status é 'cancelled' ou 'completed'
            navigate(`/bookings/${bookingId}`);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados da reserva:', err);
        setError('Não foi possível carregar os dados da reserva. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookingData();
    }
  }, [bookingId, isAuthenticated]);

  // Processar pagamento
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId || !booking) {
      setError('Dados da reserva não encontrados.');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      // Preparar dados do pagamento
      const paymentData: PaymentCreate = {
        booking_id: bookingId,
        payment_method: selectedMethod,
        amount: booking.total_amount,
      };

      // Adicionar dados do cartão se for pagamento com cartão de crédito
      if (selectedMethod === 'credit_card') {
        // Em um ambiente real, você usaria um serviço de tokenização como Stripe
        // Aqui estamos apenas passando os últimos 4 dígitos para simulação
        paymentData.card_data = {
          number: cardNumber,
          holder_name: cardName,
          expiration_month: cardExpiry.split('/')[0],
          expiration_year: `20${cardExpiry.split('/')[1]}`,
          cvv: cardCvv,
          token: 'sim_token_' + cardNumber.slice(-4), // Token simulado
          installments,
        };
      }

      // Enviar solicitação de pagamento
      const response = await paymentService.createPayment(paymentData);
      setPaymentResponse(response);

      // Se for cartão de crédito e já foi aprovado, mostrar sucesso
      if (selectedMethod === 'credit_card' && response.status === 'approved') {
        setSuccess(true);
      }

      // Se for PIX, o usuário precisa escanear o QR code
      if (selectedMethod === 'pix') {
        // Apenas exibir o QR code, não marcar como sucesso ainda
      }
    } catch (err: any) {
      console.error('Erro ao processar pagamento:', err);
      setError(
        err.response?.data?.detail || 'Ocorreu um erro ao processar o pagamento. Tente novamente.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Função para formatar número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Função para formatar data de expiração
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return v;
  };

  // Verificar pagamento PIX
  const checkPixPayment = async () => {
    if (!bookingId || !paymentResponse) return;

    setProcessingPayment(true);

    try {
      // Simular verificação do status do pagamento
      // Em um ambiente real, você usaria webhooks ou polling para verificar o status
      await paymentService.simulatePaymentApproval(paymentResponse.id);

      // Recarregar status de pagamento
      const paymentStatusData = await bookingService.getBookingPaymentStatus(bookingId);
      setPaymentStatus(paymentStatusData);

      if (paymentStatusData.payment && paymentStatusData.payment.status === 'approved') {
        setSuccess(true);
        setPaymentResponse(paymentStatusData.payment);
      }
    } catch (err) {
      console.error('Erro ao verificar pagamento:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !booking) {
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

  if (success || paymentStatus?.payment?.status === 'approved') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg mb-6 flex items-start">
          <CheckCircle size={24} className="mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold mb-2">Pagamento realizado com sucesso!</h3>
            <p className="mb-2">Seu pagamento foi processado e sua reserva está confirmada.</p>
            <p>Você receberá uma confirmação por e-mail em breve.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Detalhes do Pagamento</h3>

          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-gray-600">Método:</div>
            <div className="font-medium">
              {paymentResponse?.payment_method === 'pix' && 'PIX'}
              {paymentResponse?.payment_method === 'credit_card' && 'Cartão de Crédito'}
              {paymentResponse?.payment_method === 'on_site' && 'No local'}
            </div>

            <div className="text-gray-600">Valor:</div>
            <div className="font-medium">
              R$ {(paymentResponse?.amount || booking?.total_amount || 0).toFixed(2)}
            </div>

            <div className="text-gray-600">Status:</div>
            <div className="font-medium text-green-600">Aprovado</div>

            <div className="text-gray-600">Data:</div>
            <div className="font-medium">
              {paymentResponse?.payment_date
                ? new Date(paymentResponse.payment_date).toLocaleString('pt-BR')
                : new Date().toLocaleString('pt-BR')}
            </div>
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
          Voltar
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Pagamento da Reserva</h1>

        {/* Resumo da reserva */}
        {booking && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Resumo da Reserva</h2>

            <div className="grid grid-cols-2 gap-y-2 mb-4">
              <div className="text-gray-600">Quadra:</div>
              <div className="font-medium">{booking.court?.name}</div>

              <div className="text-gray-600">Arena:</div>
              <div className="font-medium">{booking.arena?.name}</div>

              <div className="text-gray-600">Data:</div>
              <div className="font-medium">
                {booking.timeslot && new Date(booking.timeslot.date).toLocaleDateString('pt-BR')}
              </div>

              <div className="text-gray-600">Horário:</div>
              <div className="font-medium">
                {booking.timeslot &&
                  `${booking.timeslot.start_time} às ${booking.timeslot.end_time}`}
              </div>
            </div>

            <div className="border-t pt-3 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total a pagar:</span>
                <span className="text-primary">R$ {booking.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {paymentStatus?.payment_deadline && (
              <div className="mt-4 flex items-center text-amber-600 text-sm">
                <Clock size={16} className="mr-1" />
                <span>
                  Prazo para pagamento:{' '}
                  {new Date(paymentStatus.payment_deadline).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de erro se houver */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Formulário de pagamento */}
        {!paymentResponse && (
          <form onSubmit={handleSubmitPayment} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>

            {/* Métodos de pagamento */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                type="button"
                className={`p-4 border rounded-lg flex flex-col items-center justify-center h-24 ${
                  selectedMethod === 'pix'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('pix')}
              >
                <QrCode
                  size={24}
                  className={selectedMethod === 'pix' ? 'text-primary' : 'text-gray-500'}
                />
                <span
                  className={`mt-2 ${
                    selectedMethod === 'pix' ? 'text-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  PIX
                </span>
              </button>

              <button
                type="button"
                className={`p-4 border rounded-lg flex flex-col items-center justify-center h-24 ${
                  selectedMethod === 'credit_card'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('credit_card')}
              >
                <CreditCard
                  size={24}
                  className={selectedMethod === 'credit_card' ? 'text-primary' : 'text-gray-500'}
                />
                <span
                  className={`mt-2 ${
                    selectedMethod === 'credit_card' ? 'text-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  Cartão de Crédito
                </span>
              </button>

              <button
                type="button"
                className={`p-4 border rounded-lg flex flex-col items-center justify-center h-24 ${
                  selectedMethod === 'on_site'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('on_site')}
              >
                <Wallet
                  size={24}
                  className={selectedMethod === 'on_site' ? 'text-primary' : 'text-gray-500'}
                />
                <span
                  className={`mt-2 ${
                    selectedMethod === 'on_site' ? 'text-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  Pagar no local
                </span>
              </button>
            </div>

            {/* Formulário de cartão de crédito */}
            {selectedMethod === 'credit_card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="cardName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome no Cartão
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="NOME COMO ESTÁ NO CARTÃO"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cardExpiry"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Data de Expiração
                    </label>
                    <input
                      type="text"
                      id="cardExpiry"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cardCvv"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cardCvv"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={cardCvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="installments"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Parcelas
                  </label>
                  <select
                    id="installments"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    <option value={1}>1x de R$ {booking?.total_amount.toFixed(2)} sem juros</option>
                    <option value={2}>
                      2x de R$ {(booking?.total_amount / 2).toFixed(2)} sem juros
                    </option>
                    <option value={3}>
                      3x de R$ {(booking?.total_amount / 3).toFixed(2)} sem juros
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Informações sobre PIX */}
            {selectedMethod === 'pix' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700 mb-2">
                  Ao confirmar, você receberá um QR Code PIX para realizar o pagamento.
                </p>
                <p className="text-gray-700">
                  O pagamento via PIX é processado instantaneamente após a confirmação.
                </p>
              </div>
            )}

            {/* Informações sobre pagamento no local */}
            {selectedMethod === 'on_site' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700 mb-2">
                  Você realizará o pagamento diretamente na arena no dia da sua reserva.
                </p>
                <p className="text-gray-700">
                  Importante: A reserva só será confirmada após aprovação da arena.
                </p>
              </div>
            )}

            {/* Botão de submissão */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={processingPayment}
                className="w-full py-3 rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingPayment ? (
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
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Exibir QR Code do PIX */}
        {paymentResponse && selectedMethod === 'pix' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Pagamento via PIX</h2>

            <div className="flex flex-col items-center">
              {paymentResponse.pix_qrcode && (
                <div className="mb-4">
                  <img
                    src={`data:image/png;base64,${paymentResponse.pix_qrcode}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              )}

              {paymentResponse.pix_copy_paste && (
                <div className="w-full mb-6">
                  <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX abaixo:</p>
                  <div className="relative">
                    <textarea
                      readOnly
                      className="w-full p-3 border rounded bg-gray-50 text-gray-700 text-xs pr-20"
                      rows={3}
                      value={paymentResponse.pix_copy_paste}
                    ></textarea>
                    <button
                      type="button"
                      className="absolute right-2 top-2 px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary-dark"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentResponse.pix_copy_paste);
                        alert('Código PIX copiado!');
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-gray-700 mb-6">
                Escaneie o QR Code acima com o app do seu banco para realizar o pagamento via PIX.
                <br />
                Após efetuar o pagamento, clique no botão abaixo para verificar o status.
              </p>

              <button
                type="button"
                onClick={checkPixPayment}
                disabled={processingPayment}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingPayment ? (
                  <span className="flex items-center">
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
                    Verificando...
                  </span>
                ) : (
                  'Já realizei o pagamento'
                )}
              </button>

              {paymentResponse.expires_at && (
                <div className="mt-4 text-amber-600 text-sm flex items-center">
                  <Clock size={16} className="mr-1" />
                  <span>
                    Este QR Code expira em:{' '}
                    {new Date(paymentResponse.expires_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações sobre o pagamento no local */}
        {paymentResponse && selectedMethod === 'on_site' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg flex items-start">
              <CheckCircle size={24} className="mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-2">Reserva realizada com sucesso!</h3>
                <p className="mb-2">
                  Sua reserva foi registrada. O pagamento será realizado diretamente na arena no dia
                  da sua atividade.
                </p>
                <p>Aguarde a confirmação da arena, você receberá uma notificação por e-mail.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                to={`/bookings/${bookingId}`}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
              >
                Ver detalhes da reserva
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
