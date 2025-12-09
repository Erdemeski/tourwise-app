import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

// Open-Meteo API - no API key required
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';

const cityFromRoute = (route = {}) => route.startLocation || route.endLocation || route.city || '';

const sanitizeCity = (raw = '') => {
    if (!raw) return '';
    const firstPart = raw.split(',')[0] || raw;
    const cleaned = firstPart.replace(/[0-9]/g, '').split(/[-/]/)[0] || firstPart;
    return cleaned.trim();
};

const extractCoords = (route = {}) => {
    // Prefer first waypoint coordinates if available
    if (Array.isArray(route.waypointList)) {
        const wp = route.waypointList.find(
            (w) => typeof w?.latitude === 'number' && typeof w?.longitude === 'number'
        );
        if (wp) return { lat: wp.latitude, lon: wp.longitude };
    }

    const candidates = [
        route.startCoordinates,
        route.endCoordinates,
        route.coordinates,
        route.location,
        route.startLocationCoords,
        route.endLocationCoords,
    ];
    for (const c of candidates) {
        if (c && typeof c === 'object') {
            const lat = c.lat ?? c.latitude ?? c[0];
            const lon = c.lon ?? c.lng ?? c.longitude ?? c[1];
            if (typeof lat === 'number' && typeof lon === 'number') return { lat, lon };
        }
    }
    return null;
};

const ensureCelsius = (temp) => {
    if (temp === null || temp === undefined || Number.isNaN(temp)) return null;
    const value = Number(temp);
    if (value > 200) return Math.round(value - 273.15); // Kelvin -> C
    if (value > 60) return Math.round(((value - 32) * 5) / 9); // Fahrenheit -> C
    return Math.round(value); // Already Celsius
};

// Convert Open-Meteo weather code to OpenWeather icon
const weatherCodeToIcon = (code, isDay = true) => {
    if (code === null || code === undefined) return '01d';
    const suffix = isDay ? 'd' : 'n';
    
    // WMO Weather interpretation codes mapping to OpenWeather icons
    if (code === 0) return `01${suffix}`; // Clear sky
    if (code >= 1 && code <= 3) return `${String(code + 1).padStart(2, '0')}${suffix}`; // Mainly clear (02), partly cloudy (03), overcast (04)
    if (code === 45 || code === 48) return `50${suffix}`; // Fog
    if (code >= 51 && code <= 55) return `09${suffix}`; // Drizzle
    if (code === 56 || code === 57) return `13${suffix}`; // Freezing drizzle
    if (code >= 61 && code <= 65) return `10${suffix}`; // Rain
    if (code === 66 || code === 67) return `13${suffix}`; // Freezing rain
    if (code >= 71 && code <= 75) return `13${suffix}`; // Snow fall
    if (code === 77) return `13${suffix}`; // Snow grains
    if (code >= 80 && code <= 82) return `09${suffix}`; // Rain showers
    if (code === 85 || code === 86) return `13${suffix}`; // Snow showers
    if (code === 95 || code === 96 || code === 99) return `11${suffix}`; // Thunderstorm
    
    return `01${suffix}`; // Default to clear sky
};

// Get weather description from code
const weatherCodeToDescription = (code) => {
    if (code === null || code === undefined) return 'Durum bilinmiyor';
    
    const descriptions = {
        0: 'Açık gökyüzü',
        1: 'Çoğunlukla açık',
        2: 'Kısmen bulutlu',
        3: 'Kapalı',
        45: 'Sis',
        48: 'Donlu sis',
        51: 'Hafif çisenti',
        53: 'Orta çisenti',
        55: 'Yoğun çisenti',
        56: 'Hafif donlu çisenti',
        57: 'Yoğun donlu çisenti',
        61: 'Hafif yağmur',
        63: 'Orta yağmur',
        65: 'Yoğun yağmur',
        66: 'Hafif donlu yağmur',
        67: 'Yoğun donlu yağmur',
        71: 'Hafif kar',
        73: 'Orta kar',
        75: 'Yoğun kar',
        77: 'Kar taneleri',
        80: 'Hafif sağanak',
        81: 'Orta sağanak',
        82: 'Şiddetli sağanak',
        85: 'Hafif kar sağanağı',
        86: 'Yoğun kar sağanağı',
        95: 'Fırtına',
        96: 'Dolu ile fırtına',
        99: 'Şiddetli dolu ile fırtına',
    };
    
    return descriptions[code] || 'Durum bilinmiyor';
};

const formatCityCountry = (geocodingData, fallbackCity) => {
    if (geocodingData?.results?.[0]) {
        const result = geocodingData.results[0];
        const city = result.name || fallbackCity || '';
        const country = result.country || '';
        return country ? `${city}, ${country}` : city;
    }
    return fallbackCity || '';
};

const buildAvatarFallback = (name = '') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Gezgin')}&background=0ea5e9&color=fff&size=96&font-size=0.38`;

export default function ExploreSidebar({ highlightRoutes = [], suggestedCreators = [], routes = [] }) {
    const { currentUser } = useSelector((state) => state.user);
    const [followingStates, setFollowingStates] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [weatherItems, setWeatherItems] = useState([]);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState(null);
    const lastSelectionRef = React.useRef('');

    // Fetch current user's following list to determine initial states
    useEffect(() => {
        if (currentUser?._id) {
            fetch(`/api/user/relations/${currentUser._id}`, { credentials: 'include' })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.following) {
                        const followingMap = {};
                        data.following.forEach((user) => {
                            const userId = typeof user === 'string' ? user : user._id;
                            followingMap[userId] = true;
                        });
                        setFollowingStates(followingMap);
                    }
                })
                .catch((err) => console.error('Failed to load following:', err));
        }
    }, [currentUser?._id]);

    const candidateCities = useMemo(() => {
        const source = [...(routes || []), ...(highlightRoutes || [])];
        const seen = new Set();
        const list = [];

        source.forEach((route) => {
            const coords = extractCoords(route);
            const rawCity = cityFromRoute(route);
            const city = sanitizeCity(rawCity);

            const key = coords
                ? `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`
                : city?.toLowerCase();
            if (!key) return;
            if (seen.has(key)) return;
            seen.add(key);

            list.push({ city, coords });
        });

        return list;
    }, [routes, highlightRoutes]);

    useEffect(() => {
        if (!candidateCities.length) {
            setWeatherItems([]);
            setWeatherError(null);
            setWeatherLoading(false);
            return;
        }

        const shuffled = [...candidateCities].sort(() => Math.random() - 0.5);
        const selected = shuffled.length ? [shuffled[0]] : [];
        const selectionKey = selected
            .map((c) => (c.coords ? `${c.coords.lat},${c.coords.lon}` : c.city))
            .join('|');

        // Avoid re-fetching the same selection to reduce API calls
        if (selectionKey === lastSelectionRef.current) return;
        lastSelectionRef.current = selectionKey;

        const fetchWeather = async () => {
            setWeatherLoading(true);
            setWeatherError(null);
            try {
                const target = selected[0];
                if (!target) {
                    setWeatherItems([]);
                    setWeatherLoading(false);
                    return;
                }

                const { city, coords } = target;

                // Fetch weather data using coordinates
                const fetchWeatherByCoords = async (lat, lon) => {
                    const params = new URLSearchParams({
                        latitude: lat.toString(),
                        longitude: lon.toString(),
                        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
                        daily: 'temperature_2m_max,temperature_2m_min',
                        timezone: 'auto',
                        forecast_days: '1',
                    });
                    const res = await fetch(`${OPEN_METEO_BASE}/forecast?${params.toString()}`);
                    if (!res.ok) throw new Error('Hava durumu getirilemedi');
                    return res.json();
                };

                // Fetch geocoding data for city name
                const fetchGeocoding = async (cityName) => {
                    const params = new URLSearchParams({
                        name: cityName,
                        count: '1',
                        language: 'tr',
                    });
                    const res = await fetch(`${GEOCODING_BASE}/search?${params.toString()}`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return data?.results?.[0] || null;
                };

                // Fetch weather by city name (geocoding first, then weather)
                const fetchWeatherByCity = async (cityName) => {
                    const geocoding = await fetchGeocoding(cityName);
                    if (!geocoding) throw new Error('Şehir bulunamadı');
                    return fetchWeatherByCoords(geocoding.latitude, geocoding.longitude);
                };

                let weatherData = null;
                let geocodingData = null;

                // Prefer coordinates first
                if (coords) {
                    try {
                        weatherData = await fetchWeatherByCoords(coords.lat, coords.lon);
                        // Try to get city name from geocoding
                        if (city) {
                            const geo = await fetchGeocoding(city);
                            if (geo) geocodingData = { results: [geo] };
                        }
                    } catch (err) {
                        // Fallback to city name if coordinates fail
                        if (city) {
                            try {
                                const geo = await fetchGeocoding(city);
                                if (geo) {
                                    geocodingData = { results: [geo] };
                                    weatherData = await fetchWeatherByCoords(geo.latitude, geo.longitude);
                                } else {
                                    throw new Error('Hava durumu getirilemedi');
                                }
                            } catch (err2) {
                                throw new Error('Hava durumu getirilemedi');
                            }
                        } else {
                            throw err;
                        }
                    }
                } else if (city) {
                    // Only city name available
                    const geo = await fetchGeocoding(city);
                    if (!geo) throw new Error('Şehir bulunamadı');
                    geocodingData = { results: [geo] };
                    weatherData = await fetchWeatherByCoords(geo.latitude, geo.longitude);
                } else {
                    throw new Error('Konum bilgisi bulunamadı');
                }

                if (!weatherData) {
                    throw new Error('Hava durumu getirilemedi');
                }

                setWeatherItems([{ city, weatherData, geocodingData }]);
            } catch (err) {
                console.error('Weather fetch failed', err);
                setWeatherItems([]);
                setWeatherError('Hava durumu alınamadı');
            } finally {
                setWeatherLoading(false);
            }
        };

        fetchWeather();
    }, [candidateCities]);

    const handleFollowToggle = async (userId, username) => {
        if (!currentUser?._id || userId === currentUser._id) return;

        const isCurrentlyFollowing = followingStates[userId];
        try {
            setLoadingStates((prev) => ({ ...prev, [userId]: true }));
            const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
            const res = await fetch(`/api/user/${endpoint}/${userId}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update follow status');
            }

            setFollowingStates((prev) => ({
                ...prev,
                [userId]: !isCurrentlyFollowing,
            }));
        } catch (err) {
            console.error('Failed to toggle follow:', err);
        } finally {
            setLoadingStates((prev) => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <aside>
            <div className='space-y-6 lg:sticky lg:top-24'>
                <section className='rounded-3xl border border-slate-100 dark:border-gray-600 bg-white dark:bg-[rgb(32,38,43)] p-5 shadow-sm'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-4'>Bu Hafta Yükselenler</h3>
                    <div className='space-y-4'>
                        {highlightRoutes.length > 0 ? (
                            highlightRoutes.map((route) => (
                                <Link key={route._id} to={`/routes/${route.slug}`} className='flex items-start gap-3 group'>
                                    <img
                                        src={route.coverImage || FALLBACK_COVER}
                                        alt={route.title}
                                        className='h-16 w-16 rounded-2xl object-cover flex-shrink-0'
                                        loading='lazy'
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = FALLBACK_COVER;
                                        }}
                                    />
                                    <div>
                                        <p className='text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition'>
                                            {route.title}
                                        </p>
                                        <p className='text-xs text-slate-500 dark:text-slate-400'>{route.tags?.[0] || 'Öne çıkan rota'}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className='text-sm text-slate-500 dark:text-slate-400'>Trend rotalar yakında burada görünecek.</p>
                        )}
                    </div>
                </section>

                <section className='rounded-3xl border border-slate-100 dark:border-gray-600 bg-white dark:bg-[rgb(32,38,43)] p-5 shadow-sm'>
                    <div className='flex items-center justify-between mb-3'>
                        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Rotalarda Hava</h3>
                        <span className='text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800'>
                            Canlı
                        </span>
                    </div>
                    {weatherLoading ? (
                        <div className='space-y-3'>
                            <div className='rounded-2xl bg-white dark:bg-[rgb(32,38,43)] p-1'>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse' />
                                        <div className='space-y-2'>
                                            <div className='h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
                                            <div className='h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
                                        </div>
                                    </div>
                                    <div className='text-right space-y-2'>
                                        <div className='h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto' />
                                        <div className='h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto' />
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 mt-3'>
                                    <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
                                        <div className='h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
                                        <div className='h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
                                    </div>
                                    <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
                                        <div className='h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
                                        <div className='h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
                                    </div>
                                    <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
                                        <div className='h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
                                        <div className='h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : weatherError ? (
                        <p className='text-sm text-red-500'>{weatherError}</p>
                    ) : weatherItems.length > 0 ? (
                        <div className='space-y-3'>
                            {weatherItems.map(({ city, weatherData, geocodingData }) => {
                                const current = weatherData?.current || {};
                                const daily = weatherData?.daily || {};
                                
                                const temp = ensureCelsius(current.temperature_2m);
                                const tempMin = daily.temperature_2m_min?.[0] !== undefined 
                                    ? ensureCelsius(daily.temperature_2m_min[0]) 
                                    : null;
                                const tempMax = daily.temperature_2m_max?.[0] !== undefined 
                                    ? ensureCelsius(daily.temperature_2m_max[0]) 
                                    : null;
                                const humidity = current.relative_humidity_2m;
                                const windKmh = current.wind_speed_10m !== undefined 
                                    ? Math.round(current.wind_speed_10m) 
                                    : null;
                                const feelsLike = ensureCelsius(current.apparent_temperature);
                                const weatherCode = current.weather_code;
                                const isDay = current.is_day === 1;
                                
                                const locationLabel = formatCityCountry(geocodingData, city);
                                const iconCode = weatherCodeToIcon(weatherCode, isDay);
                                const iconUrl = `https://openweather.site/img/wn/${iconCode}.png`;
                                const description = weatherCodeToDescription(weatherCode);

                                return (
                                    <div
                                        key={city}
                                        className='rounded-2xl bg-white dark:bg-[rgb(32,38,43)] p-1'
                                    >
                                        <div className='flex items-center justify-between gap-3'>
                                            <div className='flex items-center gap-2'>
                                                {iconUrl ? (
                                                    <img
                                                        src={iconUrl}
                                                        alt={description}
                                                        className='h-10 w-10'
                                                        loading='lazy'
                                                    />
                                                ) : (
                                                    <div className='h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700' />
                                                )}
                                                <div>
                                                    <p className='text-3xl font-semibold text-slate-900 dark:text-white leading-tight'>
                                                        {temp !== null ? `${temp}°C` : '--'}
                                                    </p>
                                                    <p className='text-sm text-slate-500 dark:text-slate-300 capitalize'>
                                                        {description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='text-right'>
{/*                                                 <p className='text-xs uppercase text-slate-500 dark:text-slate-400'>Konum</p>
 */}                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>{locationLabel}</p>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                                                    Min {tempMin !== null ? `${tempMin}°C` : '--'} <br /> Max {tempMax !== null ? `${tempMax}°C` : '--'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2'>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>Rüzgar</p>
                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                                    {windKmh !== null ? `${windKmh} km/sa` : '--'}
                                                </p>
                                            </div>
                                            <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2'>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>Nem</p>
                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>{humidity !== undefined ? `${Math.round(humidity)}%` : '--'}</p>
                                            </div>
                                            <div className='flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2'>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>Hissedilen</p>
                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                                    {feelsLike !== null ? `${feelsLike}°C` : '--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Hava durumu göstermek için rota konumu bulunamadı.</p>
                    )}
                </section>

                <section className='rounded-3xl border border-slate-100 dark:border-gray-600 bg-white dark:bg-[rgb(32,38,43)] p-5 shadow-sm'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-4'>Takip Etmeye Değer Gezginler</h3>
                    <div className='space-y-4'>
                        {suggestedCreators.length > 0 ? (
                            suggestedCreators.map((creator) => {
                                const creatorId = creator._id;
                                const isFollowing = followingStates[creatorId] || false;
                                const isLoading = loadingStates[creatorId] || false;

                                return (
                                    <div key={creator.username} className='flex items-center justify-between gap-3 group'>
                                        <Link to={`/user/${creator.username}`} className='flex-1'>
                                            <div className='flex items-center gap-3'>
                                                <img
                                                    src={creator.profilePicture || buildAvatarFallback(creator.username)}
                                                    alt={creator.username}
                                                    className='h-12 w-12 rounded-full object-cover bg-gray-100'
                                                    loading='lazy'
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = buildAvatarFallback(creator.username);
                                                    }}
                                                />
                                                <div>
                                                    <p className='text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition'>
                                                        {creator.fullName || creator.username}
                                                    </p>
                                                    <p className='text-xs text-slate-500 dark:text-slate-400'>@{creator.username}</p>
                                                    {creator.sampleRoute && (
                                                        <p className='text-xs text-slate-400 mt-1'>{creator.sampleRoute}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        {currentUser?._id && creatorId && creatorId !== currentUser._id && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleFollowToggle(creatorId, creator.username);
                                                }}
                                                disabled={isLoading}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${isFollowing
                                                        ? 'bg-slate-200 dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-600'
                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200'
                                                    }`}
                                            >
                                                {isLoading ? '...' : isFollowing ? 'Takip ✓' : 'Takip Et'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className='text-sm text-slate-500 dark:text-slate-400'>Gezgin önerileri yakında.</p>
                        )}
                    </div>
                </section>
            </div>
        </aside>
    );
}
