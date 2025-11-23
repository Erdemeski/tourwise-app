import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiBookmark, FiShare2 } from 'react-icons/fi';
import { motion } from 'motion/react';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

const formatRelativeTime = (value) => {
    if (!value) return 'az önce';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'az önce';

    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) return 'az önce';
    if (diff < hour) return `${Math.floor(diff / minute)} dk önce`;
    if (diff < day) return `${Math.floor(diff / hour)} sa önce`;
    if (diff < week) return `${Math.floor(diff / day)} gün önce`;
    if (diff < month) return `${Math.floor(diff / week)} hf önce`;
    if (diff < year) return `${Math.floor(diff / month)} ay önce`;
    return `${Math.floor(diff / year)} yıl önce`;
};

export default function RouteFeedCard({ route }) {
    if (!route) return null;

    const [isHoveringLike, setIsHoveringLike] = useState(false);
    const owner = route.owner || {};
    const likes = route.likesCount ?? route.likes?.length ?? 0;
    const comments = route.commentsCount ?? 0;
    const coverImage = route.coverImage || FALLBACK_COVER;
    const locationLabel = route.startLocation && route.endLocation
        ? `${route.startLocation} → ${route.endLocation}`
        : route.startLocation || route.endLocation || 'Konum bilgisi eklenmedi';
    const tags = Array.isArray(route.tags) ? route.tags.slice(0, 3) : [];
    const canFollow = Boolean(owner.username);

    return (
        <article className='rounded-3xl bg-white/90 dark:bg-[rgb(32,38,43)]/80 backdrop-blur border border-slate-100 dark:border-gray-600 shadow-lg shadow-slate-200/40 dark:shadow-none p-4 pb-3 sm:p-6 sm:pb-4 transition hover:shadow-xl'>
            <header className='flex items-start justify-between gap-4'>
                <Link to={owner.username ? `/user/${owner.username}` : '#'} >
                    <div className='flex items-center gap-3 group'>
                        <div className='flex-shrink-0'>
                            <img
                                src={owner.profilePicture || 'https://i.pravatar.cc/100?img=8'}
                                alt={owner.username || 'Traveller'}
                                className='h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-gray-50'
                            />
                        </div>
                        <div>
                            <div className='flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400'>
                                {owner.username && <span className='font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition'>{owner.fullName || owner.username}</span>}
                                {owner.username && <span>·</span>}
                                <span>@{owner.username || 'gezgin'}</span>
                            </div>
                            <p className='text-xs text-slate-400'>{formatRelativeTime(route.createdAt)}</p>
                        </div>
                    </div>
                </Link>
                {canFollow && (
                    <Link
                        to={`/user/${owner.username}`}
                        className='px-3 py-1.5 text-sm font-medium rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition'
                    >
                        Takip Et
                    </Link>
                )}
            </header>

            <div className='mt-4 space-y-4'>
                <div>
                    <Link to={`/routes/${route.slug}`}>
                        <h2 className='text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2'>{route.title}</h2>
                    </Link>
                    <p className='text-slate-600 dark:text-slate-300 leading-relaxed'>{route.summary}</p>
                </div>

                <Link to={`/routes/${route.slug}`} className='block relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group '>
                    <img src={coverImage} alt={route.title} className='h-72 w-full object-cover transition duration-300 group-hover:scale-[1.02]' loading='lazy' />
                    {/* Gradient overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
                    
                    {/* Content overlay */}
                    <div className='absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white'>
                        <div className='space-y-1'>
                            <div className='flex flex-wrap items-center gap-2 text-xs text-white/90'>
                                <span className='font-medium drop-shadow-md'>{locationLabel}</span>
                                {route.durationDays && <span className='drop-shadow-md'>· {route.durationDays} gün</span>}
                                {route.distanceKm && <span className='drop-shadow-md'>· {route.distanceKm} km</span>}
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

                <footer className='flex items-center justify-between '>
                    <div className='flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300'>
                        <button
                            type='button'
                            className='flex items-center gap-0 relative'
                            onMouseEnter={() => setIsHoveringLike(true)}
                            onMouseLeave={() => setIsHoveringLike(false)}
                        >
                            <div className='relative w-10 h-8 flex items-center justify-center'>
                                <FiHeart className={`text-rose-500 transition-opacity ${isHoveringLike ? 'opacity-0' : 'opacity-100'}`} />
                                {isHoveringLike && (
                                    <motion.div
                                        animate={{
                                            scale: [0.8, 1, 0.8],
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <svg
                                            width="40"
                                            height="40"
                                            viewBox="0 0 40 40"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="text-pink-600 translate-x-2 translate-y-1.5"
                                        >
                                            <motion.path
                                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                                fill="currentColor"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>
                            <span>{likes.toLocaleString('tr-TR')}</span>
                        </button>
                        <button type='button' className='flex items-center gap-2'>
                            <FiMessageCircle />
                            <span>{comments.toLocaleString('tr-TR')}</span>
                        </button>
                    </div>
                    <div className='flex items-center gap-4 text-sm text-slate-500'>
                        <button type='button' className='flex items-center gap-2 hover:text-slate-700 dark:hover:text-white'>
                            <FiBookmark />
                            <span>Kaydet</span>
                        </button>
                        <button type='button' className='flex items-center gap-2 hover:text-slate-700 dark:hover:text-white'>
                            <FiShare2 />
                            <span>Paylaş</span>
                        </button>
                    </div>
                </footer>
            </div>
        </article >
    );
}

