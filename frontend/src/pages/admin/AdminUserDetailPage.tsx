// src/pages/admin/AdminUserDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  AlertCircle,
  Loader,
  CheckCircle,
  Shield,
  Building,
  Save,
  X,
  Check,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import InputMask from 'react-input-mask';

interface UserDetail {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  cpf: string;
  birth_date: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserDetail | null>(null);

  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: '',
    is_active: false,
  });

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/users');
      return;
    }

    if (currentUser?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar dados do usuário
    if (id) {
      fetchUserDetails(id);
    }
  }, [isAuthenticated, currentUser, navigate, id]);

  // Buscar detalhes do usuário
  const fetchUserDetails = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminService.getUserDetails(userId);
      setUserData(data);

      // Inicializar formulário de edição
      setEditForm({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: data.role,
        is_active: data.is_active,
      });
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do usuário:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar os detalhes do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar modo de edição
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // Cancelar edição
  const handleCancelEditing = () => {
    // Reset do formulário para os valores originais
    if (userData) {
      setEditForm({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // Atualizar campo do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'is_active' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Salvar alterações
  const handleSaveChanges = async () => {
    if (!id || !userData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar se houve alteração de role
      if (editForm.role !== userData.role) {
        await adminService.updateUserRole(id, editForm.role);
      }

      // Verificar se houve alteração de status (ativo/inativo)
      if (editForm.is_active !== userData.is_active) {
        if (editForm.is_active) {
          await adminService.activateUser(id);
        } else {
          await adminService.deactivateUser(id);
        }
      }

      // Atualizar outros dados do perfil
      if (
        editForm.first_name !== userData.first_name ||
        editForm.last_name !== userData.last_name ||
        editForm.phone !== userData.phone
      ) {
        await adminService.updateUserProfile(id, {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
        });
      }

      // Atualizar dados na tela
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              first_name: editForm.first_name,
              last_name: editForm.last_name,
              phone: editForm.phone,
              role: editForm.role,
              is_active: editForm.is_active,
            }
          : null
      );

      setSuccess('Usuário atualizado com sucesso');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Erro ao salvar alterações:', err);
      setError(err.response?.data?.detail || 'Não foi possível salvar as alterações');
    } finally {
      setSaving(false);
    }
  };

  // Alternar status ativo/inativo
  const handleToggleStatus = async () => {
    if (!id || !userData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (userData.is_active) {
        await adminService.deactivateUser(id);
      } else {
        await adminService.activateUser(id);
      }

      // Atualizar dados na tela
      setUserData((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
      setEditForm((prev) => ({ ...prev, is_active: !prev.is_active }));

      setSuccess(`Usuário ${userData.is_active ? 'desativado' : 'ativado'} com sucesso`);
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      setError(err.response?.data?.detail || 'Não foi possível alterar o status do usuário');
    } finally {
      setSaving(false);
    }
  };

  // Traduzir roles para exibição
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      arena_owner: 'Proprietário de Arena',
      customer: 'Cliente',
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando dados do usuário...</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/admin/users')} className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold">Usuário não encontrado</h1>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          O usuário solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
        </div>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Voltar para lista de usuários
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/users')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Informações Pessoais</h2>

              {/* Botões de ação */}
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEditing}
                      className="py-1 px-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center"
                      disabled={saving}
                    >
                      <X size={16} className="mr-1" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="py-1 px-3 bg-primary text-white rounded hover:bg-primary-dark flex items-center"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader size={16} className="animate-spin mr-1" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-1" />
                          Salvar
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleToggleStatus}
                      className={`py-1 px-3 rounded flex items-center ${
                        userData.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader size={16} className="animate-spin mr-1" />
                      ) : userData.is_active ? (
                        <X size={16} className="mr-1" />
                      ) : (
                        <Check size={16} className="mr-1" />
                      )}
                      {userData.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={handleStartEditing}
                      className="py-1 px-3 bg-primary text-white rounded hover:bg-primary-dark flex items-center"
                    >
                      <RefreshCw size={16} className="mr-1" />
                      Atualizar
                    </button>
                  </>
                )}
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : (
                    <div className="p-2 border rounded-lg bg-gray-50">{userData.first_name}</div>
                  )}
                </div>

                {/* Sobrenome */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sobrenome
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : (
                    <div className="p-2 border rounded-lg bg-gray-50">{userData.last_name}</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="p-2 border rounded-lg bg-gray-50 flex items-center">
                    <Mail size={16} className="text-gray-500 mr-2" />
                    {userData.email}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de Usuário
                  </label>
                  <div className="p-2 border rounded-lg bg-gray-50 flex items-center">
                    <User size={16} className="text-gray-500 mr-2" />@{userData.username}
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  {isEditing ? (
                    <InputMask
                      mask="(99) 99999-9999"
                      type="text"
                      id="phone"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : (
                    <div className="p-2 border rounded-lg bg-gray-50 flex items-center">
                      <Phone size={16} className="text-gray-500 mr-2" />
                      {userData.phone}
                    </div>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <div className="p-2 border rounded-lg bg-gray-50">
                    {userData.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento
                  </label>
                  <div className="p-2 border rounded-lg bg-gray-50 flex items-center">
                    <Calendar size={16} className="text-gray-500 mr-2" />
                    {new Date(userData.birth_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Papel/Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Usuário
                  </label>
                  {isEditing ? (
                    <select
                      id="role"
                      name="role"
                      value={editForm.role}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="admin">Administrador</option>
                      <option value="arena_owner">Proprietário de Arena</option>
                      <option value="customer">Cliente</option>
                    </select>
                  ) : (
                    <div className="p-2 border rounded-lg bg-gray-50 flex items-center">
                      {userData.role === 'admin' ? (
                        <Shield size={16} className="text-purple-500 mr-2" />
                      ) : userData.role === 'arena_owner' ? (
                        <Building size={16} className="text-blue-500 mr-2" />
                      ) : (
                        <User size={16} className="text-green-500 mr-2" />
                      )}
                      {translateRole(userData.role)}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="is_active"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  {isEditing ? (
                    <div className="p-2 border rounded-lg">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          checked={editForm.is_active}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))
                          }
                          className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="ml-2">{editForm.is_active ? 'Ativo' : 'Inativo'}</span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-2 border rounded-lg bg-gray-50">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          userData.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {userData.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Card lateral com dados adicionais */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Adicionais</h2>

            <div className="space-y-4">
              {/* Data de Cadastro */}
              <div>
                <p className="text-sm text-gray-500">Data de Cadastro</p>
                <div className="flex items-center mt-1">
                  <Clock size={16} className="text-gray-500 mr-2" />
                  <span className="text-gray-700">
                    {new Date(userData.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Última Atualização */}
              <div>
                <p className="text-sm text-gray-500">Última Atualização</p>
                <div className="flex items-center mt-1">
                  <RefreshCw size={16} className="text-gray-500 mr-2" />
                  <span className="text-gray-700">
                    {new Date(userData.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-medium mb-3">Ações Rápidas</h3>

                <div className="space-y-2">
                  <button
                    onClick={handleToggleStatus}
                    className={`w-full py-2 px-3 rounded-lg flex items-center justify-center ${
                      userData.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : userData.is_active ? (
                      <X size={16} className="mr-2" />
                    ) : (
                      <Check size={16} className="mr-2" />
                    )}
                    {userData.is_active ? 'Desativar Usuário' : 'Ativar Usuário'}
                  </button>

                  {userData.role !== 'admin' && (
                    <button
                      onClick={() => {
                        setEditForm((prev) => ({ ...prev, role: 'admin' }));
                        handleSaveChanges();
                      }}
                      className="w-full py-2 px-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center"
                      disabled={saving}
                    >
                      <Shield size={16} className="mr-2" />
                      Promover a Administrador
                    </button>
                  )}

                  {userData.role !== 'arena_owner' && (
                    <button
                      onClick={() => {
                        setEditForm((prev) => ({ ...prev, role: 'arena_owner' }));
                        handleSaveChanges();
                      }}
                      className="w-full py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center"
                      disabled={saving}
                    >
                      <Building size={16} className="mr-2" />
                      Definir como Proprietário
                    </button>
                  )}

                  {userData.role !== 'customer' && (
                    <button
                      onClick={() => {
                        setEditForm((prev) => ({ ...prev, role: 'customer' }));
                        handleSaveChanges();
                      }}
                      className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center"
                      disabled={saving}
                    >
                      <User size={16} className="mr-2" />
                      Definir como Cliente
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
