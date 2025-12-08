import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiDroplet, FiWind } from 'react-icons/fi';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

// In browser, use Vite/CRA envs; no dotenv on client
const RAPID_API_HOST = 'open-weather13.p.rapidapi.com';
const RAPID_API_KEY = '8744312317msh2c048bdb31d2cf9p1a470ejsn4854eaee886b';

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

const formatCityCountry = (data, fallbackCity) => {
    const city = data?.name || fallbackCity || '';
    const country = data?.sys?.country || '';
    return country ? `${city}, ${country}` : city;
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

                const fetchCoords = async () => {
                    if (!coords) return null;
                    const res = await fetch(
                        `https://${RAPID_API_HOST}/latlon?latitude=${coords.lat}&longitude=${coords.lon}&lang=TR&unit=metric`,
                        {
                            headers: {
                                'x-api-host': RAPID_API_HOST,
                                'x-api-key': RAPID_API_KEY,
                                'X-RapidAPI-Host': RAPID_API_HOST,
                                'X-RapidAPI-Key': RAPID_API_KEY,
                            },
                        }
                    );
                    return res;
                };

                const fetchCity = async () => {
                    if (!city) return null;
                    const res = await fetch(
                        `https://${RAPID_API_HOST}/city?city=${encodeURIComponent(city)}&lang=TR&unit=metric`,
                        {
                            headers: {
                                'x-api-host': RAPID_API_HOST,
                                'x-api-key': RAPID_API_KEY,
                                'X-RapidAPI-Host': RAPID_API_HOST,
                                'X-RapidAPI-Key': RAPID_API_KEY,
                            },
                        }
                    );
                    return res;
                };

                // Prefer coordinates first
                let res = await fetchCoords();
                if ((!res || res.status === 404) && city) {
                    res = await fetchCity();
                }

                if (!res || !res.ok) {
                    throw new Error('Hava durumu getirilemedi');
                }
                const data = await res.json();
                setWeatherItems([{ city, data }]);
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
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Hava durumu yükleniyor...</p>
                    ) : weatherError ? (
                        <p className='text-sm text-red-500'>{weatherError}</p>
                    ) : weatherItems.length > 0 ? (
                        <div className='space-y-3'>
                            {weatherItems.map(({ city, data }) => {
                                const mainRaw = data?.main || {};
                                const main = {
                                    temp: ensureCelsius(mainRaw.temp),
                                    temp_min: ensureCelsius(mainRaw.temp_min),
                                    temp_max: ensureCelsius(mainRaw.temp_max),
                                    humidity: mainRaw.humidity,
                                };
                                const weather = Array.isArray(data?.weather) ? data.weather[0] : null;
                                const temp = main.temp ?? null;
                                const tempMin = main.temp_min ?? null;
                                const tempMax = main.temp_max ?? null;
                                const humidity = main.humidity;
                                const wind = data?.wind?.speed;
                                const locationLabel = formatCityCountry(data, city);
                                const iconUrl = weather?.icon
                                    ? `https://openweather.site/img/wn/${weather.icon}.png`
                                    : null;
                                const windKmh = typeof wind === 'number' ? Math.round(wind * 3.6) : null;
                                const feelsLike = ensureCelsius(mainRaw.feels_like);

                                return (
                                    <div
                                        key={city}
                                        className='rounded-2xl bg-white dark:bg-slate-900 p-1'
                                    >
                                        <div className='flex items-center justify-between gap-3'>
                                            <div className='flex items-center gap-2'>
                                                {iconUrl ? (
                                                    <img
                                                        src={iconUrl}
                                                        alt={weather?.description || 'hava durumu'}
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
                                                        {weather?.description || 'Durum bilinmiyor'}
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
                                            <div className='rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>Rüzgar</p>
                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                                    {windKmh !== null ? `${windKmh} km/sa` : '--'}
                                                </p>
                                            </div>
                                            <div className='rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
                                                <p className='text-[11px] text-slate-500 dark:text-slate-400'>Nem</p>
                                                <p className='text-sm font-semibold text-slate-900 dark:text-white'>{humidity ?? '--'}%</p>
                                            </div>
                                            <div className='rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-2.5'>
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
