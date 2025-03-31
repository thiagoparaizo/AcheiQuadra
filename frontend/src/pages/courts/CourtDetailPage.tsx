// src/pages/courts/CourtDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';
import { courtsService, Court, arenasService } from '../../services/api';

const CourtDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Data atual no formato YYYY-MM-DD
  );
  const [availability, setAvailability] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Tipos de quadra traduzidos
  const courtTypes = {
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
    racquetball: 'Raquetebol',
    badminton: 'Badminton',
    futevolei: 'Futevolei',
    multisport: 'Poliesportiva',
    other: 'Outros',
  };

  // Carregar dados da quadra
  useEffect(() => {
    const fetchCourtData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar dados da quadra
        const courtData = await courtsService.getCourt(id);
        setCourt(courtData);

        // Buscar disponibilidade inicial
        await fetchAvailability(selectedDate);
      } catch (err) {
        console.error('Erro ao buscar dados da quadra:', err);
        setError('Não foi possível carregar os dados da quadra. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourtData();
  }, [id]);

  // Buscar disponibilidade para uma data específica
  const fetchAvailability = async (date: string) => {
    if (!id) return;

    setLoadingAvailability(true);

    try {
      const availabilityData = await courtsService.getCourtAvailability(id, date);
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Erro ao buscar disponibilidade:', err);
      // Não definimos erro global, apenas para disponibilidade
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Mudar a data selecionada
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchAvailability(date);
  };

  // Ir para a foto anterior
  const prevPhoto = () => {
    if (!court || court.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === 0 ? court.photos.length - 1 : prev - 1));
  };

  // Ir para a próxima foto
  const nextPhoto = () => {
    if (!court || court.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === court.photos.length - 1 ? 0 : prev + 1));
  };

  // Função para formatar horários disponíveis
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
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            }`}
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

  if (error || !court) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Quadra não encontrada.'}
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navegação de volta */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft size={18} className="mr-1" />
          Voltar para resultados
        </button>
      </div>

      {/* Informações básicas */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Galeria de fotos */}
        <div className="w-full md:w-1/2 relative">
          {court.photos && court.photos.length > 0 ? (
            <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-100">
              <img
                src={court.photos[currentPhotoIndex]}
                alt={`${court.name} - Foto ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Controles da galeria */}
              {court.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Indicador de fotos */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {court.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`h-2 w-2 rounded-full ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">Sem imagens disponíveis</span>
            </div>
          )}
        </div>

        {/* Informações da quadra */}
        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{court.name}</h1>
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
              {courtTypes[court.type as keyof typeof courtTypes] || court.type}
            </span>
          </div>

          {/* Arena e localização */}
          {court.arena && (
            <div>
              <Link
                to={`/arenas/${court.arena.id}`}
                className="text-lg font-semibold text-primary hover:underline"
              >
                {court.arena.name}
              </Link>

              <div className="flex items-start mb-3 mt-2">
                <MapPin size={18} className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                <div>
                  {court.arena.address && (
                    <>
                      <p className="text-gray-700">
                        {court.arena.address.street}, {court.arena.address.number}
                        {court.arena.address.complement && ` - ${court.arena.address.complement}`}
                      </p>
                      <p className="text-gray-700">
                        {court.arena.address.neighborhood}, {court.arena.address.city} -{' '}
                        {court.arena.address.state}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Avaliação da arena */}
          {court.arena && court.arena.rating > 0 && (
            <div className="flex items-center mb-4">
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                <Star size={16} className="text-yellow-500 mr-1" />
                <span className="font-bold">{court.arena.rating.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Preço */}
          <div className="mb-6">
            <div className="text-2xl font-bold text-primary">
              {court.discounted_price && court.discounted_price < court.price_per_hour ? (
                <>
                  <span className="line-through text-gray-400 text-lg mr-2">
                    R$ {court.price_per_hour.toFixed(2)}
                  </span>
                  R$ {court.discounted_price.toFixed(2)}
                </>
              ) : (
                `R$ ${court.price_per_hour.toFixed(2)}`
              )}
              <span className="text-gray-500 text-lg font-normal"> /hora</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              Reserva mínima: {court.minimum_booking_hours} hora
              {court.minimum_booking_hours > 1 ? 's' : ''}
            </div>
          </div>

          {/* Botão de reserva */}
          <button
            className="bg-primary text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-primary-dark w-full"
            onClick={() => navigate(`/booking/${court.id}`)}
          >
            Reservar agora
          </button>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Sobre a Quadra</h2>
        <p className="text-gray-700 whitespace-pre-line">{court.description}</p>

        {/* Características */}
        {court.characteristics && court.characteristics.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Características</h3>
            <div className="flex flex-wrap gap-2">
              {court.characteristics.map((characteristic) => (
                <span
                  key={characteristic}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {characteristic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verificar disponibilidade */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar size={20} className="mr-2" />
          Disponibilidade
        </h2>

        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Selecione uma data
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full sm:w-64 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Horários disponíveis */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Horários disponíveis</h3>

          {loadingAvailability ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-500">Carregando horários...</span>
            </div>
          ) : (
            renderAvailabilitySlots()
          )}
        </div>
      </div>

      {/* Serviços extras */}
      {court.extra_services && court.extra_services.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Serviços Extras</h2>
          <ul className="divide-y">
            {court.extra_services.map((service, index) => (
              <li key={index} className="py-3">
                <div className="flex justify-between">
                  <span>{service}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourtDetailPage;
