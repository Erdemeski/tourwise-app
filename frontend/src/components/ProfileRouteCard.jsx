import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiBookmark, FiClock, FiMapPin, FiSettings } from 'react-icons/fi';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

export default function ProfileRouteCard({ route, isSaved = false, onSaveToggle, isOwner = false, onVisibilityClick }) {
    if (!route) return null;

    const cover = route.coverImage || FALLBACK_COVER;
    const likes = route.likesCount ?? route.likes?.length ?? 0;
    const [saved, setSaved] = useState(isSaved);

    const handleSaveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onSaveToggle) {
            onSaveToggle(route._id, !saved);
            setSaved(!saved);
        }
    };

    return (
        <article className='group relative rounded-2xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-[rgb(22,26,29)] shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg'>
            <Link to={`/routes/${route.slug}`} className='block relative'>
                <div className='relative h-52 w-full overflow-hidden'>
                <img
                    src={cover}
                    alt={route.title}
                        className='h-full w-full object-cover'
                    loading='lazy'
                />
                    {/* Duration tag */}
                    {route.durationDays && (
                        <div className='absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium'>
                            <FiClock className='w-3.5 h-3.5' />
                            <span>{route.durationDays} {route.durationDays === 1 ? 'Day' : 'Days'}</span>
                        </div>
                    )}
                    {/* Bookmark icon */}
                    <button
                        onClick={handleSaveClick}
                        className='absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10'
                    >
                        <FiBookmark
                            className={`w-4 h-4 ${saved ? 'fill-green-500 text-green-500' : 'text-white'}`}
                        />
                    </button>
                    {/* Visibility settings icon - only for shared/showcase routes */}
                    {isOwner && route.status === 'shared' && onVisibilityClick && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onVisibilityClick(route);
                            }}
                            className='absolute top-3 left-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10'
                            title='Visibility Settings'
                                    >
                            <FiSettings className='w-4 h-4 text-white' />
                        </button>
                        )}
                </div>
            </Link>

            {/* Card content */}
            <div className='p-4 space-y-2'>
                <div className='flex items-center gap-2'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white line-clamp-1'>
                        {route.title}
                    </h3>
                    {route.isForked && (
                        <span className='text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'>
                            Forked
                        </span>
                    )}
                </div>
                <div className='flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400'>
                    <FiMapPin className='w-4 h-4' />
                    <span className='line-clamp-1'>{route.startLocation || 'Location'}</span>
                    </div>
                <div className='flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-700'>
                    <button
                        onClick={handleSaveClick}
                        className='flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors'
                    >
                        <FiBookmark className={`w-4 h-4 ${saved ? 'fill-green-500 text-green-500' : ''}`} />
                        <span>{saved ? 'Saved' : 'Save'}</span>
                    </button>
                    <Link
                        to={`/routes/${route.slug}`}
                        className='text-sm font-medium text-green-600 dark:text-green-400 hover:underline'
                    >
                        View Route
                    </Link>
                </div>
            </div>
        </article>
    );
}





