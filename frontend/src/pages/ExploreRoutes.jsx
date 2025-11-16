import { Spinner } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchSidebar from '../components/SearchSidebar';
import RouteCard from '../components/RouteCard';

const fadeInStyle = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 1s ease-in forwards;
}
`;

export default function ExploreRoutes() {
    const location = useLocation();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const urlParams = new URLSearchParams(location.search);
    const searchTerm = urlParams.get('searchTerm') || '';
    const order = urlParams.get('order') || 'desc';
    const tag = urlParams.get('tag') || '';

    useEffect(() => {
        // Add the styles to the document
        const styleSheet = document.createElement("style");
        styleSheet.innerText = fadeInStyle;
        document.head.appendChild(styleSheet);

        return () => {
            // Cleanup: remove the style when component unmounts
            document.head.removeChild(styleSheet);
        };
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/routes?${urlParams.toString()}`);
            if (!res.ok) {
                setLoading(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setRoutes(data.routes || []);
                setLoading(false);
                setShowMore((data.routes || []).length === 9);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, [location.search]);

    const handleSearch = (newSearchTerm = searchTerm, newOrder = order, newTag = tag) => {
        const params = new URLSearchParams();
        if (newSearchTerm) params.set('searchTerm', newSearchTerm);
        params.set('order', newOrder);
        if (newTag) params.set('tag', newTag);

        navigate(`/explore?${params.toString()}`);
    };

    const handleFilterChange = (type, value) => {
        if (type === 'order') {
            handleSearch(searchTerm, value, tag);
        } else if (type === 'tag') {
            handleSearch(searchTerm, order, value);
        }
    };

    return (
        <div className='min-h-screen fade-in'>
            <div className='min-h-screen flex flex-col md:flex-row'>
                <div className='md:w-56 z-10'>
                    <SearchSidebar
                        searchTerm={searchTerm}
                        order={order}
                        tag={tag}
                        handleSearch={(e) => {
                            e.preventDefault();
                            handleSearch();
                        }}
                        setSearchTerm={(term) => handleSearch(term, order, tag)}
                        setOrder={(newOrder) => handleFilterChange('order', newOrder)}
                        setTag={(newTag) => handleFilterChange('tag', newTag)}
                    />
                </div>
                <div className="flex-1 min-h-screen relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-6 sm:py-10 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(85% 40%, 100% 55%, 100% 30%, 90% 10%, 85% 5%, 78% 25%, 65% 60%, 55% 70%, 50% 65%, 48% 35%, 30% 80%, 0% 70%, 20% 100%, 30% 78%, 80% 95%, 90% 110%, 95% 130%, 98% 145%, 100% 160%, 100% 200%)',
                            }}
                            className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#f728a7] to-[#99d40e] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
                        />
                    </div>
                    <div className="mx-auto max-w-2xl text-center">
                        {loading === false ? (
                            <section className='mt-0'>
                                {routes.length !== 0 ? (
                                    <>
                                        <h1 className='text-center font-semibold text-3xl'>Discover Community Routes</h1>
                                        <p className="mt-0 mb-6 sm:mb-10 text-md text-gray-600 dark:text-gray-400 leading-relaxed">Browse itineraries shared by other explorers and copy the ones you love.</p>
                                    </>
                                ) : (
                                    <>
                                        <h1 className='text-center font-semibold text-3xl'>No Routes Found</h1>
                                        <p className="mt-0 mb-6 sm:mb-10 text-xl text-gray-600 dark:text-gray-400 leading-relaxed">Try adjusting your search or filters.</p>
                                    </>
                                )}
                            </section>
                        ) : (
                            <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
                                <Spinner size='xl' />
                                <p className='text-center text-gray-500 m-2'>Searching...</p>
                            </div>
                        )}
                    </div>
                    {routes.length !== 0 &&
                        <div>
                            <div className='flex flex-wrap gap-5 mt-5 justify-center'>
                                {routes.map((route) => <RouteCard key={route._id} route={route} />)}
                            </div>
                        </div>}
                </div>
            </div>
        </div>
    )
}
