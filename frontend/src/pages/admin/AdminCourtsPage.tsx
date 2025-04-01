// src/pages/admin/AdminCourtsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader,
  CheckCircle,
  X,
  Eye,
  DollarSign,
  Clock,
  Calendar,
  Building,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import api from '../../services/api';

interface CourtData {
  id: string;
  name: string;
  type: string;
  description: string;
  price_per_hour: number;
  discounted_price?: number;
  minimum_booking_hours: number;
  is_available: boolean;
  photos: string[];
  characteristics: string[];
  extra_services: string[];
  advance_payment_required?: boolean;
}

interface ArenaData {
  id: string;
  name: string;
  address: {
    city: string;
    state: string;
  };
  owner_id: string;
  owner?: {
    name: string;
  };
}

// Tipos de quadra para exibição
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
  racquetball: 'Raquetebol',
  badminton: 'Badminton',
  futevolei: 'Futevolei',
  multisport: 'Poliesportiva',
  other: 'Outros',
};

const AdminCourtsPage: React.FC = () => {
  const { id: arenaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [arena, setArena] = useState<ArenaData | null>(null);

  // Estado para ação em andamento
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [filteredCourts, setFilteredCourts] = useState<CourtData[]>([]);

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/arenas');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (!arenaId) {
      navigate('/admin/arenas');
      return;
    }

    // Carregar dados
    fetchData();
  }, [isAuthenticated, user, navigate, arenaId]);

  // Efeito para filtrar as quadras quando os filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [courts, searchQuery, typeFilter, onlyAvailable]);

  // Buscar dados da arena e quadras
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar detalhes da arena
      const arenaData = await adminService.getArenaDetails(arenaId!);
      setArena(arenaData);

      // Buscar quadras da arena
      const courtsData = await api.get(`/arenas/${arenaId}/courts`);
      setCourts(courtsData.data);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(
        err.response?.data?.detail || 'Não foi possível carregar os dados da arena e suas quadras'
      );
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros às quadras
  const applyFilters = () => {
    let filtered = [...courts];

    // Filtrar por pesquisa (nome e descrição)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (court) =>
          court.name.toLowerCase().includes(query) ||
          court.description.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    if (typeFilter) {
      filtered = filtered.filter((court) => court.type === typeFilter);
    }

    // Filtrar apenas disponíveis
    if (onlyAvailable) {
      filtered = filtered.filter((court) => court.is_available);
    }

    setFilteredCourts(filtered);
  };

  // Alternar disponibilidade de uma quadra
  const toggleCourtAvailability = async (court: CourtData) => {
    if (actionInProgress) return;

    setActionInProgress(court.id);
    setError(null);
    setSuccess(null);

    try {
      // Em um cenário real, chamaria a API para atualizar o status da quadra
      await api.put(`/courts/${court.id}`, {
        is_available: !court.is_available,
      });

      // Atualizar estado local
      setCourts((prevCourts) =>
        prevCourts.map((c) => (c.id === court.id ? { ...c, is_available: !c.is_available } : c))
      );

      setSuccess(`Quadra ${court.is_available ? 'desativada' : 'ativada'} com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao atualizar disponibilidade da quadra:', err);
      setError(
        err.response?.data?.detail ||
          'Erro ao atualizar a disponibilidade da quadra. Tente novamente.'
      );
    } finally {
      setActionInProgress(null);
    }
  };

  // Excluir uma quadra
  const deleteCourt = async (court: CourtData) => {
    if (actionInProgress) return;
    if (!window.confirm(`Tem certeza que deseja excluir a quadra "${court.name}"?`)) return;

    setActionInProgress(court.id);
    setError(null);
    setSuccess(null);

    try {
      // Em um cenário real, chamaria a API para excluir a quadra
      await api.delete(`/courts/${court.id}`);

      // Atualizar estado local
      setCourts((prevCourts) => prevCourts.filter((c) => c.id !== court.id));

      setSuccess(`Quadra "${court.name}" excluída com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao excluir quadra:', err);
      setError(err.response?.data?.detail || 'Erro ao excluir a quadra. Tente novamente.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setOnlyAvailable(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando quadras...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={() => navigate('/admin/arenas')} className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Quadras da Arena</h1>
            {arena && (
              <div className="text-gray-600 mt-1 flex items-center">
                <Building size={16} className="mr-1" />
                {arena.name} - {arena.address.city}, {arena.address.state}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/arenas/${arenaId}/courts/new`)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Nova Quadra
        </button>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="relative flex-grow mb-4 md:mb-0">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar quadras por nome ou descrição..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-4 md:mb-0 md:w-48">
            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {Object.entries(courtTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="onlyAvailable"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="onlyAvailable" className="ml-2 block text-sm text-gray-700">
              Apenas disponíveis
            </label>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 md:mt-0 md:ml-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Lista de quadras */}
      {courts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma quadra cadastrada</h3>
          <p className="text-gray-500 mb-6">
            Esta arena ainda não possui quadras cadastradas. Clique no botão abaixo para adicionar a
            primeira.
          </p>
          <button
            onClick={() => navigate(`/admin/arenas/${arenaId}/courts/new`)}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Adicionar Quadra
          </button>
        </div>
      ) : filteredCourts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma quadra encontrada</h3>
          <p className="text-gray-500 mb-6">
            Não foram encontradas quadras com os filtros selecionados. Tente ajustar os critérios de
            busca.
          </p>
          <button
            onClick={clearFilters}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
          >
            Limpar Filtros
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
                    Quadra
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Preço/Hora
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tempo Mínimo
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
                {filteredCourts.map((court) => (
                  <tr key={court.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                          {court.photos && court.photos.length > 0 ? (
                            <img
                              src={court.photos[0]}
                              alt={court.name}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                              <Building size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{court.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {court.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {courtTypes[court.type] || court.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {court.discounted_price && court.discounted_price < court.price_per_hour ? (
                          <>
                            <span className="text-gray-500 line-through">
                              R$ {court.price_per_hour.toFixed(2)}
                            </span>
                            <div className="font-medium text-green-600">
                              R$ {court.discounted_price.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium text-gray-900">
                            R$ {court.price_per_hour.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Clock size={16} className="text-gray-400 mr-1" />
                        {court.minimum_booking_hours} hora
                        {court.minimum_booking_hours > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          court.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {court.is_available ? 'Disponível' : 'Indisponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => navigate(`/admin/courts/${court.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/courts/${court.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => toggleCourtAvailability(court)}
                          className={`${
                            court.is_available
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } mr-3`}
                          title={court.is_available ? 'Desativar' : 'Ativar'}
                          disabled={actionInProgress === court.id}
                        >
                          {actionInProgress === court.id ? (
                            <Loader size={18} className="animate-spin" />
                          ) : court.is_available ? (
                            <X size={18} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteCourt(court)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                          disabled={actionInProgress === court.id}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourtsPage;
