import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { Loader2, AlertCircle, MapPin, Car, Bus, Footprints } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Highlighter } from './ui/highlighter';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

const defaultCenter = { lat: 39.0, lng: 35.0 }; // Turkey center

// Durak verisini temizle
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
          position: { lat, lng },
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
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const stops = useMemo(() => extractStops(days), [days]);
  
  const [singleDirection, setSingleDirection] = useState(null);
  const [transitDirections, setTransitDirections] = useState([]); // Parçalı rotalar
  const [transitBadges, setTransitBadges] = useState([]); // Sadece Hat İsimleri

  const [map, setMap] = useState(null);
  const [travelMode, setTravelMode] = useState('DRIVING'); // Varsayılan DRIVING (En ucuz)

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
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ],
  }), [theme, selectionMode]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-maps-script',
  });

  // --- ROTA HESAPLAMA ---
  useEffect(() => {
    if (!isLoaded || stops.length < 2 || !window.google) {
      setSingleDirection(null);
      setTransitDirections([]);
      setTransitBadges([]);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // 1. TOPLU TAŞIMA (Sadece kullanıcı butona basınca çalışır)
    if (travelMode === 'TRANSIT') {
        setSingleDirection(null); // Araba rotasını temizle
        setTransitBadges([]); 
        
        const fetchTransitLegs = async () => {
            const promises = [];
            
            // Her durak arası için (A->B, B->C) istek at
            // Bu mecburi çünkü Google Transit'te "waypoints" yok.
            for (let i = 0; i < stops.length - 1; i++) {
                const request = {
                    origin: stops[i].position,
                    destination: stops[i + 1].position,
                    travelMode: window.google.maps.TravelMode.TRANSIT,
                    // Saat/Tarih vermiyoruz, "Şu an"ı baz alır.
                };
                
                promises.push(new Promise((resolve) => {
                    directionsService.route(request, (result, status) => {
                        if (status === window.google.maps.DirectionsStatus.OK) {
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

            // --- BEDAVA İŞLEM: Rota sonucundan Hat İsimlerini Çekme ---
            const badges = [];
            validResults.forEach(result => {
                const route = result.routes[0]; 
                const leg = route.legs[0];
                
                leg.steps.forEach(step => {
                    // Sadece önemli toplu taşıma adımlarını al (Yürümeyi alma)
                    if (step.travel_mode === 'TRANSIT' && step.transit) {
                        const line = step.transit.line;
                        
                        // İsim: Varsa kısa isim (M4), yoksa uzun isim (Kadıköy Metrosu)
                        const label = line.short_name || line.name || "Transit";
                        
                        // Renk: Google'dan geliyorsa al, yoksa Turuncu yap
                        const color = line.color || '#f59e0b';
                        const textColor = line.text_color || '#ffffff';

                        badges.push({
                            position: step.start_location, // Binilen durak
                            label: label,
                            color: color,
                            textColor: textColor,
                            // icon: line.vehicle.icon // İkonu kaldırdım, sade istedin
                        });
                    }
                });
            });
            setTransitBadges(badges);
        };

        fetchTransitLegs();
    } 
    // 2. ARABA / YÜRÜME (Tek İstek - En Ucuzu)
    else {
        setTransitDirections([]);
        setTransitBadges([]);

        const request = {
            origin: stops[0].position,
            destination: stops[stops.length - 1].position,
            // Aradaki durakları ekle
            waypoints: stops.slice(1, -1).map(stop => ({
                location: stop.position,
                stopover: true
            })).slice(0, 23),
            travelMode: window.google.maps.TravelMode[travelMode],
        };

        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                setSingleDirection(result);
            }
        });
    }

  }, [isLoaded, stops, travelMode]); // Sadece duraklar veya mod değişirse çalışır

  // Harita Ortalama
  useEffect(() => {
    if (!map || !stops.length || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend(stop.position));
    setTimeout(() => {
      map.fitBounds(bounds, { top: 80, right: 50, bottom: 150, left: 50 });
    }, 100);
  }, [map, stops.length]);

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
      
      {/* --- MOD SEÇİCİ (ORTALANMIŞ) --- */}
      {!selectionMode && stops.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex gap-1">
            <Button size="sm" variant={travelMode === 'DRIVING' ? 'default' : 'ghost'} onClick={() => setTravelMode('DRIVING')} className="h-8 px-3" title="Driving"><Car className="h-4 w-4" /></Button>
            <Button size="sm" variant={travelMode === 'TRANSIT' ? 'default' : 'ghost'} onClick={() => setTravelMode('TRANSIT')} className="h-8 px-3" title="Public Transit"><Bus className="h-4 w-4" /></Button>
            <Button size="sm" variant={travelMode === 'WALKING' ? 'default' : 'ghost'} onClick={() => setTravelMode('WALKING')} className="h-8 px-3" title="Walking"><Footprints className="h-4 w-4" /></Button>
        </div>
      )}

      <GoogleMap
        key={`map-${theme}`}
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={stops.length > 0 ? 10 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {/* TOPLU TAŞIMA ROTALARI */}
        {!selectionMode && travelMode === 'TRANSIT' && (
            <>
                {transitDirections.map((dir, idx) => (
                    <DirectionsRenderer
                        key={`dir-${idx}`}
                        directions={dir}
                        options={{
                            suppressMarkers: true,
                            preserveViewport: true,
                            polylineOptions: { strokeColor: '#3b82f6', strokeOpacity: 0.5, strokeWeight: 5 }
                        }}
                    />
                ))}

                {/* --- SADELEŞTİRİLMİŞ OTOBÜS ETİKETLERİ --- */}
                {transitBadges.map((badge, i) => (
                    <InfoWindow
                        key={`badge-${i}`}
                        position={badge.position}
                        options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -5), headerContent: null }}
                    >
                        {/* SADECE HAT İSMİ VE RENGİ */}
                        <div 
                            className="font-bold text-sm px-2 py-1 rounded shadow-sm text-white"
                            style={{ backgroundColor: badge.color, color: badge.textColor }}
                        >
                            {badge.label}
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

        {/* DURAKLAR */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={stop.position}
            icon={getMarkerIcon(index, selectedStopId === stop.id)}
            title={stop.name}
            zIndex={100}
            onClick={() => { if (!selectionMode) onStopClick(stop.original || stop); }}
          />
        ))}
      </GoogleMap>

      {/* YÜKLENİYOR... */}
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

      {/* BOŞ STATE */}
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