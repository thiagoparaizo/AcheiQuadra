// src/pages/arenas/ArenaDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { arenasService, Arena, Court } from '../../services/api';
import CourtCard from '../../components/courts/CourtCard';

const ArenaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [arena, setArena] = useState<Arena | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedCourtType, setSelectedCourtType] = useState<string | null>(null);

  // Tipos de quadras traduzidos
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

  // Mapeamento de amenidades para ícones ou nomes legíveis
  const amenityLabels: Record<string, { label: string; icon: string }> = {
    parking: { label: 'Estacionamento', icon: '🅿️' },
    wifi: { label: 'Wi-Fi', icon: '📶' },
    shower: { label: 'Chuveiro', icon: '🚿' },
    locker_room: { label: 'Vestiário', icon: '🔑' },
    bar: { label: 'Bar', icon: '🍹' },
    restaurant: { label: 'Restaurante', icon: '🍽️' },
    equipment_rental: { label: 'Aluguel de Equipamentos', icon: '⚽' },
    air_conditioning: { label: 'Ar Condicionado', icon: '❄️' },
    lighting: { label: 'Iluminação', icon: '💡' },
    covered: { label: 'Cobertura', icon: '☂️' },
    instructor: { label: 'Instrutor', icon: '👨‍🏫' },
    pet_friendly: { label: 'Pet Friendly', icon: '🐶' },
    security_cameras: { label: 'Câmeras de Segurança', icon: '📹' },
    accessible: { label: 'Acessibilidade', icon: '♿' },
    first_aid: { label: 'Primeiros Socorros', icon: '🩹' },
    water_fountain: { label: 'Bebedouro', icon: '💧' },
    snack_bar: { label: 'Lanchonete', icon: '🥪' },
    tv: { label: 'TV', icon: '📺' },
    game_transmission: { label: 'Transmissão de Jogos', icon: '📡' },
    kids_area: { label: 'Área Infantil', icon: '👶' },
  };

  // Carregar dados da arena e suas quadras
  useEffect(() => {
    const fetchArenaData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar dados da arena
        const arenaData = await arenasService.getArena(id);
        setArena(arenaData);

        // Buscar quadras da arena
        const courtsData = await arenasService.getArenaCourts(id);
        setCourts(courtsData);
      } catch (err) {
        console.error('Erro ao buscar dados da arena:', err);
        setError('Não foi possível carregar os dados da arena. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchArenaData();
  }, [id]);

  // Filtrar quadras por tipo quando selecionado
  const filteredCourts = selectedCourtType
    ? courts.filter((court) => court.type === selectedCourtType)
    : courts;

  // Agrupar tipos de quadra disponíveis
  const availableCourtTypes = [...new Set(courts.map((court) => court.type))];

  // Ir para a foto anterior
  const prevPhoto = () => {
    if (!arena || arena.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === 0 ? arena.photos.length - 1 : prev - 1));
  };

  // Ir para a próxima foto
  const nextPhoto = () => {
    if (!arena || arena.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === arena.photos.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !arena) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Arena não encontrada.'}
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
          {arena.photos && arena.photos.length > 0 ? (
            <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-100">
              <img
                src={arena.photos[currentPhotoIndex]}
                alt={`${arena.name} - Foto ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Controles da galeria */}
              {arena.photos.length > 1 && (
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
                    {arena.photos.map((_, index) => (
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
          ) : arena.logo_url ? (
            <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
              <img
                src={arena.logo_url}
                alt={arena.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">Sem imagens disponíveis</span>
            </div>
          )}
        </div>

        {/* Informações da arena */}
        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{arena.name}</h1>

          {/* Avaliação */}
          <div className="flex items-center mb-4">
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              <Star size={16} className="text-yellow-500 mr-1" />
              <span className="font-bold">{arena.rating.toFixed(1)}</span>
              <span className="text-sm ml-1">({arena.rating_count} avaliações)</span>
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start mb-3">
            <MapPin size={18} className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-700">
                {arena.address.street}, {arena.address.number}
                {arena.address.complement && ` - ${arena.address.complement}`}
              </p>
              <p className="text-gray-700">
                {arena.address.neighborhood}, {arena.address.city} - {arena.address.state}
              </p>
              <p className="text-gray-700">CEP: {arena.address.zipcode}</p>
            </div>
          </div>

          {/* Contato */}
          <div className="mb-3 flex items-center">
            <Phone size={18} className="text-gray-500 mr-2 flex-shrink-0" />
            <a href={`tel:${arena.phone}`} className="text-primary hover:underline">
              {arena.phone}
            </a>
          </div>

          <div className="mb-3 flex items-center">
            <Mail size={18} className="text-gray-500 mr-2 flex-shrink-0" />
            <a href={`mailto:${arena.email}`} className="text-primary hover:underline">
              {arena.email}
            </a>
          </div>

          {/* Horário de funcionamento */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Clock size={18} className="text-gray-500 mr-2" />
              Horário de Funcionamento
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {arena.business_hours.monday && arena.business_hours.monday.length > 0 && (
                <>
                  <div className="font-medium">Segunda-feira:</div>
                  <div>
                    {arena.business_hours.monday.map((hours, idx) => (
                      <div key={idx}>
                        {hours.start} às {hours.end}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {arena.business_hours.tuesday && arena.business_hours.tuesday.length > 0 && (
                <>
                  <div className="font-medium">Terça-feira:</div>
                  <div>
                    {arena.business_hours.tuesday.map((hours, idx) => (
                      <div key={idx}>
                        {hours.start} às {hours.end}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {/* Continuar para os outros dias... */}
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Sobre a Arena</h2>
        <p className="text-gray-700 whitespace-pre-line">{arena.description}</p>
      </div>

      {/* Amenidades */}
      {arena.amenities && arena.amenities.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Comodidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {arena.amenities.map((amenity) => (
              <div key={amenity} className="flex items-center">
                <span className="mr-2 text-xl">{amenityLabels[amenity]?.icon || '•'}</span>
                <span>{amenityLabels[amenity]?.label || amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quadras disponíveis */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Layers size={20} className="mr-2" />
            Quadras Disponíveis ({courts.length})
          </h2>
        </div>

        {/* Filtros de tipo de quadra */}
        {availableCourtTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-full ${
                selectedCourtType === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCourtType(null)}
            >
              Todas
            </button>
            {availableCourtTypes.map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full ${
                  selectedCourtType === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCourtType(type)}
              >
                {courtTypes[type as keyof typeof courtTypes] || type}
              </button>
            ))}
          </div>
        )}

        {/* Lista de quadras */}
        {filteredCourts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourts.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {selectedCourtType
                ? `Nenhuma quadra do tipo ${
                    courtTypes[selectedCourtType as keyof typeof courtTypes] || selectedCourtType
                  } disponível.`
                : 'Nenhuma quadra disponível no momento.'}
            </p>
          </div>
        )}
      </div>

      {/* Política de cancelamento */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Política de Cancelamento</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {arena.cancellation_policy ||
            'Entre em contato com a arena para mais informações sobre cancelamentos.'}
        </p>
      </div>
    </div>
  );
};

export default ArenaDetailPage;
