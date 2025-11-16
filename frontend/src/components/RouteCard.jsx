import { Badge } from 'flowbite-react';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

export default function RouteCard({ route }) {
    const heroImage = useMemo(() => {
        if (!route) return FALLBACK_COVER;
        if (route.coverImage) return route.coverImage;
        if (Array.isArray(route.gallery) && route.gallery.length > 0) {
            return route.gallery[0];
        }
        return FALLBACK_COVER;
    }, [route]);

    const waypointCount = route?.waypointList?.length || 0;
    const isNew = route?.createdAt
        ? (Date.now() - new Date(route.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7
        : false;

    return (
        <div className='group relative w-full shadow-md border bg-white dark:border-zinc-700 border-zinc-200 dark:bg-gray-800 hover:border-teal-400 h-[340px] overflow-hidden rounded-lg sm:w-[430px] transition-all'>
            {isNew && (
                <Badge color='info' size='sm' className='absolute top-2 left-2 z-30 cursor-default'>
                    New
                </Badge>
            )}
            <Link to={`/routes/${route?.slug || ''}`}>
                <img
                    src={heroImage}
                    alt={route?.title || 'Route cover'}
                    className='h-[220px] w-full object-cover group-hover:scale-[1.05] transition-all duration-300'
                />
            </Link>
            <div className='p-4 flex flex-col gap-3 h-[140px]'>
                <div>
                    <p className='text-lg font-semibold line-clamp-2 text-gray-900 dark:text-gray-100'>
                        {route?.title}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
                        {route?.summary}
                    </p>
                </div>
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2 flex-wrap'>
                        {route?.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} color='gray' size='sm'>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <div className='text-sm font-medium text-teal-600 dark:text-teal-300'>
                        {waypointCount} stops
                    </div>
                </div>
{/*                 <Link
                    to={`/routes/${route?.slug || ''}`}
                    className='absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 transition-all duration-300 border border-teal-500 text-teal-600 dark:text-teal-300 dark:bg-[rgb(22,26,29)] dark:hover:bg-teal-500 hover:bg-teal-500 hover:text-white text-center py-2 rounded-md'
                >
                    View route
                </Link>
 */}
             </div>
        </div>
    );
}
