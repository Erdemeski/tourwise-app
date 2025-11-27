import React, { useMemo } from 'react';
import { Alert } from 'flowbite-react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

/* const mapLibraries = ['places'];
 */
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
  const path = useMemo(() => stops.map((stop) => stop.position), [stops]);
  const center = stops.length ? stops[Math.floor(stops.length / 2)].position : defaultCenter;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    /*     libraries: mapLibraries,
     */
    id: 'itinerary-map-script',
  });

  if (!apiKey) {
    return (
      <Alert color='warning'>
        Add <span className='font-semibold'>GOOGLE_MAPS_API_KEY</span> to display the interactive map.
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

  return (
    <div className='rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700' style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height }}
        center={center}
        zoom={6}
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
        <Polyline
          path={path}
          options={{
            strokeColor: '#6366f1',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          }}
        />
        {stops.map((stop, index) => (
          <Marker
            key={stop.id || index}
            position={stop.position}
            label={{
              text: `${stop.dayNumber}`,
              color: '#fff',
              fontSize: '12px',
            }}
            title={stop.name}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default ItineraryMap;


