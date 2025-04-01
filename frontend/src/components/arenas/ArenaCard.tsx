// src/components/arenas/ArenaCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Layers } from 'lucide-react';
import { Arena } from '../../services/api';

interface ArenaCardProps {
  arena: Arena;
}

const ArenaCard: React.FC<ArenaCardProps> = ({ arena }) => {
  // Função para renderizar os ícones de amenidades
  const renderAmenities = (amenities: string[]) => {
    // Mapeamento de amenidades para ícones ou nomes curtos
    const amenityIcons: Record<string, string> = {
      parking: '🅿️',
      wifi: '📶',
      shower: '🚿',
      locker_room: '🔑',
      bar: '🍹',
      restaurant: '🍽️',
      equipment_rental: '⚽',
      air_conditioning: '❄️',
      lighting: '💡',
      covered: '☂️',
      instructor: '👨‍🏫',
      pet_friendly: '🐶',
      security_cameras: '📹',
      accessible: '♿',
    };

    // Exibir no máximo 4 amenidades
    return amenities.slice(0, 4).map((amenity) => (
      <div key={amenity} className="mr-2 text-sm" title={amenity}>
        {amenityIcons[amenity] || amenity}
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/arenas/${arena._id}`}>
        <div className="relative">
          {/* Imagem principal ou logo */}
          <img
            src={arena.photos[0] || arena.logo_url || '/placeholder-arena.jpg'}
            alt={arena.name}
            className="w-full h-48 object-cover"
          />
          {/* Badge com rating */}
          {arena.rating > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded flex items-center">
              <Star size={12} className="mr-1" />
              {arena.rating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold mb-1 truncate">{arena.name}</h3>

          {/* Localização */}
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate">
              {arena.address.neighborhood}, {arena.address.city}, {arena.address.state}
            </span>
          </div>

          {/* Número de quadras */}
          {arena.courts_count !== undefined && (
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <Layers size={14} className="mr-1 flex-shrink-0" />
              <span>
                {arena.courts_count} {arena.courts_count === 1 ? 'quadra' : 'quadras'}
              </span>
            </div>
          )}

          {/* Descrição curta */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{arena.description}</p>

          {/* Amenidades */}
          {arena.amenities && arena.amenities.length > 0 && (
            <div className="flex flex-wrap mt-2">
              {renderAmenities(arena.amenities)}
              {arena.amenities.length > 4 && (
                <div className="text-sm text-gray-500">+{arena.amenities.length - 4}</div>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ArenaCard;
