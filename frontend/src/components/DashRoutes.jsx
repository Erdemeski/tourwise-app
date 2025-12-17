import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Sparkles,
    Trash2,
    PencilLine,
    ChevronRight,
    Calendar,
    Clock,
    Tag,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Share2,
    Eye,
    EyeOff,
    Globe,
    Lock,
    Heart,
    GitFork,
    ExternalLink,
    Settings,
    Route,
    FileText,
    ArrowRight,
    Info,
    Zap,
    Filter,
    MoreHorizontal,
    X,
} from 'lucide-react';

// shadcn components
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { RainbowButton } from './ui/rainbow-button';
import { ShinyButton } from './ui/shiny-button';

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

const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary', icon: PencilLine, color: 'text-slate-500' },
    finished: { label: 'Finished', variant: 'default', icon: CheckCircle2, color: 'text-blue-500' },
    shared: { label: 'Shared', variant: 'success', icon: Share2, color: 'text-emerald-500' },
};

const sanitizeCommaSeparated = (value = '') =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

// Route Card Component
const RouteCard = ({ route, onEdit, onDelete, onToggleStatus, onToggleVisibility, statusLoading, visibilityLoading }) => {
    const config = statusConfig[route.status] || statusConfig.draft;
    const StatusIcon = config.icon;
    const isShared = route.status === 'shared';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
        >
            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                        {/* Cover Image */}
                        <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0">
                            {route.coverImage ? (
                                <img
                                    src={route.coverImage}
                                    alt={route.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                                    <Route className="h-10 w-10 text-violet-400" />
                                </div>
                            )}
                            {/* Status Badge Overlay */}
                            <div className="absolute top-2 left-2">
                                <Badge variant={config.variant} className="shadow-md">
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {config.label}
                                </Badge>
                            </div>
                            {route.isForked && (
                                <div className="absolute top-2 right-2">
                                    <Badge variant="outline" className="bg-purple-500/90 text-white border-0 shadow-md">
                                        <GitFork className="h-3 w-3 mr-1" />
                                        Forked
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/routes/${route.slug}`}
                                        className="font-semibold text-lg text-slate-900 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-1"
                                    >
                                        {route.title}
                                    </Link>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                        {route.summary || 'No description provided'}
                                    </p>
                                </div>

                                {/* Actions Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => onEdit(route)}>
                                            <PencilLine className="h-4 w-4 mr-2" />
                                            Edit Details
                                        </DropdownMenuItem>
                                        <Link to={`/routes/${route._id}/edit`}>
                                            <DropdownMenuItem>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Full Editor
                                            </DropdownMenuItem>
                                        </Link>
                                        {route.itineraryId && (
                                            <Link to={`/my-itineraries`}>
                                                <DropdownMenuItem>
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    Edit Itinerary
                                                </DropdownMenuItem>
                                            </Link>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onToggleStatus(route._id, route.status, route.visibility)}
                                            disabled={statusLoading === route._id}
                                        >
                                            {route.status === 'shared' ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                    Unshare Route
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Share Route
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        {isShared && (
                                            <DropdownMenuItem
                                                onClick={() => onToggleVisibility(route._id, route.visibility)}
                                                disabled={visibilityLoading === route._id}
                                            >
                                                {route.visibility === 'public' ? (
                                                    <>
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        Make Private
                                                    </>
                                                ) : (
                                                    <>
                                                        <Globe className="h-4 w-4 mr-2" />
                                                        Make Public
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(route._id)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(route.updatedAt)}
                                </span>
                                {route.durationDays && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {route.durationDays} days
                                    </span>
                                )}
                                {isShared && (
                                    <span className="flex items-center gap-1">
                                        {route.visibility === 'public' ? (
                                            <>
                                                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-emerald-600 dark:text-emerald-400">Public</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-amber-600 dark:text-amber-400">Private</span>
                                            </>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Stats & Actions */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                        <Heart className="h-4 w-4 text-rose-500" />
                                        {route.likes?.length || 0}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                        <GitFork className="h-4 w-4 text-violet-500" />
                                        {route.forksCount || 0}
                                    </span>
                                    {route.itineraryStatus && (
                                        <Badge variant="outline" className="text-xs dark:border-gray-600">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {route.itineraryStatus}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
                                        onClick={() => onEdit(route)}
                                    >
                                        <PencilLine className="h-4 w-4 mr-1" />
                                        Quick Edit
                                    </Button>
                                    <Link to={`/routes/${route.slug}`}>
                                        <Button variant="outline" size="sm" className="dark:border-gray-600">
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Empty State Component
const EmptyState = ({ onPublish }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
    >
        <div className="p-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 mb-6">
            <Route className="h-12 w-12 text-violet-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Routes Yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
            Start by publishing your AI-generated itinerary as a route, or create a new route from scratch.
        </p>
        <div className="flex gap-3">
            <Button onClick={onPublish} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                <Sparkles className="h-4 w-4 mr-2" />
                Publish Itinerary
            </Button>
            <Link to="/my-itineraries">
                <Button variant="outline" className="dark:border-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Create Itinerary
                </Button>
            </Link>
        </div>
    </motion.div>
);

export default function DashRoutes() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();
    const navigate = useNavigate();

    // Routes state
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMore, setShowMore] = useState(true);
    const [error, setError] = useState(null);

    // Itineraries for publishing
    const [aiItineraries, setAiItineraries] = useState([]);

    // Modal states
    const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Form states
    const [shareForm, setShareForm] = useState({
        itineraryId: '',
        title: '',
        summary: '',
        visibility: 'public',
        tags: '',
        highlights: '',
        tips: '',
    });
    const [editForm, setEditForm] = useState(null);
    const [routeToDelete, setRouteToDelete] = useState(null);

    // Loading states
    const [shareLoading, setShareLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(null);
    const [visibilityLoading, setVisibilityLoading] = useState(null);

    // Error/Success states
    const [shareError, setShareError] = useState(null);
    const [shareSuccess, setShareSuccess] = useState(null);
    const [editError, setEditError] = useState(null);

    // Filter state
    const [statusFilter, setStatusFilter] = useState('all');

    const shareableItineraries = useMemo(
        () => aiItineraries.filter((item) => item.status === 'finished' && !item.publishedRouteId),
        [aiItineraries]
    );

    const filteredRoutes = useMemo(() => {
        if (statusFilter === 'all') return routes;
        return routes.filter((route) => route.status === statusFilter);
    }, [routes, statusFilter]);

    const safeParseJson = async (res) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            return { message: text || 'Unexpected response from server' };
        }
    };

    const fetchRoutes = useCallback(async (append = false) => {
        try {
            const startIndex = append ? routes.length : 0;
            let query;
            const limit = 20;
            if (currentUser.isAdmin) {
                query = `/api/routes?order=desc&startIndex=${startIndex}&limit=${limit}`;
            } else {
                query = `/api/routes?userId=${currentUser._id}&visibility=all&order=desc&startIndex=${startIndex}&limit=${limit}`;
            }
            const res = await fetch(query, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load routes');
            }
            const fetchedRoutes = data.routes || [];
            setRoutes((prev) => (append ? [...prev, ...fetchedRoutes] : fetchedRoutes));
            // Check if there might be more routes to fetch
            setShowMore(fetchedRoutes.length >= limit);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser, routes.length]);

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
            setPublishDrawerOpen(true);
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
            setDeleteDialogOpen(false);
            setRouteToDelete(null);
        }
    };

    const handleStatusToggle = async (routeId, status, currentVisibility) => {
        const nextStatus = status === 'shared' ? 'finished' : 'shared';
        const nextVisibility = nextStatus === 'finished' ? 'private' : currentVisibility;
        try {
            setStatusLoading(routeId);
            const res = await fetch(`/api/routes/${routeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: nextStatus, visibility: nextVisibility }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Unable to update status');
            }
            const updatedRoute = await res.json();
            setRoutes((prev) =>
                prev.map((route) =>
                    route._id === routeId ? { ...route, status: updatedRoute.status, visibility: updatedRoute.visibility } : route
                )
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusLoading(null);
        }
    };

    const handleVisibilityToggle = async (routeId, visibility) => {
        const nextVisibility = visibility === 'public' ? 'private' : 'public';
        try {
            setVisibilityLoading(routeId);
            const res = await fetch(`/api/routes/${routeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            setVisibilityLoading(null);
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
            const data = await safeParseJson(res);
            if (!res.ok) {
                throw new Error(data.message || 'Failed to publish itinerary');
            }

            setShareSuccess(`Route published successfully!`);
            setShareForm({
                itineraryId: '',
                title: '',
                summary: '',
                visibility: 'public',
                tags: '',
                highlights: '',
                tips: '',
            });
            fetchRoutes();
            fetchAiItineraries();
            setTimeout(() => {
                setPublishDrawerOpen(false);
                setShareSuccess(null);
            }, 2000);
        } catch (err) {
            setShareError(err.message);
        } finally {
            setShareLoading(false);
        }
    };

    const handleEditOpen = (route) => {
        setEditForm({
            _id: route._id,
            title: route.title || '',
            summary: route.summary || '',
            tags: (route.tags || []).join(', '),
            highlights: route.highlights || '',
            tips: route.tips || '',
            visibility: route.visibility || 'private',
            status: route.status || 'draft',
            itineraryId: route.itineraryId || null,
        });
        setEditError(null);
        setEditDrawerOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm?._id) return;

        try {
            setEditLoading(true);
            setEditError(null);

            const payload = {
                title: editForm.title.trim(),
                summary: editForm.summary.trim(),
                tags: sanitizeCommaSeparated(editForm.tags),
                highlights: editForm.highlights,
                tips: editForm.tips,
            };

            const res = await fetch(`/api/routes/${editForm._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update route');
            }

            setRoutes((prev) =>
                prev.map((route) =>
                    route._id === editForm._id ? { ...route, ...data } : route
                )
            );
            setEditDrawerOpen(false);
        } catch (err) {
            setEditError(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteClick = (routeId) => {
        setRouteToDelete(routeId);
        setDeleteDialogOpen(true);
    };

    const shareButtonDisabled = useMemo(
        () => !shareForm.itineraryId || shareLoading || !shareableItineraries.find((i) => i._id === shareForm.itineraryId),
        [shareForm.itineraryId, shareLoading, shareableItineraries]
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                <p className="text-slate-500 dark:text-slate-400">Loading your routes...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[rgb(22,26,29)] pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                My Routes
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Manage and share your travel routes with the community
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <ShinyButton
                                onClick={() => setPublishDrawerOpen(true)}
                                className="px-4 py-2 bg-white dark:bg-[rgb(32,38,43)] border border-slate-200 dark:border-gray-700 shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 mr-2 text-violet-500" />
                                    <span className="text-slate-700 dark:text-slate-200">Publish Itinerary</span>
                                </div>
                            </ShinyButton>
                            <Link to="/my-itineraries">
                                <Button variant="outline" className="dark:border-gray-700 dark:bg-[rgb(32,38,43)]">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Manage Itineraries
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-white dark:bg-[rgb(32,38,43)] border-slate-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                        <Route className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{routes.length}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Routes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-[rgb(32,38,43)] border-slate-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <Share2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {routes.filter((r) => r.status === 'shared').length}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Shared</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-[rgb(32,38,43)] border-slate-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                        <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {routes.reduce((acc, r) => acc + (r.likes?.length || 0), 0)}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Likes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-[rgb(32,38,43)] border-slate-200 dark:border-gray-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                        <GitFork className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {routes.reduce((acc, r) => acc + (r.forksCount || 0), 0)}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Forks</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'shared', 'finished', 'draft'].map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                    className={statusFilter === status ? '' : 'dark:border-gray-700'}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                    {status !== 'all' && (
                                        <span className="ml-1.5 text-xs opacity-70">
                                            ({routes.filter((r) => r.status === status).length})
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="ml-auto"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}

                {/* Routes List */}
                {filteredRoutes.length > 0 ? (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredRoutes.map((route) => (
                                <RouteCard
                                    key={route._id}
                                    route={route}
                                    onEdit={handleEditOpen}
                                    onDelete={handleDeleteClick}
                                    onToggleStatus={handleStatusToggle}
                                    onToggleVisibility={handleVisibilityToggle}
                                    statusLoading={statusLoading}
                                    visibilityLoading={visibilityLoading}
                                />
                            ))}
                        </AnimatePresence>

                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-center pt-6"
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => fetchRoutes(true)}
                                    className="dark:border-gray-700"
                                >
                                    Load More
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <EmptyState onPublish={() => setPublishDrawerOpen(true)} />
                )}
            </div>

            {/* Publish Itinerary Drawer */}
            <Drawer open={publishDrawerOpen} onOpenChange={setPublishDrawerOpen}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="border-b border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-slate-900 dark:text-slate-100">
                                    Publish Itinerary as Route
                                </DrawerTitle>
                                <DrawerDescription className="text-slate-500 dark:text-slate-400">
                                    Share your AI-generated itinerary with the community
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    <form onSubmit={handleShareSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                        {/* Itinerary Selection */}
                        <div className="space-y-2">
                            <Label>Select Itinerary *</Label>
                            <Select
                                value={shareForm.itineraryId}
                                onValueChange={(value) => setShareForm((prev) => ({ ...prev, itineraryId: value }))}
                            >
                                <SelectTrigger className="dark:border-gray-600">
                                    <SelectValue placeholder="Choose an itinerary to publish" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shareableItineraries.length > 0 ? (
                                        shareableItineraries.map((item) => (
                                            <SelectItem key={item._id} value={item._id}>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-violet-500" />
                                                    {item.title}
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            No finished itineraries available
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {shareableItineraries.length === 0 && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <Info className="h-4 w-4 text-amber-500 shrink-0" />
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        No itineraries ready to publish.{' '}
                                        <Link to="/my-itineraries" className="underline font-medium">
                                            Create one first
                                        </Link>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="share-title">Title *</Label>
                            <Input
                                id="share-title"
                                value={shareForm.title}
                                onChange={(e) => setShareForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Give your route a catchy title"
                                className="dark:border-gray-600"
                            />
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <Label htmlFor="share-summary">Summary *</Label>
                            <Textarea
                                id="share-summary"
                                rows={3}
                                value={shareForm.summary}
                                onChange={(e) => setShareForm((prev) => ({ ...prev, summary: e.target.value }))}
                                placeholder="Describe your route in a few sentences..."
                                className="dark:border-gray-600"
                            />
                        </div>

                        {/* Visibility & Tags */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Visibility</Label>
                                <Select
                                    value={shareForm.visibility}
                                    onValueChange={(value) => setShareForm((prev) => ({ ...prev, visibility: value }))}
                                >
                                    <SelectTrigger className="dark:border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-emerald-500" />
                                                Public
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="private">
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-amber-500" />
                                                Private
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="share-tags">Tags</Label>
                                <Input
                                    id="share-tags"
                                    value={shareForm.tags}
                                    onChange={(e) => setShareForm((prev) => ({ ...prev, tags: e.target.value }))}
                                    placeholder="adventure, food, culture"
                                    className="dark:border-gray-600"
                                />
                            </div>
                        </div>

                        {/* Highlights & Tips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="share-highlights">Highlights (optional)</Label>
                                <Textarea
                                    id="share-highlights"
                                    rows={2}
                                    value={shareForm.highlights}
                                    onChange={(e) => setShareForm((prev) => ({ ...prev, highlights: e.target.value }))}
                                    placeholder="What makes this route special?"
                                    className="dark:border-gray-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="share-tips">Tips (optional)</Label>
                                <Textarea
                                    id="share-tips"
                                    rows={2}
                                    value={shareForm.tips}
                                    onChange={(e) => setShareForm((prev) => ({ ...prev, tips: e.target.value }))}
                                    placeholder="Any tips for fellow travelers?"
                                    className="dark:border-gray-600"
                                />
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {shareError && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600 dark:text-red-400">{shareError}</p>
                            </div>
                        )}
                        {shareSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">{shareSuccess}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
                            <Button type="button" variant="outline" onClick={() => setPublishDrawerOpen(false)} className="dark:border-gray-600">
                                Cancel
                            </Button>
                            <RainbowButton
                                type="submit"
                                disabled={shareButtonDisabled}
                                className="h-10"
                            >
                                {shareLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Publish Route
                                    </>
                                )}
                            </RainbowButton>
                        </div>
                    </form>
                </DrawerContent>
            </Drawer>

            {/* Edit Route Drawer */}
            <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="border-b border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                                <PencilLine className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-slate-900 dark:text-slate-100">
                                    Edit Route Details
                                </DrawerTitle>
                                <DrawerDescription className="text-slate-500 dark:text-slate-400">
                                    Update your route information
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    {editForm && (
                        <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                                    className="dark:border-gray-600"
                                />
                            </div>

                            {/* Summary */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-summary">Summary</Label>
                                <Textarea
                                    id="edit-summary"
                                    rows={3}
                                    value={editForm.summary}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
                                    className="dark:border-gray-600"
                                />
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                                <Input
                                    id="edit-tags"
                                    value={editForm.tags}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                                    placeholder="adventure, food, culture"
                                    className="dark:border-gray-600"
                                />
                            </div>

                            {/* Highlights & Tips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-highlights">Highlights</Label>
                                    <Textarea
                                        id="edit-highlights"
                                        rows={2}
                                        value={editForm.highlights}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, highlights: e.target.value }))}
                                        className="dark:border-gray-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-tips">Tips</Label>
                                    <Textarea
                                        id="edit-tips"
                                        rows={2}
                                        value={editForm.tips}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, tips: e.target.value }))}
                                        className="dark:border-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Itinerary Link */}
                            {editForm.itineraryId && (
                                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-violet-500 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-violet-900 dark:text-violet-200">
                                                Connected Itinerary
                                            </h4>
                                            <p className="text-sm text-violet-700 dark:text-violet-400 mt-1">
                                                To edit stops, order, and itinerary details, go to the Itineraries page.
                                            </p>
                                            <Link to="/my-itineraries">
                                                <Button variant="outline" size="sm" className="mt-3 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    Edit Itinerary
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Full Editor Link */}
                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                    <Settings className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-900 dark:text-slate-200">
                                            Need More Options?
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            Use the full editor to change images, media, waypoints, and more advanced settings.
                                        </p>
                                        <Link to={`/routes/${editForm._id}/edit`}>
                                            <Button variant="outline" size="sm" className="mt-3 dark:border-gray-600">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Open Full Editor
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {editError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
                                <Button type="button" variant="outline" onClick={() => setEditDrawerOpen(false)} className="dark:border-gray-600">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editLoading}>
                                    {editLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </DrawerContent>
            </Drawer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="mx-auto p-3 rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-center">Delete Route?</DialogTitle>
                        <DialogDescription className="text-center">
                            This action cannot be undone. This will permanently delete your route and remove it from the community.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="dark:border-gray-600">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteRoute}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
