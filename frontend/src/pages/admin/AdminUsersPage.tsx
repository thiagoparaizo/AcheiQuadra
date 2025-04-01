// src/pages/admin/AdminUsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  Loader,
  Edit,
  User,
  Check,
  X,
  Lock,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';

interface UserData {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado para ações em progresso
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/users');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar usuários
    fetchUsers();
  }, [isAuthenticated, user, navigate, currentPage, roleFilter, activeFilter]);

  // Buscar usuários com filtros
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Preparar parâmetros de filtro
      const params: Record<string, any> = {
        page: currentPage,
        items_per_page: 10,
      };

      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== null) params.is_active = activeFilter;
      if (searchQuery) params.search = searchQuery;

      // Buscar usuários
      const response = await adminService.getUsers(params);
      console.log('Users response:', response);
      console.log('Users:', response.users);

      setUsers(response.users);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar a lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros de busca
  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Resetar para primeira página
    fetchUsers();
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setActiveFilter(null);
    setCurrentPage(1);
    setShowFilterMenu(false);
    // Recarregar usuários com filtros limpos
    fetchUsers();
  };

  // Alternar status ativo/inativo de um usuário
  const handleToggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    if (actionInProgress) return; // Evitar ações simultâneas

    setActionInProgress(userId);

    try {
      if (isCurrentlyActive) {
        await adminService.deactivateUser(userId);
      } else {
        await adminService.activateUser(userId);
      }

      // Atualizar lista de usuários após a ação
      setUsers(users.map((u) => (u._id === userId ? { ...u, is_active: !isCurrentlyActive } : u)));
    } catch (err: any) {
      console.error('Erro ao alterar status do usuário:', err);
      const errorMsg = err.response?.data?.detail || 'Erro ao atualizar o status do usuário';
      setError(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Alterar papel/role de um usuário
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    if (actionInProgress) return; // Evitar ações simultâneas

    setActionInProgress(userId);

    try {
      await adminService.updateUserRole(userId, newRole);

      // Atualizar lista de usuários após a ação
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      console.error('Erro ao alterar papel do usuário:', err);
      const errorMsg = err.response?.data?.detail || 'Erro ao atualizar o papel do usuário';
      setError(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Navegar para detalhes do usuário
  const handleViewUserDetails = (userId: string) => {
    console.log('User ID to navigate:', userId); // Adicione este log
    if (!userId) {
      console.error('User ID is undefined or empty');
      return;
    }
    navigate(`/admin/users/${userId}`);
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

  // Componente de menu de ações do usuário
  const UserActionMenu = ({ userData }: { userData: UserData }) => {
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
                handleViewUserDetails(userData._id);
              }}
            >
              <User size={16} className="mr-2" />
              Ver detalhes
            </button>

            <button
              className={`w-full text-left px-4 py-2 text-sm ${
                userData.is_active ? 'text-red-600' : 'text-green-600'
              } hover:bg-gray-100 flex items-center`}
              onClick={() => {
                setShowMenu(false);
                handleToggleUserStatus(userData._id, userData.is_active);
              }}
              disabled={actionInProgress === userData._id}
            >
              {userData.is_active ? (
                <>
                  <X size={16} className="mr-2" />
                  Desativar usuário
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Ativar usuário
                </>
              )}
            </button>

            {userData.role !== 'admin' && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleChangeUserRole(userData._id, 'admin');
                }}
                disabled={actionInProgress === userData._id}
              >
                <Lock size={16} className="mr-2" />
                Promover a Admin
              </button>
            )}

            {userData.role !== 'arena_owner' && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleChangeUserRole(userData._id, 'arena_owner');
                }}
                disabled={actionInProgress === userData._id}
              >
                <Lock size={16} className="mr-2" />
                Definir como Proprietário
              </button>
            )}

            {userData.role !== 'customer' && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  handleChangeUserRole(userData._id, 'customer');
                }}
                disabled={actionInProgress === userData._id}
              >
                <User size={16} className="mr-2" />
                Definir como Cliente
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Traduzir roles para exibição
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      arena_owner: 'Proprietário',
      customer: 'Cliente',
    };
    return roles[role] || role;
  };

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/admin')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleApplySearch} className="flex items-center">
          <div className="relative flex-grow mr-4">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, email ou username..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Usuário
                  </label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="admin">Administradores</option>
                    <option value="arena_owner">Proprietários</option>
                    <option value="customer">Clientes</option>
                  </select>
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
                      <span className="ml-2 text-sm text-gray-700">Todos</span>
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
                      <span className="ml-2 text-sm text-gray-700">Ativos</span>
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
                      <span className="ml-2 text-sm text-gray-700">Inativos</span>
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
                      fetchUsers();
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
            className="ml-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={() => fetchUsers()}
            className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200"
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </form>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando usuários...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-500 mb-6">
            Não encontramos usuários com os filtros selecionados.
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
                    Usuário
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
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
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Data de Cadastro
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
                {users.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.first_name} {userData.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{userData.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userData.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : userData.role === 'arena_owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {translateRole(userData.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userData.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {userData.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleViewUserDetails(userData._id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit size={16} />
                        </button>

                        {actionInProgress === userData._id ? (
                          <Loader size={16} className="animate-spin text-gray-500 mr-3" />
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(userData._id, userData.is_active)}
                            className={`${
                              userData.is_active
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            } mr-3`}
                            title={userData.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {userData.is_active ? <X size={16} /> : <Check size={16} />}
                          </button>
                        )}

                        <UserActionMenu userData={userData} />
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

export default AdminUsersPage;
