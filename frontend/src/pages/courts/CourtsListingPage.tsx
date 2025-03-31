// src/pages/courts/CourtsListingPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import CourtFilters from '../../components/courts/CourtFilters';
import CourtCard from '../../components/courts/CourtCard';
import { courtsService, Court, CourtSearchParams } from '../../services/api';

const CourtsListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  // Obter filtros dos parâmetros da URL
  const getFiltersFromParams = (): CourtSearchParams => {
    const params: CourtSearchParams = {
      page: Number(searchParams.get('page')) || 1,
      items_per_page: 12,
    };

    // Adicionar outros parâmetros de busca se estiverem presentes
    if (searchParams.has('court_type'))
      params.court_type = searchParams.get('court_type') || undefined;
    if (searchParams.has('city')) params.city = searchParams.get('city') || undefined;
    if (searchParams.has('state')) params.state = searchParams.get('state') || undefined;
    if (searchParams.has('neighborhood'))
      params.neighborhood = searchParams.get('neighborhood') || undefined;
    if (searchParams.has('date')) params.date = searchParams.get('date') || undefined;
    if (searchParams.has('start_time'))
      params.start_time = searchParams.get('start_time') || undefined;
    if (searchParams.has('end_time')) params.end_time = searchParams.get('end_time') || undefined;
    if (searchParams.has('min_price'))
      params.min_price = Number(searchParams.get('min_price')) || undefined;
    if (searchParams.has('max_price'))
      params.max_price = Number(searchParams.get('max_price')) || undefined;
    if (searchParams.has('sort_by'))
      params.sort_by = (searchParams.get('sort_by') as 'distance') || undefined;
    if (searchParams.has('distance_km'))
      params.distance_km = Number(searchParams.get('distance_km')) || undefined;

    // Manejar amenidades que podem ser múltiplas
    const amenities = searchParams.getAll('amenities');
    if (amenities.length > 0) params.amenities = amenities;

    return params;
  };

  // Solicitar localização do usuário
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
        }
      );
    } else {
      console.log('Geolocalização não suportada pelo navegador');
    }
  };

  // Efeito para carregar quadras com base nos filtros da URL
  useEffect(() => {
    const loadCourts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obter filtros dos parâmetros da URL
        const filters = getFiltersFromParams();
        setCurrentPage(filters.page || 1);

        // Adicionar localização do usuário se disponível e solicitado distância
        if (userLocation && filters.distance_km) {
          filters.latitude = userLocation.latitude;
          filters.longitude = userLocation.longitude;
        }

        // Buscar quadras
        const response = await courtsService.listCourts(filters);
        setCourts(response);

        // Atualizar total de páginas (isso vai depender da API)
        // No exemplo, vamos assumir que temos um cabeçalho ou metadados com o total
        setTotalPages(Math.ceil(response.total / filters.items_per_page!) || 1);
      } catch (err) {
        console.error('Erro ao buscar quadras:', err);
        setError('Não foi possível carregar as quadras. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, [searchParams]);

  // Efeito para solicitar localização na primeira renderização
  useEffect(() => {
    requestLocation();
  }, []);

  // Manipulador para mudança de filtros
  const handleFilterChange = (filters: CourtSearchParams) => {
    // Resetar para a primeira página ao mudar filtros
    filters.page = 1;

    // Converter filtros para URLSearchParams
    const newParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (key === 'amenities' && Array.isArray(value)) {
          value.forEach((item) => newParams.append(key, item));
        } else {
          newParams.set(key, String(value));
        }
      }
    });

    // Adicionar localização se disponível e tiver filtro de distância
    if (filters.distance_km && userLocation) {
      newParams.set('latitude', String(userLocation.latitude));
      newParams.set('longitude', String(userLocation.longitude));
    }

    // Atualizar URL
    setSearchParams(newParams);
  };

  // Manipulador para mudança de página
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    setSearchParams(newParams);
  };

  // Componente para paginação
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <nav className="flex items-center">
          <button
            className="px-3 py-1 mr-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="px-3 py-1 ml-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Encontre a quadra ideal</h1>

      {/* Filtros */}
      <CourtFilters onFilterChange={handleFilterChange} initialFilters={getFiltersFromParams()} />

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando quadras...</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Resultados */}
      {!loading && !error && (
        <>
          {courts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Nenhuma quadra encontrada com os filtros selecionados.
              </p>
              <p className="text-gray-500 mt-2">
                Tente ajustar os filtros para encontrar mais opções.
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">{courts.length} quadras encontradas</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <CourtCard key={court.id} court={court} />
                ))}
              </div>

              <Pagination />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CourtsListingPage;
