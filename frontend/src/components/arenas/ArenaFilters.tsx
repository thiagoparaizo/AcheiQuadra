// src/components/arenas/ArenaFilters.tsx
import React, { useState } from 'react';
import { Search, X, Filter, MapPin, Star } from 'lucide-react';
import { ArenaSearchParams } from '../../services/api';

interface ArenaFiltersProps {
  onFilterChange: (filters: ArenaSearchParams) => void;
  initialFilters?: ArenaSearchParams;
}

const ArenaFilters: React.FC<ArenaFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<ArenaSearchParams>(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Tipos de quadras disponíveis para filtrar arenas
  const courtTypes = [
    { value: 'soccer', label: 'Futebol Campo' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'society', label: 'Society' },
    { value: 'tennis', label: 'Tênis' },
    { value: 'beach_tennis', label: 'Beach Tennis' },
    { value: 'paddle', label: 'Padel' },
    { value: 'basketball', label: 'Basquete' },
    { value: 'volleyball', label: 'Vôlei' },
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
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'air_conditioning', label: 'Ar Condicionado' },
    { value: 'equipment_rental', label: 'Aluguel de Equipamentos' },
    { value: 'security_cameras', label: 'Câmeras de Segurança' },
    { value: 'instructor', label: 'Professor/Instrutor' },
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
    setFilters((prev) => ({
      ...prev,
      [name]: value ? (name === 'min_rating' ? parseFloat(value) : value) : undefined,
    }));
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

  // Handler para mudança em tipo de quadra
  const handleCourtTypeChange = (selectedType: string) => {
    setFilters((prev) => ({
      ...prev,
      court_type: prev.court_type === selectedType ? undefined : selectedType,
    }));
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
            name="name"
            placeholder="Buscar arenas..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.name || ''}
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

      {/* Filtros rápidos - tipos de quadra */}
      <div className="flex flex-wrap gap-2 mb-4">
        {courtTypes.map((type) => (
          <button
            key={type.value}
            className={`px-3 py-1 text-sm rounded-full ${
              filters.court_type === type.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleCourtTypeChange(type.value)}
          >
            {type.label}
          </button>
        ))}
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
                  onChange={handleTextChange}
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

            {/* Avaliação mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avaliação mínima
              </label>
              <div className="flex items-center">
                <Star size={16} className="text-yellow-400 mr-2" />
                <select
                  name="min_rating"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.min_rating || ''}
                  onChange={handleSelectChange}
                >
                  <option value="">Qualquer</option>
                  <option value="3">3+ estrelas</option>
                  <option value="3.5">3.5+ estrelas</option>
                  <option value="4">4+ estrelas</option>
                  <option value="4.5">4.5+ estrelas</option>
                </select>
              </div>
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

export default ArenaFilters;
