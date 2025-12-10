import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Sparkles,
    Trash2,
    PencilLine,
    MessageCircleWarning,
    ChevronRight,
    Calendar,
    Clock,
    DollarSign,
    Tag,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    GripVertical,
    Share2,
    List,
    Send,
    Wand2,
    Info,
    X,
    Navigation,
    Star,
    ExternalLink,
    History,
    Ticket,
    Camera,
} from 'lucide-react';

// shadcn components
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from './ui/drawer';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

import FullScreenItineraryMap from './FullScreenItineraryMap';
import { ShinyButton } from './ui/shiny-button';
import { RainbowButton } from './ui/rainbow-button';

const formatDate = (value) => {
    try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return value;
    }
};

const sanitizeCommaSeparated = (value = '') =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary', icon: PencilLine },
    finished: { label: 'Finished', variant: 'success', icon: CheckCircle2 },
    archived: { label: 'Archived', variant: 'destructive', icon: AlertCircle },
};

// Chat message component
const ChatMessage = ({ message, isUser }) => (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
            </div>
        )}
        <div
            className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isUser
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md'
                }`}
        >
            <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
    </div>
);

// Quick suggestion button
const QuickSuggestion = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-gray-500 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
        <Icon className="h-3.5 w-3.5" />
        {label}
    </button>
);

export default function DashItineraries() {
    const { currentUser } = useSelector((state) => state.user);

    // List state
    const [itineraries, setItineraries] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);

    // Selection state
    const [selectedId, setSelectedId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // Drawer states
    const [listDrawerOpen, setListDrawerOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

    // Modal states
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [modifyOpen, setModifyOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [locationDetailOpen, setLocationDetailOpen] = useState(false);

    // Form states
    const [generatorForm, setGeneratorForm] = useState({
        prompt: '',
        durationDays: '1',
        travelStyles: '',
        startingCity: '',
        mustInclude: '',
        exclude: '',
    });
    const [modifyPrompt, setModifyPrompt] = useState('');
    const [editDraft, setEditDraft] = useState(null);

    // Loading states
    const [generatorLoading, setGeneratorLoading] = useState(false);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [finishLoading, setFinishLoading] = useState(false);

    // Error states
    const [generatorError, setGeneratorError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [finishError, setFinishError] = useState(null);

    // Chat state
    const [selectedStop, setSelectedStop] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Map interaction
    const [selectedStopId, setSelectedStopId] = useState(null);

    // Scroll to bottom of chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Fetch itineraries
    const fetchItineraries = useCallback(async () => {
        if (!currentUser?._id) return;
        try {
            setListLoading(true);
            setListError(null);
            const res = await fetch('/api/ai/itineraries?view=compact', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Itineraries could not be loaded');
            setItineraries(data);
        } catch (error) {
            setListError(error.message);
        } finally {
            setListLoading(false);
        }
    }, [currentUser?._id]);

    // Fetch itinerary detail
    const fetchItineraryDetail = useCallback(async (id) => {
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
            if (!res.ok) throw new Error(data.message || 'Unable to load itinerary');
            setSelected(data);
            setEditDraft({
                title: data.title || '',
                summary: data.summary || '',
                tags: data.tags?.join(', ') || '',
            });
        } catch (error) {
            setDetailError(error.message);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItineraries();
    }, [fetchItineraries]);

    useEffect(() => {
        if (selectedId) {
            fetchItineraryDetail(selectedId);
        }
    }, [selectedId, fetchItineraryDetail]);

    // Generate itinerary
    const handleGenerateItinerary = async () => {
        if (!generatorForm.prompt.trim()) {
            setGeneratorError('Please describe your trip');
            return;
        }
        try {
            setGeneratorLoading(true);
            setGeneratorError(null);
            // Close dialog immediately when generation starts
            setGeneratorOpen(false);

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
            if (!res.ok) throw new Error(data.message || 'Failed to generate itinerary');

            setItineraries((prev) => [data, ...prev]);
            setSelectedId(data._id);
            setGeneratorForm({
                prompt: '',
                durationDays: '1',
                travelStyles: '',
                startingCity: '',
                mustInclude: '',
                exclude: '',
            });
        } catch (error) {
            setGeneratorError(error.message);
            // Reopen dialog on error so user can see the error message
            setGeneratorOpen(true);
        } finally {
            setGeneratorLoading(false);
        }
    };

    // Save changes
    const handleSaveChanges = async () => {
        if (!selected?._id) return;
        try {
            setSaveLoading(true);
            setSaveError(null);
            const payload = {
                title: editDraft.title.trim(),
                summary: editDraft.summary.trim(),
                tags: sanitizeCommaSeparated(editDraft.tags),
            };

            const res = await fetch(`/api/ai/itineraries/${selected._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save itinerary');

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

    // Mark as finished
    const handleMarkFinished = async () => {
        if (!selected?._id) return;
        try {
            setFinishLoading(true);
            setFinishError(null);
            const res = await fetch(`/api/ai/itineraries/${selected._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'finished' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to mark as finished');

            setSelected(data);
            setItineraries((prev) =>
                prev.map((item) => (item._id === data._id ? { ...item, ...data } : item))
            );
        } catch (error) {
            setFinishError(error.message);
        } finally {
            setFinishLoading(false);
        }
    };

    // Delete itinerary
    const handleDelete = async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(`/api/ai/itineraries/${selectedId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok && res.status !== 204) {
                const data = await res.json();
                throw new Error(data.message || 'Unable to delete itinerary');
            }
            setItineraries((prev) => prev.filter((item) => item._id !== selectedId));
            setSelectedId(null);
            setSelected(null);
            setDetailDrawerOpen(false);
        } catch (error) {
            setListError(error.message);
        } finally {
            setDeleteOpen(false);
        }
    };

    // Modify with AI
    const handleModifyItinerary = async () => {
        if (!modifyPrompt.trim() || !selected?._id) return;

        try {
            setModifyLoading(true);
            // Close dialog immediately when refinement starts
            setModifyOpen(false);
            setDetailDrawerOpen(false);

            const res = await fetch(`/api/ai/itineraries/${selected._id}/modify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ prompt: modifyPrompt }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Modification failed');

            setSelected(data);
            setItineraries((prev) =>
                prev.map((item) => (item._id === data._id ? { ...item, ...data } : item))
            );

            setModifyPrompt('');
        } catch (error) {
            setDetailError(error.message);
            // Reopen dialog on error so user can see the error message
            setModifyOpen(true);
        } finally {
            setModifyLoading(false);
        }
    };

    // Send chat message
    const handleSendMessage = async (question = chatInput) => {
        if (!selectedStop || !question.trim()) return;

        const userMessage = question.trim();
        setChatMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const payload = {
                poiId: selectedStop?.id,
                question: userMessage,
                context: {
                    name: selectedStop?.name,
                    summary: selectedStop?.description,
                    location: selectedStop?.location,
                },
            };
            const res = await fetch('/api/ai/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unable to contact AI assistant');

            setChatMessages(prev => [...prev, { text: data.answer, isUser: false }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { text: `Sorry, I couldn't get an answer: ${error.message}`, isUser: false }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Drag and drop
    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceDayNum = parseInt(source.droppableId.replace('day-', ''));
        const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

        const newItinerary = JSON.parse(JSON.stringify(selected));
        const sourceDay = newItinerary.days.find((d) => d.dayNumber === sourceDayNum);
        const destDay = newItinerary.days.find((d) => d.dayNumber === destDayNum);

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
                    newIndex: destination.index,
                };
            } else {
                url = `/api/ai/itineraries/${selected._id}/move`;
                body = {
                    fromDay: sourceDayNum,
                    toDay: destDayNum,
                    fromIndex: source.index,
                    toIndex: destination.index,
                };
            }

            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                fetchItineraryDetail(selected._id);
                const data = await res.json();
                setDetailError(data.message || 'Failed to update order');
            }
        } catch {
            fetchItineraryDetail(selected._id);
            setDetailError('Network error during reorder');
        }
    };

    const stopCount = useMemo(() => {
        if (!selected?.days?.length) return 0;
        return selected.days.reduce((acc, day) => acc + (day?.stops?.length || 0), 0);
    }, [selected]);

    // Global stop index offsets per day (for cumulative numbering)
    const stopIndexOffsets = useMemo(() => {
        const offsets = {};
        let running = 0;
        (selected?.days || []).forEach((day) => {
            offsets[day.dayNumber] = running;
            running += day?.stops?.length || 0;
        });
        return offsets;
    }, [selected?.days]);

    // Handle map marker click - show location details first
    const handleStopClick = (stop) => {
        setSelectedStopId(stop.id);
        setSelectedStop(stop);
        setLocationDetailOpen(true);
    };

    // Open chat for selected stop
    const openChatForStop = () => {
        setLocationDetailOpen(false);
        setChatMessages([
            {
                text: `Hello! I know everything about ${selectedStop?.name}. Ask me about ticket prices, history, best photo spots, or opening hours.`,
                isUser: false
            }
        ]);
        setChatDrawerOpen(true);
    };

    const handleSelectItinerary = (id) => {
        setSelectedId(id);
        setListDrawerOpen(false);
    };

    return (
        <div className="fixed inset-0 top-[65px] z-10">
            {/* Full Screen Map - Always visible */}
            <div className="absolute inset-0 w-full h-full">
                <FullScreenItineraryMap
                    days={selected?.days || []}
                    onStopClick={handleStopClick}
                    selectedStopId={selectedStopId}
                    isLoading={generatorLoading || modifyLoading}
                    loadingMessage={modifyLoading ? "Refining Your Itinerary" : "Generating Your Itinerary"}
                    loadingDescription={modifyLoading ? "Our AI is refining your trip based on your preferences..." : "Our AI is crafting the perfect trip for you..."}
                    className="w-full h-full"
                />
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute top-4 left-4 z-30 flex gap-2">
                <ShinyButton
                    onClick={() => setListDrawerOpen(true)}
                    className="px-3 shadow-lg bg-white dark:bg-[rgb(22,26,29)] text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[rgb(32,38,43)] border border-slate-200 dark:border-[rgb(32,38,43)]"
                >
                    <div className="flex items-center justify-center">
                        <List className="h-4 w-4 mr-2" />
                        <span className="text-sm">My Itineraries</span>
                    </div>
                </ShinyButton>
                <RainbowButton className='h-full'>
                    <div onClick={() => setGeneratorOpen(true)} className="flex items-center justify-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate New
                    </div>
                </RainbowButton>
                {/*                 <Button
                    onClick={() => setGeneratorOpen(true)}
                    className="shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                    size="sm"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate New
                </Button>
 */}
            </div>

            {/* Quick Stats Card - Centered at bottom */}
            <AnimatePresence>
                {selected && !detailDrawerOpen && !listDrawerOpen && !chatDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 z-30 w-full flex justify-center px-16 sm:px-4"
                    >
                        <Card
                            className="cursor-pointer shadow-2xl border-0 bg-white/95 dark:bg-[rgb(22,26,29)]/95 backdrop-blur-md hover:scale-[1.02] transition-transform w-full max-w-md"
                            onClick={() => setDetailDrawerOpen(true)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shrink-0">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                        {selected.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selected.durationDays || '?'} days • {stopCount} stops
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-slate-400">View Details</span>
                                    <ChevronRight className="h-5 w-5 text-slate-400 dark:text-white" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Itineraries List Drawer */}
            <Drawer open={listDrawerOpen} onOpenChange={setListDrawerOpen}>
                <DrawerContent className="max-h-[80vh]">
                    <DrawerHeader className="border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <DrawerTitle className="text-slate-900 dark:text-slate-100">My Itineraries</DrawerTitle>
                                <DrawerDescription className="text-slate-500 dark:text-slate-400">
                                    AI-generated travel plans ready to explore
                                </DrawerDescription>
                            </div>
                            <RainbowButton
                                className='h-full'
                                onClick={() => {
                                    setGeneratorOpen(true);
                                    setListDrawerOpen(false);
                                }}>
                                <div className="flex items-center justify-center">
                                    <Plus className="h-4 w-4 mr-1" />
                                    New
                                </div>
                            </RainbowButton>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-800 dark:scrollbar-thumb-gray-200 scrollbar-track-transparent" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                        {listLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
                                <p className="text-sm text-slate-500">Loading itineraries...</p>
                            </div>
                        ) : listError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                                <p className="text-sm text-red-500 mb-3">{listError}</p>
                                <Button variant="outline" size="sm" onClick={fetchItineraries}>
                                    Try Again
                                </Button>
                            </div>
                        ) : itineraries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                                    <MapPin className="h-10 w-10 text-violet-500" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    No Itineraries Yet
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                    Create your first AI-powered travel itinerary to get started
                                </p>
                                <Button
                                    onClick={() => {
                                        setGeneratorOpen(true);
                                        setListDrawerOpen(false);
                                    }}
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Itinerary
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-3 pb-4">
                                {itineraries.map((item) => {
                                    const config = statusConfig[item.status] || statusConfig.draft;
                                    const StatusIcon = config.icon;
                                    const isActive = selectedId === item._id;

                                    return (
                                        <Card
                                            key={item._id}
                                            onClick={() => handleSelectItinerary(item._id)}
                                            className={`cursor-pointer transition-all hover:shadow-md ${isActive
                                                ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant={config.variant} className="text-xs">
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                                            {item.summary}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatDate(item.updatedAt)}
                                                            </span>
                                                            {item.durationDays && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {item.durationDays} days
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Itinerary Detail Drawer */}
            <Drawer open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
                <DrawerContent className="max-h-[85vh]">
                    {detailLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
                            <p className="text-sm text-slate-500">Loading details...</p>
                        </div>
                    ) : selected ? (
                        <>
                            <DrawerHeader className="border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant={statusConfig[selected.status]?.variant || 'secondary'}>
                                                {statusConfig[selected.status]?.label || selected.status}
                                            </Badge>
                                            {selected.budget && (
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    {selected.budget.currency} {selected.budget.amount}
                                                </Badge>
                                            )}
                                        </div>
                                        <DrawerTitle className="text-slate-900 dark:text-slate-100">{selected.title}</DrawerTitle>
                                        <DrawerDescription className="text-slate-500 dark:text-slate-400">
                                            {selected.durationDays || '?'} days • {stopCount} stops
                                        </DrawerDescription>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <RainbowButton className='h-full size-10' onClick={() => setModifyOpen(true)}
                                            title="Refine with AI">
                                            <Wand2 className="h-4 w-4" />
                                        </RainbowButton>
                                        {/*                                         <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setModifyOpen(true)}
                                            title="Refine with AI"
                                            className="dark:border-gray-500"
                                        >
                                            <Wand2 className="h-4 w-4" />
                                        </Button>
 */}                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setDeleteOpen(true)}
                                            className="text-red-500 hover:text-red-600 hover:border-red-300 dark:border-gray-500"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-gray-800 dark:scrollbar-thumb-gray-200 scrollbar-track-transparent" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                                {detailError && (
                                    <div className="my-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {detailError}
                                    </div>
                                )}

                                {/* Budget Info with Notes */}
                                {selected.budget && (
                                    <div className="py-4 border-b border-slate-200 dark:border-gray-500">
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500 shrink-0">
                                                    <DollarSign className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                                                        Estimated Budget
                                                    </h4>
                                                    <div className="flex items-baseline gap-2 mt-1">
                                                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                                            {selected.budget.currency} {selected.budget.amount}
                                                        </span>
                                                        {selected.budget.perPerson && (
                                                            <span className="text-sm text-emerald-600 dark:text-emerald-400">
                                                                (~{selected.budget.currency} {selected.budget.perPerson}/person)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {selected.budget.notes && (
                                                        <div className="mt-3 flex items-start gap-2">
                                                            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                            <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">
                                                                {selected.budget.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Edit Section */}
                                <div className="py-4 space-y-4 border-b border-slate-200 dark:border-gray-500">
                                    <div>
                                        <Label htmlFor="edit-title">Title</Label>
                                        <Input
                                            id="edit-title"
                                            value={editDraft?.title || ''}
                                            onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                                            className="mt-1.5 dark:border-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-summary">Summary</Label>
                                        <Textarea
                                            id="edit-summary"
                                            rows={2}
                                            value={editDraft?.summary || ''}
                                            onChange={(e) => setEditDraft((prev) => ({ ...prev, summary: e.target.value }))}
                                            className="mt-1.5 dark:border-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                                        <Input
                                            id="edit-tags"
                                            value={editDraft?.tags || ''}
                                            onChange={(e) => setEditDraft((prev) => ({ ...prev, tags: e.target.value }))}
                                            placeholder="adventure, food, culture"
                                            className="mt-1.5 dark:border-gray-500"
                                        />
                                    </div>
                                    {saveError && (
                                        <p className="text-sm text-red-500">{saveError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveChanges}
                                            disabled={saveLoading}
                                            className="flex-1"
                                        >
                                            {saveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Save Changes
                                        </Button>
                                        {selected.status !== 'finished' && (
                                            <Button
                                                variant="outline"
                                                onClick={handleMarkFinished}
                                                disabled={finishLoading}
                                            >
                                                {finishLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                )}
                                                Finish
                                            </Button>
                                        )}
                                    </div>
                                    {finishError && <p className="text-sm text-red-500">{finishError}</p>}
                                </div>

                                {/* Tags */}
                                {selected.tags?.length > 0 && (
                                    <div className="py-4 flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-500">
                                        {selected.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Share Link for Finished */}
                                {selected.status === 'finished' && (
                                    <div className="py-4 border-b border-slate-200 dark:border-gray-500">
                                        <Link to="/my-routes">
                                            <Button className="w-full bg-gradient-to-r dark:text-white from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Share via My Routes
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Days and Stops */}
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <div className="py-4 space-y-6 pb-8">
                                        {selected.days?.map((day) => (
                                            <div key={day.dayNumber} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                            Day {day.dayNumber}
                                                            {day.title && `: ${day.title}`}
                                                        </h4>
                                                        {day.summary && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {day.summary}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="dark:border-gray-500">
                                                        {day.stops?.length || 0} stops
                                                    </Badge>
                                                </div>

                                                <Droppable droppableId={`day-${day.dayNumber}`}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={`space-y-2 min-h-[50px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver
                                                                ? 'bg-violet-50 dark:bg-gray-600/30'
                                                                : 'bg-slate-50 dark:bg-gray-600/10'
                                                                }`}
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
                                                                            className={`flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-black/50 ${snapshot.isDragging
                                                                                ? 'shadow-xl ring-2 ring-violet-500'
                                                                                : 'border-slate-200 dark:border-gray-500'
                                                                                }`}
                                                                        >
                                                                            {/* Drag Handle - Only this triggers drag */}
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className="p-2 -m-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-none"
                                                                                style={{ touchAction: 'none' }}
                                                                            >
                                                                                <GripVertical className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold shrink-0">
                                                                                {(stopIndexOffsets[day.dayNumber] || 0) + index + 1}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h5 className="font-medium text-slate-900 dark:text-slate-100">
                                                                                    {stop.name}
                                                                                </h5>
                                                                                {stop.location?.city && (
                                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                                        📍 {stop.location.city}
                                                                                    </p>
                                                                                )}
                                                                                {stop.description && (
                                                                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
                                                                                        {stop.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="shrink-0 h-8 w-8"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleStopClick(stop);
                                                                                }}
                                                                            >
                                                                                <MessageCircleWarning className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        ))}
                                    </div>
                                </DragDropContext>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <DrawerTitle className="sr-only">Itinerary Details</DrawerTitle>
                            <DrawerDescription className="sr-only">Select an itinerary to view details</DrawerDescription>
                            <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                            <p className="text-slate-500">Select an itinerary to view details</p>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>

            {/* Location Detail Modal */}
            <Dialog open={locationDetailOpen} onOpenChange={setLocationDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 mt-0.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-lg">
                                    {selectedStop?.name}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    {selectedStop?.location?.city && (
                                        <span>📍 {selectedStop.location.city}</span>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Rating & Info */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-medium">***</span>
                                <span className="text-slate-400">(*** reviews)</span>
                            </div>
                            <Badge variant="outline" className="text-emerald-600">
                                Open/Closed
                            </Badge>
                        </div>

                        {/* Description */}
                        {selectedStop?.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {selectedStop.description}
                            </p>
                        )}

                        {/* Action Buttons */}
                        {/*                         <div className="grid grid-cols-2 gap-3">
                            <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                <Navigation className="h-4 w-4 mr-2" />
                                Directions
                            </Button>
                            <Button variant="outline" className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add to trip
                            </Button>
                        </div>
 */}
                        <div className="flex items-center justify-center gap-2">
                            <Link to={`https://www.google.com/maps/search/?api=1&query=${selectedStop?.name || selectedStop?.location?.address}`} target="_blank">
                                <Button variant="outline" className="w-full dark:border-gray-500">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Open in Google Maps
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[rgb(32,38,43)]">
                            <Plus className="h-4 w-4 text-slate-400" />
                            <button
                                onClick={openChatForStop}
                                className="flex-1 text-left text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                Ask AI about this place...
                            </button>
                            <Button size="icon" className="h-8 w-8" onClick={openChatForStop}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Chat Drawer - iMessage style */}
            <Drawer open={chatDrawerOpen} onOpenChange={setChatDrawerOpen}>
                <DrawerContent className="max-h-[85vh]">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-6 py-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DrawerTitle className="text-base text-slate-900 dark:text-slate-100">
                                Chat with AI about {selectedStop?.name} 🏛️
                            </DrawerTitle>
                            <DrawerDescription className="text-xs text-slate-500 dark:text-slate-400">
                                TourWise AI
                            </DrawerDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setChatDrawerOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Chat Messages */}
                    <div
                        className="flex-1 overflow-y-auto px-6 py-4"
                        style={{ maxHeight: 'calc(85vh - 200px)' }}
                    >
                        {chatMessages.map((msg, idx) => (
                            <ChatMessage key={idx} message={msg.text} isUser={msg.isUser} />
                        ))}
                        {chatLoading && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 rounded-bl-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="px-6 py-2 flex gap-2 overflow-x-auto">
                        <QuickSuggestion
                            icon={History}
                            label="History"
                            onClick={() => handleSendMessage(`Tell me about the history of ${selectedStop?.name}`)}
                        />
                        <QuickSuggestion
                            icon={Ticket}
                            label="Ticket Price"
                            onClick={() => handleSendMessage(`What is the entrance fee for ${selectedStop?.name}?`)}
                        />
                        <QuickSuggestion
                            icon={Camera}
                            label="Best Photo Spots"
                            onClick={() => handleSendMessage(`What are the best photo spots at ${selectedStop?.name}?`)}
                        />
                        <QuickSuggestion
                            icon={Clock}
                            label="Opening Hours"
                            onClick={() => handleSendMessage(`What are the opening hours of ${selectedStop?.name}?`)}
                        />
                    </div>

                    {/* Chat Input */}
                    <div className="px-6 py-4 mt-1">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Ask a question..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="flex-1 bg-white dark:bg-[rgb(22,26,29)]"
                            />
                            <Button
                                size="icon"
                                disabled={chatLoading || !chatInput.trim()}
                                onClick={() => handleSendMessage()}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Generate Modal */}
            <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-[rgb(22,26,29)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500" />
                            Create AI Itinerary
                        </DialogTitle>
                        <DialogDescription>
                            Describe your dream trip and let AI craft the perfect itinerary
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="prompt">Describe your trip *</Label>
                            <Textarea
                                id="prompt"
                                rows={3}
                                placeholder="3 days in Cappadocia with hot air balloon, cave hotels, and local cuisine..."
                                value={generatorForm.prompt}
                                onChange={(e) => setGeneratorForm((prev) => ({ ...prev, prompt: e.target.value }))}
                                className="mt-1.5"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Duration</Label>
                                <Select
                                    value={generatorForm.durationDays}
                                    onValueChange={(value) => setGeneratorForm((prev) => ({ ...prev, durationDays: value }))}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select days" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((day) => (
                                            <SelectItem key={day} value={String(day)}>
                                                {day} {day === 1 ? 'day' : 'days'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="startingCity">Starting city</Label>
                                <Input
                                    id="startingCity"
                                    placeholder="Istanbul"
                                    value={generatorForm.startingCity}
                                    onChange={(e) => setGeneratorForm((prev) => ({ ...prev, startingCity: e.target.value }))}
                                    className="mt-1.5 dark:border-gray-500"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="travelStyles">Travel styles</Label>
                            <Input
                                id="travelStyles"
                                placeholder="adventure, foodie, culture"
                                value={generatorForm.travelStyles}
                                onChange={(e) => setGeneratorForm((prev) => ({ ...prev, travelStyles: e.target.value }))}
                                className="mt-1.5 dark:border-gray-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="mustInclude">Must include</Label>
                                <Input
                                    id="mustInclude"
                                    placeholder="balloon ride, local market"
                                    value={generatorForm.mustInclude}
                                    onChange={(e) => setGeneratorForm((prev) => ({ ...prev, mustInclude: e.target.value }))}
                                    className="mt-1.5 dark:border-gray-500"
                                />
                            </div>
                            <div>
                                <Label htmlFor="exclude">Exclude</Label>
                                <Input
                                    id="exclude"
                                    placeholder="museums, nightlife"
                                    value={generatorForm.exclude}
                                    onChange={(e) => setGeneratorForm((prev) => ({ ...prev, exclude: e.target.value }))}
                                    className="mt-1.5 dark:border-gray-500"
                                />
                            </div>
                        </div>

                        {generatorError && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {generatorError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="dark:border-gray-500" onClick={() => setGeneratorOpen(false)}>
                            Cancel
                        </Button>
                        <RainbowButton
                            className='h-full'
                            onClick={handleGenerateItinerary}
                            disabled={generatorLoading || !generatorForm.prompt.trim()}
                        >
                            {generatorLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate
                                </>)}

                        </RainbowButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modify Modal */}
            <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-violet-500" />
                            Refine with AI
                        </DialogTitle>
                        <DialogDescription>
                            Tell the AI what changes you'd like to make
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            rows={4}
                            placeholder="Make Day 2 more adventurous, replace dinner on Day 1 with a cheaper option..."
                            value={modifyPrompt}
                            onChange={(e) => setModifyPrompt(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModifyOpen(false)}>
                            Cancel
                        </Button>
                        <RainbowButton className='h-full' onClick={handleModifyItinerary} disabled={modifyLoading || !modifyPrompt.trim()}>
                            {modifyLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Refining...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Refine Plan
                                </>
                            )}
                        </RainbowButton>
                        {/*                         <Button
                            onClick={handleModifyItinerary}
                            disabled={modifyLoading || !modifyPrompt.trim()}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600"
                        >
                            {modifyLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Refining...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Refine Plan
                                </>
                            )}
                        </Button>
 */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Itinerary?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your itinerary.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
