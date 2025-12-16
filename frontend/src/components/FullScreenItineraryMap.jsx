import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { Loader2, AlertCircle, Sparkles, Wand2, MapPin, Car, Bus, Footprints, Train } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Highlighter } from './ui/highlighter';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

const defaultCenter = { lat: 39.0, lng: 35.0 }; // Turkey center

// Durakları ayıkla
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
          id: stop?.id || stop?._id || `${day?.dayNumber ?? 0}-${idx}`,
          name: stop?.name ?? `Stop ${idx + 1}`,
          description: stop?.description,
          location: stop?.location,
          position: { lat, lng },
          dayNumber: day?.dayNumber ?? idx + 1,
          original: stop 
        };
      })
      .filter(Boolean);
  });
};

const mapContainerStyle = { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

const FullScreenItineraryMap = ({
  days = [],
  onStopClick = () => { },
  selectedStopId = null,
  isLoading = false,
  loadingMessage = "Generating Your Itinerary",
  loadingDescription = "Our AI is crafting the perfect trip for you...",
  className = '',
  onMapClick, 
  selectionMode = false 
}) => {
  const theme = useSelector((state) => state.theme.theme);
  const mapKey = `map-${theme}`;
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const stops = useMemo(() => extractStops(days), [days]);
  
  const [singleDirection, setSingleDirection] = useState(null);
  const [transitDirections, setTransitDirections] = useState([]);
  const [transitBadges, setTransitBadges] = useState([]); // Şık etiketler için state

  const [map, setMap] = useState(null);
  const [travelMode, setTravelMode] = useState('DRIVING'); 

  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    zoomControlOptions: { position: window.google?.maps?.ControlPosition?.RIGHT_CENTER },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    colorScheme: theme === 'dark' ? 'DARK' : 'LIGHT',
    draggableCursor: selectionMode ? 'crosshair' : 'grab',
    clickableIcons: false, 
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    ],
  }), [theme, selectionMode]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-maps-script',
  });

  // --- ROTA HESAPLAMA MOTORU ---
  useEffect(() => {
    if (!isLoaded || stops.length < 2 || !window.google) {
      setSingleDirection(null);
      setTransitDirections([]);
      setTransitBadges([]);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // 1. TOPLU TAŞIMA MODU (TRANSIT) - Detaylı ve Renkli
    if (travelMode === 'TRANSIT') {
        setSingleDirection(null);
        setTransitBadges([]); 
        
        const fetchTransitLegs = async () => {
            const promises = [];
            
            // Her durak arası için (Leg) istek at
            for (let i = 0; i < stops.length - 1; i++) {
                const request = {
                    origin: stops[i].position,
                    destination: stops[i + 1].position,
                    travelMode: window.google.maps.TravelMode.TRANSIT,
                    transitOptions: {
                        routingPreference: 'FEWER_TRANSFERS', // Daha az aktarma tercih et
                        modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM'] // Hepsini kapsa
                    },
                    provideRouteAlternatives: true // Alternatifleri iste (API desteklerse)
                };
                
                promises.push(new Promise((resolve) => {
                    directionsService.route(request, (result, status) => {
                        if (status === window.google.maps.DirectionsStatus.OK) {
                            // Alternatiflerden en kısa olanı (ilkini) alıyoruz şimdilik
                            // (Alternatifleri haritada aynı anda göstermek karmaşa yaratır)
                            resolve(result); 
                        } else {
                            resolve(null);
                        }
                    });
                }));
            }

            const results = await Promise.all(promises);
            const validResults = results.filter(res => res !== null);
            setTransitDirections(validResults);

            // --- GÖRSEL ETİKET OLUŞTURMA (BADGES) ---
            const badges = [];
            validResults.forEach(result => {
                const route = result.routes[0]; // En iyi rota
                const legs = route.legs;
                
                legs.forEach(leg => {
                    leg.steps.forEach(step => {
                        // Sadece Toplu Taşıma adımlarını yakala
                        if (step.travel_mode === 'TRANSIT' && step.transit) {
                            const line = step.transit.line;
                            
                            // Renk Seçimi: API rengi varsa kullan, yoksa araç tipine göre varsayılan ata
                            let badgeColor = line.color || '#4b5563'; // Varsayılan gri
                            if (!line.color) {
                                if (line.vehicle.type === 'BUS') badgeColor = '#f59e0b'; // Otobüs Turuncu
                                if (line.vehicle.type === 'SUBWAY') badgeColor = '#ef4444'; // Metro Kırmızı
                                if (line.vehicle.type === 'TRAM') badgeColor = '#10b981'; // Tramvay Yeşil
                            }

                            // İsim Seçimi: Short Name (14ES) -> Name (Kadıköy Metrosu)
                            const label = line.short_name || line.name || line.vehicle.name;

                            badges.push({
                                position: step.start_location, // Binilen yer
                                label: label,
                                color: badgeColor,
                                textColor: line.text_color || '#ffffff',
                                icon: line.vehicle.icon, // Google ikonu
                                headsign: step.transit.headsign, // Yön (Eminönü)
                                details: `${step.duration.text} • ${step.transit.num_stops} stops`
                            });
                        }
                    });
                });
            });
            setTransitBadges(badges);
        };

        fetchTransitLegs();
    } 
    // 2. ARABA / YÜRÜME MODU
    else {
        setTransitDirections([]);
        setTransitBadges([]);

        const origin = stops[0].position;
        const destination = stops[stops.length - 1].position;
        
        const waypoints = stops.slice(1, -1).map(stop => ({
            location: stop.position,
            stopover: true
        })).slice(0, 23);

        const request = {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode[travelMode],
        };

        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                setSingleDirection(result);
            }
        });
    }

  }, [isLoaded, stops, travelMode]);

  // --- HARİTA RENDER ---
  useEffect(() => {
    if (!map || !stops.length || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend(stop.position));
    setTimeout(() => {
      map.fitBounds(bounds, { top: 80, right: 50, bottom: 150, left: 50 });
    }, 100);
  }, [map, stops]);

  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleMapClick = useCallback((e) => {
    if (onMapClick && e.latLng) {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, [onMapClick]);

  const getMarkerIcon = useCallback((index, isSelected) => {
    if (!window.google) return undefined;
    const size = isSelected ? 48 : 40;
    const backgroundColor = isSelected ? '#8B5CF6' : '#3B82F6';
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${backgroundColor}" stroke="white" stroke-width="3"/>
          <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" fill="white" font-size="${size * 0.38}" font-weight="bold" font-family="system-ui, -apple-system, sans-serif">${index + 1}</text>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  }, []);

  useEffect(() => {
    if (map && window.google) map.setOptions(mapOptions);
  }, [map, mapOptions]);

  if (!apiKey) return <div className="flex items-center justify-center h-full">Map API Key Missing</div>;
  if (loadError) return <div className="flex items-center justify-center h-full">Map Error</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;

  const mapCenter = stops.length > 0 ? stops[Math.floor(stops.length / 2)].position : defaultCenter;

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      
      {/* MOD SEÇİCİ */}
      {!selectionMode && stops.length > 1 && (
        <div className="absolute top-4 left-4 z-40 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex gap-1">
            <Button size="sm" variant={travelMode === 'DRIVING' ? 'default' : 'ghost'} onClick={() => setTravelMode('DRIVING')} className="h-8 px-3" title="Driving"><Car className="h-4 w-4" /></Button>
            <Button size="sm" variant={travelMode === 'TRANSIT' ? 'default' : 'ghost'} onClick={() => setTravelMode('TRANSIT')} className="h-8 px-3" title="Public Transit"><Bus className="h-4 w-4" /></Button>
            <Button size="sm" variant={travelMode === 'WALKING' ? 'default' : 'ghost'} onClick={() => setTravelMode('WALKING')} className="h-8 px-3" title="Walking"><Footprints className="h-4 w-4" /></Button>
        </div>
      )}

      <GoogleMap
        key={mapKey}
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={stops.length > 0 ? 10 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {/* TOPLU TAŞIMA ROTALARI (ÇOKLU LEG) */}
        {!selectionMode && travelMode === 'TRANSIT' && (
            <>
                {transitDirections.map((dir, idx) => (
                    <DirectionsRenderer
                        key={`dir-${idx}`}
                        directions={dir}
                        options={{
                            suppressMarkers: true,
                            preserveViewport: true,
                            polylineOptions: { 
                                strokeColor: '#3b82f6', // Nötr mavi ana hat
                                strokeOpacity: 0.6, 
                                strokeWeight: 5 
                            }
                        }}
                    />
                ))}

                {/* --- ÖZEL TASARIM OTOBÜS ETİKETLERİ (BADGES) --- */}
                {transitBadges.map((badge, i) => (
                    <InfoWindow
                        key={`badge-${i}`}
                        position={badge.position}
                        options={{ 
                            disableAutoPan: true, 
                            pixelOffset: new window.google.maps.Size(0, -5),
                            headerContent: null // Varsayılan başlığı gizle (Google Maps v3.53+)
                        }}
                    >
                        {/* İçerik Tasarımı */}
                        <div className="flex flex-col items-center">
                            {/* Ana Etiket (Hat No ve İkon) */}
                            <div 
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-md mb-1 border border-white/20"
                                style={{ 
                                    backgroundColor: badge.color, 
                                    color: badge.textColor 
                                }}
                            >
                                {badge.icon && <img src={badge.icon} alt="" className="w-3.5 h-3.5 invert brightness-0 grayscale-0" />} 
                                <span className="font-bold text-sm tracking-wide">{badge.label}</span>
                            </div>
                            
                            {/* Alt Bilgi (Yön ve Süre) - Küçük puntolarla */}
                            <div className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                {badge.headsign && (
                                    <div className="text-[10px] text-gray-600 dark:text-gray-300 font-medium max-w-[120px] truncate text-center leading-tight">
                                        to {badge.headsign}
                                    </div>
                                )}
                                <div className="text-[9px] text-gray-400 text-center mt-0.5">
                                    {badge.details}
                                </div>
                            </div>
                        </div>
                    </InfoWindow>
                ))}
            </>
        )}

        {/* ARABA/YÜRÜME ROTASI */}
        {!selectionMode && travelMode !== 'TRANSIT' && singleDirection && (
            <DirectionsRenderer
                directions={singleDirection}
                options={{
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: travelMode === 'WALKING' ? '#10b981' : (theme === 'dark' ? '#f5bd4c' : '#6366f1'),
                        strokeOpacity: 0.8,
                        strokeWeight: 5,
                        icons: travelMode === 'WALKING' ? [{ 
                            icon: { path: window.google.maps.SymbolPath.CIRCLE, fillOpacity: 1, scale: 3 },
                            offset: '0',
                            repeat: '10px'
                        }] : []
                    },
                }}
            />
        )}

        {/* DURAK MARKERLARI */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={stop.position}
            icon={getMarkerIcon(index, selectedStopId === stop.id)}
            title={stop.name}
            zIndex={100} // Markerlar her zaman en üstte
            onClick={() => { if (!selectionMode) onStopClick(stop.original || stop); }}
          />
        ))}
      </GoogleMap>

      {/* Loading ve Empty State Overlay'leri (Aynen korundu) */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/50 backdrop-blur-sm">
             <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-violet-500 mb-2"/>
                <p className="font-semibold text-slate-800 dark:text-white">{loadingMessage}</p>
                <p className="text-sm text-slate-500">{loadingDescription}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stops.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/95 dark:bg-[rgb(22,26,29)]/95 rounded-2xl shadow-2xl backdrop-blur-sm max-w-sm mx-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-4"><MapPin className="h-12 w-12 text-blue-500" /></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Welcome to Your Itineraries</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400"><Highlighter action="underline" color="#FF9800">Select</Highlighter> an itinerary from the list or <Highlighter action="underline" color="#87CEFA">Generate</Highlighter> a new one.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenItineraryMap;