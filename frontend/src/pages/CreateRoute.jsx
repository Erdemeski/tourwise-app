import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import {
    MapPin,
    Plus,
    Trash2,
    Upload,
    Image,
    FileText,
    Tag,
    Calendar,
    Mountain,
    Settings,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    GripVertical,
    Eye,
    EyeOff,
    Globe,
    Lock,
    X,
    Route,
    Sparkles,
    Info,
    ArrowLeft,
} from 'lucide-react';

// shadcn components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RainbowButton } from '@/components/ui/rainbow-button';

// Rich text editor
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

// Draggable Image Component
const DraggableImage = ({ image, index, moveImage, removeImage }) => {
    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', index);
        e.target.classList.add('opacity-50');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;
        if (fromIndex !== toIndex) {
            moveImage(fromIndex, toIndex);
        }
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className='relative group cursor-move rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700'
        >
            <img
                src={image}
                alt={`upload ${index + 1}`}
                className='w-full h-32 object-cover'
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90">
                    <GripVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
            </div>
            {index === 0 && (
                <div className="absolute bottom-2 left-2">
                    <Badge className="bg-violet-500 text-white text-xs">Cover</Badge>
                </div>
            )}
            <button
                type='button'
                onClick={() => removeImage(index)}
                className='absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};

// Section Header Component
const SectionHeader = ({ icon: Icon, title, description, iconBg = "bg-violet-100 dark:bg-violet-900/30", iconColor = "text-violet-600 dark:text-violet-400" }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
    </div>
);

export default function CreateRoute() {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [imageUploadProgress, setImageUploadProgress] = useState({});
    const [imageUploadError, setImageUploadError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        visibility: 'private',
        tags: '',
        coverImage: '',
        gallery: [],
        distanceKm: '',
        durationDays: '',
        season: 'all',
        terrainTypes: '',
        allowForks: true,
        allowComments: true,
        overview: '',
        itinerary: '',
        highlights: '',
        tips: '',
    });

    const [waypointDraft, setWaypointDraft] = useState({ title: '', summary: '', day: 1 });
    const [waypoints, setWaypoints] = useState([]);

    const handleUploadImages = async () => {
        try {
            if (files.length === 0) {
                setImageUploadError('Please select at least one image');
                return;
            }
            setImageUploadError(null);
            const storage = getStorage(app);
            const uploadPromises = files.map(async (file) => {
                const fileName = `${Date.now()}-${file.name}`;
                const storageRef = ref(storage, fileName);
                const uploadTask = uploadBytesResumable(storageRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setImageUploadProgress(prev => ({
                                ...prev,
                                [fileName]: progress.toFixed(0)
                            }));
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            });

            const downloadURLs = await Promise.all(uploadPromises);
            setFormData(prev => ({
                ...prev,
                gallery: [...prev.gallery, ...downloadURLs],
                coverImage: prev.coverImage || downloadURLs[0],
            }));
            setFiles([]);
            setImageUploadProgress({});
        } catch (error) {
            setImageUploadError('Image upload failed');
            setImageUploadProgress({});
            console.log(error);
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, index) => index !== indexToRemove),
            coverImage: indexToRemove === 0 ? prev.gallery[1] || '' : prev.coverImage,
        }));
    };

    const moveImage = (fromIndex, toIndex) => {
        const newImages = [...formData.gallery];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        setFormData(prev => ({
            ...prev,
            gallery: newImages,
            coverImage: newImages[0] || '',
        }));
    };

    const handleWaypointAdd = () => {
        if (!waypointDraft.title.trim()) return;
        setWaypoints((prev) => [...prev, waypointDraft]);
        setWaypointDraft({ title: '', summary: '', day: (waypointDraft.day || 1) + 1 });
    };

    const handleWaypointRemove = (index) => {
        setWaypoints((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            setSubmitError(null);
            const payload = {
                title: formData.title,
                summary: formData.summary,
                visibility: formData.visibility,
                tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                coverImage: formData.coverImage,
                gallery: formData.gallery,
                distanceKm: formData.distanceKm || null,
                durationDays: formData.durationDays || null,
                season: formData.season,
                terrainTypes: formData.terrainTypes.split(',').map((tag) => tag.trim()).filter(Boolean),
                allowForks: formData.allowForks,
                allowComments: formData.allowComments,
                overview: formData.overview,
                itinerary: formData.itinerary,
                highlights: formData.highlights,
                tips: formData.tips,
                waypointList: waypoints,
            };

            const res = await fetch('/api/routes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setSubmitError(data.message || 'Failed to create route');
                return;
            }
            setSubmitError(null);
            navigate(`/routes/${data.slug}`);
        } catch (error) {
            setSubmitError('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isUploading = Object.keys(imageUploadProgress).length > 0;
    const uploadProgress = Object.values(imageUploadProgress);
    const averageProgress = uploadProgress.length > 0
        ? Math.round(uploadProgress.reduce((a, b) => Number(a) + Number(b), 0) / uploadProgress.length)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[rgb(22,26,29)]">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[rgb(22,26,29)]/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/my-routes">
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Route</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Share your travel experience</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="hidden sm:flex dark:border-gray-600">
                                <Eye className="h-3 w-3 mr-1" />
                                Draft
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] shadow-sm">
                            <CardContent className="pt-6">
                                <SectionHeader
                                    icon={Route}
                                    title="Basic Information"
                                    description="Give your route a name and description"
                                />

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title *</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Epic weekend in Cappadocia"
                                                required
                                                className="dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Visibility</Label>
                                            <Select
                                                value={formData.visibility}
                                                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                                            >
                                                <SelectTrigger className="dark:border-gray-600">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="private">
                                                        <div className="flex items-center gap-2">
                                                            <Lock className="h-4 w-4 text-amber-500" />
                                                            Private
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="public">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="h-4 w-4 text-emerald-500" />
                                                            Public
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="summary">Summary *</Label>
                                        <Textarea
                                            id="summary"
                                            value={formData.summary}
                                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                            placeholder="A two-day loop through fairy chimneys, balloon tours, and cave hotels."
                                            required
                                            rows={3}
                                            className="dark:border-gray-600"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Media Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] shadow-sm">
                            <CardContent className="pt-6">
                                <SectionHeader
                                    icon={Image}
                                    title="Media Gallery"
                                    description="Add photos to showcase your route"
                                    iconBg="bg-rose-100 dark:bg-rose-900/30"
                                    iconColor="text-rose-600 dark:text-rose-400"
                                />

                                <div className="space-y-4">
                                    {/* Upload Area */}
                                    <div className="border-2 border-dashed border-slate-200 dark:border-gray-600 rounded-xl p-6 text-center hover:border-violet-400 dark:hover:border-violet-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Click to upload images
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                PNG, JPG up to 10MB each
                                            </p>
                                        </label>
                                    </div>

                                    {/* Selected Files */}
                                    {files.length > 0 && (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {files.length} file(s) selected
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={handleUploadImages}
                                                disabled={isUploading}
                                                size="sm"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading {averageProgress}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Upload
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Cover Image URL */}
                                    <div className="space-y-2">
                                        <Label htmlFor="coverUrl">Cover Image URL (optional)</Label>
                                        <Input
                                            id="coverUrl"
                                            type="url"
                                            value={formData.coverImage}
                                            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                            className="dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Error */}
                                    {imageUploadError && (
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                            <p className="text-sm text-red-600 dark:text-red-400">{imageUploadError}</p>
                                        </div>
                                    )}

                                    {/* Gallery Grid */}
                                    {formData.gallery.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {formData.gallery.map((image, index) => (
                                                <DraggableImage
                                                    key={index}
                                                    image={image}
                                                    index={index}
                                                    moveImage={moveImage}
                                                    removeImage={handleRemoveImage}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Route Details Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] shadow-sm">
                            <CardContent className="pt-6">
                                <SectionHeader
                                    icon={Mountain}
                                    title="Route Details"
                                    description="Add information about distance, duration, and terrain"
                                    iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                                    iconColor="text-emerald-600 dark:text-emerald-400"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="distance">Distance (km)</Label>
                                        <Input
                                            id="distance"
                                            type="number"
                                            value={formData.distanceKm}
                                            onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                                            placeholder="42"
                                            className="dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (days)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={formData.durationDays}
                                            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                            placeholder="3"
                                            className="dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Best Season</Label>
                                        <Select
                                            value={formData.season}
                                            onValueChange={(value) => setFormData({ ...formData, season: value })}
                                        >
                                            <SelectTrigger className="dark:border-gray-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Year</SelectItem>
                                                <SelectItem value="spring">Spring</SelectItem>
                                                <SelectItem value="summer">Summer</SelectItem>
                                                <SelectItem value="autumn">Autumn</SelectItem>
                                                <SelectItem value="winter">Winter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags</Label>
                                        <Input
                                            id="tags"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            placeholder="road-trip, food, family"
                                            className="dark:border-gray-600"
                                        />
                                        <p className="text-xs text-slate-500">Separate with commas</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="terrain">Terrain Types</Label>
                                        <Input
                                            id="terrain"
                                            value={formData.terrainTypes}
                                            onChange={(e) => setFormData({ ...formData, terrainTypes: e.target.value })}
                                            placeholder="mountain, coastal, urban"
                                            className="dark:border-gray-600"
                                        />
                                        <p className="text-xs text-slate-500">Separate with commas</p>
                                    </div>
                                </div>

                                {/* Checkboxes */}
                                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.allowForks}
                                            onChange={(e) => setFormData({ ...formData, allowForks: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Allow others to fork this route</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.allowComments}
                                            onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Allow comments</span>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Content Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] shadow-sm">
                            <CardContent className="pt-6">
                                <SectionHeader
                                    icon={FileText}
                                    title="Route Story"
                                    description="Tell travelers about your experience"
                                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                                    iconColor="text-blue-600 dark:text-blue-400"
                                />

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Overview</Label>
                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={formData.overview}
                                                onChange={(value) => setFormData({ ...formData, overview: value })}
                                                placeholder="High-level description of this route..."
                                                className="bg-white dark:bg-[rgb(22,26,29)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Itinerary</Label>
                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={formData.itinerary}
                                                onChange={(value) => setFormData({ ...formData, itinerary: value })}
                                                placeholder="Day by day itinerary details..."
                                                className="bg-white dark:bg-[rgb(22,26,29)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Highlights</Label>
                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={formData.highlights}
                                                onChange={(value) => setFormData({ ...formData, highlights: value })}
                                                placeholder="What makes this route special?"
                                                className="bg-white dark:bg-[rgb(22,26,29)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tips</Label>
                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={formData.tips}
                                                onChange={(value) => setFormData({ ...formData, tips: value })}
                                                placeholder="Packing list, timing tips, reservations..."
                                                className="bg-white dark:bg-[rgb(22,26,29)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Waypoints Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-slate-200 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] shadow-sm">
                            <CardContent className="pt-6">
                                <SectionHeader
                                    icon={MapPin}
                                    title="Waypoints"
                                    description="Add stops along your route (optional)"
                                    iconBg="bg-amber-100 dark:bg-amber-900/30"
                                    iconColor="text-amber-600 dark:text-amber-400"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                                    <Input
                                        type="number"
                                        placeholder="Day"
                                        value={waypointDraft.day}
                                        onChange={(e) => setWaypointDraft({ ...waypointDraft, day: Number(e.target.value) })}
                                        className="dark:border-gray-600"
                                    />
                                    <Input
                                        placeholder="Stop title"
                                        value={waypointDraft.title}
                                        onChange={(e) => setWaypointDraft({ ...waypointDraft, title: e.target.value })}
                                        className="dark:border-gray-600"
                                    />
                                    <Input
                                        placeholder="Summary"
                                        value={waypointDraft.summary}
                                        onChange={(e) => setWaypointDraft({ ...waypointDraft, summary: e.target.value })}
                                        className="dark:border-gray-600"
                                    />
                                    <Button type="button" variant="outline" onClick={handleWaypointAdd} className="dark:border-gray-600">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </div>

                                {waypoints.length > 0 && (
                                    <div className="space-y-2">
                                        {waypoints.map((stop, index) => (
                                            <div
                                                key={`${stop.title}-${index}`}
                                                className="flex items-start justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-gray-700"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm">
                                                        {stop.day}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{stop.title}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{stop.summary}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleWaypointRemove(index)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {waypoints.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No waypoints added yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Error Message */}
                    {submitError && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
                        >
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                        </motion.div>
                    )}

                    {/* Submit Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-end pb-8"
                    >
                        <Link to="/my-routes">
                            <Button type="button" variant="outline" className="w-full sm:w-auto dark:border-gray-600">
                                Cancel
                            </Button>
                        </Link>
                        <RainbowButton
                            type="submit"
                            disabled={isSubmitting || !formData.title || !formData.summary}
                            className="w-full sm:w-auto h-10"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Publish Route
                                </>
                            )}
                        </RainbowButton>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}
