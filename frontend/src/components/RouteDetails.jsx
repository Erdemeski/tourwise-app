import { Badge } from 'flowbite-react';
import React, { useMemo, useState } from 'react';
import { IoLocationSharp } from "react-icons/io5";
import CommentSection from './CommentSection';
import '../styles/home.css';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80';

const hasContent = (htmlString) => {
    if (!htmlString) return false;
    const strippedContent = htmlString.replace(/<[^>]*>/g, '').trim();
    return strippedContent.length > 0;
};

export default function RouteDetails({ route }) {
    const gallery = useMemo(() => {
        if (!route) return [];
        const items = [];
        if (route.coverImage) items.push(route.coverImage);
        if (Array.isArray(route.gallery)) {
            items.push(...route.gallery.filter(Boolean));
        }
        return items.length > 0 ? items : [FALLBACK_COVER];
    }, [route]);

    const [activeImage, setActiveImage] = useState(gallery[0]);

    return (
        <div className="rounded-lg shadow-md bg-white dark:bg-gray-800">
            <div className="relative">
                <div className="w-full h-[320px] sm:h-[420px] bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                    <img
                        src={activeImage}
                        alt={route?.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                {gallery.length > 1 && (
                    <div className="flex gap-3 px-4 py-3 overflow-x-auto bg-white dark:bg-gray-800">
                        {gallery.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveImage(image)}
                                className={`h-20 w-28 rounded-md overflow-hidden border-2 transition-all ${activeImage === image ? 'border-teal-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                            >
                                <img src={image} alt={`Route preview ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className='p-5 flex flex-col gap-5'>
                <div className='bg-gray-50 dark:bg-gray-700 rounded-md p-5 flex flex-col gap-4 shadow-sm'>
                    <div className='flex flex-wrap gap-2'>
                        {route?.tags?.map((tag) => (
                            <Badge key={tag} color='gray' size='sm'>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{route?.title}</h1>
                    <p className='text-gray-600 dark:text-gray-300 text-base leading-relaxed'>{route?.summary}</p>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300'>
                        {route?.startLocation && (
                            <div className='flex items-center gap-2'>
                                <IoLocationSharp className="text-teal-500 dark:text-teal-400 size-5" />
                                <span><strong>Start:</strong> {route.startLocation}</span>
                            </div>
                        )}
                        {route?.endLocation && (
                            <div className='flex items-center gap-2'>
                                <IoLocationSharp className="text-teal-500 dark:text-teal-400 size-5" />
                                <span><strong>Finish:</strong> {route.endLocation}</span>
                            </div>
                        )}
                        {route?.distanceKm ? (
                            <div><strong>Distance:</strong> {route.distanceKm} km</div>
                        ) : null}
                        {route?.durationDays ? (
                            <div><strong>Duration:</strong> {route.durationDays} day(s)</div>
                        ) : null}
                        {route?.season && (
                            <div><strong>Best season:</strong> {route.season}</div>
                        )}
                        {route?.terrainTypes?.length > 0 && (
                            <div><strong>Terrain:</strong> {route.terrainTypes.join(', ')}</div>
                        )}
                    </div>
                </div>

        <div className='grid gap-5'>
          {route?.overview && hasContent(route.overview) && (
            <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Route Overview</h2>
              <div className='post-content text-gray-800 dark:text-gray-200' dangerouslySetInnerHTML={{ __html: route.overview }} />
            </section>
          )}
          {route?.itinerary && hasContent(route.itinerary) && (
            <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Itinerary</h2>
              <div className='post-content text-gray-800 dark:text-gray-200' dangerouslySetInnerHTML={{ __html: route.itinerary }} />
            </section>
          )}
          {route?.highlights && hasContent(route.highlights) && (
            <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Highlights</h2>
              <div className='post-content text-gray-800 dark:text-gray-200' dangerouslySetInnerHTML={{ __html: route.highlights }} />
            </section>
          )}
          {route?.tips && hasContent(route.tips) && (
            <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Insider Tips</h2>
              <div className='post-content text-gray-800 dark:text-gray-200' dangerouslySetInnerHTML={{ __html: route.tips }} />
            </section>
          )}
        </div>

                {route?.waypointList?.length > 0 && (
                    <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
                        <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Waypoints</h2>
                        <div className='space-y-3'>
                            {route.waypointList.sort((a, b) => (a.order || 0) - (b.order || 0)).map((stop, index) => (
                                <div key={`${stop.title}-${index}`} className='border border-gray-200 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800'>
                                    <div className='flex justify-between text-sm text-gray-500 dark:text-gray-400'>
                                        <span>Day {stop.day || index + 1}</span>
                                        {stop.startTime && (
                                            <span>{stop.startTime}{stop.endTime ? ` – ${stop.endTime}` : ''}</span>
                                        )}
                                    </div>
                                    <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-100 mt-1'>{stop.title}</h3>
                                    {stop.location && (
                                        <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm'>
                                            <IoLocationSharp className='size-4 text-teal-500 dark:text-teal-400' /> {stop.location}
                                        </div>
                                    )}
                                    {stop.summary && (
                                        <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>{stop.summary}</p>
                                    )}
                                    {stop.notes && (
                                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400 italic'>{stop.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

        <section className='bg-gray-50 dark:bg-gray-700 rounded-md p-4'>
          <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-3'>Discussion</h2>
          <CommentSection routeId={route?._id} />
        </section>
      </div>
    </div>
  );
}
