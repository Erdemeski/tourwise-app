import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RouteFeedCard from '../components/RouteFeedCard';
import RouteFeedCardSkeleton from '../components/RouteFeedCardSkeleton';
import FilterPanel from '../components/FilterPanel';
import ExploreSidebar from '../components/ExploreSidebar';
import { ScrollProgress } from '../components/ui/scroll-progress';

const FEED_BATCH_SIZE = 5;

export default function ExploreRoutes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const searchTerm = urlParams.get('searchTerm') || '';
    const order = urlParams.get('order') || 'desc';
    const tag = urlParams.get('tag') || '';
    const onlyFollowing = urlParams.get('onlyFollowing') === 'true';

    const [routes, setRoutes] = useState([]);
    const [highlightRoutes, setHighlightRoutes] = useState([]);
    const [suggestedCreators, setSuggestedCreators] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [feedError, setFeedError] = useState(null);

    const routesRef = useRef([]);
    const sentinelRef = useRef(null);
    const hasMoreRef = useRef(hasMore);
    const fetchingRef = useRef(false);

    useEffect(() => {
        routesRef.current = routes;
    }, [routes]);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    const fetchRoutes = useCallback(async ({ reset = false } = {}) => {
        if (!reset && (!hasMoreRef.current || fetchingRef.current)) return;

        const params = new URLSearchParams(location.search);
        const startIndex = reset ? 0 : routesRef.current.length;
        params.set('startIndex', startIndex.toString());
        params.set('limit', FEED_BATCH_SIZE.toString());

        // Add onlyFollowing filter if enabled
        if (onlyFollowing && currentUser?._id) {
            params.set('onlyFollowing', 'true');
        }

        try {
            fetchingRef.current = true;
            if (reset) {
                setIsInitialLoading(true);
                setFeedError(null);
            } else {
                setIsFetchingMore(true);
            }

            const res = await fetch(`/api/routes?${params.toString()}`, {
                credentials: onlyFollowing ? 'include' : undefined,
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Rotalar yüklenemedi');
            }

            const nextRoutes = data.routes || [];
            setRoutes((prev) => (reset ? nextRoutes : [...prev, ...nextRoutes]));

            const loaded = startIndex + nextRoutes.length;
            const total = data.totalRoutes ?? null;

            // Eğer total bilgisi varsa onu kullan, yoksa gelen route sayısına göre karar ver
            if (total !== null) {
                // Total bilgisi varsa, yüklenen sayı total'den azsa ve gelen route sayısı batch size'a eşitse daha fazla var
                const canLoadMore = loaded < total && nextRoutes.length === FEED_BATCH_SIZE;
                setHasMore(canLoadMore);
            } else {
                // Total bilgisi yoksa, gelen route sayısına göre karar ver
                // Eğer gelen route sayısı batch size'dan azsa, bu son batch demektir
                const canLoadMore = nextRoutes.length === FEED_BATCH_SIZE;
                setHasMore(canLoadMore);
            }
        } catch (error) {
            setFeedError(error.message || 'Rotalar yüklenemedi');
            if (reset) {
                setRoutes([]);
            }
            setHasMore(false);
        } finally {
            if (reset) {
                setIsInitialLoading(false);
            } else {
                setIsFetchingMore(false);
            }
            fetchingRef.current = false;
        }
    }, [location.search, onlyFollowing, currentUser?._id]);

    useEffect(() => {
        setRoutes([]);
        setHasMore(true);
        fetchRoutes({ reset: true });
    }, [location.search, fetchRoutes]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMoreRef.current && !fetchingRef.current) {
                    fetchRoutes({ reset: false });
                }
            },
            {
                threshold: 0.1,
                rootMargin: '200px', // Kullanıcı 200px kala tetikle
            }
        );

        observer.observe(node);
        return () => observer.unobserve(node);
    }, [fetchRoutes, routes.length, hasMore]);

    const fetchHighlights = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                limit: '4',
                sortBy: 'forksCount',
                order: 'desc',
            });
            const res = await fetch(`/api/routes?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            setHighlightRoutes(data.routes || []);
        } catch (error) {
            setHighlightRoutes([]);
        }
    }, []);

    useEffect(() => {
        fetchHighlights();
    }, [fetchHighlights]);

    useEffect(() => {
        const source = highlightRoutes.length ? highlightRoutes : routes;
        const uniqueCreators = [];
        const seen = new Set();

        source.forEach((route) => {
            if (route?.owner?.username && !seen.has(route.owner.username)) {
                seen.add(route.owner.username);
                uniqueCreators.push({
                    ...route.owner,
                    sampleRoute: route.title,
                });
            }
        });
        setSuggestedCreators(uniqueCreators.slice(0, 3));
    }, [highlightRoutes, routes]);

    const handleSearch = (newSearchTerm = searchTerm, newOrder = order, newTag = tag, newOnlyFollowing = onlyFollowing) => {
        const params = new URLSearchParams();
        if (newSearchTerm) params.set('searchTerm', newSearchTerm);
        params.set('order', newOrder);
        if (newTag) params.set('tag', newTag);
        if (newOnlyFollowing) params.set('onlyFollowing', 'true');
        navigate(`/explore?${params.toString()}`);
    };

    const setOnlyFollowing = (value) => {
        handleSearch(searchTerm, order, tag, value);
    };

    const handleFilterChange = (type, value) => {
        if (type === 'order') {
            handleSearch(searchTerm, value, tag);
        } else if (type === 'tag') {
            handleSearch(searchTerm, order, value);
        }
    };

    return (
        <div className='min-h-screen bg-slate-50 dark:bg-[rgb(22,26,29)]'>
            <ScrollProgress className="top-[60px] sm:top-[64px]" />
            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                <div className='grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)_300px]'>
                    <aside className='space-y-6'>
                        <div className='rounded-3xl border border-slate-100 dark:border-gray-600 bg-white/90 dark:bg-[rgb(32,38,43)]/70 shadow-sm sticky top-24 p-6'>
                            <FilterPanel
                                searchTerm={searchTerm}
                                order={order}
                                tag={tag}
                                onlyFollowing={onlyFollowing}
                                handleSearch={(e) => {
                                    e.preventDefault();
                                    handleSearch();
                                }}
                                setSearchTerm={(term) => handleSearch(term, order, tag)}
                                setOrder={(newOrder) => handleFilterChange('order', newOrder)}
                                setTag={(newTag) => handleFilterChange('tag', newTag)}
                                setOnlyFollowing={currentUser?._id ? setOnlyFollowing : undefined}
                            />
                        </div>
                        {/*                         <div className='rounded-3xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6 shadow-md'>
                            <h3 className='text-lg font-semibold mb-2'>Filtreleri Kullan</h3>
                            <p className='text-sm text-slate-200'>Aradığın rota tipini seç, keşfet butonuna bas ve topluluğun en güncel önerilerini gör.</p>
                        </div>
 */}
                    </aside>

                    <main className='space-y-8'>
                        <section className='rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white p-8 shadow-lg'>
                            <p className='text-sm uppercase tracking-wide opacity-80'>Topluluk akışı</p>
                            <h1 className='mt-2 text-3xl sm:text-4xl font-semibold'>Yeni rotaları arkadaşların gibi keşfet</h1>
                            <p className='mt-3 text-base sm:text-lg text-white/90 max-w-2xl'>
                                İlham veren gezginler hikayelerini paylaşıyor. Fotoğraflarla dolu sosyal akışa katıl, beğendiğin rotaları detaylıca incele.
                            </p>
                        </section>

                        {isInitialLoading ? (
                            <div className='space-y-6'>
                                {Array.from({ length: 3 }).map((_, idx) => (
                                    <RouteFeedCardSkeleton key={`initial-skeleton-${idx}`} />
                                ))}
                            </div>
                        ) : routes.length > 0 ? (
                            <>
                                <div className='space-y-6'>
                                    {routes.map((route) => (
                                        <RouteFeedCard key={route._id} route={route} />
                                    ))}
                                </div>
                                {feedError && (
                                    <p className='text-sm text-red-500'>{feedError}</p>
                                )}
                                {isFetchingMore && (
                                    <div className='space-y-6 py-6'>
                                        {Array.from({ length: 2 }).map((_, idx) => (
                                            <RouteFeedCardSkeleton key={`more-skeleton-${idx}`} />
                                        ))}
                                    </div>
                                )}
                                {/* Sentinel element - infinite scroll için */}
                                <div ref={sentinelRef} className='h-20 w-full' />
                                {!hasMore && routes.length > 0 && (
                                    <p className='text-center text-sm text-slate-500 dark:text-slate-400 py-4'>
                                        💫 Hepsi bu kadar! Yeni rotalar eklendikçe seni haberdar edeceğiz.
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className='rounded-3xl border border-dashed border-slate-200 dark:border-gray-600 bg-white/80 dark:bg-[rgb(32,38,43)]/60 text-center p-12'>
                                <h2 className='text-2xl font-semibold text-slate-800 dark:text-white mb-4'>Aramana uygun rota bulunamadı</h2>
                                <p className='text-slate-500 dark:text-slate-400 mb-6'>
                                    Farklı bir anahtar kelime dene ya da tüm rotaları yeniden görüntüle.
                                </p>
                                <button
                                    onClick={() => handleSearch('', 'desc', '')}
                                    className='px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition'
                                >
                                    Tüm rotaları göster
                                </button>
                            </div>
                        )}
                    </main>

                    <ExploreSidebar
                        highlightRoutes={highlightRoutes}
                        suggestedCreators={suggestedCreators}
                    />
                </div>
            </div>
        </div>
    );
}
