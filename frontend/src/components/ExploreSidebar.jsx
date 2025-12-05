import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

export default function ExploreSidebar({ highlightRoutes = [], suggestedCreators = [] }) {
    const { currentUser } = useSelector((state) => state.user);
    const [followingStates, setFollowingStates] = useState({});
    const [loadingStates, setLoadingStates] = useState({});

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
                                                    src={creator.profilePicture || 'https://i.pravatar.cc/100?img=12'}
                                                    alt={creator.username}
                                                    className='h-12 w-12 rounded-full object-cover bg-gray-100'
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
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${
                                                    isFollowing
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
