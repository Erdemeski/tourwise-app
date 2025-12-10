import React, { useEffect } from 'react';
import DashItineraries from '../components/DashItineraries';

export default function MyItinerariesPage() {
    // Prevent body scroll for full-screen map experience
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return <DashItineraries />;
}
