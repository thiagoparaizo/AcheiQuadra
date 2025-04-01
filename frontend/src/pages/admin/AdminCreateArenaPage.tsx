// src/pages/admin/AdminCreateArenaPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader,
  X,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Camera,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import InputMask from 'react-input-mask';

interface ArenaFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
  business_hours: {
    monday: Array<{ start: string; end: string }>;
    tuesday: Array<{ start: string; end: string }>;
    wednesday: Array<{ start: string; end: string }>;
    thursday: Array<{ start: string; end: string }>;
    friday: Array<{ start: string; end: string }>;
    saturday: Array<{ start: string; end: string }>;
    sunday: Array<{ start: string; end: string }>;
  };
  amenities: string[];
  cancellation_policy: string;
  advance_payment_required: boolean;
  payment_deadline_hours: number;
  owner_id?: string;
}

const defaultBusinessHours = {
  monday: [{ start: '08:00', end: '22:00' }],
  tuesday: [{ start: '08:00', end: '22:00' }],
  wednesday: [{ start: '08:00', end: '22:00' }],
  thursday: [{ start: '08:00', end: '22:00' }],
  friday: [{ start: '08:00', end: '22:00' }],
  saturday: [{ start: '08:00', end: '22:00' }],
  sunday: [{ start: '08:00', end: '22:00' }],
};

const initialFormData: ArenaFormData = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
  },
  business_hours: defaultBusinessHours,
  amenities: [],
  cancellation_policy:
    'Cancelamentos até 24 horas antes da reserva recebem reembolso integral. Cancelamentos com menos de 24 horas de antecedência não serão reembolsados.',
  advance_payment_required: true,
  payment_deadline_hours: 24,
};

const AdminCreateArenaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados para carregamento e dados
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArenaFormData>(initialFormData);
  const [arenaOwners, setArenaOwners] = useState<{ id: string; name: string }[]>([]);

  // Estados para imagens
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Estado para abas
  const [activeTab, setActiveTab] = useState<
    'general' | 'address' | 'hours' | 'amenities' | 'photos'
  >('general');

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/arenas/new');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar lista de proprietários de arena
    fetchArenaOwners();
  }, [isAuthenticated, user, navigate]);

  // Buscar proprietários de arena
  const fetchArenaOwners = async () => {
    setLoading(true);
    try {
      // Normalmente isso seria uma chamada específica para buscar apenas proprietários
      // mas como estamos simulando, vamos buscar todos os usuários e filtrar
      const response = await adminService.getUsers({ role: 'arena_owner' });

      const owners = response.users
        .filter((u: any) => u.role === 'arena_owner')
        .map((u: any) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
        }));

      setArenaOwners(owners);
    } catch (err) {
      console.error('Erro ao carregar proprietários de arena:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lidar com mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Lidando com campos aninhados (como address.street)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      // Solução específica para cada objeto aninhado conhecido
      if (parent === 'address') {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value,
          },
        }));
      } else if (parent === 'business_hours') {
        // Adicione tratamento para business_hours se necessário
        // ...
      } else {
        // Abordagem mais genérica mas tipo-segura para outros objetos aninhados
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Lidar com mudanças em checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Lidar com mudanças em amenidades (array de strings)
  const handleAmenityChange = (amenity: string, isChecked: boolean) => {
    setFormData((prev) => {
      const currentAmenities = [...prev.amenities];
      if (isChecked && !currentAmenities.includes(amenity)) {
        return { ...prev, amenities: [...currentAmenities, amenity] };
      } else if (!isChecked && currentAmenities.includes(amenity)) {
        return { ...prev, amenities: currentAmenities.filter((a) => a !== amenity) };
      }
      return prev;
    });
  };

  // Lidar com mudanças nos horários de funcionamento
  const handleBusinessHourChange = (
    day: keyof typeof defaultBusinessHours,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setFormData((prev) => {
      const newHours = [...prev.business_hours[day]];
      newHours[index] = { ...newHours[index], [field]: value };

      return {
        ...prev,
        business_hours: {
          ...prev.business_hours,
          [day]: newHours,
        },
      };
    });
  };

  // Adicionar horário para um dia específico
  const addBusinessHour = (day: keyof typeof defaultBusinessHours) => {
    setFormData((prev) => {
      const newHours = [...prev.business_hours[day], { start: '08:00', end: '22:00' }];

      return {
        ...prev,
        business_hours: {
          ...prev.business_hours,
          [day]: newHours,
        },
      };
    });
  };

  // Remover horário para um dia específico
  const removeBusinessHour = (day: keyof typeof defaultBusinessHours, index: number) => {
    setFormData((prev) => {
      const newHours = [...prev.business_hours[day]];
      newHours.splice(index, 1);

      return {
        ...prev,
        business_hours: {
          ...prev.business_hours,
          [day]: newHours,
        },
      };
    });
  };

  // Lidar com upload de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lidar com upload de fotos
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFiles((prev) => [...prev, ...files]);

      // Criar previews
      const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
      setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  // Remover foto
  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Salvar nova arena
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar dados para envio
      const formDataToSend = new FormData();

      // Converter objeto para JSON e adicionar ao FormData
      const arenaFormData = { ...formData };
      formDataToSend.append('data', JSON.stringify(arenaFormData));

      // Adicionar logo se houver
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      // Adicionar fotos
      photoFiles.forEach((file) => {
        formDataToSend.append('photos', file);
      });

      // Enviar dados para a API
      await adminService.createArena(formDataToSend);

      setSuccess('Arena criada com sucesso!');

      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate('/admin/arenas');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao criar arena:', err);
      setError(
        err.response?.data?.detail || 'Erro ao criar arena. Verifique os dados e tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Lista de amenidades disponíveis
  const amenitiesList = [
    { id: 'parking', name: 'Estacionamento', category: 'structure' },
    { id: 'locker_room', name: 'Vestiário', category: 'structure' },
    { id: 'shower', name: 'Chuveiro', category: 'structure' },
    { id: 'lighting', name: 'Iluminação', category: 'structure' },
    { id: 'covered', name: 'Quadra Coberta', category: 'structure' },
    { id: 'outdoor', name: 'Quadra ao Ar Livre', category: 'structure' },
    { id: 'equipment_rental', name: 'Aluguel de Equipamentos', category: 'services' },
    { id: 'instructor', name: 'Instrutor/Professor', category: 'services' },
    { id: 'snack_bar', name: 'Lanchonete', category: 'services' },
    { id: 'bar', name: 'Bar', category: 'services' },
    { id: 'restaurant', name: 'Restaurante', category: 'services' },
    { id: 'wifi', name: 'Wi-Fi', category: 'comfort' },
    { id: 'air_conditioning', name: 'Ar Condicionado', category: 'comfort' },
    { id: 'waiting_area', name: 'Área de Espera', category: 'comfort' },
    { id: 'security_cameras', name: 'Câmeras de Segurança', category: 'security' },
    { id: 'security_guard', name: 'Segurança', category: 'security' },
    { id: 'first_aid', name: 'Primeiros Socorros', category: 'security' },
    { id: 'wheelchair_access', name: 'Acesso para Cadeirantes', category: 'accessibility' },
  ];

  // Agrupar amenidades por categoria
  const groupedAmenities = amenitiesList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof amenitiesList>);

  const categoryNames: Record<string, string> = {
    structure: 'Estrutura',
    services: 'Serviços',
    comfort: 'Conforto',
    security: 'Segurança',
    accessibility: 'Acessibilidade',
  };

  // Lista de estados brasileiros
  const brazilianStates = [
    'AC',
    'AL',
    'AM',
    'AP',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MG',
    'MS',
    'MT',
    'PA',
    'PB',
    'PE',
    'PI',
    'PR',
    'RJ',
    'RN',
    'RO',
    'RR',
    'RS',
    'SC',
    'SE',
    'SP',
    'TO',
  ];

  // Renderizar abas
  const renderTabs = () => {
    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'general'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
            type="button"
          >
            Informações Gerais
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'address'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('address')}
            type="button"
          >
            Endereço
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'hours'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('hours')}
            type="button"
          >
            Horários
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'amenities'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('amenities')}
            type="button"
          >
            Comodidades
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'photos'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('photos')}
            type="button"
          >
            Fotos
          </button>
        </nav>
      </div>
    );
  };

  // Renderizar conteúdo da aba atual
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Arena*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descreva as características e diferenciais da arena..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone*
                </label>
                <InputMask
                  mask="(99) 99999-9999"
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="contato@arena.com.br"
                />
              </div>
            </div>

            {arenaOwners.length > 0 && (
              <div>
                <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Proprietário da Arena
                </label>
                <select
                  id="owner_id"
                  name="owner_id"
                  value={formData.owner_id || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione um proprietário</option>
                  {arenaOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Se não selecionado, você (como administrador) será o proprietário.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="cancellation_policy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Política de Cancelamento*
              </label>
              <textarea
                id="cancellation_policy"
                name="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="advance_payment_required"
                  name="advance_payment_required"
                  checked={formData.advance_payment_required}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="advance_payment_required"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Exigir pagamento antecipado
                </label>
              </div>

              {formData.advance_payment_required && (
                <div>
                  <label
                    htmlFor="payment_deadline_hours"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prazo para pagamento (horas)
                  </label>
                  <input
                    type="number"
                    id="payment_deadline_hours"
                    name="payment_deadline_hours"
                    value={formData.payment_deadline_hours}
                    onChange={handleInputChange}
                    min="1"
                    max="72"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="address.street"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rua*
                </label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="address.number"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número*
                </label>
                <input
                  type="text"
                  id="address.number"
                  name="address.number"
                  value={formData.address.number}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address.complement"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Complemento
              </label>
              <input
                type="text"
                id="address.complement"
                name="address.complement"
                value={formData.address.complement || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="address.neighborhood"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bairro*
                </label>
                <input
                  type="text"
                  id="address.neighborhood"
                  name="address.neighborhood"
                  value={formData.address.neighborhood}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="address.city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cidade*
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="address.state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Estado*
                </label>
                <select
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione um estado</option>
                  {brazilianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="address.zipcode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CEP*
                </label>
                <InputMask
                  mask="99999-999"
                  type="text"
                  id="address.zipcode"
                  name="address.zipcode"
                  value={formData.address.zipcode}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <MapPin size={20} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-700 font-medium mb-1">Localização no mapa</p>
                  <p className="text-sm text-blue-600">
                    A localização será automaticamente geolocalizada com base no endereço informado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 mb-4">
              Configure os horários de funcionamento da arena. Para cada dia da semana, você pode
              adicionar múltiplos períodos de funcionamento.
            </p>

            {Object.entries(formData.business_hours).map(([day, periods]) => {
              const dayName = {
                monday: 'Segunda-feira',
                tuesday: 'Terça-feira',
                wednesday: 'Quarta-feira',
                thursday: 'Quinta-feira',
                friday: 'Sexta-feira',
                saturday: 'Sábado',
                sunday: 'Domingo',
              }[day as keyof typeof defaultBusinessHours];

              return (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{dayName}</h3>

                  {periods.map((period, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div>
                          <label className="text-xs text-gray-500">Abertura</label>
                          <input
                            type="time"
                            value={period.start}
                            onChange={(e) =>
                              handleBusinessHourChange(
                                day as keyof typeof defaultBusinessHours,
                                index,
                                'start',
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Fechamento</label>
                          <input
                            type="time"
                            value={period.end}
                            onChange={(e) =>
                              handleBusinessHourChange(
                                day as keyof typeof defaultBusinessHours,
                                index,
                                'end',
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>

                      {periods.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeBusinessHour(day as keyof typeof defaultBusinessHours, index)
                          }
                          className="ml-2 p-1 text-red-500 hover:text-red-700"
                          title="Remover horário"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addBusinessHour(day as keyof typeof defaultBusinessHours)}
                    className="text-primary hover:text-primary-dark text-sm flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar horário
                  </button>
                </div>
              );
            })}

            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-start">
                <Clock size={20} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-700 font-medium mb-1">Dica sobre horários</p>
                  <p className="text-sm text-amber-600">
                    Se a arena não funciona em determinado dia, mantenha pelo menos um período com
                    horários iguais (ex: 00:00 às 00:00) para indicar que está fechado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'amenities':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 mb-4">
              Selecione as comodidades e serviços disponíveis na arena.
            </p>

            {Object.entries(groupedAmenities).map(([category, items]) => (
              <div key={category} className="border rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-3">{categoryNames[category] || category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((amenity) => (
                    <div key={amenity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity.id}`}
                        checked={formData.amenities.includes(amenity.id)}
                        onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`amenity-${amenity.id}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {amenity.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Logo da Arena</h3>

              <div className="flex items-center">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-24 w-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                      title="Remover logo"
                    >
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-gray-100 flex items-center justify-center rounded-lg border">
                    <Camera size={32} className="text-gray-400" />
                  </div>
                )}

                <div className="ml-6">
                  <label
                    htmlFor="logo-upload"
                    className="bg-primary text-white px-4 py-2 rounded cursor-pointer inline-block"
                  >
                    {logoPreview ? 'Alterar Logo' : 'Carregar Logo'}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Recomendado: 400x400px, formato quadrado.
                    <br />
                    Formatos aceitos: JPG, PNG, GIF.
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Fotos da Arena</h3>
                <label
                  htmlFor="photos-upload"
                  className="bg-primary text-white px-4 py-2 rounded cursor-pointer inline-block"
                >
                  Adicionar Fotos
                </label>
                <input
                  id="photos-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Adicione fotos que mostrem as quadras, estrutura e ambiente da arena. Você pode
                fazer upload de até 10 fotos.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Arena Preview ${index + 1}`}
                      className="h-32 w-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                      title="Remover foto"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}

                {photoPreviewUrls.length === 0 && (
                  <div className="h-32 bg-gray-100 flex items-center justify-center rounded-lg border">
                    <p className="text-gray-400 text-sm text-center px-4">
                      Nenhuma foto adicionada
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Recomendado: 1200x800px. Máximo de 5MB por foto.
                <br />
                Formatos aceitos: JPG, PNG, WEBP.
              </p>
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
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/arenas')} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold">Nova Arena</h1>
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
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {renderTabs()}

          <div className="p-6">{renderTabContent()}</div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/arenas')}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader size={18} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Criar Arena
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateArenaPage;
