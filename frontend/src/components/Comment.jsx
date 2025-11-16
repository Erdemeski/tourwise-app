import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { FaThumbsUp } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Button, Textarea } from 'flowbite-react';

export default function Comment({ comment, onLike, onEdit, onDelete }) {
    const [user, setUser] = useState({});
    const { currentUser } = useSelector((state) => state.user);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);

    useEffect(() => {
        const getUser = async () => {
            try {
                const res = await fetch(`/api/user/${comment.userId}`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data);
                }
            } catch (error) {
                console.log(error.message);
            }
        };
        getUser();
    }, [comment]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedContent(comment.content);
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/comment/${comment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: editedContent,
                }),
            });
            if (res.ok) {
                setIsEditing(false);
                onEdit(comment, editedContent);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className='flex p-4 border-b dark:border-gray-600 text-sm'>
            <div className='flex-shrink-0 mr-3'>
                <img className='w-10 h-10 rounded-full bg-gray-200' src={user.profilePicture} alt={user.username} />
            </div>
            <div className='flex-1'>
                <div className='flex items-center mb-1 justify-between'>
                    <div className='flex flex-col mb-1 sm:flex-row sm:mb-0'>
                        <span className='font-bold mr-1 text-xs truncate'>{user ? `@${user.username}` : 'anonymous user'}</span>
                        <span className='text-gray-500 text-xs dark:text-gray-400'>
                            {moment(comment.createdAt).fromNow()}
                        </span>
                    </div>
                </div>
                {isEditing ? (
                    <>
                        <Textarea
                            className='min-h-10 max-h-80 sm:max-h-40 bg-white dark:bg-[rgb(22,26,29)]'
                            placeholder='Edit the comment...'
                            maxLength='400'
                            onChange={(e) => setEditedContent(e.target.value)}
                            value={editedContent}
                        />
                        <div className='flex justify-between items-center mt-3'>
                            <p className='text-gray-500 dark:text-gray-400 text-xs'>{400 - editedContent.length} characters remaining</p>
                            <div className='flex flex-row gap-3'>
                                <Button outline gradientDuoTone='purpleToBlue' type='button' onClick={handleSave} size='sm'>
                                    Save
                                </Button>
                                <Button outline gradientDuoTone='pinkToOrange' type='button' onClick={() => setIsEditing(false)} size='sm'>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <p className='text-gray-600 pb-2 dark:text-gray-50'>{comment.content}</p>
                        <div className='flex items-center pt-2 text-xs border-t dark:border-gray-600 max-w-fit gap-2'>
                            <button
                                type='button'
                                onClick={() => onLike(comment._id)}
                                className={`text-gray-400 hover:text-sky-500 dark:hover:text-sky-300 ${currentUser && comment.likes.includes(currentUser._id) && '!text-sky-600 dark:!text-sky-400'}`}
                            >
                                <FaThumbsUp className='text-sm' />
                            </button>
                            <p className='text-gray-400'>
                                {comment.numberOfLikes > 0 && `${comment.numberOfLikes} ${comment.numberOfLikes === 1 ? 'like' : 'likes'}`}
                            </p>
                            {currentUser && (currentUser._id === comment.userId || currentUser.isAdmin) && (
                                <>
                                    <button type='button' onClick={handleEdit} className='text-gray-400 hover:text-sky-500 dark:hover:text-sky-300'>
                                        Edit
                                    </button>
                                    <button type='button' onClick={() => onDelete(comment._id)} className='text-gray-400 hover:text-red-500 dark:hover:text-red-400'>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
