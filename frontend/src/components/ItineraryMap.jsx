import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Alert } from 'flowbite-react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%', // Dışarıdan yönetilsin
};

const defaultCenter = { lat: 39.9255, lng: 32.8663 }; 

const extractStops = (days = []) => {
    if (!Array.isArray(days)) return [];
    return days.flatMap((day) => {
        const stops = Array.isArray(day?.stops) ? day.stops : [];
        return stops
            .map((stop, idx) => {
                const lat = stop?.location?.geo?.lat ?? stop?.latitude ?? null;
                const lng = stop?.location?.geo?.lng ?? stop?.longitude ?? null;
                if (typeof lat !== 'number' || typeof lng !== 'number') return null;
                return {
                    id: stop?.id || stop?._id || `${day?.dayNumber}-${idx}`,
                    name: stop?.name ?? `Stop ${idx + 1}`,
                    position: { lat, lng },
                    dayNumber: day?.dayNumber ?? idx + 1,
                    original: stop // Tüm veriyi sakla
                };
            })
            .filter(Boolean);
    });
};

const ItineraryMap = ({ days = [], height = '100%', onStopClick, onMapClick, selectionMode = false }) => {
    const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

    // useMemo ile stops hesaplaması doğru, kalmalı.
    const stops = useMemo(() => extractStops(days), [days]);
    const [directions, setDirections] = useState(null);
    
    // ÖNEMLİ: Son istek yapılan değerleri sakla - sonsuz döngüyü önler
    const lastRequestRef = useRef('');

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        id: 'google-map-script',
        libraries: ['places']
    });

    // Stops için stabil bir key oluştur (içerik bazlı, referans bazlı değil)
    const stopsKey = useMemo(() => {
        if (stops.length === 0) return '';
        return stops.map(s => `${s.position.lat.toFixed(6)},${s.position.lng.toFixed(6)}`).join('|');
    }, [stops]);

    // Harita Rotasını Çizen Effect
    useEffect(() => {
        if (!isLoaded || !window.google || stops.length < 2) {
            // Eğer durak sayısı 2'den azsa rotayı temizle (tek marker kalsın)
            if (stops.length < 2) setDirections(null);
            return;
        }

        // ÖNEMLİ: Aynı istek daha önce yapıldıysa tekrar yapma - SONSUZ DÖNGÜYÜ ÖNLER
        if (lastRequestRef.current === stopsKey) {
            console.log('[ItineraryMap] Skipping duplicate API request');
            return;
        }
        
        // Yeni istek yapılacak, referansı güncelle
        lastRequestRef.current = stopsKey;
        console.log('[ItineraryMap] Making Directions API request:', { stopsCount: stops.length });

        const directionsService = new window.google.maps.DirectionsService();
        
        // Waypoints limitini aşmamak için slice (Google limiti 25, biz 23 alalım güvenlik için)
        const waypoints = stops.slice(1, -1).map(stop => ({
            location: stop.position,
            stopover: true
        })).slice(0, 23);

        directionsService.route({
            origin: stops[0].position,
            destination: stops[stops.length - 1].position,
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                setDirections(result);
            } else {
                console.error(`Directions request failed due to ${status}`);
            }
        });
    }, [isLoaded, stopsKey, stops]); // stopsKey ile içerik bazlı kontrol

    const handleMapClick = (e) => {
        // Sadece selectionMode açıksa tıklamayı kabul et
        if (selectionMode && onMapClick && e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onMapClick({ lat, lng });
        }
    };

    if (loadError) return <Alert color='failure'>Map Error: {loadError.message}</Alert>;
    if (!isLoaded) return <div className='h-full flex items-center justify-center bg-gray-100 animate-pulse'>Loading Map...</div>;

    // Harita merkezini belirle: Varsa durakların ortası, yoksa varsayılan
    const mapCenter = stops.length > 0 ? stops[Math.floor(stops.length / 2)].position : defaultCenter;

    return (
        <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden relative shadow-md">
            <GoogleMap
                mapContainerStyle={{ ...containerStyle, height }}
                center={mapCenter}
                zoom={stops.length > 0 ? 10 : 6} // Durak yoksa daha geniş açı
                onClick={handleMapClick}
                options={{
                    disableDefaultUI: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    // Selection Mode aktifse 'crosshair', değilse normal el işareti
                    draggableCursor: selectionMode ? 'crosshair' : '', 
                    clickableIcons: false // POI tıklamalarını kapat, karışıklığı önler
                }}
            >
                {/* Rota Çizgisi */}
                {directions && !selectionMode && (
                    <DirectionsRenderer 
                        directions={directions} 
                        options={{
                            suppressMarkers: true, // Varsayılan markerları gizle, biz kendimiz ekliyoruz
                            polylineOptions: { strokeColor: '#8b5cf6', strokeOpacity: 0.8, strokeWeight: 6 }
                        }}
                    />
                )}

                {/* Özel Markerlar */}
                {stops.map((stop, index) => (
                    <Marker
                        key={stop.id} // Unique ID
                        position={stop.position}
                        label={{
                            text: `${index + 1}`,
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            className: 'map-marker-label'
                        }}
                        onClick={() => onStopClick && onStopClick(stop.original)}
                        animation={window.google.maps.Animation.DROP} // Markerlar düşerek gelsin
                    />
                ))}
            </GoogleMap>
            
            {/* Görsel İyileştirme: Seçim Modu Göstergesi */}
            {selectionMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600/90 backdrop-blur-sm text-white px-6 py-2 rounded-full shadow-xl text-sm font-semibold z-10 animate-pulse border border-indigo-400">
                    📍 Click specifically on the map to add location
                </div>
            )}
        </div>
    );
};
export default ItineraryMap;