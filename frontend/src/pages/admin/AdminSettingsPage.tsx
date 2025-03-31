// src/pages/admin/AdminSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  AlertCircle,
  Loader,
  Save,
  RefreshCw,
  CheckCircle,
  X,
  Mail,
  MapPin,
  DollarSign,
  Bell,
  Server,
  Globe,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';

// Interface para configurações do sistema
interface SystemSettings {
  email: {
    smtp_server: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    enable_notifications: boolean;
  };
  payment: {
    gateway_api_key: string;
    gateway_secret: string;
    currency: string;
    enable_payments: boolean;
  };
  maps: {
    api_key: string;
    enable_maps: boolean;
  };
  general: {
    site_name: string;
    support_email: string;
    support_phone: string;
    terms_url: string;
    privacy_url: string;
    enable_registration: boolean;
    maintenance_mode: boolean;
  };
  booking: {
    max_booking_advance_days: number;
    min_booking_advance_hours: number;
    default_payment_deadline_hours: number;
    enable_auto_confirmation: boolean;
  };
}

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Estado para controle de abas
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'payment' | 'maps' | 'booking'>(
    'general'
  );

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/settings');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar configurações
    fetchSettings();
  }, [isAuthenticated, user, navigate]);

  // Buscar configurações do sistema
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getSystemSettings();
      setSettings(response);
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(
        err.response?.data?.detail || 'Não foi possível carregar as configurações do sistema'
      );

      // Carregar configurações padrão para demonstração
      setSettings({
        email: {
          smtp_server: 'smtp.example.com',
          smtp_port: 587,
          smtp_username: 'noreply@quadrasapp.com',
          smtp_password: '',
          from_email: 'noreply@quadrasapp.com',
          enable_notifications: true,
        },
        payment: {
          gateway_api_key: '',
          gateway_secret: '',
          currency: 'BRL',
          enable_payments: true,
        },
        maps: {
          api_key: '',
          enable_maps: true,
        },
        general: {
          site_name: 'QuadrasApp',
          support_email: 'suporte@quadrasapp.com',
          support_phone: '(11) 99999-9999',
          terms_url: '/terms',
          privacy_url: '/privacy',
          enable_registration: true,
          maintenance_mode: false,
        },
        booking: {
          max_booking_advance_days: 60,
          min_booking_advance_hours: 2,
          default_payment_deadline_hours: 24,
          enable_auto_confirmation: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminService.saveSystemSettings(settings);
      setSuccess('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Atualizar campo de configuração
  const handleSettingChange = (category: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value,
      },
    });
  };

  // Testar conexão de email
  const handleTestEmailConnection = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminService.testEmailConnection(settings.email);
      setSuccess('Conexão com servidor de email testada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao testar conexão de email:', err);
      setError(err.response?.data?.detail || 'Erro ao testar conexão de email');
    } finally {
      setSaving(false);
    }
  };

  // Testar gateway de pagamento
  const handleTestPaymentGateway = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminService.testPaymentGateway(settings.payment);
      setSuccess('Conexão com gateway de pagamento testada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao testar gateway de pagamento:', err);
      setError(err.response?.data?.detail || 'Erro ao testar gateway de pagamento');
    } finally {
      setSaving(false);
    }
  };

  // Testar API do Google Maps
  const handleTestMapsApi = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminService.testMapsApi(settings.maps.api_key);
      setSuccess('API do Google Maps testada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao testar API do Google Maps:', err);
      setError(err.response?.data?.detail || 'Erro ao testar API do Google Maps');
    } finally {
      setSaving(false);
    }
  };

  // Renderizar conteúdo da aba atual
  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do site</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.general.site_name}
                onChange={(e) => handleSettingChange('general', 'site_name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de suporte
              </label>
              <input
                type="email"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.general.support_email}
                onChange={(e) => handleSettingChange('general', 'support_email', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone de suporte
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.general.support_phone}
                onChange={(e) => handleSettingChange('general', 'support_phone', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL dos Termos de Uso
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.general.terms_url}
                onChange={(e) => handleSettingChange('general', 'terms_url', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Política de Privacidade
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.general.privacy_url}
                onChange={(e) => handleSettingChange('general', 'privacy_url', e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_registration"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.general.enable_registration}
                onChange={(e) =>
                  handleSettingChange('general', 'enable_registration', e.target.checked)
                }
              />
              <label htmlFor="enable_registration" className="ml-2 block text-sm text-gray-700">
                Permitir novos cadastros
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenance_mode"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.general.maintenance_mode}
                onChange={(e) =>
                  handleSettingChange('general', 'maintenance_mode', e.target.checked)
                }
              />
              <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-700">
                Modo de manutenção (site inacessível para usuários)
              </label>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servidor SMTP</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.email.smtp_server}
                onChange={(e) => handleSettingChange('email', 'smtp_server', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porta SMTP</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.email.smtp_port}
                onChange={(e) =>
                  handleSettingChange('email', 'smtp_port', parseInt(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário SMTP</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.email.smtp_username}
                onChange={(e) => handleSettingChange('email', 'smtp_username', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha SMTP</label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.email.smtp_password}
                onChange={(e) => handleSettingChange('email', 'smtp_password', e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de remetente
              </label>
              <input
                type="email"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.email.from_email}
                onChange={(e) => handleSettingChange('email', 'from_email', e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_notifications"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.email.enable_notifications}
                onChange={(e) =>
                  handleSettingChange('email', 'enable_notifications', e.target.checked)
                }
              />
              <label htmlFor="enable_notifications" className="ml-2 block text-sm text-gray-700">
                Ativar notificações por email
              </label>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestEmailConnection}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Testar Conexão SMTP
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave API do Gateway
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.payment.gateway_api_key}
                onChange={(e) => handleSettingChange('payment', 'gateway_api_key', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave Secreta do Gateway
              </label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.payment.gateway_secret}
                onChange={(e) => handleSettingChange('payment', 'gateway_secret', e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moeda padrão</label>
              <select
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.payment.currency}
                onChange={(e) => handleSettingChange('payment', 'currency', e.target.value)}
              >
                <option value="BRL">Real Brasileiro (BRL)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_payments"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.payment.enable_payments}
                onChange={(e) =>
                  handleSettingChange('payment', 'enable_payments', e.target.checked)
                }
              />
              <label htmlFor="enable_payments" className="ml-2 block text-sm text-gray-700">
                Ativar pagamentos online
              </label>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestPaymentGateway}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Testar Gateway de Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'maps':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave API do Google Maps
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.maps.api_key}
                onChange={(e) => handleSettingChange('maps', 'api_key', e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Obtenha uma chave API no{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Console do Google Cloud
                </a>
                .
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_maps"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.maps.enable_maps}
                onChange={(e) => handleSettingChange('maps', 'enable_maps', e.target.checked)}
              />
              <label htmlFor="enable_maps" className="ml-2 block text-sm text-gray-700">
                Ativar integração com mapas
              </label>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestMapsApi}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Testar API do Google Maps
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'booking':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de dias para agendamento antecipado
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.booking.max_booking_advance_days}
                onChange={(e) =>
                  handleSettingChange(
                    'booking',
                    'max_booking_advance_days',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="365"
              />
              <p className="mt-1 text-sm text-gray-500">
                Define com quantos dias de antecedência um usuário pode fazer uma reserva.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo de horas para agendamento
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.booking.min_booking_advance_hours}
                onChange={(e) =>
                  handleSettingChange(
                    'booking',
                    'min_booking_advance_hours',
                    parseInt(e.target.value)
                  )
                }
                min="0"
                max="72"
              />
              <p className="mt-1 text-sm text-gray-500">
                Define com quantas horas de antecedência, no mínimo, um usuário pode fazer uma
                reserva.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prazo padrão para pagamento (horas)
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={settings.booking.default_payment_deadline_hours}
                onChange={(e) =>
                  handleSettingChange(
                    'booking',
                    'default_payment_deadline_hours',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="72"
              />
              <p className="mt-1 text-sm text-gray-500">
                Tempo que o usuário tem para efetuar o pagamento após fazer a reserva.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_auto_confirmation"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={settings.booking.enable_auto_confirmation}
                onChange={(e) =>
                  handleSettingChange('booking', 'enable_auto_confirmation', e.target.checked)
                }
              />
              <label
                htmlFor="enable_auto_confirmation"
                className="ml-2 block text-sm text-gray-700"
              >
                Confirmar reservas automaticamente após pagamento
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/admin')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
      </div>

      {/* Mensagens de erro ou sucesso */}
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Sidebar com abas */}
          <div className="md:w-64 bg-gray-50 p-4 border-r">
            <div className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                  activeTab === 'general'
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <Settings size={18} className="mr-2" />
                Geral
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                  activeTab === 'email'
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('email')}
              >
                <Mail size={18} className="mr-2" />
                Email
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                  activeTab === 'payment'
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('payment')}
              >
                <DollarSign size={18} className="mr-2" />
                Pagamentos
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                  activeTab === 'maps'
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('maps')}
              >
                <MapPin size={18} className="mr-2" />
                Mapas
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                  activeTab === 'booking'
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('booking')}
              >
                <Calendar size={18} className="mr-2" />
                Reservas
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <HelpCircle size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Dica</p>
                  <p>
                    Certifique-se de salvar suas alterações antes de mudar para outra seção de
                    configurações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo da aba */}
          <div className="p-6 flex-grow">
            <h2 className="text-xl font-semibold mb-6">
              {activeTab === 'general' && 'Configurações Gerais'}
              {activeTab === 'email' && 'Configurações de Email'}
              {activeTab === 'payment' && 'Configurações de Pagamento'}
              {activeTab === 'maps' && 'Configurações de Mapas'}
              {activeTab === 'booking' && 'Configurações de Reservas'}
            </h2>

            {/* Conteúdo da aba atual */}
            {renderTabContent()}

            {/* Botão para salvar configurações */}
            <div className="mt-8 border-t pt-6">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
