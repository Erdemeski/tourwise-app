import { Spinner } from 'flowbite-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RouteActionsPanel from '../components/RouteActionsPanel';
import RouteDetails from '../components/RouteDetails';
import RouteCard from '../components/RouteCard';
import FooterBanner from '../components/FooterBanner';
import NotFound from './NotFound';

export default function RouteDetailsPage() {
    const { slug } = useParams();
    const { currentUser } = useSelector((state) => state.user);
    const [route, setRoute] = useState(null);
    const [relatedRoutes, setRelatedRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const fetchRoute = useCallback(async () => {
        try {
            setLoading(true);
            setNotFound(false);
            const res = await fetch(`/api/routes?slug=${slug}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.routes || data.routes.length === 0) {
                setNotFound(true);
                setRoute(null);
                return;
            }
            const fetchedRoute = data.routes[0];
            const isOwner = currentUser && fetchedRoute.userId === currentUser._id;
            const isAdmin = currentUser?.isAdmin;
            if (fetchedRoute.visibility !== 'public' && !isOwner && !isAdmin) {
                setNotFound(true);
                setRoute(null);
                return;
            }
            setRoute(fetchedRoute);
            setNotFound(false);
        } catch (error) {
            setNotFound(true);
            setRoute(null);
        } finally {
            setLoading(false);
        }
    }, [slug, currentUser]);

    useEffect(() => {
        fetchRoute();
    }, [fetchRoute]);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!route) return;
            try {
                const tag = route.tags?.[0];
                const query = tag ? `?limit=3&tag=${encodeURIComponent(tag)}&order=desc` : '?limit=3&order=desc';
                const res = await fetch(`/api/routes${query}`);
                const data = await res.json();
                if (res.ok && data.routes) {
                    const filtered = data.routes.filter((item) => item._id !== route._id);
                    setRelatedRoutes(filtered);
                }
            } catch (error) {
                setRelatedRoutes([]);
            }
        };
        fetchRelated();
    }, [route]);

    const handleRouteUpdated = (updatedRoute) => {
        if (!updatedRoute) {
            fetchRoute();
            return;
        }
        setRoute((prev) => ({
            ...prev,
            ...updatedRoute,
            likes: updatedRoute.likes || updatedRoute.likes === 0 ? updatedRoute.likes : prev.likes,
            forksCount: typeof updatedRoute.forksCount === 'number' ? updatedRoute.forksCount : prev.forksCount,
        }));
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (notFound || !route) {
        return <NotFound />;
    }

    return (
        <>
            <div className='p-3 min-h-screen max-w-screen-2xl mx-auto flex flex-col gap-8'>
                <div className='flex flex-col gap-2 text-center'>
                    <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white'>{route.title}</h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {route.summary}
                    </p>
                </div>

                <div className='grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
                    <RouteDetails route={route} />
                    <RouteActionsPanel route={route} onRouteUpdated={handleRouteUpdated} />
                </div>

                {relatedRoutes.length > 0 && (
                    <section>
                        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white text-center mb-4'>You may also like</h2>
                        <div className='flex flex-wrap gap-5 justify-center'>
                            {relatedRoutes.map((item) => (
                                <RouteCard key={item._id} route={item} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <FooterBanner />
        </>
    );
}

