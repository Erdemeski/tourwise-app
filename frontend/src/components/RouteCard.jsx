import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

export default function RouteCard({ route }) {
    if (!route) return null;

    const owner = route.owner || {};
    const heroImage = useMemo(() => {
        if (route.coverImage) return route.coverImage;
        if (Array.isArray(route.gallery) && route.gallery.length > 0) {
            return route.gallery[0];
        }
        return FALLBACK_COVER;
    }, [route]);

    const tags = Array.isArray(route.tags) ? route.tags.slice(0, 3) : [];

    return (
        <article className='group relative rounded-3xl bg-white/90 dark:bg-[rgb(32,38,43)]/80 backdrop-blur border border-slate-100 dark:border-gray-600 shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl'>
            <Link to={`/routes/${route.slug}`} className='block relative'>
                <img
                    src={heroImage}
                    alt={route.title || 'Route cover'}
                    className='w-full h-72 object-cover transition duration-300 group-hover:scale-[1.02]'
                    loading='lazy'
                />
                {/* Gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
                
                {/* Content overlay */}
                <div className='absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white'>
                    <div className='space-y-1'>
                        <h2 className='text-xl font-semibold line-clamp-1 drop-shadow-lg'>
                            {route.title}
                        </h2>
                        {route.summary && (
                            <p className='text-sm text-white/90 line-clamp-1 drop-shadow-md'>
                                {route.summary}
                            </p>
                        )}
{/*                         <div className='flex items-center gap-2 text-xs text-white/80'>
                            <span className='font-medium'>ROTANIN BAŞLANGICI</span>
                            <span>{route.startLocation || 'Belirtilmedi'}</span>
                        </div>
 */}                        {tags.length > 0 && (
                            <div className='flex flex-wrap gap-1.5 pt-1'>
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className='px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30'
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Owner info at bottom */}
            <footer className='p-2.5 bg-white/90 dark:bg-[rgb(32,38,43)]/80 backdrop-blur'>
                <div className='flex items-center justify-between'>
                    <Link
                        to={owner.username ? `/user/${owner.username}` : '#'}
                        className='flex items-center gap-2.5 group'
                    >
                        <img
                            src={owner.profilePicture || 'https://i.pravatar.cc/100?img=12'}
                            alt={owner.username || 'Traveller'}
                            className='h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-gray-50'
                        />
                        <div>
                            <p className='text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition'>
                                {owner.fullName || owner.username || 'Gezgin'}
                            </p>
                            <p className='text-xs text-slate-500 dark:text-slate-400'>
                                @{owner.username || 'gezgin'}
                            </p>
                        </div>
                    </Link>
                    {owner.username && (
                        <Link
                            to={`/user/${owner.username}`}
                            className='px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 transition'
                        >
                            Takip Et
                        </Link>
                    )}
                </div>
            </footer>
        </article>
    );
}
