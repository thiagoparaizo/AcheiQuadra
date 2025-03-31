// src/components/courts/CourtFilters.tsx
import React, { useState } from 'react';
import { Search, X, Filter, MapPin, Calendar } from 'lucide-react';
import { CourtSearchParams } from '../../services/api';

interface CourtFiltersProps {
  onFilterChange: (filters: CourtSearchParams) => void;
  initialFilters?: CourtSearchParams;
}

const CourtFilters: React.FC<CourtFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<CourtSearchParams>(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Tipos de quadras disponíveis
  const courtTypes = [
    { value: 'soccer', label: 'Futebol Campo' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'society', label: 'Society' },
    { value: 'tennis', label: 'Tênis' },
    { value: 'beach_tennis', label: 'Beach Tennis' },
    { value: 'volleyball', label: 'Vôlei' },
    { value: 'beach_volleyball', label: 'Vôlei de Praia' },
    { value: 'basketball', label: 'Basquete' },
    { value: 'paddle', label: 'Padel' },
    { value: 'squash', label: 'Squash' },
    { value: 'racquetball', label: 'Raquetebol' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'futevolei', label: 'Futevolei' },
    { value: 'multisport', label: 'Poliesportiva' },
    { value: 'other', label: 'Outros' },
  ];

  // Opções de ordenação
  const sortOptions = [
    { value: 'distance', label: 'Distância' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'rating', label: 'Avaliação' },
  ];

  // Amenidades comuns
  const popularAmenities = [
    { value: 'parking', label: 'Estacionamento' },
    { value: 'shower', label: 'Chuveiro' },
    { value: 'locker_room', label: 'Vestiário' },
    { value: 'lighting', label: 'Iluminação' },
    { value: 'covered', label: 'Quadra Coberta' },
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'bar', label: 'Bar/Lanchonete' },
    { value: 'air_conditioning', label: 'Ar Condicionado' },
  ];

  // Handler para mudanças em campos de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para mudanças em campos numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
  };

  // Handler para mudanças em selects
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para mudanças em campos de data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para mudanças em amenidades (checkboxes)
  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFilters((prev) => {
      const currentAmenities = prev.amenities || [];

      if (checked && !currentAmenities.includes(value)) {
        return { ...prev, amenities: [...currentAmenities, value] };
      } else if (!checked && currentAmenities.includes(value)) {
        return { ...prev, amenities: currentAmenities.filter((a) => a !== value) };
      }

      return prev;
    });
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Barra de pesquisa principal */}
      <div className="flex items-center mb-4">
        <div className="relative flex-grow">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            name="search"
            placeholder="Buscar quadras..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.search || ''}
            onChange={handleTextChange}
          />
        </div>
        <button
          className="ml-2 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter size={20} />
        </button>
        <button
          className="ml-2 bg-primary text-white p-2 rounded-lg hover:bg-primary-dark"
          onClick={applyFilters}
        >
          Buscar
        </button>
      </div>

      {/* Filtros rápidos - tipos de quadra populares */}
      <div className="flex flex-wrap gap-2 mb-4">
        {courtTypes.slice(0, 6).map((type) => (
          <button
            key={type.value}
            className={`px-3 py-1 text-sm rounded-full ${
              filters.court_type === type.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => {
              setFilters((prev) => ({
                ...prev,
                court_type: prev.court_type === type.value ? undefined : type.value,
              }));
            }}
          >
            {type.label}
          </button>
        ))}
        <button
          className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Menos filtros' : 'Mais filtros'}
        </button>
      </div>

      {/* Filtros avançados */}
      {showAdvancedFilters && (
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro de localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <div className="flex items-center">
                <MapPin size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  name="city"
                  placeholder="Cidade"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.city || ''}
                  onChange={handleTextChange}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  name="neighborhood"
                  placeholder="Bairro"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.neighborhood || ''}
                  onChange={handleTextChange}
                />
                <select
                  name="state"
                  className="p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.state || ''}
                  onChange={handleSelectChange}
                >
                  <option value="">UF</option>
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
            </div>

            {/* Filtro de data e horário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Horário</label>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <input
                  type="date"
                  name="date"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.date || ''}
                  onChange={handleDateChange}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="time"
                  name="start_time"
                  placeholder="Início"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.start_time || ''}
                  onChange={handleTextChange}
                />
                <input
                  type="time"
                  name="end_time"
                  placeholder="Fim"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.end_time || ''}
                  onChange={handleTextChange}
                />
              </div>
            </div>

            {/* Filtro de preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço por hora</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-full">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    name="min_price"
                    placeholder="Min"
                    className="w-full pl-8 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    min="0"
                    value={filters.min_price || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative w-full">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    name="max_price"
                    placeholder="Max"
                    className="w-full pl-8 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    min="0"
                    value={filters.max_price || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                name="sort_by"
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                value={filters.sort_by || 'distance'}
                onChange={handleTextChange}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de quadra (todos os tipos) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de quadra</label>
              <select
                name="court_type"
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                value={filters.court_type || ''}
                onChange={handleTextChange}
              >
                <option value="">Todos os tipos</option>
                {courtTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Distância */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distância (km)</label>
              <input
                type="number"
                name="distance_km"
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                min="0"
                max="50"
                placeholder="Máximo de 50km"
                value={filters.distance_km || ''}
                onChange={handleNumberChange}
              />
              <p className="text-xs text-gray-500 mt-1">Necessita permitir localização</p>
            </div>
          </div>

          {/* Amenidades */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comodidades</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {popularAmenities.map((amenity) => (
                <div key={amenity.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity.value}`}
                    value={amenity.value}
                    checked={(filters.amenities || []).includes(amenity.value)}
                    onChange={handleAmenityChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`amenity-${amenity.value}`}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="mt-4 flex justify-end">
            <button
              className="text-gray-600 hover:text-gray-800 mr-4 flex items-center"
              onClick={clearFilters}
            >
              <X size={16} className="mr-1" />
              Limpar filtros
            </button>
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
              onClick={applyFilters}
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtFilters;
