import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Alert,
    Badge,
    Button,
    Card,
    Label,
    Modal,
    Select,
    Spinner,
    TextInput,
    Textarea
} from 'flowbite-react';
import { Link } from 'react-router-dom';
import {
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineExclamationCircle,
    HiOutlineMap,
    HiOutlinePencilSquare,
    HiOutlineSparkles,
    HiOutlineTrash
} from 'react-icons/hi2';
import ItineraryMap from './ItineraryMap';

const formatDate = (value) => {
    try {
        return new Date(value).toLocaleString();
    } catch (error) {
        return value;
    }
};

const sanitizeCommaSeparated = (value = '') =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const statusColor = {
    draft: 'gray',
    published: 'info',
    archived: 'failure',
};

export default function DashItineraries() {
    const { currentUser } = useSelector((state) => state.user);
    const [itineraries, setItineraries] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [generatorForm, setGeneratorForm] = useState({
        prompt: '',
        durationDays: 1,
        travelStyles: '',
        startingCity: '',
        mustInclude: '',
        exclude: '',
    });
    const [generatorLoading, setGeneratorLoading] = useState(false);
    const [generatorError, setGeneratorError] = useState(null);

    const [editDraft, setEditDraft] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const [deleteState, setDeleteState] = useState({ open: false, id: null });
    const [chatState, setChatState] = useState({
        open: false,
        stop: null,
        question: '',
        answer: null,
        loading: false,
        error: null,
    });

    const fetchItineraries = async () => {
        if (!currentUser?._id) return;
        try {
            setListLoading(true);
            setListError(null);
            const res = await fetch('/api/ai/itineraries?view=compact', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Itineraries could not be loaded');
            }
            setItineraries(data);
            if (!selectedId && data.length) {
                setSelectedId(data[0]._id);
            }
        } catch (error) {
            setListError(error.message);
        } finally {
            setListLoading(false);
        }
    };

    const fetchItineraryDetail = async (id) => {
        if (!id) {
            setSelected(null);
            setEditDraft(null);
            return;
        }
        try {
            setDetailLoading(true);
            setDetailError(null);
            const res = await fetch(`/api/ai/itineraries/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Unable to load itinerary');
            }
            setSelected(data);
            setEditDraft({
                title: data.title || '',
                summary: data.summary || '',
                tags: data.tags?.join(', ') || '',
                visibility: data.visibility || 'private',
            });
        } catch (error) {
            setDetailError(error.message);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, [currentUser?._id]);

    useEffect(() => {
        fetchItineraryDetail(selectedId);
    }, [selectedId]);

    const handleGenerateItinerary = async () => {
        if (!generatorForm.prompt.trim()) {
            setGeneratorError('Prompt is required');
            return;
        }
        try {
            setGeneratorLoading(true);
            setGeneratorError(null);

            const payload = {
                prompt: generatorForm.prompt.trim(),
                preferences: {
                    durationDays: Number(generatorForm.durationDays) || undefined,
                    travelStyles: sanitizeCommaSeparated(generatorForm.travelStyles),
                    startingCity: generatorForm.startingCity || undefined,
                    mustInclude: sanitizeCommaSeparated(generatorForm.mustInclude),
                    exclude: sanitizeCommaSeparated(generatorForm.exclude),
                },
            };

            const res = await fetch('/api/ai/itineraries/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate itinerary');
            }

            setItineraries((prev) => [data, ...prev]);
            setSelectedId(data._id);
            setGeneratorOpen(false);
            setGeneratorForm({
                prompt: '',
                durationDays: 4,
                travelStyles: '',
                startingCity: '',
                mustInclude: '',
                exclude: '',
            });
        } catch (error) {
            setGeneratorError(error.message);
        } finally {
            setGeneratorLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!selected?._id) return;
        try {
            setSaveLoading(true);
            setSaveError(null);
            const payload = {
                title: editDraft.title.trim(),
                summary: editDraft.summary.trim(),
                tags: sanitizeCommaSeparated(editDraft.tags),
                visibility: editDraft.visibility,
            };

            const res = await fetch(`/api/ai/itineraries/${selected._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to save itinerary');
            }
            setSelected(data);
            setItineraries((prev) =>
                prev.map((item) => (item._id === data._id ? { ...item, ...data } : item))
            );
        } catch (error) {
            setSaveError(error.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteState.id) return;
        try {
            const res = await fetch(`/api/ai/itineraries/${deleteState.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok && res.status !== 204) {
                const data = await res.json();
                throw new Error(data.message || 'Unable to delete itinerary');
            }
            setItineraries((prev) => prev.filter((item) => item._id !== deleteState.id));
            if (selectedId === deleteState.id) {
                setSelectedId(null);
                setSelected(null);
            }
        } catch (error) {
            setListError(error.message);
        } finally {
            setDeleteState({ open: false, id: null });
        }
    };

    const openChatForStop = (stop) => {
        setChatState({
            open: true,
            stop,
            question: `What else should I know about ${stop?.name}?`,
            answer: null,
            loading: false,
            error: null,
        });
    };

    const handleAskQuestion = async () => {
        if (!chatState.stop || !chatState.question.trim()) return;
        try {
            setChatState((prev) => ({ ...prev, loading: true, error: null, answer: null }));
            const payload = {
                poiId: chatState.stop?.id,
                question: chatState.question.trim(),
                context: {
                    name: chatState.stop?.name,
                    summary: chatState.stop?.description,
                    location: chatState.stop?.location,
                },
            };
            const res = await fetch('/api/ai/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Unable to contact AI assistant');
            }
            setChatState((prev) => ({ ...prev, answer: data.answer, loading: false }));
        } catch (error) {
            setChatState((prev) => ({ ...prev, error: error.message, loading: false }));
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceDayNum = parseInt(source.droppableId.replace('day-', ''));
        const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

        // Deep copy for optimistic update
        const newItinerary = JSON.parse(JSON.stringify(selected));
        
        const sourceDay = newItinerary.days.find(d => d.dayNumber === sourceDayNum);
        const destDay = newItinerary.days.find(d => d.dayNumber === destDayNum);

        if (!sourceDay || !destDay) return;

        const [movedStop] = sourceDay.stops.splice(source.index, 1);
        destDay.stops.splice(destination.index, 0, movedStop);

        setSelected(newItinerary);

        try {
            let url = '';
            let body = {};

            if (sourceDayNum === destDayNum) {
                 url = `/api/ai/itineraries/${selected._id}/reorder`;
                 body = {
                    dayNumber: sourceDayNum,
                    oldIndex: source.index,
                    newIndex: destination.index
                 };
            } else {
                 url = `/api/ai/itineraries/${selected._id}/move`;
                 body = {
                    fromDay: sourceDayNum,
                    toDay: destDayNum,
                    fromIndex: source.index,
                    toIndex: destination.index
                 };
            }

            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                 // Revert on error by reloading
                 fetchItineraryDetail(selected._id);
                 const data = await res.json();
                 setDetailError(data.message || "Failed to update order");
            }
        } catch (error) {
            console.error(error);
            fetchItineraryDetail(selected._id);
            setDetailError("Network error during reorder");
        }
    };

    const stopCount = useMemo(() => {
        if (!selected?.days?.length) return 0;
        return selected.days.reduce((acc, day) => acc + (day?.stops?.length || 0), 0);
    }, [selected]);

    if (listLoading) {
        return (
            <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
                <Spinner size='xl' />
                <p className='text-center text-gray-500 m-2'>Loading your itineraries…</p>
            </div>
        );
    }

    return (
        <div className='grid lg:grid-cols-[380px_1fr] gap-6 w-full px-4 lg:px-8 py-6 bg-white dark:bg-[rgb(22,26,29)]'>
            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-50'>AI itineraries</h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Drafts generated for Google Maps routes
                        </p>
                    </div>
                    <Button gradientDuoTone='purpleToBlue' size='sm' onClick={() => setGeneratorOpen(true)}>
                        <HiOutlineSparkles className='mr-2 h-4 w-4' />
                        Generate
                    </Button>
                </div>

                {listError && <Alert color='failure'>{listError}</Alert>}

                {itineraries.length === 0 && !listError ? (
                    <Card className='shadow-md border-dashed border-2 border-gray-200 dark:border-gray-700'>
                        <p className='text-sm text-gray-600 dark:text-gray-300'>
                            You have not created any AI itineraries yet. Click Generate to craft one with your prompt.
                        </p>
                    </Card>
                ) : (
                    <div className='space-y-3 max-h-[70vh] overflow-y-auto pr-2'>
                        {itineraries.map((item) => (
                            <Card
                                key={item._id}
                                onClick={() => setSelectedId(item._id)}
                                className={`cursor-pointer transition-all ${
                                    selectedId === item._id
                                        ? 'ring-2 ring-purple-500'
                                        : 'hover:ring-1 hover:ring-gray-200'
                                }`}
                            >
                                <div className='flex items-start justify-between gap-2'>
                                    <div>
                                        <p className='text-xs text-gray-500'>{formatDate(item.updatedAt)}</p>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                                            {item.title}
                                        </h3>
                                    </div>
                                    <Badge color={statusColor[item.status] || 'gray'}>{item.status}</Badge>
                                </div>
                                <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3'>{item.summary}</p>
                                <div className='flex flex-wrap gap-2'>
                                    {(item.tags || []).slice(0, 3).map((tag) => (
                                        <Badge key={tag} color='info' size='sm'>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className='space-y-4'>
                {detailError && <Alert color='failure'>{detailError}</Alert>}
                {detailLoading && (
                    <Card>
                        <div className='flex items-center gap-3'>
                            <Spinner size='sm' />
                            <p className='text-sm text-gray-600 dark:text-gray-300'>Loading details…</p>
                        </div>
                    </Card>
                )}
                {!detailLoading && selected && (
                    <>
                        <Card className='shadow-lg'>
                            <div className='flex flex-wrap gap-3 items-start justify-between'>
                                <div>
                                    <div className='flex gap-2 items-center'>
                                        <Badge color={selected.visibility === 'shared' ? 'success' : 'gray'}>
                                            {selected.visibility}
                                        </Badge>
                                        <Badge color={statusColor[selected.status] || 'gray'}>
                                            {selected.status}
                                        </Badge>
                                    </div>
                                    <h3 className='text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-2'>
                                        {selected.title}
                                    </h3>
                                    <p className='text-sm text-gray-500 mt-1'>
                                        {selected.durationDays || '?'} days • {stopCount} stops
                                    </p>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    <Link to={`/dashboard?tab=my-routes&itinerary=${selected._id}`}>
                                        <Button color='success' size='sm'>
                                            Share via My Routes
                                        </Button>
                                    </Link>
                                    <Button
                                        color='failure'
                                        size='sm'
                                        onClick={() => setDeleteState({ open: true, id: selected._id })}
                                    >
                                        <HiOutlineTrash className='mr-2 h-4 w-4' />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                            {selected.publishedRouteId && (
                                <Alert color='success' className='mt-4'>
                                    This itinerary is already published as a route. Manage additional details inside the{' '}
                                    <Link className='underline font-medium' to='/dashboard?tab=my-routes'>
                                        My Routes
                                    </Link>{' '}
                                    tab.
                                </Alert>
                            )}
                            <div className='grid md:grid-cols-2 gap-4 mt-6'>
                                <div>
                                    <Label>Title</Label>
                                    <TextInput
                                        value={editDraft?.title || ''}
                                        onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Visibility</Label>
                                    <Select
                                        value={editDraft?.visibility || 'private'}
                                        onChange={(e) =>
                                            setEditDraft((prev) => ({ ...prev, visibility: e.target.value }))
                                        }
                                    >
                                        <option value='private'>Private</option>
                                        <option value='shared'>Shared</option>
                                    </Select>
                                </div>
                                <div className='md:col-span-2'>
                                    <Label>Summary</Label>
                                    <Textarea
                                        rows={3}
                                        value={editDraft?.summary || ''}
                                        onChange={(e) => setEditDraft((prev) => ({ ...prev, summary: e.target.value }))}
                                    />
                                </div>
                                <div className='md:col-span-2'>
                                    <Label>Tags (comma separated)</Label>
                                    <TextInput
                                        value={editDraft?.tags || ''}
                                        onChange={(e) => setEditDraft((prev) => ({ ...prev, tags: e.target.value }))}
                                    />
                                </div>
                            </div>
                            {saveError && <p className='text-sm text-red-500 mt-3'>{saveError}</p>}
                            <Button
                                gradientDuoTone='greenToBlue'
                                className='mt-4'
                                onClick={handleSaveChanges}
                                isProcessing={saveLoading}
                            >
                                <HiOutlinePencilSquare className='mr-2 h-4 w-4' />
                                Save changes
                            </Button>
                        </Card>

                        <Card>
                            <div className='flex items-center gap-2 mb-3'>
                                <HiOutlineMap className='h-5 w-5 text-purple-500' />
                                <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-50'>Route preview</h4>
                            </div>
                            <ItineraryMap days={selected.days} />
                        </Card>

                        <div className='space-y-4'>
                            <DragDropContext onDragEnd={onDragEnd}>
                                {selected.days?.map((day) => (
                                    <Card key={day.dayNumber} className='shadow-sm'>
                                        <div className='flex justify-between items-center'>
                                            <div>
                                                <p className='text-xs text-gray-500'>Day {day.dayNumber}</p>
                                                <h5 className='text-lg font-semibold text-gray-900 dark:text-gray-50'>
                                                    {day.title || `Day ${day.dayNumber}`}
                                                </h5>
                                                <p className='text-sm text-gray-600 dark:text-gray-300'>{day.summary}</p>
                                            </div>
                                            <Badge color='purple'>{day.stops?.length || 0} stops</Badge>
                                        </div>
                                        
                                        <Droppable droppableId={`day-${day.dayNumber}`}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className='mt-4 space-y-3 min-h-[20px]'
                                                >
                                                    {day.stops?.map((stop, index) => (
                                                        <Draggable 
                                                            key={stop._id || `${day.dayNumber}-${index}-${stop.name}`} 
                                                            draggableId={stop._id || `${day.dayNumber}-${index}-${stop.name}`} 
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 bg-white dark:bg-gray-800 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-purple-500 z-10' : ''}`}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                >
                                                                    <div className='flex items-start justify-between gap-2'>
                                                                        <div>
                                                                            <p className='font-medium text-gray-900 dark:text-gray-50'>
                                                                                {stop.name}
                                                                            </p>
                                                                            <p className='text-xs text-gray-500'>
                                                                                {stop.location?.city || stop.location?.address || '—'}
                                                                            </p>
                                                                        </div>
                                                                        <Button
                                                                            size='xs'
                                                                            color='light'
                                                                            onClick={() => openChatForStop(stop)}
                                                                        >
                                                                            <HiOutlineChatBubbleBottomCenterText className='mr-1 h-4 w-4' />
                                                                            Ask AI
                                                                        </Button>
                                                                    </div>
                                                                    {stop.description && (
                                                                        <p className='text-sm text-gray-600 dark:text-gray-300'>
                                                                            {stop.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </Card>
                                ))}
                            </DragDropContext>
                        </div>
                    </>
                )}
            </div>

            <Modal show={generatorOpen} onClose={() => setGeneratorOpen(false)}>
                <Modal.Header>Create an AI itinerary</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <div>
                            <Label htmlFor='prompt'>Prompt</Label>
                            <Textarea
                                id='prompt'
                                rows={4}
                                placeholder='3 days in Cappadocia focused on sunrise hikes and local cuisine…'
                                value={generatorForm.prompt}
                                onChange={(e) => setGeneratorForm((prev) => ({ ...prev, prompt: e.target.value }))}
                            />
                        </div>
                        <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                                <Label>Duration (days)</Label>
                                <Select
                                    value={generatorForm.durationDays}
                                    onChange={(e) =>
                                        setGeneratorForm((prev) => ({ ...prev, durationDays: Number(e.target.value) }))
                                    }
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((day) => (
                                        <option key={day} value={day}>
                                            {day} days
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Starting city (optional)</Label>
                                <TextInput
                                    value={generatorForm.startingCity}
                                    onChange={(e) =>
                                        setGeneratorForm((prev) => ({ ...prev, startingCity: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Travel styles</Label>
                            <TextInput
                                placeholder='foodie, family, adventure'
                                value={generatorForm.travelStyles}
                                onChange={(e) =>
                                    setGeneratorForm((prev) => ({ ...prev, travelStyles: e.target.value }))
                                }
                            />
                        </div>
                        <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                                <Label>Must include</Label>
                                <TextInput
                                    placeholder='balloon ride, coffee shop'
                                    value={generatorForm.mustInclude}
                                    onChange={(e) =>
                                        setGeneratorForm((prev) => ({ ...prev, mustInclude: e.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>Exclude</Label>
                                <TextInput
                                    placeholder='nightlife, museums'
                                    value={generatorForm.exclude}
                                    onChange={(e) =>
                                        setGeneratorForm((prev) => ({ ...prev, exclude: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        {generatorError && <p className='text-sm text-red-500'>{generatorError}</p>}
                        <div className='flex justify-end gap-3'>
                            <Button color='gray' onClick={() => setGeneratorOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerateItinerary} isProcessing={generatorLoading}>
                                <HiOutlineSparkles className='mr-2 h-4 w-4' />
                                Generate itinerary
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={deleteState.open} onClose={() => setDeleteState({ open: false, id: null })} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
                            Delete this itinerary draft?
                        </h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDelete}>
                                Yes, delete
                            </Button>
                            <Button color='gray' onClick={() => setDeleteState({ open: false, id: null })}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={chatState.open} onClose={() => setChatState((prev) => ({ ...prev, open: false }))}>
                <Modal.Header>Ask TourWise AI</Modal.Header>
                <Modal.Body>
                    {chatState.stop && (
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs uppercase text-gray-500'>Selected stop</p>
                                <p className='text-lg font-semibold text-gray-900 dark:text-gray-50'>
                                    {chatState.stop.name}
                                </p>
                                <p className='text-sm text-gray-500'>
                                    {chatState.stop.location?.city || chatState.stop.location?.address}
                                </p>
                            </div>
                            <div>
                                <Label>Question</Label>
                                <Textarea
                                    rows={3}
                                    value={chatState.question}
                                    onChange={(e) =>
                                        setChatState((prev) => ({ ...prev, question: e.target.value }))
                                    }
                                />
                            </div>
                            {chatState.error && <Alert color='failure'>{chatState.error}</Alert>}
                            {chatState.answer && (
                                <Alert color='success'>
                                    <p className='whitespace-pre-line text-sm'>{chatState.answer}</p>
                                </Alert>
                            )}
                            <div className='flex justify-end gap-3'>
                                <Button color='gray' onClick={() => setChatState((prev) => ({ ...prev, open: false }))}>
                                    Close
                                </Button>
                                <Button onClick={handleAskQuestion} isProcessing={chatState.loading}>
                                    Ask AI
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
