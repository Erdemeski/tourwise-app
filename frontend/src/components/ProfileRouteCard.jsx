import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiBookmark } from 'react-icons/fi';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

export default function ProfileRouteCard({ route }) {
    if (!route) return null;

    const cover = route.coverImage || FALLBACK_COVER;
    const likes = route.likesCount ?? route.likes?.length ?? 0;
    const comments = route.commentsCount ?? 0;
    const forks = route.forksCount || 0;
    const tags = Array.isArray(route.tags) ? route.tags.slice(0, 3) : [];

    return (
        <article className='group relative rounded-2xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-[rgb(22,26,29)] shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg'>
            <Link to={`/routes/${route.slug}`} className='block relative'>
                <img
                    src={cover}
                    alt={route.title}
                    className='h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]'
                    loading='lazy'
                />
                {/* Gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />

                {/* Content overlay */}
                <div className='absolute bottom-0 left-0 right-0 p-2.5 text-white'>
                    <div className='space-y-1'>
                        <h3 className='text-base font-semibold line-clamp-1 drop-shadow-lg'>
                            {route.title}
                        </h3>
                        <div className='flex items-center gap-2 text-xs text-white/90 drop-shadow-md'>
                            <span>{route.startLocation || 'Konum'}</span>
                            {route.durationDays && <span>· {route.durationDays} gün</span>}
                        </div>
                        {tags.length > 0 && (
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

            {/* Footer with stats */}
            <footer className='p-2.5 bg-white dark:bg-[rgb(22,26,29)]'>
                <div className='flex items-center justify-between text-xs text-slate-500 dark:text-slate-400'>
                    <div className='flex items-center gap-2'>
                        <span className='inline-flex items-center gap-1'>
                            <FiHeart className='text-rose-500' /> {likes}
                        </span>
                        <span className='inline-flex items-center gap-1'>
                            <FiMessageCircle /> {comments}
                        </span>
                    </div>
                    <span className='inline-flex items-center gap-1'>
                        <FiBookmark /> {forks}
                    </span>
                </div>
            </footer>
        </article>
    );
}





