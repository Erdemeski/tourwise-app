import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';

const defaultCenter = { lat: 39.0, lng: 35.0 }; // Turkey center

const extractStops = (days = []) => {
  if (!Array.isArray(days)) return [];
  return days.flatMap((day) => {
    const stops = Array.isArray(day?.stops) ? day.stops : [];
    return stops
      .map((stop, idx) => {
        const lat = stop?.location?.geo?.lat ?? stop?.latitude ?? null;
        const lng = stop?.location?.geo?.lng ?? stop?.longitude ?? null;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return null;
        }
        return {
          id: stop?.id || stop?._id || `${day?.dayNumber ?? 0}-${idx}`,
          name: stop?.name ?? `Stop ${idx + 1}`,
          description: stop?.description,
          location: stop?.location,
          position: { lat, lng },
          dayNumber: day?.dayNumber ?? idx + 1,
        };
      })
      .filter(Boolean);
  });
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const FullScreenItineraryMap = ({ 
  days = [], 
  onStopClick = () => {},
  selectedStopId = null,
  className = ''
}) => {
  const apiKey =
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env?.GOOGLE_MAPS_API_KEY ||
    '';

  const stops = useMemo(() => extractStops(days), [days]);
  const [directions, setDirections] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'fullscreen-itinerary-map-script',
  });

  // Calculate directions when stops change
  useEffect(() => {
    if (!isLoaded || stops.length < 2 || !window.google) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = stops[0].position;
    const destination = stops[stops.length - 1].position;
    
    const waypoints = stops.slice(1, -1).map(stop => ({
      location: stop.position,
      stopover: true
    })).slice(0, 23);

    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirections(result);
      } else {
        console.error(`Directions request failed: ${status}`);
      }
    });
  }, [isLoaded, stops]);

  // Fit bounds when stops change
  useEffect(() => {
    if (!map || !stops.length || !window.google) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend(stop.position));
    
    // Add some padding
    setTimeout(() => {
      map.fitBounds(bounds, { 
        top: 80, 
        right: 50, 
        bottom: 150, 
        left: 50 
      });
    }, 100);
  }, [map, stops]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Custom marker icon using SVG
  const getMarkerIcon = useCallback((index, isSelected) => {
    if (!window.google) return undefined;
    
    const size = isSelected ? 48 : 40;
    const backgroundColor = isSelected ? '#8B5CF6' : '#3B82F6';
    
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${backgroundColor}" stroke="white" stroke-width="3"/>
          <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="white" font-size="${size * 0.38}" font-weight="bold" font-family="system-ui, -apple-system, sans-serif">${index + 1}</text>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size/2),
    };
  }, []);

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 ${className}`}>
        <div className="text-center p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl backdrop-blur-sm max-w-sm mx-4">
          <AlertCircle className="h-14 w-14 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Map API Key Required
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Add <code className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 ${className}`}>
        <div className="text-center p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl backdrop-blur-sm max-w-sm mx-4">
          <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Failed to Load Map
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please check your API key and internet connection
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  const mapCenter = stops.length > 0 
    ? stops[Math.floor(stops.length / 2)].position 
    : defaultCenter;

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={stops.length > 0 ? 10 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#6366f1',
                strokeOpacity: 0.9,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={stop.position}
            icon={getMarkerIcon(index, selectedStopId === stop.id)}
            title={stop.name}
            onClick={() => onStopClick(stop)}
          />
        ))}
      </GoogleMap>

      {/* Empty state overlay - only when no itinerary selected */}
      {stops.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-2xl backdrop-blur-sm max-w-sm mx-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-4">
              <MapPin className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Welcome to Your Itineraries
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select an itinerary from the list or generate a new one to see it on the map
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenItineraryMap;
