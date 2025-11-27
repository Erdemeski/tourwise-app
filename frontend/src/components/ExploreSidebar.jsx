import React from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

export default function ExploreSidebar({ highlightRoutes = [], suggestedCreators = [] }) {
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
                            suggestedCreators.map((creator) => (
                                <div key={creator.username} className='flex items-center justify-between gap-3 group'>
                                    <Link to={`/user/${creator.username}`}>
                                        <div className='flex items-center gap-3 '>
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
                                    <div className='px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 transition'>
                                        Takip Et
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='text-sm text-slate-500 dark:text-slate-400'>Gezgin önerileri yakında.</p>
                        )}
                    </div>
                </section>
            </div>
        </aside>
    );
}











