import { Alert, Button, Card, Checkbox, FileInput, Label, Select, TextInput } from 'flowbite-react';
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { CircularProgressbar } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

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
            className='relative group cursor-move'
        >
            <img
                src={image}
                alt={`upload ${index + 1}`}
                className='w-full h-32 object-cover rounded-lg'
            />
            <button
                type='button'
                onClick={() => removeImage(index)}
                className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
            >
                <FaTrash size={14} />
            </button>
        </div>
    );
};

export default function CreateRoute() {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [imageUploadProgress, setImageUploadProgress] = useState({});
    const [imageUploadError, setImageUploadError] = useState(null);
    const [submitError, setSubmitError] = useState(null);

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
        }
    };

    return (
        <div className='relative isolate bg-gray-50 dark:bg-[rgb(22,26,29)]'>
            <div className='p-3 max-w-4xl mx-auto min-h-screen'>
                <h2 className="mt-7 mb-10 text-center text-4xl font-bold tracking-tight text-balance text-gray-900 dark:text-gray-50 sm:text-5xl">Create a route</h2>
                <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
                    <Card className='p-4 shadow-lg'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label className='block text-sm font-medium leading-6'>Title</Label>
                                <TextInput
                                    type='text'
                                    sizing='sm'
                                    placeholder='Epic weekend in Cappadocia'
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6'>Visibility</Label>
                                <Select
                                    sizing='sm'
                                    value={formData.visibility}
                                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                                >
                                    <option value="private">Private</option>
                                    <option value="public">Public</option>
                                    <option value="unlisted">Unlisted</option>
                                </Select>
                            </div>
                            <div className='md:col-span-2'>
                                <Label className='block text-sm font-medium leading-6'>Summary</Label>
                                <TextInput
                                    type='text'
                                    sizing='sm'
                                    placeholder='A two-day loop through fairy chimneys, balloon tours, and cave hotels.'
                                    required
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className='p-4 shadow-lg'>
                        <h3 className='text-xl font-semibold mb-3'>Media</h3>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col sm:flex-row gap-4'>
                                <FileInput
                                    className='w-full'
                                    sizing='sm'
                                    type='file'
                                    accept='image/*'
                                    multiple
                                    onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                />
                                <Button
                                    outline
                                    className='w-full sm:w-40'
                                    type='button'
                                    gradientDuoTone='purpleToBlue'
                                    size='sm'
                                    onClick={handleUploadImages}
                                    disabled={Object.keys(imageUploadProgress).length > 0}
                                >
                                    {Object.keys(imageUploadProgress).length > 0 ? (
                                        <div className='flex gap-2 flex-wrap'>
                                            {Object.entries(imageUploadProgress).map(([fileName, progress]) => (
                                                <div key={fileName} className='w-16 h-16 sm:w-20 sm:h-20'>
                                                    <CircularProgressbar value={progress} text={`${progress}%`} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'Upload'
                                    )}
                                </Button>
                            </div>
                            <TextInput
                                type='url'
                                sizing='sm'
                                placeholder='Cover image URL (optional)'
                                value={formData.coverImage}
                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                            />
                            {imageUploadError && (
                                <Alert color='failure'>
                                    {imageUploadError}
                                </Alert>
                            )}
                            {formData.gallery.length > 0 && (
                                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
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
                    </Card>

                    <Card className='p-4 shadow-lg'>
                        <h3 className='text-xl font-semibold mb-3'>Route metadata</h3>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div>
                                <Label className='block text-sm font-medium leading-6'>Distance (km)</Label>
                                <TextInput
                                    type='number'
                                    sizing='sm'
                                    placeholder='e.g. 42'
                                    value={formData.distanceKm}
                                    onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6'>Duration (days)</Label>
                                <TextInput
                                    type='number'
                                    sizing='sm'
                                    placeholder='e.g. 3'
                                    value={formData.durationDays}
                                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6'>Best season</Label>
                                <Select
                                    sizing='sm'
                                    value={formData.season}
                                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                >
                                    <option value='all'>All year</option>
                                    <option value='spring'>Spring</option>
                                    <option value='summer'>Summer</option>
                                    <option value='autumn'>Autumn</option>
                                    <option value='winter'>Winter</option>
                                </Select>
                            </div>
                            <div className='md:col-span-3 grid md:grid-cols-2 gap-4'>
                                <div>
                                    <Label className='block text-sm font-medium leading-6'>Tags (comma separated)</Label>
                                    <TextInput
                                        type='text'
                                        sizing='sm'
                                        placeholder='road-trip, food, family'
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className='block text-sm font-medium leading-6'>Terrain types</Label>
                                    <TextInput
                                        type='text'
                                        sizing='sm'
                                        placeholder='mountain, coastal, urban'
                                        value={formData.terrainTypes}
                                        onChange={(e) => setFormData({ ...formData, terrainTypes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Checkbox
                                    id='allowForks'
                                    checked={formData.allowForks}
                                    onChange={(e) => setFormData({ ...formData, allowForks: e.target.checked })}
                                />
                                <Label htmlFor='allowForks'>Allow others to copy this route</Label>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Checkbox
                                    id='allowComments'
                                    checked={formData.allowComments}
                                    onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                                />
                                <Label htmlFor='allowComments'>Allow comments</Label>
                            </div>
                        </div>
                    </Card>

                    <Card className='p-4 shadow-lg'>
                        <h3 className='text-xl font-semibold mb-4'>Route story</h3>
                        <div className='grid gap-6'>
                            <div>
                                <Label className='block text-sm font-medium leading-6 mb-2'>Overview</Label>
                                <ReactQuill
                                    theme='snow'
                                    modules={quillModules}
                                    value={formData.overview}
                                    onChange={(value) => setFormData({ ...formData, overview: value })}
                                    placeholder='High-level description of this route...'
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6 mb-2'>Itinerary</Label>
                                <ReactQuill
                                    theme='snow'
                                    modules={quillModules}
                                    value={formData.itinerary}
                                    onChange={(value) => setFormData({ ...formData, itinerary: value })}
                                    placeholder='Day by day itinerary details...'
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6 mb-2'>Highlights</Label>
                                <ReactQuill
                                    theme='snow'
                                    modules={quillModules}
                                    value={formData.highlights}
                                    onChange={(value) => setFormData({ ...formData, highlights: value })}
                                    placeholder='What makes this route special?'
                                />
                            </div>
                            <div>
                                <Label className='block text-sm font-medium leading-6 mb-2'>Tips</Label>
                                <ReactQuill
                                    theme='snow'
                                    modules={quillModules}
                                    value={formData.tips}
                                    onChange={(value) => setFormData({ ...formData, tips: value })}
                                    placeholder='Packing list, timing tips, reservations...'
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className='p-4 shadow-lg'>
                        <h3 className='text-xl font-semibold mb-4'>Waypoints (optional)</h3>
                        <div className='grid md:grid-cols-4 gap-3'>
                            <TextInput
                                type='number'
                                sizing='sm'
                                placeholder='Day'
                                value={waypointDraft.day}
                                onChange={(e) => setWaypointDraft({ ...waypointDraft, day: Number(e.target.value) })}
                            />
                            <TextInput
                                type='text'
                                sizing='sm'
                                placeholder='Stop title'
                                value={waypointDraft.title}
                                onChange={(e) => setWaypointDraft({ ...waypointDraft, title: e.target.value })}
                            />
                            <TextInput
                                type='text'
                                sizing='sm'
                                placeholder='Summary'
                                value={waypointDraft.summary}
                                onChange={(e) => setWaypointDraft({ ...waypointDraft, summary: e.target.value })}
                            />
                            <Button type='button' color='light' onClick={handleWaypointAdd}>
                                Add
                            </Button>
                        </div>
                        {waypoints.length > 0 && (
                            <div className='mt-4 space-y-2'>
                                {waypoints.map((stop, index) => (
                                    <div key={`${stop.title}-${index}`} className='border border-gray-200 dark:border-gray-600 rounded-md p-3 flex justify-between items-start'>
                                        <div>
                                            <p className='font-semibold text-gray-800 dark:text-gray-100'>Day {stop.day}: {stop.title}</p>
                                            <p className='text-sm text-gray-500 dark:text-gray-400'>{stop.summary}</p>
                                        </div>
                                        <Button size='xs' color='failure' onClick={() => handleWaypointRemove(index)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Button className='mb-3' type='submit' gradientDuoTone='purpleToPink'>Publish route</Button>
                    {submitError && <Alert className='mt-2' color='failure'>{submitError}</Alert>}
                </form>
            </div>
        </div>
    );
}

