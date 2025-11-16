import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge, Button, Modal, Spinner, Table } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function DashRoutes() {
    const { currentUser } = useSelector((state) => state.user);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMore, setShowMore] = useState(true);
    const [pendingVisibility, setPendingVisibility] = useState(null);
    const [routeToDelete, setRouteToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);

    const fetchRoutes = async (append = false) => {
        try {
            const startIndex = append ? routes.length : 0;
            const query = `/api/routes?userId=${currentUser._id}&visibility=all&order=desc&startIndex=${startIndex}`;
            const res = await fetch(query, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load routes');
            }
            const fetchedRoutes = data.routes || [];
            setRoutes((prev) => (append ? [...prev, ...fetchedRoutes] : fetchedRoutes));
            setShowMore(fetchedRoutes.length >= 9);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?._id) {
            fetchRoutes();
        }
    }, [currentUser?._id]);

    const handleDeleteRoute = async () => {
        if (!routeToDelete) return;
        try {
            const res = await fetch(`/api/routes/${routeToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete route');
            }
            setRoutes((prev) => prev.filter((route) => route._id !== routeToDelete));
        } catch (err) {
            setError(err.message);
        } finally {
            setShowModal(false);
            setRouteToDelete(null);
        }
    };

    const handleVisibilityToggle = async (routeId, visibility) => {
        const nextVisibility = visibility === 'public' ? 'private' : 'public';
        try {
            setPendingVisibility(routeId);
            const res = await fetch(`/api/routes/${routeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ visibility: nextVisibility }),
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Unable to update visibility');
            }
            const updatedRoute = await res.json();
            setRoutes((prev) =>
                prev.map((route) =>
                    route._id === routeId ? { ...route, visibility: updatedRoute.visibility } : route
                )
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
        <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>My Routes</h2>
                <Link to='/routes/create'>
                    <Button gradientDuoTone='greenToBlue'>Create new route</Button>
                </Link>
            </div>

            {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

            {routes.length > 0 ? (
                <>
                    <Table hoverable className='shadow-md'>
                        <Table.Head>
                            <Table.HeadCell>Updated</Table.HeadCell>
                            <Table.HeadCell>Title</Table.HeadCell>
                            <Table.HeadCell>Visibility</Table.HeadCell>
                            <Table.HeadCell>Likes</Table.HeadCell>
                            <Table.HeadCell>Forks</Table.HeadCell>
                            <Table.HeadCell className='text-center'>Actions</Table.HeadCell>
                        </Table.Head>
                        {routes.map((route) => (
                            <Table.Body key={route._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell>{new Date(route.updatedAt).toLocaleString()}</Table.Cell>
                                    <Table.Cell>
                                        <Link className='font-medium text-gray-900 dark:text-white hover:underline' to={`/routes/${route.slug}`}>
                                            {route.title}
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={route.visibility === 'public' ? 'success' : 'gray'}>
                                            {route.visibility}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>{route.likes?.length || 0}</Table.Cell>
                                    <Table.Cell>{route.forksCount || 0}</Table.Cell>
                                    <Table.Cell>
                                        <div className='flex flex-wrap gap-2 justify-end'>
                                            <Button
                                                size='xs'
                                                color='light'
                                                onClick={() => handleVisibilityToggle(route._id, route.visibility)}
                                                isProcessing={pendingVisibility === route._id}
                                            >
                                                Make {route.visibility === 'public' ? 'private' : 'public'}
                                            </Button>
                                            <Link to={`/routes/${route._id}/edit`}>
                                                <Button size='xs' color='info'>
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                size='xs'
                                                color='failure'
                                                onClick={() => {
                                                    setRouteToDelete(route._id);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        ))}
                    </Table>
                    {showMore && (
                        <button onClick={() => fetchRoutes(true)} className='w-full text-teal-500 self-center text-sm py-7'>
                            Show more
                        </button>
                    )}
                </>
            ) : (
                <p className='text-gray-600 dark:text-gray-400 text-sm text-center py-10'>
                    You have not published any routes yet.
                </p>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Delete this route?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDeleteRoute}>Yes, delete</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

