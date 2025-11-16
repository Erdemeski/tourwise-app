import React from 'react';

export default function RouteCardSkeleton() {
    return (
        <div className='w-full sm:w-[430px] h-[340px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-gray-800 shadow-md animate-pulse overflow-hidden'>
            <div className='h-[220px] w-full bg-gray-200 dark:bg-gray-700' />
            <div className='p-4 flex flex-col gap-3'>
                <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-11/12' />
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12' />
                <div className='flex justify-between items-center'>
                    <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded' />
                    <div className='h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded' />
                </div>
            </div>
        </div>
    );
}
