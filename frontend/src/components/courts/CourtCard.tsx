// src/components/courts/CourtCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import { Court } from '../../services/api';

interface CourtCardProps {
  court: Court;
}

const CourtCard: React.FC<CourtCardProps> = ({ court }) => {
  // Tipos de quadra traduzidos
  const courtTypes = {
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/courts/${court.id}`}>
        <div className="relative">
          {/* Imagem principal */}
          <img
            src={court.photos[0] || '/placeholder-court.jpg'}
            alt={court.name}
            className="w-full h-48 object-cover"
          />
          {/* Badge com tipo de quadra */}
          <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded">
            {courtTypes[court.type as keyof typeof courtTypes] || 'Outros'}
          </div>
          {/* Desconto, se houver */}
          {court.discounted_price && court.discounted_price < court.price_per_hour && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
              {Math.round((1 - court.discounted_price / court.price_per_hour) * 100)}% OFF
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold mb-1 truncate">{court.name}</h3>

          {/* Arena e localização */}
          {court.arena && (
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">
                {court.arena.name} - {court.arena.address.city}, {court.arena.address.state}
              </span>
            </div>
          )}

          {/* Avaliação */}
          {court.arena && court.arena.rating > 0 && (
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <Star size={14} className="mr-1 text-yellow-500 flex-shrink-0" />
              <span>{court.arena.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Duração mínima */}
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <Clock size={14} className="mr-1 flex-shrink-0" />
            <span>Mínimo: {court.minimum_booking_hours}h</span>
          </div>

          {/* Preço */}
          <div className="flex justify-between items-end mt-2">
            <div>
              {court.discounted_price ? (
                <div>
                  <span className="text-gray-500 line-through text-sm">
                    R$ {court.price_per_hour.toFixed(2)}
                  </span>
                  <div className="text-primary font-bold">
                    R$ {court.discounted_price.toFixed(2)}/hora
                  </div>
                </div>
              ) : (
                <div className="text-primary font-bold">
                  R$ {court.price_per_hour.toFixed(2)}/hora
                </div>
              )}
            </div>

            {/* Distância, se disponível */}
            {court.distance && (
              <div className="text-sm text-gray-500">
                {court.distance < 1
                  ? `${(court.distance * 1000).toFixed(0)}m`
                  : `${court.distance.toFixed(1)}km`}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CourtCard;
