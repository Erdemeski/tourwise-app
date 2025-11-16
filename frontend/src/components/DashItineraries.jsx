import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge, Button, Card, Modal, Spinner } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function DashItineraries() {
    const { currentUser } = useSelector((state) => state.user);
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [itineraryToDelete, setItineraryToDelete] = useState(null);
    const [error, setError] = useState(null);
    const [pendingVisibility, setPendingVisibility] = useState(null);

    const fetchItineraries = async () => {
        if (!currentUser?._id) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/itineraries/user/${currentUser._id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load itineraries');
            }
            setItineraries(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, [currentUser?._id]);

    const handleDeleteItinerary = async () => {
        if (!itineraryToDelete) return;
        try {
            const res = await fetch(`/api/itineraries/${itineraryToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete itinerary');
            }
            setItineraries((prev) => prev.filter((item) => item._id !== itineraryToDelete));
        } catch (err) {
            setError(err.message);
        } finally {
            setShowModal(false);
            setItineraryToDelete(null);
        }
    };

    const handleVisibilityToggle = async (itineraryId, visibility) => {
        const nextVisibility = visibility === 'shared' ? 'private' : 'shared';
        try {
            setPendingVisibility(itineraryId);
            const res = await fetch(`/api/itineraries/${itineraryId}/visibility`, {
                method: 'PUT',
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update visibility');
            }
            const updated = await res.json();
            setItineraries((prev) =>
                prev.map((item) => (item._id === itineraryId ? { ...item, visibility: updated.visibility } : item))
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setPendingVisibility(null);
        }
    };

    if (loading) {
        return (
            <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
                <Spinner size='xl' />
                <p className='text-center text-gray-500 m-2'>Loading...</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-4 md:mx-auto pt-3 relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-6 sm:py-10 lg:px-8'>
            <div className='flex justify-between items-center'>
                <h2 className='text-3xl font-semibold text-gray-800 dark:text-gray-100'>My Itineraries</h2>
                <Link to='/explore'>
                    <Button color='light'>Find new routes</Button>
                </Link>
            </div>

            {error && <p className='text-red-500 text-sm'>{error}</p>}

            {itineraries.length > 0 ? (
                <div className={`grid grid-cols-1 ${itineraries.length === 1 ? 'xl:grid-cols-1' : 'xl:grid-cols-2'} gap-4`}>
                    {itineraries.map((itinerary) => (
                        <Card key={itinerary._id} className='hover:shadow-lg transition-shadow duration-300 relative'>
                            <div className='flex justify-between mb-2 text-sm text-gray-500 dark:text-gray-400'>
                                <span>{new Date(itinerary.updatedAt).toLocaleString()}</span>
                                <Badge color={itinerary.visibility === 'shared' ? 'success' : 'gray'}>
                                    {itinerary.visibility}
                                </Badge>
                            </div>
                            <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1'>{itinerary.title}</h3>
                            <p className='text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3'>{itinerary.summary}</p>
                            <div className='flex flex-wrap gap-2 mb-4'>
                                {itinerary.tags?.map((tag) => (
                                    <Badge key={tag} color='info' size='sm'>
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    size='xs'
                                    color='light'
                                    onClick={() => handleVisibilityToggle(itinerary._id, itinerary.visibility)}
                                    isProcessing={pendingVisibility === itinerary._id}
                                >
                                    {itinerary.visibility === 'shared' ? 'Make private' : 'Share publicly'}
                                </Button>
                                <Link to={`/routes/${itinerary.routeId}`}>
                                    <Button size='xs' color='info'>
                                        View source route
                                    </Button>
                                </Link>
                                <Button
                                    size='xs'
                                    color='failure'
                                    onClick={() => {
                                        setItineraryToDelete(itinerary._id);
                                        setShowModal(true);
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className='text-center text-gray-500 dark:text-gray-400 text-sm py-10'>
                    You have not saved any itineraries yet.
                </p>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Delete this itinerary?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDeleteItinerary}>Yes, delete</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

