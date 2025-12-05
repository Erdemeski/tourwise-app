import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge, Button, Card, Modal, Spinner, Table, TextInput } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function DashItineraryModeration() {
    const { currentUser } = useSelector((state) => state.user);
    const [itineraries, setItineraries] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [usersLookup, setUsersLookup] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, lastMonth: 0 });
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [itineraryToDelete, setItineraryToDelete] = useState(null);
    const [error, setError] = useState(null);
    const [statusLoading, setStatusLoading] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/user/getusers', { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                const lookup = {};
                (data.users || []).forEach((user) => {
                    lookup[user._id] = user;
                });
                setUsersLookup(lookup);
            }
        } catch (err) {
            console.log(err.message);
        }
    };

    const fetchItineraries = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch all AI itineraries for admin moderation
            const res = await fetch('/api/ai/itineraries', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load itineraries');
            }
            const allItineraries = Array.isArray(data) ? data : (data.itineraries || []);
            setItineraries(allItineraries);
            
            // Calculate stats
            const now = new Date();
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const lastMonthFinished = allItineraries.filter(
                (item) => item.status === 'finished' && new Date(item.createdAt) >= oneMonthAgo
            ).length;
            
            setStats({
                total: allItineraries.length,
                lastMonth: lastMonthFinished,
            });
            setFiltered(allItineraries);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.isAdmin) {
            fetchUsers();
            fetchItineraries();
        } else {
            setLoading(false);
        }
    }, [currentUser?.isAdmin]);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(itineraries);
            return;
        }
        const term = search.toLowerCase();
        setFiltered(
            itineraries.filter((itinerary) => {
                const owner = usersLookup[itinerary.userId];
                return (
                    itinerary.title?.toLowerCase().includes(term) ||
                    itinerary.summary?.toLowerCase().includes(term) ||
                    owner?.username?.toLowerCase().includes(term)
                );
            })
        );
    }, [search, itineraries, usersLookup]);

    const handleStatusToggle = async (itineraryId, status) => {
        // Toggle between draft and finished, or restore from archived
        let nextStatus;
        if (status === 'finished') {
            nextStatus = 'draft';
        } else if (status === 'archived') {
            nextStatus = 'finished';
        } else {
            nextStatus = 'finished';
        }
        
        try {
            setStatusLoading(itineraryId);
            setError(null);
            const res = await fetch(`/api/ai/itineraries/${itineraryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update status');
            }
            setItineraries((prev) =>
                prev.map((item) =>
                    item._id === itineraryId ? { ...item, status: data.status } : item
                )
            );
            setFiltered((prev) =>
                prev.map((item) =>
                    item._id === itineraryId ? { ...item, status: data.status } : item
                )
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusLoading(null);
        }
    };

    const handleDeleteItinerary = async () => {
        if (!itineraryToDelete) return;
        try {
            setError(null);
            const res = await fetch(`/api/ai/itineraries/${itineraryToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok && res.status !== 204) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete itinerary');
            }
            setItineraries((prev) => prev.filter((item) => item._id !== itineraryToDelete));
            setFiltered((prev) => prev.filter((item) => item._id !== itineraryToDelete));
        } catch (err) {
            setError(err.message);
        } finally {
            setShowModal(false);
            setItineraryToDelete(null);
        }
    };

    if (!currentUser?.isAdmin) {
        return (
            <p className='text-center text-gray-500 dark:text-gray-400 mt-10'>
                You do not have permission to view this section.
            </p>
        );
    }

    if (loading) {
        return (
            <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
                <Spinner size='xl' />
                <p className='text-center text-gray-500 m-2'>Loading...</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-6 md:mx-auto pt-3 relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-6 sm:py-10 lg:px-8'>
            <div className='flex flex-wrap justify-center gap-4'>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Total itineraries</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.total}</p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Finished this month</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.lastMonth}</p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Finished</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                        {itineraries.filter((item) => item.status === 'finished').length}
                    </p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Draft</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                        {itineraries.filter((item) => item.status === 'draft' || !item.status).length}
                    </p>
                </Card>
            </div>

            {error && <p className='text-red-500 text-sm text-center'>{error}</p>}

            <div className='max-w-md mx-auto w-full'>
                <TextInput
                    placeholder='Search by title or owner...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filtered.length > 0 ? (
                <Table hoverable className='shadow-md'>
                    <Table.Head>
                        <Table.HeadCell shared='true'>Updated</Table.HeadCell>
                        <Table.HeadCell>Title</Table.HeadCell>
                        <Table.HeadCell>Owner</Table.HeadCell>
                        <Table.HeadCell>Source</Table.HeadCell>
                        <Table.HeadCell>Status</Table.HeadCell>
                        <Table.HeadCell className='text-center'>Actions</Table.HeadCell>
                    </Table.Head>
                    {filtered.map((itinerary) => {
                        const owner = usersLookup[itinerary.userId];
                        return (
                            <Table.Body key={itinerary._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell>{new Date(itinerary.updatedAt).toLocaleString()}</Table.Cell>
                                    <Table.Cell className='max-w-xs'>
                                        <p className='font-medium text-gray-900 dark:text-white line-clamp-2'>{itinerary.title}</p>
                                        <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>{itinerary.summary}</p>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {owner ? `@${owner.username}` : itinerary.userId}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={itinerary.source === 'ai' ? 'purple' : 'blue'}>
                                            {itinerary.source || 'route'}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={
                                            itinerary.status === 'finished' ? 'info' :
                                            itinerary.status === 'archived' ? 'failure' : 'gray'
                                        }>
                                            {itinerary.status || 'draft'}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell className='flex justify-end gap-2'>
                                        {itinerary.status !== 'archived' && (
                                            <Button
                                                size='xs'
                                                color='light'
                                                onClick={() => handleStatusToggle(itinerary._id, itinerary.status)}
                                                isProcessing={statusLoading === itinerary._id}
                                            >
                                                {itinerary.status === 'finished' ? 'Make draft' : 'Make finished'}
                                            </Button>
                                        )}
                                        {itinerary.status === 'archived' && (
                                            <Button
                                                size='xs'
                                                color='light'
                                                onClick={() => handleStatusToggle(itinerary._id, 'archived')}
                                                isProcessing={statusLoading === itinerary._id}
                                            >
                                                Restore to finished
                                            </Button>
                                        )}
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
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        );
                    })}
                </Table>
            ) : (
                <p className='text-center text-gray-500 dark:text-gray-400 text-sm py-10'>
                    No itineraries found for the selected filters.
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

