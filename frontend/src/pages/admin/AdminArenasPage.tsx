// src/pages/admin/AdminArenasPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  Loader,
  Edit,
  MapPin,
  Star,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';

interface ArenaData {
  _id: string;
  name: string;
  description: string;
  address: {
    city: string;
    state: string;
    neighborhood: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  rating_count: number;
  courts_count: number;
  active: boolean;
  created_at: string;
}

const AdminArenasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arenas, setArenas] = useState<ArenaData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado para ações em progresso
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

    // Carregar arenas
    fetchArenas();
  }, [isAuthenticated, user, navigate, currentPage, activeFilter]);

  // Buscar arenas com filtros
  const fetchArenas = async () => {
    setLoading(true);
    setError(null);

    try {
      // Preparar parâmetros de filtro
      const params: Record<string, any> = {
        page: currentPage,
        items_per_page: 10,
      };

      if (activeFilter !== null) params.active_only = activeFilter;
      if (searchQuery) params.search = searchQuery;
      if (cityFilter) params.city = cityFilter;
      if (stateFilter) params.state = stateFilter;

      // Buscar arenas
      const response = await adminService.getArenas(params);

      setArenas(response.arenas || response);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      console.error('Erro ao carregar arenas:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar a lista de arenas');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros de busca
  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Resetar para primeira página
    fetchArenas();
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setCityFilter('');
    setStateFilter('');
    setActiveFilter(null);
    setCurrentPage(1);
    setShowFilterMenu(false);
    // Recarregar arenas com filtros limpos
    fetchArenas();
  };

  // Alternar status ativo/inativo de uma arena
  const handleToggleArenaStatus = async (arenaId: string, isCurrentlyActive: boolean) => {
    if (actionInProgress) return; // Evitar ações simultâneas

    setActionInProgress(arenaId);

    try {
      if (isCurrentlyActive) {
        await adminService.deactivateArena(arenaId);
      } else {
        await adminService.activateArena(arenaId);
      }

      // Atualizar lista de arenas após a ação
      setArenas(arenas.map((a) => (a._id === arenaId ? { ...a, active: !isCurrentlyActive } : a)));
    } catch (err: any) {
      console.error('Erro ao alterar status da arena:', err);
      const errorMsg = err.response?.data?.detail || 'Erro ao atualizar o status da arena';
      setError(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Navegar para adicionar nova arena
  const handleAddArena = () => {
    navigate('/admin/arenas/new');
  };

  // Navegar para editar arena
  const handleEditArena = (arenaId: string) => {
    navigate(`/admin/arenas/${arenaId}/edit`);
  };

  // Navegar para visualizar arena
  const handleViewArena = (arenaId: string) => {
    navigate(`/arenas/${arenaId}`);
  };

  // Navegar para gerenciar quadras de uma arena
  const handleManageCourts = (arenaId: string) => {
    navigate(`/admin/arenas/${arenaId}/courts`);
  };

  // Excluir arena
  const handleDeleteArena = async (arenaId: string) => {
    if (actionInProgress) return; // Evitar ações simultâneas

    if (
      !window.confirm('Tem certeza que deseja excluir esta arena? Esta ação não pode ser desfeita.')
    ) {
      return;
    }

    setActionInProgress(arenaId);

    try {
      await adminService.deleteArena(arenaId);

      // Remover arena da lista
      setArenas(arenas.filter((a) => a._id !== arenaId));
    } catch (err: any) {
      console.error('Erro ao excluir arena:', err);
      const errorMsg = err.response?.data?.detail || 'Erro ao excluir arena';
      setError(errorMsg);
    } finally {
      setActionInProgress(null);
    }
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

  // Componente de menu de ações da arena
  const ArenaActionMenu = ({ arenaData }: { arenaData: ArenaData }) => {
    const [showMenu, setShowMenu] = useState(false);

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
                handleViewArena(arenaData._id);
              }}
            >
              <Eye size={16} className="mr-2" />
              Ver no site
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowMenu(false);
                handleEditArena(arenaData._id);
              }}
            >
              <Edit size={16} className="mr-2" />
              Editar
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowMenu(false);
                handleManageCourts(arenaData._id);
              }}
            >
              <Building size={16} className="mr-2" />
              Gerenciar Quadras
            </button>

            <button
              className={`w-full text-left px-4 py-2 text-sm ${
                arenaData.active ? 'text-orange-600' : 'text-green-600'
              } hover:bg-gray-100 flex items-center`}
              onClick={() => {
                setShowMenu(false);
                handleToggleArenaStatus(arenaData._id, arenaData.active);
              }}
              disabled={actionInProgress === arenaData._id}
            >
              {arenaData.active ? (
                <>
                  <X size={16} className="mr-2" />
                  Desativar
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Ativar
                </>
              )}
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowMenu(false);
                handleDeleteArena(arenaData._id);
              }}
              disabled={actionInProgress === arenaData._id}
            >
              <Trash size={16} className="mr-2" />
              Excluir
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/admin')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Gerenciar Arenas</h1>
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

      {/* Barra de ações */}
      <div className="flex justify-between items-center mb-6">
        <form onSubmit={handleApplySearch} className="flex items-center flex-grow mr-4">
          <div className="relative flex-grow mr-2">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou estado..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          >
            Buscar
          </button>
        </form>

        <div className="flex">
          <div className="relative mr-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Digite a cidade"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-primary focus:ring-primary h-4 w-4"
                        name="status"
                        checked={activeFilter === null}
                        onChange={() => setActiveFilter(null)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Todas</span>
                    </label>
                    <br />
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-primary focus:ring-primary h-4 w-4"
                        name="status"
                        checked={activeFilter === true}
                        onChange={() => setActiveFilter(true)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Ativas</span>
                    </label>
                    <br />
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-primary focus:ring-primary h-4 w-4"
                        name="status"
                        checked={activeFilter === false}
                        onChange={() => setActiveFilter(false)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Inativas</span>
                    </label>
                  </div>
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
                      fetchArenas();
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
            onClick={handleAddArena}
            className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Nova Arena
          </button>

          <button
            type="button"
            onClick={() => fetchArenas()}
            className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200"
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Lista de arenas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando arenas...</span>
        </div>
      ) : arenas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma arena encontrada</h3>
          <p className="text-gray-500 mb-6">Não encontramos arenas com os filtros selecionados.</p>
          <div className="flex justify-center">
            <button
              onClick={handleClearFilters}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-200"
            >
              Limpar filtros
            </button>
            <button
              onClick={handleAddArena}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Nova Arena
            </button>
          </div>
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
                    Arena
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Localização
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Proprietário
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Avaliação
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quadras
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
                {arenas.map((arenaData) => (
                  <tr key={arenaData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">{arenaData.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-1" />
                        <span className="text-gray-500">
                          {arenaData.address.city}, {arenaData.address.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {arenaData.owner ? (
                        <span className="text-gray-900">{arenaData.owner.name}</span>
                      ) : (
                        <span className="text-gray-500 italic">Não definido</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star size={16} className="text-yellow-400 mr-1" />
                        <span className="text-gray-900">{arenaData.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1 text-xs">
                          ({arenaData.rating_count})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-gray-900">{arenaData.courts_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          arenaData.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {arenaData.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleEditArena(arenaData._id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit size={16} />
                        </button>

                        {actionInProgress === arenaData._id ? (
                          <Loader size={16} className="animate-spin text-gray-500 mr-3" />
                        ) : (
                          <button
                            onClick={() => handleToggleArenaStatus(arenaData._id, arenaData.active)}
                            className={`${
                              arenaData.active
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            } mr-3`}
                            title={arenaData.active ? 'Desativar' : 'Ativar'}
                          >
                            {arenaData.active ? <X size={16} /> : <Check size={16} />}
                          </button>
                        )}

                        <ArenaActionMenu arenaData={arenaData} />
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

export default AdminArenasPage;
