import { Spinner, Modal, Button, Label, Select, Textarea, Alert, TextInput, FileInput } from 'flowbite-react';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ProfileRouteCard from './ProfileRouteCard';
import { FiShare2, FiSettings, FiMoreVertical, FiMapPin, FiCalendar, FiUsers, FiBookmark } from 'react-icons/fi';
import { FaRoute } from "react-icons/fa";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { updateSuccess } from '../redux/user/userSlice';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=47';
const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80';

const formatNumber = (value = 0) => {
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return Number(value || 0).toLocaleString('en-US');
};

export default function ProfileShowcase({ username, /* onEditProfile = () => {} */ }) {
    const { currentUser } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const viewerId = currentUser?._id;
    const [profileUser, setProfileUser] = useState(null);
    const [allRoutes, setAllRoutes] = useState([]);
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('shared');
    const [showShareModal, setShowShareModal] = useState(false);
    const [routeToShare, setRouteToShare] = useState(null);
    const [shareForm, setShareForm] = useState({
        shareType: 'forum', // 'forum' or 'showcase'
        highlights: '',
        tips: '',
    });
    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);
    const [routeToUpdate, setRouteToUpdate] = useState(null);
    const [visibilityForm, setVisibilityForm] = useState({
        visibility: 'public',
    });
    const [visibilityLoading, setVisibilityLoading] = useState(false);
    const [visibilityError, setVisibilityError] = useState(null);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        location: '',
        profilePicture: '',
        bannerImage: '',
    });
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [bannerImageFile, setBannerImageFile] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [bannerImageUrl, setBannerImageUrl] = useState(null);
    const [profileImageProgress, setProfileImageProgress] = useState(null);
    const [bannerImageProgress, setBannerImageProgress] = useState(null);
    const [profileImageUploading, setProfileImageUploading] = useState(false);
    const [bannerImageUploading, setBannerImageUploading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [relations, setRelations] = useState({ followers: [], following: [] });
    const [showRelationsModal, setShowRelationsModal] = useState(null); // 'followers' | 'following' | null
    const profileImageRef = useRef(null);
    const bannerImageRef = useRef(null);
    const targetUsername = username || currentUser?.username;
    const isOwner = profileUser && viewerId === profileUser._id;

    useEffect(() => {
        if (!targetUsername) {
            setProfileUser(null);
            setAllRoutes([]);
            setSavedRoutes([]);
            setLoading(false);
            setError('Kullanıcı adı bulunamadı');
            return;
        }

        let ignore = false;

        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            setActiveTab('shared');
            try {
                const userRes = await fetch(`/api/user/by-username/${encodeURIComponent(targetUsername)}`, {
                    credentials: 'include',
                });
                const userData = await userRes.json();
                if (!userRes.ok) {
                    throw new Error(userData.message || 'Kullanıcı bulunamadı');
                }
                if (ignore) return;
                setProfileUser(userData);

                // Load all routes for the user
                const params = new URLSearchParams({
                    userId: userData._id,
                    order: 'desc',
                    limit: '100',
                });
                if (viewerId === userData._id) {
                    params.set('visibility', 'all');
                }

                const routesRes = await fetch(`/api/routes?${params.toString()}`, {
                    credentials: 'include',
                });
                const routesData = await routesRes.json();
                if (!routesRes.ok) {
                    throw new Error(routesData.message || 'Rotalar yüklenemedi');
                }
                if (!ignore) {
                    setAllRoutes(routesData.routes || []);
                }

                // Fetch followers/following relations
                try {
                    const relationsRes = await fetch(`/api/user/relations/${userData._id}`, { credentials: 'include' });
                    const relationsData = await relationsRes.json();
                    if (relationsRes.ok && relationsData && !ignore) {
                        setRelations({
                            followers: relationsData.followers || [],
                            following: relationsData.following || [],
                        });
                        if (viewerId && userData._id !== viewerId) {
                            setIsFollowing((relationsData.followers || []).some((f) => f._id === viewerId));
                        }
                    }
                } catch (err) {
                    console.error('Failed to load relations:', err);
                }

                // Load saved/favorited routes if viewing own profile
                if (viewerId === userData._id) {
                    try {
                        // Fetch all public routes and filter by likes
                        const savedRes = await fetch('/api/routes?order=desc&limit=200', {
                            credentials: 'include',
                        });
                        const savedData = await savedRes.json();
                        if (savedRes.ok && savedData.routes) {
                            const liked = savedData.routes.filter((route) =>
                                route.likes?.includes(viewerId)
                            );
                            if (!ignore) {
                                setSavedRoutes(liked);
                            }
                        }
                    } catch (err) {
                        console.error('Failed to load saved routes:', err);
                    }
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message);
                    setProfileUser(null);
                    setAllRoutes([]);
                    setSavedRoutes([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadProfile();
        return () => {
            ignore = true;
        };
    }, [targetUsername, viewerId]);

    // Filter routes based on active tab
    const filteredRoutes = useMemo(() => {
        if (!isOwner && activeTab === 'created') {
            return [];
        }

        switch (activeTab) {
            case 'created':
                return allRoutes.filter((route) =>
                    route.itineraryStatus === 'finished'
                );
            case 'shared':
                return allRoutes.filter((route) =>
                    route.visibility === 'public' && route.status === 'shared'
                );
            case 'showcase':
                return allRoutes.filter((route) =>
                    route.visibility === 'private' && route.status === 'shared'
                );
            case 'saved':
                return savedRoutes;
            default:
                return [];
        }
    }, [allRoutes, savedRoutes, activeTab, isOwner]);

    const stats = useMemo(() => {
        // Paylaşılan rotalar (hem private hem public shared rotalar)
        const sharedRoutesCount = allRoutes.filter((route) =>
            route.status === 'shared'
        ).length;
        
        // Favorilenen rotalar (saved routes)
        const favoritedRoutesCount = savedRoutes.length;

        const followersCount = relations.followers?.length ?? profileUser?.followers?.length ?? 0;

        return {
            sharedRoutes: sharedRoutesCount,
            favoritedRoutes: favoritedRoutesCount,
            followers: followersCount,
        };
    }, [allRoutes, savedRoutes, relations.followers, profileUser?.followers]);

    const displayName = profileUser ? `${profileUser.firstName} ${profileUser.lastName}` : '';
    const joinedAt = profileUser?.createdAt
        ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';
    const location = profileUser?.location || '';
    const bio = profileUser?.bio || '';
    const bannerImage = profileUser?.bannerImage || FALLBACK_BANNER;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${displayName}'s Profile`,
                text: `Check out ${displayName}'s travel routes on Tourwise`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    const handleSaveToggle = async (routeId, isSaved) => {
        try {
            const res = await fetch(`/api/routes/${routeId}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                throw new Error('Failed to toggle save');
            }
            // Update saved routes list
            if (isSaved) {
                const route = allRoutes.find((r) => r._id === routeId);
                if (route) {
                    setSavedRoutes((prev) => [...prev, route]);
                }
            } else {
                setSavedRoutes((prev) => prev.filter((r) => r._id !== routeId));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    const handleShareRoute = (route) => {
        setRouteToShare(route);
        setShareForm({
            shareType: 'forum',
            highlights: route.highlights || '',
            tips: route.tips || '',
        });
        setShowShareModal(true);
    };

    const handleShareSubmit = async () => {
        if (!routeToShare) return;

        try {
            setShareLoading(true);
            setShareError(null);

            const visibility = shareForm.shareType === 'forum' ? 'public' : 'private';
            const status = 'shared';

            const res = await fetch(`/api/routes/${routeToShare._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    visibility,
                    status,
                    highlights: shareForm.highlights,
                    tips: shareForm.tips,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to share route');
            }

            const updatedRoute = await res.json();
            setAllRoutes((prev) =>
                prev.map((r) => (r._id === routeToShare._id ? updatedRoute : r))
            );
            setShowShareModal(false);
            setRouteToShare(null);
        } catch (err) {
            setShareError(err.message);
        } finally {
            setShareLoading(false);
        }
    };

    const handleVisibilityClick = (route) => {
        setRouteToUpdate(route);
        setVisibilityForm({
            visibility: route.visibility || 'public',
        });
        setShowVisibilityModal(true);
    };

    const handleVisibilitySubmit = async () => {
        if (!routeToUpdate) return;

        try {
            setVisibilityLoading(true);
            setVisibilityError(null);

            const res = await fetch(`/api/routes/${routeToUpdate._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    visibility: visibilityForm.visibility,
                    status: 'shared', // Keep status as shared
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update visibility');
            }

            const updatedRoute = await res.json();
            setAllRoutes((prev) =>
                prev.map((r) => (r._id === routeToUpdate._id ? updatedRoute : r))
            );
            setShowVisibilityModal(false);
            setRouteToUpdate(null);
        } catch (err) {
            setVisibilityError(err.message);
        } finally {
            setVisibilityLoading(false);
        }
    };

    const handleEditProfileClick = () => {
        if (profileUser) {
            setEditFormData({
                firstName: profileUser.firstName || '',
                lastName: profileUser.lastName || '',
                bio: profileUser.bio || 'Travel enthusiast exploring the world one city at a time. Passionate about discovering hidden gems and sharing authentic travel experiences with the community.',
                location: profileUser.location || 'San Francisco, CA',
                profilePicture: profileUser.profilePicture || FALLBACK_AVATAR,
                bannerImage: profileUser.bannerImage || FALLBACK_BANNER,
            });
            setProfileImageUrl(profileUser.profilePicture || FALLBACK_AVATAR);
            setBannerImageUrl(profileUser.bannerImage || FALLBACK_BANNER);
            setShowEditProfileModal(true);
        }
/*         onEditProfile();
 */    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImageUrl(URL.createObjectURL(file));
            uploadProfileImage(file);
        }
    };

    const handleBannerImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerImageFile(file);
            setBannerImageUrl(URL.createObjectURL(file));
            uploadBannerImage(file);
        }
    };

    const uploadProfileImage = async (file) => {
        setProfileImageUploading(true);
        setProfileImageProgress(0);
        const storage = getStorage(app);
        const fileName = new Date().getTime() + file.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProfileImageProgress(progress);
            },
            (error) => {
                setEditError('Profile image could not upload');
                setProfileImageUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setEditFormData((prev) => ({ ...prev, profilePicture: downloadURL }));
                    setProfileImageUploading(false);
                });
            }
        );
    };

    const uploadBannerImage = async (file) => {
        setBannerImageUploading(true);
        setBannerImageProgress(0);
        const storage = getStorage(app);
        const fileName = new Date().getTime() + file.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setBannerImageProgress(progress);
            },
            (error) => {
                setEditError('Banner image could not upload');
                setBannerImageUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setEditFormData((prev) => ({ ...prev, bannerImage: downloadURL }));
                    setBannerImageUploading(false);
                });
            }
        );
    };

    const handleEditFormChange = (e) => {
        setEditFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleEditProfileSubmit = async () => {
        if (!profileUser) return;

        try {
            setEditLoading(true);
            setEditError(null);

            if (profileImageUploading || bannerImageUploading) {
                setEditError('Please wait for images to upload');
                return;
            }

            const res = await fetch(`/api/user/update/${profileUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editFormData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update profile');
            }

            const updatedUser = await res.json();
            setProfileUser(updatedUser);
            dispatch(updateSuccess(updatedUser));
            setShowEditProfileModal(false);
        } catch (err) {
            setEditError(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!profileUser || !viewerId) return;

        try {
            setFollowLoading(true);
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            const res = await fetch(`/api/user/${endpoint}/${profileUser._id}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update follow status');
            }

            const data = await res.json();
            const newFollowingState = !isFollowing;
            setIsFollowing(newFollowingState);
            
            // Update followers lists locally and update profile user followers count
            setRelations((prev) => ({
                ...prev,
                followers: newFollowingState
                    ? [...(prev.followers || []), { _id: viewerId, username: currentUser?.username, firstName: currentUser?.firstName, lastName: currentUser?.lastName, profilePicture: currentUser?.profilePicture }]
                    : (prev.followers || []).filter((f) => f._id !== viewerId && f !== viewerId),
            }));
            
            // Update profile user followers count immediately
            setProfileUser((prev) => ({
                ...prev,
                followers: data.followers || prev.followers,
            }));
        } catch (err) {
            console.error('Failed to toggle follow:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className='flex flex-col items-center justify-center py-20 gap-4'>
                <Spinner size='xl' />
                <p className='text-slate-500 dark:text-slate-400'>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className='rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-10 text-center'>
                <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-2'>Profile not found</h2>
                <p className='text-slate-500 dark:text-slate-400 mb-6'>{error}</p>
                <Link to='/explore' className='px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition'>
                    Back to Explore
                </Link>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Banner Section */}
            <div className='relative rounded-3xl overflow-hidden h-64 md:h-80'>
                <img
                    src={bannerImage}
                    alt='Profile banner'
                    className='w-full h-full object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
            </div>

            {/* Profile Info Section */}
            <div className='px-4 -mt-16 relative z-20'>
                <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                    {/* Profile Picture */}
                    <div className='flex justify-center md:justify-start -mt-8 md:mt-0'>
                        <div className='relative'>
                            <img
                                src={profileUser?.profilePicture || FALLBACK_AVATAR}
                                alt={displayName}
                                className='h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-50'
                            />
                            {/* Online status indicator */}
                            <div className='absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white z-10' />
                        </div>
                    </div>

                    <div className='flex-1 text-center md:text-left'>
                        <div className='flex flex-col md:flex-row items-center gap-2 justify-center md:justify-between'>
                            <div className='flex flex-col items-center md:items-start justify-center md:justify-start'>
                                <div className='flex items-center justify-center md:justify-start gap-3 mb-1'>
                                    <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
                                        {displayName}
                                    </h1>
                                    {profileUser?.isAdmin && (
                                        <span className='px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'>
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <p className='text-md mb-2 text-slate-600 dark:text-slate-400'>@{profileUser?.username}</p>
                            </div>
                            <div className='hidden md:flex items-center gap-2 justify-center md:justify-end'>
                                <button
                                    onClick={handleShare}
                                    className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition flex items-center gap-2'
                                >
                                    <FiShare2 className='w-4 h-4' />
                                    <span>Share</span>
                                </button>
                                {isOwner ? (
                                    <>
                                        <button
                                            onClick={handleEditProfileClick}
                                            className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition flex items-center gap-2'
                                        >
                                            <FiSettings className='w-4 h-4' />
                                            <span>Edit</span>
                                        </button>
                                        <button className='p-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition'>
                                            <FiMoreVertical className='w-4 h-4' />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${isFollowing
                                            ? 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-600'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3'>
                            {location && (
                                <div className='flex items-center gap-1.5'>
                                    <FiMapPin className='w-4 h-4' />
                                    <span>{location}</span>
                                </div>
                            )}
                            {joinedAt && (
                                <div className='flex items-center gap-1.5'>
                                    <FiCalendar className='w-4 h-4' />
                                    <span>Joined {joinedAt}</span>
                                </div>
                            )}
                        </div>
                        {bio && (
                            <p className='text-slate-600 dark:text-slate-300 max-w-2xl mx-auto md:mx-0'>
                                {bio}
                            </p>
                        )}
                    </div>
                    <div className='md:hidden flex items-center gap-2 justify-center md:justify-end'>
                        <button
                            onClick={handleShare}
                            className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition flex items-center gap-2'
                        >
                            <FiShare2 className='w-4 h-4' />
                            <span>Share</span>
                        </button>
                        {isOwner ? (
                            <>
                                <button
                                    onClick={handleEditProfileClick}
                                    className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition flex items-center gap-2'
                                >
                                    <FiSettings className='w-4 h-4' />
                                    <span>Edit Profile</span>
                                </button>
                                {/*                                 <Link
                                    to='/my-routes'
                                    className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition'
                                >
                                    My Routes
                                </Link>
                                <Link
                                    to='/my-itineraries'
                                    className='px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition'
                                >
                                    My Itineraries
                                </Link>
 */}                                <button className='p-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition'>
                                    <FiMoreVertical className='w-4 h-4' />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleFollowToggle}
                                disabled={followLoading}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${isFollowing
                                    ? 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-600'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-8'>
                    <div className='rounded-2xl bg-white dark:bg-[rgb(22,26,29)] border border-slate-100 dark:border-gray-700 p-3 text-center'>
                        <div className='flex justify-center mb-2'>
                            <div className='p-2 rounded-full bg-green-100 dark:bg-green-900/30'>
                                <FaRoute className='w-6 h-6 text-green-600 dark:text-green-400' />
                            </div>
                        </div>
                        <p className='text-3xl font-bold text-slate-900 dark:text-white mb-1'>
                            {formatNumber(stats.sharedRoutes)}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Paylaşılan Rotalar</p>
                    </div>
                    <div className='rounded-2xl bg-white dark:bg-[rgb(22,26,29)] border border-slate-100 dark:border-gray-700 p-3 text-center'>
                        <div className='flex justify-center mb-2'>
                            <div className='p-2 rounded-full bg-green-100 dark:bg-green-900/30'>
                                <FiBookmark className='w-6 h-6 text-green-600 dark:text-green-400' />
                            </div>
                        </div>
                        <p className='text-3xl font-bold text-slate-900 dark:text-white mb-1'>
                            {formatNumber(stats.favoritedRoutes)}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Favorilenen Rotalar</p>
                    </div>
                    <div className='rounded-2xl bg-white dark:bg-[rgb(22,26,29)] border border-slate-100 dark:border-gray-700 p-3 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition' onClick={() => setShowRelationsModal('followers')}>
                        <div className='flex justify-center mb-2'>
                            <div className='p-2 rounded-full bg-green-100 dark:bg-green-900/30'>
                                <FiUsers className='w-6 h-6 text-green-600 dark:text-green-400' />
                            </div>
                        </div>
                        <p className='text-3xl font-bold text-slate-900 dark:text-white mb-1'>
                            {formatNumber(profileUser?.followers?.length || stats.followers)}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Followers</p>
                    </div>
                    <div className='rounded-2xl bg-white dark:bg-[rgb(22,26,29)] border border-slate-100 dark:border-gray-700 p-3 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition' onClick={() => setShowRelationsModal('following')}>
                        <div className='flex justify-center mb-2'>
                            <div className='p-2 rounded-full bg-green-100 dark:bg-green-900/30'>
                                <FiUsers className='w-6 h-6 text-green-600 dark:text-green-400' />
                            </div>
                        </div>
                        <p className='text-3xl font-bold text-slate-900 dark:text-white mb-1'>
                            {formatNumber(profileUser?.following?.length || stats.following)}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>Following</p>
                    </div>
                </div>
            </div>

            {/* Routes Section */}
            <section className='rounded-3xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-[rgb(32,38,43)] p-6 shadow-sm'>
                <div className='flex flex-col gap-4 mb-6'>
                    <div className='flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-4'>
                        {isOwner && (
                            <button
                                onClick={() => setActiveTab('created')}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'created'
                                    ? 'border-green-500 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Oluşturduğun Rotalar
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('shared')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'shared'
                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {isOwner ? 'Paylaştığın Rotalar' : 'Paylaşılan Rotalar'}
                        </button>
                        {isOwner && (
                            <button
                                onClick={() => setActiveTab('showcase')}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'showcase'
                                    ? 'border-green-500 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Vitrin
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'saved'
                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {isOwner ? 'Favorilenen Rotalar' : 'Saved Routes'}
                        </button>
                    </div>
                </div>

                {filteredRoutes.length > 0 ? (
                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {filteredRoutes.map((route) => (
                            <div key={route._id} className='relative'>
                                <ProfileRouteCard
                                    route={route}
                                    isSaved={savedRoutes.some((r) => r._id === route._id)}
                                    onSaveToggle={handleSaveToggle}
                                    isOwner={isOwner}
                                    onVisibilityClick={handleVisibilityClick}
                                />
                                {isOwner && activeTab === 'created' && route.status !== 'shared' && (
                                    <button
                                        onClick={() => handleShareRoute(route)}
                                        className='absolute top-2 left-2 px-3 py-1.5 rounded-full bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition shadow-lg z-10'
                                    >
                                        Share Route
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl'>
                        <p className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>
                            {activeTab === 'created' && 'No draft routes yet'}
                            {activeTab === 'shared' && 'No shared routes yet'}
                            {activeTab === 'showcase' && 'No showcase routes yet'}
                            {activeTab === 'saved' && 'No saved routes yet'}
                        </p>
                        <p className='text-slate-500 dark:text-slate-400'>
                            {activeTab === 'created' && 'Create a new route to get started.'}
                            {activeTab === 'shared' && 'Share your routes to see them here.'}
                            {activeTab === 'showcase' && 'Add routes to your showcase to display them on your profile.'}
                            {activeTab === 'saved' && 'Save routes you like to see them here.'}
                        </p>
                        {isOwner && activeTab === 'created' && (
                            <Link
                                to='/dashboard?tab=my-itineraries'
                                className='inline-block mt-4 px-5 py-2.5 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition'
                            >
                                Create Route
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* Share Route Modal */}
            <Modal show={showShareModal} onClose={() => setShowShareModal(false)} size='md'>
                <Modal.Header>Share Route</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <div>
                            <Label>Share Type</Label>
                            <Select
                                value={shareForm.shareType}
                                onChange={(e) => setShareForm((prev) => ({ ...prev, shareType: e.target.value }))}
                            >
                                <option value='forum'>Share on Forum (Public)</option>
                                <option value='showcase'>Add to Showcase (Profile Only)</option>
                            </Select>
                            <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                {shareForm.shareType === 'forum'
                                    ? 'Your route will be visible to everyone on the forum'
                                    : 'Your route will only be visible on your profile showcase'}
                            </p>
                        </div>
                        <div>
                            <Label>Highlights (optional)</Label>
                            <Textarea
                                rows={3}
                                value={shareForm.highlights}
                                onChange={(e) => setShareForm((prev) => ({ ...prev, highlights: e.target.value }))}
                                placeholder='Add key highlights of your route...'
                            />
                        </div>
                        <div>
                            <Label>Tips (optional)</Label>
                            <Textarea
                                rows={3}
                                value={shareForm.tips}
                                onChange={(e) => setShareForm((prev) => ({ ...prev, tips: e.target.value }))}
                                placeholder='Add helpful tips for travelers...'
                            />
                        </div>
                        {shareError && <Alert color='failure'>{shareError}</Alert>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color='gray' onClick={() => setShowShareModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleShareSubmit} isProcessing={shareLoading}>
                        {shareForm.shareType === 'forum' ? 'Share on Forum' : 'Add to Showcase'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Visibility Settings Modal */}
            <Modal show={showVisibilityModal} onClose={() => setShowVisibilityModal(false)} size='md'>
                <Modal.Header>Update Route Visibility</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <div>
                            <Label>Visibility</Label>
                            <Select
                                value={visibilityForm.visibility}
                                onChange={(e) => setVisibilityForm((prev) => ({ ...prev, visibility: e.target.value }))}
                            >
                                <option value='public'>Public (Visible on Forum)</option>
                                <option value='private'>Private (Showcase Only)</option>
                            </Select>
                            <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                {visibilityForm.visibility === 'public'
                                    ? 'Your route will be visible to everyone on the forum'
                                    : 'Your route will only be visible on your profile showcase'}
                            </p>
                        </div>
                        {routeToUpdate && (
                            <div className='p-3 bg-slate-50 dark:bg-gray-800 rounded-lg'>
                                <p className='text-sm font-medium text-slate-900 dark:text-white mb-1'>
                                    {routeToUpdate.title}
                                </p>
                                <p className='text-xs text-slate-500 dark:text-slate-400'>
                                    Current: {routeToUpdate.visibility} • Status: {routeToUpdate.status || 'draft'}
                                </p>
                            </div>
                        )}
                        {visibilityError && <Alert color='failure'>{visibilityError}</Alert>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color='gray' onClick={() => setShowVisibilityModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleVisibilitySubmit} isProcessing={visibilityLoading}>
                        Update Visibility
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal show={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} size='4xl'>
                <Modal.Header>Edit Profile</Modal.Header>
                <Modal.Body>
                    <div className='space-y-6'>
                        {/* Banner Image */}
                        <div>
                            <Label>Banner Image</Label>
                            <div className='relative mt-2'>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={handleBannerImageChange}
                                    ref={bannerImageRef}
                                    className='hidden'
                                />
                                <div
                                    onClick={() => bannerImageRef.current?.click()}
                                    className='relative h-40 w-full rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-slate-300 dark:border-gray-600 hover:border-green-500 transition'
                                >
                                    {bannerImageProgress && (
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/50 z-10'>
                                            <CircularProgressbar
                                                value={bannerImageProgress}
                                                text={`${Math.round(bannerImageProgress)}%`}
                                                styles={{
                                                    root: { width: '80px', height: '80px' },
                                                    path: { stroke: '#10b981' },
                                                    text: { fill: '#fff', fontSize: '16px' },
                                                }}
                                            />
                                        </div>
                                    )}
                                    <img
                                        src={bannerImageUrl || bannerImage}
                                        alt='Banner'
                                        className={`w-full h-full object-cover ${bannerImageProgress && bannerImageProgress < 100 ? 'opacity-50' : ''}`}
                                    />
                                </div>
                                <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                    Click to upload banner image
                                </p>
                            </div>
                        </div>

                        {/* Profile Picture */}
                        <div>
                            <Label>Profile Picture</Label>
                            <div className='flex items-center gap-4 mt-2'>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={handleProfileImageChange}
                                    ref={profileImageRef}
                                    className='hidden'
                                />
                                <div
                                    onClick={() => profileImageRef.current?.click()}
                                    className='relative w-24 h-24 rounded-full overflow-hidden cursor-pointer border-4 border-slate-200 dark:border-gray-700'
                                >
                                    {profileImageProgress && (
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/50 z-10'>
                                            <CircularProgressbar
                                                value={profileImageProgress}
                                                text={`${Math.round(profileImageProgress)}%`}
                                                styles={{
                                                    root: { width: '60px', height: '60px' },
                                                    path: { stroke: '#10b981' },
                                                    text: { fill: '#fff', fontSize: '12px' },
                                                }}
                                            />
                                        </div>
                                    )}
                                    <img
                                        src={profileImageUrl || profileUser?.profilePicture || FALLBACK_AVATAR}
                                        alt='Profile'
                                        className={`w-full h-full object-cover ${profileImageProgress && profileImageProgress < 100 ? 'opacity-50' : ''}`}
                                    />
                                </div>
                                <p className='text-sm text-slate-600 dark:text-slate-400'>
                                    Click to change profile picture
                                </p>
                            </div>
                        </div>

                        {/* First Name & Last Name */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor='firstName'>First Name</Label>
                                <TextInput
                                    id='firstName'
                                    value={editFormData.firstName}
                                    onChange={handleEditFormChange}
                                    placeholder='First name'
                                />
                            </div>
                            <div>
                                <Label htmlFor='lastName'>Last Name</Label>
                                <TextInput
                                    id='lastName'
                                    value={editFormData.lastName}
                                    onChange={handleEditFormChange}
                                    placeholder='Last name'
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <Label htmlFor='location'>Location</Label>
                            <TextInput
                                id='location'
                                value={editFormData.location}
                                onChange={handleEditFormChange}
                                placeholder='e.g., San Francisco, CA'
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <Label htmlFor='bio'>Bio</Label>
                            <Textarea
                                id='bio'
                                rows={4}
                                value={editFormData.bio}
                                onChange={handleEditFormChange}
                                placeholder='Tell us about yourself...'
                                maxLength={500}
                            />
                            <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                {editFormData.bio.length}/500 characters
                            </p>
                        </div>

                        {editError && <Alert color='failure'>{editError}</Alert>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color='gray' onClick={() => setShowEditProfileModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditProfileSubmit}
                        isProcessing={editLoading || profileImageUploading || bannerImageUploading}
                        disabled={profileImageUploading || bannerImageUploading}
                    >
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Followers / Following Modal */}
            <Modal show={Boolean(showRelationsModal)} onClose={() => setShowRelationsModal(null)} size='md'>
                <Modal.Header>
                    {showRelationsModal === 'followers' ? 'Followers' : 'Following'}
                </Modal.Header>
                <Modal.Body>
                    <div className='space-y-3 max-h-96 overflow-y-auto'>
                        {(showRelationsModal === 'followers' ? relations.followers : relations.following || []).map((user) => (
                            <Link
                                to={`/user/${user.username}`}
                                key={user._id}
                                className='flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition'
                                onClick={() => setShowRelationsModal(null)}
                            >
                                <img
                                    src={user.profilePicture || FALLBACK_AVATAR}
                                    alt={user.username}
                                    className='w-10 h-10 rounded-full object-cover'
                                />
                                <div className='flex-1'>
                                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{user.firstName} {user.lastName}</p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>@{user.username}</p>
                                </div>
                                {user.isAdmin && (
                                    <span className='text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'>
                                        Admin
                                    </span>
                                )}
                            </Link>
                        ))}
                        {(showRelationsModal === 'followers' ? relations.followers : relations.following)?.length === 0 && (
                            <p className='text-sm text-slate-500 dark:text-slate-400 text-center py-4'>No users found.</p>
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
