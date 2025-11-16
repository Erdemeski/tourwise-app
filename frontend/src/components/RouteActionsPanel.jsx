import { Badge, Button, Card } from 'flowbite-react';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

export default function RouteActionsPanel({ route, onRouteUpdated }) {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    const [likes, setLikes] = useState(route?.likes || []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const isOwner = currentUser?._id === route?.userId;

    const refreshParent = (updatedRoute) => {
        if (onRouteUpdated) {
            onRouteUpdated(updatedRoute);
        }
    };

    const handleToggleLike = async () => {
        if (!currentUser) {
            navigate('/sign-in');
            return;
        }
        if (!route?._id) return;

        try {
            setIsProcessing(true);
            setActionError(null);
            const res = await fetch(`/api/routes/${route._id}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update reaction');
            }
            const updatedRoute = await res.json();
            setLikes(updatedRoute.likes || []);
            refreshParent(updatedRoute);
        } catch (error) {
            setActionError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleForkRoute = async () => {
        if (!currentUser) {
            navigate('/sign-in');
            return;
        }
        if (!route?._id) return;
        if (!route.allowForks && !currentUser.isAdmin) {
            setActionError('The author disabled forking for this route.');
            return;
        }

        try {
            setIsProcessing(true);
            setActionError(null);
            const res = await fetch(`/api/routes/${route._id}/fork`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to fork route');
            }
            const newItinerary = await res.json();
            setSuccessMessage('Copied to your private itineraries');
            navigate('/dashboard?tab=itineraries', { replace: false });
            refreshParent({ ...route, forksCount: (route.forksCount || 0) + 1 });
            return newItinerary;
        } catch (error) {
            setActionError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const likeCount = likes.length;
    const userHasLiked = currentUser ? likes.includes(currentUser._id) : false;

    return (
        <Card className='sticky top-16 p-5 flex flex-col gap-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto'>
            <div className='flex flex-col gap-4 '>
                <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-96'>
                    <p>route Map will go here</p>
                </div>
                <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>Shared on</p>
                    <p className='text-sm text-gray-700 dark:text-gray-200 mt-1'>
                        {new Date(route?.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                    <Badge color='info' size='sm'>Visibility: {route?.visibility || 'private'}</Badge>
                    <Badge color='purple' size='sm'>{route?.forksCount || 0} forks</Badge>
                    <Badge color={route?.allowForks ? 'success' : 'warning'} size='sm'>
                        {route?.allowForks ? 'Forking enabled' : 'Forking disabled'}
                    </Badge>
                    {route?.allowComments === false && (
                        <Badge color='failure' size='sm'>Comments off</Badge>
                    )}
                </div>
            </div>

            {actionError && (
                <p className='text-sm text-red-500 dark:text-red-400'>{actionError}</p>
            )}
            {successMessage && (
                <p className='text-sm text-green-600 dark:text-green-400'>{successMessage}</p>
            )}

            <div className='flex flex-col gap-3'>
                <Button
                    color={userHasLiked ? 'info' : 'light'}
                    onClick={handleToggleLike}
                    disabled={isProcessing}
                >
                    {userHasLiked ? 'Liked' : 'Appreciate'} • {likeCount}
                </Button>

                <Button
                    gradientDuoTone='purpleToBlue'
                    onClick={handleForkRoute}
                    disabled={isProcessing || (isOwner && !currentUser?.isAdmin)}
                >
                    {isOwner && !currentUser.isAdmin ? 'Already yours' : 'Save a copy'}
                </Button>

                {!currentUser && (
                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                        <Link to='/sign-in' className='text-teal-600 dark:text-teal-300 underline'>
                            Sign in
                        </Link> to like or keep this route.
                    </div>
                )}
            </div>

            {isOwner && (
                <div className='mt-4 border-t border-gray-200 dark:border-gray-700 pt-4'>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        You are the creator of this route. You can edit the content or adjust visibility from the dashboard.
                    </p>
                    <Button
                        color='light'
                        className='mt-2'
                        as={Link}
                        to={`/routes/${route?._id}/edit`}
                    >
                        Edit route
                    </Button>
                </div>
            )}
        </Card>
    );
}

