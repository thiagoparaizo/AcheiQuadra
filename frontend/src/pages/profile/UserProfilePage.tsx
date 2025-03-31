// src/pages/profile/UserProfilePage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  AlertCircle,
  FileText,
  CreditCard,
  Lock,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import InputMask from 'react-input-mask';

const UserProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para os campos editáveis
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Redirecionar se não estiver autenticado
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
    }
  }, [isAuthenticated, navigate]);

  // Atualizar estados quando o usuário é carregado
  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
    }
  }, [user]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
    // Se estiver saindo do modo de edição, resetar os valores
    if (editMode && user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Implementar lógica de atualização do perfil
      // Fazer uma chamada para a API para atualizar os dados
      // Aqui vamos simular uma atualização bem-sucedida

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Aqui você chamaria seu serviço de API para atualizar o perfil
      // await userService.updateProfile({ first_name: firstName, last_name: lastName, phone });

      setSuccess('Perfil atualizado com sucesso!');
      setEditMode(false);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.response?.data?.detail || 'Ocorreu um erro ao atualizar seu perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de perfil */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Informações Pessoais</h2>
              <button
                onClick={toggleEditMode}
                className="flex items-center text-primary hover:underline"
              >
                {editMode ? (
                  <>
                    <X size={16} className="mr-1" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit size={16} className="mr-1" />
                    Editar
                  </>
                )}
              </button>
            </div>

            {/* Mensagem de sucesso ou erro */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome
                  </label>
                  {editMode ? (
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-gray-800">
                      <User size={18} className="text-gray-500 mr-2" />
                      {user.first_name}
                    </div>
                  )}
                </div>

                {/* Sobrenome */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sobrenome
                  </label>
                  {editMode ? (
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-gray-800">{user.last_name}</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center text-gray-800">
                    <Mail size={18} className="text-gray-500 mr-2" />
                    {user.email}
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  {editMode ? (
                    <InputMask
                      mask="(99) 99999-9999"
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-gray-800">
                      <Phone size={18} className="text-gray-500 mr-2" />
                      {user.phone}
                    </div>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <div className="flex items-center text-gray-800">
                    <FileText size={18} className="text-gray-500 mr-2" />
                    {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento
                  </label>
                  <div className="flex items-center text-gray-800">
                    <Calendar size={18} className="text-gray-500 mr-2" />
                    {new Date(user.birth_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
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
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-1" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Links úteis */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Menu Rápido</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile/bookings"
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  <Calendar size={18} className="mr-2 text-primary" />
                  Minhas Reservas
                </Link>
              </li>
              <li>
                <Link
                  to="/profile/payments"
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  <CreditCard size={18} className="mr-2 text-primary" />
                  Histórico de Pagamentos
                </Link>
              </li>
              <li>
                <Link
                  to="/profile/change-password"
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  <Lock size={18} className="mr-2 text-primary" />
                  Alterar Senha
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
