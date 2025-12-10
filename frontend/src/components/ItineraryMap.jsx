import React, { useMemo, useState, useEffect } from 'react';
import { Alert } from 'flowbite-react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '360px',
};

const defaultCenter = { lat: 39.9255, lng: 32.8663 }; // Ankara fallback

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
          id: stop?.id || `${day?.dayNumber ?? 0}-${idx}`,
          name: stop?.name ?? `Stop ${idx + 1}`,
          position: { lat, lng },
          dayNumber: day?.dayNumber ?? idx + 1,
        };
      })
      .filter(Boolean);
  });
};

const ItineraryMap = ({ days = [], height = 360 }) => {
  const apiKey =
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env?.GOOGLE_MAPS_API_KEY ||
    '';

  const stops = useMemo(() => extractStops(days), [days]);
  const [directions, setDirections] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-maps-script',
  });

  useEffect(() => {
    if (!isLoaded || stops.length < 2 || !window.google) {
        setDirections(null);
        return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Google Maps JS API Directions servisi en fazla 25 waypoint destekler (ücretsiz planda kısıtlı olabilir).
    // İlk ve son durak harici en fazla 23 waypoint alabiliriz.
    const origin = stops[0].position;
    const destination = stops[stops.length - 1].position;
    
    // Aradaki duraklar (Waypoints)
    const waypoints = stops.slice(1, -1).map(stop => ({
        location: stop.position,
        stopover: true
    })).slice(0, 23); // Limit güvenliği

    directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING, // Veya WALKING, TRANSIT
    }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
        } else {
            console.error(`Directions request failed: ${status}`);
        }
    });

  }, [isLoaded, stops]);

  if (!apiKey) {
    return (
      <Alert color='warning'>
        Add <span className='font-semibold'>VITE_GOOGLE_MAPS_API_KEY</span> to your .env file to display the interactive map.
      </Alert>
    );
  }

  if (loadError) {
    return <Alert color='failure'>Google Maps failed to load. Please check your API key.</Alert>;
  }

  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl h-[360px]'>
        <p className='text-sm text-gray-500 dark:text-gray-300'>Loading map…</p>
      </div>
    );
  }

  if (!stops.length) {
    return (
      <Alert color='info'>
        Generated itinerary does not include coordinates yet. Try regenerating with more specific locations or edit stops manually.
      </Alert>
    );
  }

  // Harita merkezini duraklara göre ayarla (veya directions varsa o otomatik ayarlar)
  const mapCenter = stops.length ? stops[Math.floor(stops.length / 2)].position : defaultCenter;

  return (
    <div className='rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700' style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height }}
        center={mapCenter}
        zoom={stops.length > 1 ? 10 : 12}
        options={{
          disableDefaultUI: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {directions ? (
            <DirectionsRenderer 
                directions={directions} 
                options={{
                    suppressMarkers: true, // Kendi özel markerlarımızı kullanmak için
                    polylineOptions: {
                        strokeColor: '#6366f1',
                        strokeOpacity: 0.8,
                        strokeWeight: 5
                    }
                }}
            />
        ) : null}

        {stops.map((stop, index) => (
          <Marker
            key={stop.id || index}
            position={stop.position}
            label={{
              text: `${index + 1}`,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            title={stop.name}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default ItineraryMap;
