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
            const res = await fetch('/api/itineraries', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load itineraries');
            }
            setItineraries(data.itineraries || []);
            setStats({
                total: data.totalItineraries || 0,
                lastMonth: data.lastMonthItineraries || 0,
            });
            setFiltered(data.itineraries || []);
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
            console.log(itineraries);
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

    const handleVisibilityToggle = async (itineraryId, visibility) => {
        try {
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
                prev.map((item) =>
                    item._id === itineraryId ? { ...item, visibility: updated.visibility } : item
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

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
                    <h3 className='text-sm text-gray-500 uppercase'>Shared this month</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.lastMonth}</p>
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
                        <Table.HeadCell>Visibility</Table.HeadCell>
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
                                        <Badge color={itinerary.visibility === 'shared' ? 'success' : 'gray'}>
                                            {itinerary.visibility}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={itinerary.status === 'published' ? 'info' : itinerary.status === 'archived' ? 'failure' : 'gray'}>
                                            {itinerary.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell className='flex justify-end gap-2'>
                                        <Button
                                            size='xs'
                                            color='light'
                                            onClick={() => handleVisibilityToggle(itinerary._id, itinerary.visibility)}
                                        >
                                            {itinerary.visibility === 'shared' ? 'Make private' : 'Share'}
                                        </Button>
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

