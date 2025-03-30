# app/services/maps.py
import logging
import httpx
from typing import Dict, Any, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

# O serviço de Mapas oferece funcionalidades geoespaciais importantes para o sistema, como:
# Geocodificação de endereços (conversão de endereço para coordenadas)
# Cálculo de distâncias entre pontos
# Busca de locais próximos (restaurantes, estacionamentos, etc.)
# Geração de URLs para mapas estáticos

async def geocode_address(address: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """
    Converter endereço em coordenadas geográficas.
    
    Args:
        address: Dicionário com dados do endereço (street, number, neighborhood, city, state, zipcode)
    
    Returns:
        Dict com latitude e longitude, ou None se não for possível geocodificar
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. Geocodificação não será realizada.")
        return None
    
    # Criar string de endereço
    address_str = f"{address.get('street')} {address.get('number')}, {address.get('neighborhood')}, {address.get('city')}, {address.get('state')}, {address.get('zipcode')}"
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": address_str,
            "key": settings.GOOGLE_MAPS_API_KEY,
            "region": "br"  # Ajustar para o Brasil
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if data["status"] == "OK" and data["results"]:
                location = data["results"][0]["geometry"]["location"]
                return {"latitude": location["lat"], "longitude": location["lng"]}
            else:
                logger.error(f"Erro ao geocodificar endereço: {data['status']}")
                # Em desenvolvimento, retornar coordenadas fictícias
                if settings.ENVIRONMENT == "development":
                    logger.info(f"Usando coordenadas fictícias para endereço: {address_str}")
                    return {"latitude": -23.550520, "longitude": -46.633308}  # São Paulo
                return None
    
    except Exception as e:
        logger.error(f"Erro ao geocodificar endereço: {e}")
        return None

async def calculate_distance(
    origin: Tuple[float, float], 
    destination: Tuple[float, float],
    mode: str = "driving"
) -> Optional[float]:
    """
    Calcular distância entre dois pontos geográficos.
    
    Args:
        origin: Tuple (latitude, longitude) da origem
        destination: Tuple (latitude, longitude) do destino
        mode: Modo de transporte (driving, walking, bicycling, transit)
    
    Returns:
        Distância em quilômetros ou None se não for possível calcular
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. Cálculo de distância não será realizado.")
        return None
    
    try:
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": f"{origin[0]},{origin[1]}",
            "destinations": f"{destination[0]},{destination[1]}",
            "mode": mode,
            "key": settings.GOOGLE_MAPS_API_KEY,
            "language": "pt-BR"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if (data["status"] == "OK" and 
                data["rows"] and 
                data["rows"][0]["elements"] and 
                data["rows"][0]["elements"][0]["status"] == "OK"):
                
                # Distância em metros, converter para km
                distance = data["rows"][0]["elements"][0]["distance"]["value"] / 1000
                return distance
            else:
                logger.error(f"Erro ao calcular distância: {data['status']}")
                return None
    
    except Exception as e:
        logger.error(f"Erro ao calcular distância: {e}")
        return None

async def get_nearby_places(
    latitude: float,
    longitude: float,
    radius: int = 1000,  # metros
    place_type: str = "restaurant",
    keyword: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Buscar locais próximos a um ponto geográfico.
    
    Args:
        latitude: Latitude do ponto central
        longitude: Longitude do ponto central
        radius: Raio de busca em metros (máximo 50000)
        place_type: Tipo do local (restaurant, cafe, bar, etc)
        keyword: Palavra-chave para filtrar resultados
        
    Returns:
        Lista de lugares próximos
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. Busca de locais próximos não será realizada.")
        return []
    
    try:
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius,
            "type": place_type,
            "key": settings.GOOGLE_MAPS_API_KEY,
            "language": "pt-BR"
        }
        
        if keyword:
            params["keyword"] = keyword
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if data["status"] == "OK":
                # Simplificar dados para retorno
                places = []
                for result in data["results"]:
                    place = {
                        "name": result.get("name"),
                        "address": result.get("vicinity"),
                        "location": {
                            "latitude": result["geometry"]["location"]["lat"],
                            "longitude": result["geometry"]["location"]["lng"]
                        },
                        "rating": result.get("rating"),
                        "place_id": result.get("place_id"),
                        "types": result.get("types", [])
                    }
                    places.append(place)
                return places
            else:
                logger.error(f"Erro ao buscar locais próximos: {data['status']}")
                return []
    
    except Exception as e:
        logger.error(f"Erro ao buscar locais próximos: {e}")
        return []

async def get_static_map_url(
    latitude: float,
    longitude: float,
    zoom: int = 15,
    size: str = "600x300",
    markers: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Obter URL para um mapa estático.
    
    Args:
        latitude: Latitude do centro do mapa
        longitude: Longitude do centro do mapa
        zoom: Nível de zoom (1 a 20)
        size: Tamanho da imagem (larguraxaltura)
        markers: Lista de marcadores no formato [{"lat": float, "lng": float, "label": str}]
        
    Returns:
        URL para o mapa estático
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. URL de mapa estático não será gerada.")
        return ""
    
    base_url = "https://maps.googleapis.com/maps/api/staticmap"
    params = {
        "center": f"{latitude},{longitude}",
        "zoom": zoom,
        "size": size,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "language": "pt-BR"
    }
    
    # Adicionar marcadores
    marker_strings = []
    if markers:
        for marker in markers:
            marker_str = ""
            if "label" in marker:
                marker_str += f"label:{marker['label']}|"
            marker_str += f"{marker['lat']},{marker['lng']}"
            marker_strings.append(f"markers={marker_str}")
    else:
        # Adicionar marcador central se não houver outros
        marker_strings.append(f"markers={latitude},{longitude}")
    
    # Construir URL
    url_parts = [base_url]
    query_params = []
    
    for key, value in params.items():
        query_params.append(f"{key}={value}")
    
    for marker in marker_strings:
        query_params.append(marker)
    
    url = f"{base_url}?{'&'.join(query_params)}"
    return url