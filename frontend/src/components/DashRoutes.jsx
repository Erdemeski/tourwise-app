import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Badge, Button, Label, Modal, Select, Spinner, Table, TextInput, Textarea } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function DashRoutes() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMore, setShowMore] = useState(true);
    const [pendingVisibility, setPendingVisibility] = useState(null);
    const [routeToDelete, setRouteToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);
    const [aiItineraries, setAiItineraries] = useState([]);
    const [shareForm, setShareForm] = useState({
        itineraryId: '',
        title: '',
        summary: '',
        visibility: 'public',
        tags: '',
        highlights: '',
        tips: '',
    });
    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [shareSuccess, setShareSuccess] = useState(null);

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

    const fetchAiItineraries = async () => {
        try {
            const res = await fetch('/api/ai/itineraries?view=compact', { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setAiItineraries(data || []);
            }
        } catch (err) {
            console.log(err.message);
        }
    };

    useEffect(() => {
        if (currentUser?._id) {
            fetchRoutes();
            fetchAiItineraries();
        }
    }, [currentUser?._id]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const itineraryParam = params.get('itinerary');
        if (itineraryParam) {
            setShareForm((prev) => ({ ...prev, itineraryId: itineraryParam }));
        }
    }, [location.search]);

    useEffect(() => {
        if (!shareForm.itineraryId) return;
        const itinerary = aiItineraries.find((item) => item._id === shareForm.itineraryId);
        if (itinerary) {
            setShareForm((prev) => ({
                ...prev,
                title: itinerary.title || prev.title,
                summary: itinerary.summary || prev.summary,
                tags: (itinerary.tags || []).join(', '),
            }));
        }
    }, [shareForm.itineraryId, aiItineraries]);

    const sanitizeCommaSeparated = (value = '') =>
        value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

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

    const handleShareSubmit = async (e) => {
        e.preventDefault();
        if (!shareForm.itineraryId) {
            setShareError('Select an itinerary to publish');
            return;
        }
        if (!shareForm.title.trim() || !shareForm.summary.trim()) {
            setShareError('Title and summary are required');
            return;
        }
        try {
            setShareLoading(true);
            setShareError(null);
            setShareSuccess(null);

            const payload = {
                itineraryId: shareForm.itineraryId,
                title: shareForm.title.trim(),
                summary: shareForm.summary.trim(),
                visibility: shareForm.visibility,
                tags: sanitizeCommaSeparated(shareForm.tags),
                highlights: shareForm.highlights,
                tips: shareForm.tips,
                sharePublicly: shareForm.visibility === 'public',
            };

            const res = await fetch('/api/routes/from-itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to publish itinerary');
            }

            setShareSuccess(`Route published! You can now customize it at /routes/${data.slug}`);
            setShareForm((prev) => ({ ...prev, highlights: '', tips: '' }));
            fetchRoutes();
        } catch (err) {
            setShareError(err.message);
        } finally {
            setShareLoading(false);
        }
    };

    const shareButtonDisabled = useMemo(() => !shareForm.itineraryId || shareLoading, [shareForm.itineraryId, shareLoading]);

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

            <div className='mb-6'>
                <form className='grid gap-4 lg:grid-cols-2 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30' onSubmit={handleShareSubmit}>
                    <div className='lg:col-span-2 flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-semibold text-gray-800 dark:text-gray-100'>Share AI itinerary</p>
                            <p className='text-xs text-gray-500'>
                                Pick an AI draft and add extra context before publishing it as a route.
                            </p>
                        </div>
                        <Link to='/dashboard?tab=my-itineraries'>
                            <Button color='light' size='xs'>Manage drafts</Button>
                        </Link>
                    </div>
                    <div>
                        <Label>Itinerary draft</Label>
                        <Select
                            value={shareForm.itineraryId}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, itineraryId: e.target.value }))}
                        >
                            <option value=''>Select itinerary</option>
                            {aiItineraries.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.title}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label>Visibility</Label>
                        <Select
                            value={shareForm.visibility}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, visibility: e.target.value }))}
                        >
                            <option value='public'>Public</option>
                            <option value='private'>Private</option>
                            <option value='unlisted'>Unlisted</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Title</Label>
                        <TextInput
                            value={shareForm.title}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label>Tags</Label>
                        <TextInput
                            placeholder='family, foodie, adventure'
                            value={shareForm.tags}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, tags: e.target.value }))}
                        />
                    </div>
                    <div className='lg:col-span-2'>
                        <Label>Summary</Label>
                        <Textarea
                            rows={3}
                            value={shareForm.summary}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, summary: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label>Highlights (optional)</Label>
                        <Textarea
                            rows={2}
                            value={shareForm.highlights}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, highlights: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label>Tips (optional)</Label>
                        <Textarea
                            rows={2}
                            value={shareForm.tips}
                            onChange={(e) => setShareForm((prev) => ({ ...prev, tips: e.target.value }))}
                        />
                    </div>
                    {shareError && (
                        <div className='lg:col-span-2'>
                            <Alert color='failure'>{shareError}</Alert>
                        </div>
                    )}
                    {shareSuccess && (
                        <div className='lg:col-span-2'>
                            <Alert color='success'>{shareSuccess}</Alert>
                        </div>
                    )}
                    <div className='lg:col-span-2 flex justify-end'>
                        <Button type='submit' disabled={shareButtonDisabled} isProcessing={shareLoading}>
                            Publish as route
                        </Button>
                    </div>
                </form>
            </div>

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

