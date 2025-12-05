import React from 'react';
import DashItineraries from '../components/DashItineraries';

export default function MyItinerariesPage() {
    return (
        <div className='min-h-screen bg-slate-50 dark:bg-[rgb(22,26,29)] px-4 py-8'>
            <div className='max-w-6xl mx-auto'>
                <DashItineraries />
            </div>
        </div>
    );
}


